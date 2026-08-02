import QRCode from 'qrcode';

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Lightweight KV implementation for Upstash Redis
const kv = {
  get: async (key) => {
    if (!KV_URL) return null;
    try {
      const res = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await res.json();
      if (!data.result) return null;
      
      let parsed = JSON.parse(data.result);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      return parsed;
    } catch (e) {
      console.error('KV GET Error:', e);
      return null;
    }
  },
  set: async (key, value) => {
    if (!KV_URL) return;
    try {
      await fetch(`${KV_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: typeof value === 'object' ? JSON.stringify(value) : String(value)
      });
    } catch (e) {
      console.error('KV SET Error:', e);
    }
  }
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const SUPER_ADMIN_ID = '6804139305'; // Founder Telegram ID
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Production WebApp Domain (Prevents Vercel preview login wall)
const PUBLIC_DOMAIN = process.env.PUBLIC_URL || 'https://tedxsergeli.vercel.app';

// Super Admin Persistent Bottom Keyboard Menu
const ADMIN_KEYBOARD = {
  keyboard: [
    [{ text: "📊 Статистика" }, { text: "📋 Контролеры" }],
    [{ text: "👑 Админы" }, { text: "ℹ️ Инструкция" }],
    [{ text: "❌ Скрыть меню" }]
  ],
  resize_keyboard: true,
  persistent: true
};

// Helper to check if a user is Super Admin (Founder or added Co-Admin)
async function isSuperAdmin(from, chatId) {
  const userIdStr = String(from ? from.id : chatId);
  const adminChatStr = String(ADMIN_CHAT_ID || '');

  if (userIdStr === SUPER_ADMIN_ID || (adminChatStr && userIdStr === adminChatStr)) {
    return true;
  }

  const extraAdmins = (await kv.get('super_admins')) || [];
  const username = from && from.username ? from.username.toLowerCase().replace('@', '') : '';

  return extraAdmins.some((a) => {
    const aStr = String(a).toLowerCase().replace('@', '');
    return aStr === userIdStr || (username && aStr === username);
  });
}

// Helper to check if a user is authorized as a ticket scanner/checker
async function isAuthorizedScanner(from, chatId) {
  if (await isSuperAdmin(from, chatId)) return true;

  const scanners = (await kv.get('allowed_scanners')) || [];
  const userIdStr = String(from ? from.id : chatId);
  const username = from && from.username ? from.username.toLowerCase().replace('@', '') : '';

  return scanners.some((s) => {
    const sStr = String(s).toLowerCase().replace('@', '');
    return sStr === userIdStr || (username && sStr === username);
  });
}

// Helper to track user IDs for broadcasting
async function trackUser(chatId) {
  let users = (await kv.get('all_user_ids')) || [];
  if (!users.includes(chatId)) {
    users.push(chatId);
    await kv.set('all_user_ids', users);
  }
}

// Helper to track ticket IDs for stats
async function trackTicket(ticketId) {
  let tickets = (await kv.get('all_ticket_ids')) || [];
  if (!tickets.includes(ticketId)) {
    tickets.push(ticketId);
    await kv.set('all_ticket_ids', tickets);
  }
}

// Telegram API Helper
async function callTelegram(method, body) {
  try {
    const response = await fetch(`${API_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  } catch (err) {
    console.error(`Telegram API Call Error (${method}):`, err);
    return null;
  }
}

// Send Photo via FormData for Buffer upload
async function callTelegramPhoto(chatId, buffer, caption, extra = {}) {
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption || '');
    formData.append('parse_mode', 'HTML');

    if (extra.message_thread_id) {
      formData.append('message_thread_id', extra.message_thread_id);
    }
    if (extra.reply_markup) {
      formData.append('reply_markup', typeof extra.reply_markup === 'string' ? extra.reply_markup : JSON.stringify(extra.reply_markup));
    }

    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('photo', blob, 'ticket_qr.png');

    const response = await fetch(`${API_URL}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  } catch (err) {
    console.error('sendPhoto error:', err);
    return null;
  }
}

// Generate pure high-resolution QR code PNG image
async function generateTicketQrImage(qrUrl) {
  return await QRCode.toBuffer(qrUrl, {
    margin: 2,
    width: 800,
    color: {
      dark: '#0E0E11',
      light: '#FFFFFF'
    }
  });
}

// Seat Allocation helper for 200 total seats
function getSeatDetails(seatNum) {
  const n = Math.max(1, Math.min(200, parseInt(seatNum, 10) || 1));
  let sector = 1;
  let sectorName = "Sektor 1";
  let seatInSector = n;
  let row = 1;
  let seat = 1;
  let floor = 1;

  if (n <= 48) {
    sector = 1;
    sectorName = "Sektor 1";
    seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1;
    seat = ((n - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 96) {
    sector = 2;
    sectorName = "Sektor 2";
    seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 144) {
    sector = 3;
    sectorName = "Sektor 3";
    seatInSector = n - 96;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 192) {
    sector = 4;
    sectorName = "Sektor 4";
    seatInSector = n - 144;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else {
    sector = 5;
    sectorName = "2-Etaj (Balkon)";
    seatInSector = n - 192;
    row = 1;
    seat = seatInSector;
    floor = 2;
  }

  return {
    seatNumber: n,
    sector,
    sectorName,
    seatInSector,
    row,
    seat,
    floor,
    seatId: `SEAT-${n}`,
    seatLabel: sector === 5 ? `2-Etaj (Balkon) — 1-qator / ${seat}-o'rin` : `Sektor ${sector} — ${row}-qator / ${seat}-o'rin`
  };
}

const texts = {
  welcome: `👋 <b>Привет! Вы в официальном боте TEDxSergeli Specialized School.</b>\nДо вашего билета остался всего 1 шаг.\n\n🌐 <b>Tilni tanlang / Выберите язык / Choose language:</b>`,
  askName: {
    uz: `👤 Iltimos, ism va familiyangizni kiriting (mehmonlar ro'yxati uchun):`,
    ru: `👤 Введите ваше Имя и Фамилию для внесения в списки гостей:`,
    en: `👤 Please enter your Full Name for the guest list:`,
  },
  askPhone: {
    uz: `📱 Endi telefon raqamingizni yuboring:\n(Quyidagi "Raqamni ulashish" tugmasini bosing yoki raqamni yozing)`,
    ru: `📱 Теперь отправьте ваш номер телефона:\n(Нажмите кнопку "Поделиться контактом" ниже или напишите номер)`,
    en: `📱 Now send your phone number:\n(Press "Share Contact" below or type your number)`,
  },
  btnShareContact: {
    uz: `📱 Raqamni ulashish`,
    ru: `📱 Поделиться контактом`,
    en: `📱 Share Contact`
  },
  payment: {
    uz: `🎫 <b>Ajoyib!</b>\n\nChipta narxi: <b>49 999 UZS</b>.\nTo'lovni quyidagi kartaga o'tkazing:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>To'lov amalga oshirilgach, chek rasmini shu yerga yuboring.</i>`,
    ru: `🎫 <b>Отлично!</b>\n\nСтоимость билета: <b>49 999 UZS</b>.\nПереведите деньги на карту:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>После оплаты отправьте фотографию чека прямо сюда.</i>`,
    en: `🎫 <b>Great!</b>\n\nTicket price: <b>49 999 UZS</b>.\nTransfer the money to the card:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>After payment, send the receipt photo here.</i>`
  },
  photoReply: {
    uz: `✅ <b>Chek tekshirishga yuborildi.</b>\nKuting...`,
    ru: `✅ <b>Чек отправлен на проверку.</b>\nОжидайте...`,
    en: `✅ <b>Receipt sent for review.</b>\nPlease wait...`
  },
  reject: `❌ <b>To'lov tasdiqlanmadi. / Оплата не подтверждена. / Payment not confirmed.</b>\nIltimos, chekni tekshiring. / Пожалуйста, проверьте чек. / Please check your receipt.`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook is running');
  }

  try {
    const update = req.body;
    if (!update) return res.status(200).json({ ok: true });

    // Handle Telegram Message
    if (update.message) {
      const { text, from, chat, photo, contact } = update.message;
      const chatId = chat.id;

      // Track user for analytics and broadcasts
      await trackUser(chatId);

      // === SUPER ADMIN COMMAND ENGINE ===
      if (text && (await isSuperAdmin(from, chatId))) {
        
        // Hide Keyboard Command
        if (text === '❌ Скрыть меню') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🙈 <b>Клавиатура супер-администратора скрыта.</b>\n\nЧтобы снова открыть меню управления, введите команду <code>/admin</code>`,
            reply_markup: { remove_keyboard: true }
          });
          return res.status(200).json({ ok: true });
        }

        // Database Reset Command (/reset_db or /clear_db)
        if (text === '/reset_db' || text === '/clear_db') {
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          if (Array.isArray(allTicketIds)) {
            for (const tid of allTicketIds) {
              await kv.set(`ticket:${tid}`, null);
            }
          }

          await kv.set('occupied_seats', []);
          await kv.set('allocated_seats', []);
          await kv.set('total_tickets_sold', 0);
          await kv.set('all_ticket_ids', []);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>База данных очищена!</b>\nВсе забронированные места и проданные билеты сброшены (0/200).`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Admin Dashboard / Help
        if (text === '/admin' || text === '/help_admin' || text === 'ℹ️ Инструкция' || text === '/scanner' || text === '/checkin' || text === '/scan') {
          const scannerAppUrl = `${PUBLIC_DOMAIN}/scanner`;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚡️ <b>TEDxSergeli SUPER ADMIN DASHBOARD & QR-СКАНЕР</b>\n\n` +
                  `📱 <b>Входной контроль по QR-кодам:</b>\n` +
                  `Нажмите кнопку ниже, чтобы открыть веб-сканер билетов прямо в Telegram!\n\n` +
                  `👑 <b>Управление Администраторами:</b>\n` +
                  `• <code>/add_admin @username</code> — Назначить Со-Администратора\n` +
                  `• <code>/del_admin @username</code> — Снять Со-Администратора\n` +
                  `• <code>/admins</code> — Список всех Администраторов (кнопка <b>👑 Админы</b>)\n\n` +
                  `🎫 <b>Управление Контролерами Билетов:</b>\n` +
                  `• <code>/add_scanner @username</code> — Назначить волонтера-контролера\n` +
                  `• <code>/del_scanner @username</code> — Удалить контролера\n` +
                  `• <code>/scanners</code> — Список контролеров (кнопка <b>📋 Контролеры</b>)\n\n` +
                  `📊 <b>Мониторинг и База Данных:</b>\n` +
                  `• <code>/stats</code> — Живая статистика билетов (кнопка <b>📊 Статистика</b>)\n` +
                  `• <code>/reset_db</code> — Очистить все места и сбросить билеты\n` +
                  `• <code>/find TEDX-849201</code> — Найти инфо о билете\n` +
                  `• <code>/reset_ticket TEDX-849201</code> — Сбросить статус билета в VALID\n\n` +
                  `📢 <b>Массовые Рассылки:</b>\n` +
                  `• <code>/broadcast Ваш текст</code> — Отправить анонс всем пользователям бота`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📷 QR-Сканерни очиш / Открыть QR-Сканер",
                    web_app: { url: scannerAppUrl }
                  }
                ]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // Add Super Admin
        if (text.startsWith('/add_admin')) {
          const target = text.replace('/add_admin', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_admin @username</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let extraAdmins = (await kv.get('super_admins')) || [];
          if (!extraAdmins.includes(target)) {
            extraAdmins.push(target);
            await kv.set('super_admins', extraAdmins);
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Новый Со-Администратор назначен!</b>\n\n👤 <b>Админ:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Delete Super Admin
        if (text.startsWith('/del_admin')) {
          const target = text.replace('/del_admin', '').trim().replace('@', '');
          let extraAdmins = (await kv.get('super_admins')) || [];
          extraAdmins = extraAdmins.filter((a) => a.toLowerCase() !== target.toLowerCase());
          await kv.set('super_admins', extraAdmins);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Со-Администратор удален:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // List Admins
        if (text === '/admins' || text === '👑 Админы') {
          const extraAdmins = (await kv.get('super_admins')) || [];
          const listStr = extraAdmins.length > 0
            ? extraAdmins.map((a, i) => `${i + 1}. <code>${a}</code>`).join('\n')
            : '<i>Дополнительные админы не назначены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>СПИСОК АДМИНИСТРАТОРОВ TEDxSergeli:</b>\n\n` +
                  `🥇 <b>Главный Админ:</b> <code>${SUPER_ADMIN_ID}</code>\n\n` +
                  `👥 <b>Со-Администраторы:</b>\n${listStr}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Add Scanner
        if (text.startsWith('/add_scanner')) {
          const target = text.replace('/add_scanner', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_scanner @username</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let scanners = (await kv.get('allowed_scanners')) || [];
          if (!scanners.includes(target)) {
            scanners.push(target);
            await kv.set('allowed_scanners', scanners);
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🎫 <b>Новый контролер билетов добавлен!</b>\n\n👤 <b>Контролер:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Remove Scanner
        if (text.startsWith('/del_scanner')) {
          const target = text.replace('/del_scanner', '').trim().replace('@', '');
          let scanners = (await kv.get('allowed_scanners')) || [];
          scanners = scanners.filter((s) => s.toLowerCase() !== target.toLowerCase());
          await kv.set('allowed_scanners', scanners);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Контролер удален:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // List Scanners
        if (text === '/scanners' || text === '📋 Контролеры') {
          const scanners = (await kv.get('allowed_scanners')) || [];
          const listStr = scanners.length > 0
            ? scanners.map((s, i) => `${i + 1}. <code>${s}</code>`).join('\n')
            : '<i>Контролеры пока не добавлены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📋 <b>СПИСОК АВТОРИЗОВАННЫХ КОНТРОЛЕРОВ ВХОДА:</b>\n\n${listStr}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Statistics
        if (text === '/stats' || text === '📊 Статистика') {
          const totalSold = parseInt((await kv.get('total_tickets_sold')) || 0, 10);
          const allocatedSeats = (await kv.get('allocated_seats')) || [];
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          const allUserIds = (await kv.get('all_user_ids')) || [];
          const occupiedSeats = (await kv.get('occupied_seats')) || [];

          const displaySold = Math.max(
            totalSold,
            Array.isArray(allocatedSeats) ? allocatedSeats.length : 0,
            Array.isArray(allTicketIds) ? allTicketIds.length : 0
          );

          let scannedCount = 0;
          for (const tid of allTicketIds) {
            const t = await kv.get(`ticket:${tid}`);
            if (t && t.status === 'used') scannedCount++;
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📊 <b>СТАТИСТИКА TEDxSergeli Specialized School:</b>\n\n` +
                  `👥 <b>Пользователей в боте:</b> ${allUserIds.length}\n` +
                  `🎟 <b>Продано билетов:</b> ${displaySold} / 200\n` +
                  `⏳ <b>Временно забронировано мест:</b> ${occupiedSeats.length}\n` +
                  `🟢 <b>Прошло через контроль (Вход):</b> ${scannedCount} человек`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Find Ticket
        if (text.startsWith('/find')) {
          const tid = text.replace('/find', '').trim();
          let ticket = await kv.get(`ticket:${tid}`);
          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${tid}</code> не найден.`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>ИНФОРМАЦИЯ О БИЛЕТЕ:</b>\n\n` +
                  `🎟 <b>ID:</b> <code>${ticket.id}</code>\n` +
                  `👤 <b>Гость:</b> ${ticket.name}\n` +
                  `📱 <b>Тел:</b> <code>${ticket.phone}</code>\n` +
                  `📍 <b>Ряд:</b> ${ticket.row} | <b>Место:</b> ${ticket.seat}\n` +
                  `🔴 <b>Статус:</b> <b>${ticket.status.toUpperCase()}</b>\n` +
                  `🕒 <b>Выдан:</b> ${new Date(ticket.confirmed_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}\n` +
                  (ticket.used_at ? `🟢 <b>Отсканирован:</b> ${new Date(ticket.used_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })} (@${ticket.scanned_by})` : ''),
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Broadcast
        if (text.startsWith('/broadcast')) {
          const broadcastMsg = text.replace('/broadcast', '').trim();
          if (!broadcastMsg) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/broadcast Ваш текст анонса</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          const allUserIds = (await kv.get('all_user_ids')) || [];
          let successCount = 0;

          for (const uid of allUserIds) {
            try {
              const r = await callTelegram('sendMessage', {
                chat_id: uid,
                parse_mode: 'HTML',
                text: `📢 <b>Официальное сообщение TEDxSergeli:</b>\n\n${broadcastMsg}`
              });
              if (r && r.ok) successCount++;
            } catch {}
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🚀 <b>Рассылка завершена!</b>\n\nУспешно доставлено <b>${successCount} / ${allUserIds.length}</b> пользователям.`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Handle /start command (Normal registration or QR scanner deep link)
      if (text && text.startsWith('/start')) {
        const payload = text.split(' ')[1] || 'direct';

        // Check if QR Code Scan
        if (payload.startsWith('scan_') || payload.startsWith('TEDX-')) {
          const ticketId = payload.replace('scan_', '').trim();
          const authorized = await isAuthorizedScanner(from, chatId);

          if (!authorized) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⛔️ <b>RUXSAT YO'Q / ДОСТУП ОГРАНИЧЕН</b>\n\n` +
                    `Вы не являетесь авторизованным контролёром TEDxSergeli.\n` +
                    `Сканировать билеты на входе могут только зарегистрированные волонтеры и организаторы.`
            });
            return res.status(200).json({ ok: true });
          }

          let ticket = await kv.get(`ticket:${ticketId}`);

          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ <b>НЕ ДЕЙСТВИТЕЛЬНЫЙ БИЛЕТ! / CHIPTA TOPILMADI!</b>\n\nБилет с кодом <code>${ticketId}</code> не найден в системе.`
            });
            return res.status(200).json({ ok: true });
          }

          const scannerUsername = from ? (from.username || from.first_name || 'Volunteer') : 'Volunteer';

          if (ticket.status === 'valid') {
            ticket.status = 'used';
            ticket.used_at = new Date().toISOString();
            ticket.scanned_by = scannerUsername;
            await kv.set(`ticket:${ticketId}`, ticket);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `🟢 <b>БИЛЕТ УСПЕШНО ПРОВЕРЕН! / CHIPTA TASDIQLANDI!</b>\n\n` +
                    `👤 <b>Гость / Mehmon:</b> ${ticket.name || 'Noma\'lum'}\n` +
                    `📱 <b>Тел:</b> <code>${ticket.phone || 'Noma\'lum'}</code>\n` +
                    `📍 <b>Ряд / Qator:</b> ${ticket.row} | <b>Место / Joy:</b> ${ticket.seat}\n` +
                    `🎟 <b>ID билета:</b> <code>${ticket.id}</code>\n\n` +
                    `✅ <i>Статус билета изменен на: ИСПОЛЬЗОВАН (Вход разрешен).</i>`
            });
          } else {
            const timeStr = ticket.used_at
              ? new Date(ticket.used_at).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' })
              : 'Ранее';

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>ВНИМАНИЕ! БИЛЕТ УЖЕ ИСПОЛЬЗОВАН! / CHIPTA ALLAQACHON ISHLATILGAN!</b>\n\n` +
                    `👤 <b>Гость / Mehmon:</b> ${ticket.name || 'Noma\'lum'}\n` +
                    `📍 <b>Ряд / Qator:</b> ${ticket.row} | <b>Место / Joy:</b> ${ticket.seat}\n` +
                    `🎟 <b>ID билета:</b> <code>${ticket.id}</code>\n` +
                    `🕒 <b>Время первого входа:</b> ${timeStr}\n` +
                    `👤 <b>Проверил:</b> @${ticket.scanned_by || 'Admin'}\n\n` +
                    `🛑 <i>Повторный вход по данному билету запрещен.</i>`
            });
          }

          return res.status(200).json({ ok: true });
        }

        // Standard clean registration start
        let user = { step: 'LANG', source: payload, payment_status: 'none' };
        await kv.set(`user:${chatId}`, user);

        if (await isSuperAdmin(from, chatId)) {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Вы авторизованы как Super Admin TEDxSergeli!</b>\n\nИспользуйте меню снизу для управления или команду <code>/admin</code> для вызова справки.`,
            reply_markup: ADMIN_KEYBOARD
          });
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.welcome,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🇺🇿 O'zbekcha", callback_data: `lang_uz` }],
              [{ text: "🇷🇺 Русский", callback_data: `lang_ru` }],
              [{ text: "🇬🇧 English", callback_data: `lang_en` }]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Handle Telegram WebApp Data (Seat Selection from Mini App)
      if (update.message && update.message.web_app_data) {
        const { data } = update.message.web_app_data;
        let user = (await kv.get(`user:${chatId}`)) || {};
        try {
          const parsed = JSON.parse(data);
          const { seatNumber, sector, row, seat, bookingExpiresAt } = parsed || {};

          if (seatNumber) {
            let occupied = (await kv.get('occupied_seats')) || [];
            if (!Array.isArray(occupied)) occupied = [];
            if (!occupied.includes(seatNumber)) {
              occupied.push(seatNumber);
              await kv.set('occupied_seats', occupied, 900);
            }

            user.seatNumber = seatNumber;
            user.seatId = `SEAT-${seatNumber}`;
            user.sector = sector || 1;
            user.row = row || 1;
            user.seat = seat || 1;
            user.step = 'PAYMENT';
            user.payment_status = 'pending_payment';
            user.bookingExpiresAt = bookingExpiresAt || (Date.now() + 15 * 60 * 1000);
            await kv.set(`user:${chatId}`, user);

            const userLang = user.lang || 'ru';
            let msg = '';
            if (userLang === 'uz') {
              msg = `✅ <b>Joy tanlandi: #${seatNumber} (Sektor ${sector || 1}, ${row || 1}-qator / ${seat || 1}-o'rin)</b>\n\n` +
                    `⏳ <b>Diqqat! Ushbu joy siz uchun 15 daqiqa davomida band qilinadi.</b>\n` +
                    `Shu vaqt ichida to'lov chekini (скриншот) yuborishingiz kerak.\n\n` +
                    `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
                    `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
                    `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
                    `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
            } else if (userLang === 'en') {
              msg = `✅ <b>Seat selected: #${seatNumber} (Sector ${sector || 1}, Row ${row || 1} / Seat ${seat || 1})</b>\n\n` +
                    `⏳ <b>Attention! This seat is reserved for 15 minutes.</b>\n` +
                    `Please send the payment receipt screenshot within this time.\n\n` +
                    `💳 <b>Amount:</b> 49,999 UZS\n` +
                    `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
                    `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
                    `📸 After payment, please send the receipt screenshot here.`;
            } else {
              msg = `✅ <b>Место выбрано: №${seatNumber} (Сектор ${sector || 1}, ${row || 1}-ряд / ${seat || 1}-место)</b>\n\n` +
                    `⏳ <b>Внимание! Это место забронировано за вами на 15 минут.</b>\n` +
                    `Пожалуйста, отправьте чек об оплате в течение этого времени.\n\n` +
                    `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
                    `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
                    `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
                    `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
            }

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg,
              reply_markup: { remove_keyboard: true }
            });
            return res.status(200).json({ ok: true });
          }
        } catch (e) {
          console.error('Error handling web_app_data:', e);
        }
      }

      // Fetch user state from Vercel KV
      let user = (await kv.get(`user:${chatId}`)) || {};

      // 2. User sends Name
      if (user.step === 'NAME' && text) {
        user.name = text;
        user.step = 'PHONE';
        await kv.set(`user:${chatId}`, user);
        
        const lang = user.lang || 'ru';
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: texts.askPhone[lang],
          reply_markup: {
            keyboard: [
              [{ text: texts.btnShareContact[lang], request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        return res.status(200).json({ ok: true });
      }

      // 3. User sends Phone -> Auto-assign next sequential seat and request payment
      if (user.step === 'PHONE') {
        if (contact) {
          user.phone = contact.phone_number;
        } else if (text) {
          user.phone = text;
        }

        if (user.phone) {
          let totalSold = parseInt((await kv.get('total_tickets_sold')) || 0, 10);
          let occupiedSeats = (await kv.get('occupied_seats')) || [];
          let allocatedSeats = (await kv.get('allocated_seats')) || [];

          if (!Array.isArray(occupiedSeats)) occupiedSeats = [];
          if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

          let nextSeatNumber = totalSold + 1;
          const allTaken = new Set([...occupiedSeats, ...allocatedSeats]);
          while (allTaken.has(nextSeatNumber) && nextSeatNumber <= 200) {
            nextSeatNumber++;
          }
          if (nextSeatNumber > 200) nextSeatNumber = 200;

          user.seatNumber = nextSeatNumber;
          user.seatId = `SEAT-${nextSeatNumber}`;
          user.step = 'PAYMENT';
          user.payment_status = 'pending_payment';
          await kv.set(`user:${chatId}`, user);

          const seatInfo = getSeatDetails(nextSeatNumber);
          const lang = user.lang || 'ru';

          let msg = '';
          if (lang === 'uz') {
            msg = `✅ <b>Siz uchun navbatdagi joy ajratildi: #${seatInfo.seatNumber}</b>\n` +
                  `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n\n` +
                  `⏳ <b>Eslatma:</b> To'lov chekini yuborish uchun sizda <b>15 daqiqa</b> bor. Aks holda, ushbu joy boshqa ishtirokchilar uchun ochiladi.\n\n` +
                  `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
                  `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
                  `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
                  `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
          } else if (lang === 'en') {
            msg = `✅ <b>Next available seat assigned to you: #${seatInfo.seatNumber}</b>\n` +
                  `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n\n` +
                  `⏳ <b>Notice:</b> You have <b>15 minutes</b> to send your payment receipt screenshot. Otherwise, your seat reservation will be released to other attendees.\n\n` +
                  `💳 <b>Amount:</b> 49,999 UZS\n` +
                  `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
                  `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
                  `📸 After payment, please send the receipt screenshot here.`;
          } else {
            msg = `✅ <b>Вам выделено следующее место по очереди: №${seatInfo.seatNumber}</b>\n` +
                  `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n\n` +
                  `⏳ <b>Внимание:</b> У вас есть <b>15 минут</b> на отправку чека об оплате. В противном случае забронированное место станет доступным для других участников.\n\n` +
                  `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
                  `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
                  `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
                  `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: msg,
            reply_markup: { remove_keyboard: true }
          });
          return res.status(200).json({ ok: true });
        }
      }

      // 4. User sends Payment Receipt Photo
      if (photo && photo.length > 0) {
        user.step = 'AWAITING_VERIFICATION';
        user.payment_status = 'pending';
        await kv.set(`user:${chatId}`, user);

        const photoFileId = photo[photo.length - 1].file_id;
        const lang = user.lang || 'ru';

        // Notify User
        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.photoReply[lang]
        });

        // Notify Admin for approval
        const targetAdminChats = new Set();
        if (ADMIN_CHAT_ID) targetAdminChats.add(ADMIN_CHAT_ID);
        if (SUPER_ADMIN_ID) targetAdminChats.add(SUPER_ADMIN_ID);

        const seatInfo = getSeatDetails(user.seatNumber || 1);
        const adminPhotoPayload = {
          photo: photoFileId,
          caption: `📥 <b>YANGI TO'LOV CHEKI / НОВЫЙ ЧЕК ОБ ОПЛАТЕ!</b>\n\n` +
                   `👤 <b>Ism / Имя:</b> ${user.name || 'Noma\'lum'}\n` +
                   `📱 <b>Тел:</b> <code>${user.phone || 'Noma\'lum'}</code>\n` +
                   `📍 <b>Mavjud joy:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
                   `🌐 <b>Til:</b> ${(user.lang || 'ru').toUpperCase()}\n` +
                   `🆔 <b>User ID:</b> <code>${chatId}</code>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Tasdiqlash (Подтвердить)", callback_data: `confirm_${chatId}` },
                { text: "❌ Rad etish (Отклонить)", callback_data: `reject_${chatId}` }
              ]
            ]
          }
        };

        for (const targetChatId of targetAdminChats) {
          try {
            await callTelegram('sendPhoto', {
              ...adminPhotoPayload,
              chat_id: targetChatId
            });
          } catch (err) {
            console.error(`Failed to send receipt to admin chat ${targetChatId}:`, err);
          }
        }
        return res.status(200).json({ ok: true });
      }
    }

    // Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const adminUsername = from.username || from.first_name || 'Admin';
      const chatId = message.chat.id;

      // Handle Language Selection
      if (data.startsWith('lang_')) {
        const selectedLang = data.split('_')[1];
        
        let user = {
          chatId,
          lang: selectedLang,
          step: 'NAME'
        };
        await kv.set(`user:${chatId}`, user);

        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: "✅ " + (selectedLang === 'uz' ? "Til tanlandi" : selectedLang === 'en' ? "Language selected" : "Язык выбран")
        });

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.askName[selectedLang]
        });

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      // Handle Admin Actions (Confirm / Reject)
      if (data.startsWith('confirm_') || data.startsWith('reject_')) {
        const [action, userIdStr] = data.split('_');
        const userId = parseInt(userIdStr, 10);
        let user = (await kv.get(`user:${userId}`)) || {};

        if (user.payment_status === 'confirmed' || user.payment_status === 'rejected') {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: "⚠️ Bu to'lov allaqachon ko'rib chiqilgan / Заявка уже обработана!",
            show_alert: true
          });
          return res.status(200).json({ ok: true });
        }

        if (action === 'confirm') {
          const ticketId = `TEDX-${Math.floor(100000 + Math.random() * 900000)}`;

          let allocatedSeats = (await kv.get('allocated_seats')) || [];
          if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

          let seatNumber = user.seatNumber || (user.seatId ? parseInt(String(user.seatId).replace(/\D/g, ''), 10) : null);

          if (!seatNumber || seatNumber < 1 || seatNumber > 200) {
            seatNumber = allocatedSeats.length + 1;
            if (seatNumber > 200) seatNumber = 200;
          }

          if (!allocatedSeats.includes(seatNumber)) {
            allocatedSeats.push(seatNumber);
            await kv.set('allocated_seats', allocatedSeats);
          }

          const totalSold = allocatedSeats.length;
          await kv.set('total_tickets_sold', totalSold);

          let occupiedSeats = (await kv.get('occupied_seats')) || [];
          if (Array.isArray(occupiedSeats)) {
            occupiedSeats = occupiedSeats.filter((s) => s !== seatNumber);
            await kv.set('occupied_seats', occupiedSeats);
          }

          const seatInfo = getSeatDetails(seatNumber);

          const ticketData = {
            id: ticketId,
            userId: userId,
            name: user.name || 'Mehmon',
            phone: user.phone || 'Noma\'lum',
            seatNumber: seatInfo.seatNumber,
            seatId: seatInfo.seatId,
            sector: seatInfo.sector,
            sectorName: seatInfo.sectorName,
            row: seatInfo.row,
            seat: seatInfo.seat,
            status: 'valid',
            confirmed_at: new Date().toISOString()
          };
          await kv.set(`ticket:${ticketId}`, ticketData);
          await trackTicket(ticketId);

          user.ticketId = ticketId;
          user.seatNumber = seatInfo.seatNumber;
          user.seatId = seatInfo.seatId;
          user.payment_status = 'confirmed';
          await kv.set(`user:${userId}`, user);

          const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TEDxSergeliBot';
          const qrUrl = `https://t.me/${botUsername}?start=scan_${ticketId}`;

          // Generate PNG QR code image
          let photoBuffer = null;
          try {
            photoBuffer = await generateTicketQrImage(qrUrl);
          } catch (genErr) {
            console.error('Ticket QR generation error:', genErr);
          }

          const userLang = user.lang || 'ru';
          let ticketCaption = '';

          if (userLang === 'uz') {
            ticketCaption =
              `🎉 <b>To'lov tasdiqlandi!</b>\n\n` +
              `🎟️ <b>TEDxSergeli Specialized School — Rasmiy Elektron Chipta</b>\n\n` +
              `👤 <b>Mehmon:</b> ${user.name || 'Mehmon'}\n` +
              `📍 <b>Sektor:</b> ${seatInfo.sectorName}\n` +
              `📐 <b>O'rin:</b> ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (Umumiy №${seatInfo.seatNumber})\n` +
              `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n\n` +
              `📅 <b>Sana:</b> 4-sentabr, 2026\n` +
              `📍 <b>Manzil:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Ixtisoslashtirilgan Maktabi (Google Maps)</a>\n\n` +
              `📌 <b>Kirish qoidalari (TEDx Rules):</b>\n` +
              `• 1️⃣ Tadbir kunida ushbu QR-kodni nazoratchiga ko'rsating.\n` +
              `• 2️⃣ Eshiklar soat 13:30 da yopiladi. Kechikmang!\n` +
              `• 3️⃣ Har bir QR-kod faqat 1 marotaba kirish uchun amal qiladi.\n\n` +
              `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
          } else if (userLang === 'en') {
            ticketCaption =
              `🎉 <b>Payment confirmed!</b>\n\n` +
              `🎟️ <b>TEDxSergeli Specialized School — Official Ticket</b>\n\n` +
              `👤 <b>Guest:</b> ${user.name || 'Guest'}\n` +
              `📍 <b>Sector:</b> ${seatInfo.sector === 5 ? '2nd Floor (Balcony)' : `Sector ${seatInfo.sector}`}\n` +
              `📐 <b>Seat:</b> Row ${seatInfo.row} / Seat ${seatInfo.seat} (Total №${seatInfo.seatNumber})\n` +
              `🔑 <b>Ticket ID:</b> <code>${ticketId}</code>\n\n` +
              `📅 <b>Date:</b> September 4, 2026\n` +
              `📍 <b>Location:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Specialized School (Google Maps)</a>\n\n` +
              `📌 <b>Entrance Rules (TEDx Rules):</b>\n` +
              `• 1️⃣ Show this QR code to the scanner on the day of the event.\n` +
              `• 2️⃣ Doors close at 13:30. Please arrive on time!\n` +
              `• 3️⃣ Each QR code is valid for 1 entry only.\n\n` +
              `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
          } else {
            ticketCaption =
              `🎉 <b>Оплата подтверждена!</b>\n\n` +
              `🎟️ <b>TEDxSergeli Specialized School — Официальный электронный билет</b>\n\n` +
              `👤 <b>Гость:</b> ${user.name || 'Гость'}\n` +
              `📍 <b>Сектор:</b> ${seatInfo.sector === 5 ? '2-Этаж (Балкон)' : `Сектор ${seatInfo.sector}`}\n` +
              `📐 <b>Место:</b> ${seatInfo.row}-ряд / ${seatInfo.seat}-место (Общий №${seatInfo.seatNumber})\n` +
              `🔑 <b>ID Билета:</b> <code>${ticketId}</code>\n\n` +
              `📅 <b>Дата:</b> 4 сентября 2026\n` +
              `📍 <b>Адрес:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Специализированная школа Сергели (Google Maps)</a>\n\n` +
              `📌 <b>Правила входа (Правила TEDx):</b>\n` +
              `• 1️⃣ Покажите этот QR-код контролеру на входе в день мероприятия.\n` +
              `• 2️⃣ Двери закрываются в 13:30. Пожалуйста, не опаздывайте!\n` +
              `• 3️⃣ Каждый QR-код действителен только для 1 входа.\n\n` +
              `ℹ️ <i>TEDxSergeli — независимое мероприятие, проводимое по лицензии TED.</i>`;
          }

          if (photoBuffer) {
            await callTelegramPhoto(userId, photoBuffer, ticketCaption);
          } else {
            await callTelegram('sendMessage', {
              chat_id: userId,
              parse_mode: 'HTML',
              text: ticketCaption
            });
          }

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI (CHIPTA BERILDI)</b>\nID: <code>${ticketId}</code> | ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\nTekshirdi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        } else if (action === 'reject') {
          user.payment_status = 'rejected';
          await kv.set(`user:${userId}`, user);

          await callTelegram('sendMessage', {
            chat_id: userId,
            parse_mode: 'HTML',
            text: texts.reject
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n❌ <b>RAD ETILDI / ОТКЛОНЕНО</b>\nRad etdi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        }

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
