import { Resvg } from '@resvg/resvg-js';
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

// Helper to call Telegram JSON API
async function callTelegram(method, body) {
  const response = await fetch(`${API_URL}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

// Helper to send PNG Photo via FormData
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
    formData.append('photo', blob, 'ticket.png');

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

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate high-resolution official TEDx Ticket Image with QR Code
async function generateTicketImage({ name, row, seat, ticketId, qrUrl }) {
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    margin: 1,
    width: 300,
    color: {
      dark: '#0E0E11',
      light: '#FFFFFF'
    }
  });

  const formattedRow = String(row).padStart(2, '0');
  const formattedSeat = String(seat).padStart(2, '0');
  const safeName = escapeXml(String(name || 'Mehmon').slice(0, 40));

  const svg = `
  <svg width="1000" height="500" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Card Background -->
    <rect width="1000" height="500" rx="32" fill="#0E0E11"/>
    
    <!-- Red Outer Accent Border -->
    <rect x="2" y="2" width="996" height="496" rx="30" stroke="#E62B1E" stroke-width="3" stroke-opacity="0.4"/>

    <!-- Header Badge -->
    <rect x="60" y="50" width="180" height="36" rx="18" fill="#E62B1E" fill-opacity="0.15" stroke="#E62B1E" stroke-width="1"/>
    <text x="150" y="73" fill="#E62B1E" font-family="sans-serif" font-weight="bold" font-size="13" text-anchor="middle" letter-spacing="2">OFFICIAL TICKET</text>

    <!-- TEDxSergeli Logo -->
    <text x="60" y="140" fill="#E62B1E" font-family="sans-serif" font-weight="900" font-size="52" letter-spacing="-1">TEDx<tspan fill="#FFFFFF">Sergeli</tspan></text>
    <text x="60" y="168" fill="#8E8E93" font-family="sans-serif" font-size="14" letter-spacing="1">x = independently organized TED event</text>

    <!-- Dashed Line Separator -->
    <line x1="650" y1="50" x2="650" y2="450" stroke="#2C2C30" stroke-width="3" stroke-dasharray="8 8"/>

    <!-- Guest Name -->
    <text x="60" y="230" fill="#8E8E93" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="2">GUEST / МЕХМОН</text>
    <text x="60" y="270" fill="#FFFFFF" font-family="sans-serif" font-size="32" font-weight="bold">${safeName}</text>

    <!-- Row & Seat Boxes -->
    <g transform="translate(60, 315)">
      <!-- Row Box -->
      <rect x="0" y="0" width="150" height="80" rx="16" fill="#1A1A1E" stroke="#2C2C30" stroke-width="1"/>
      <text x="20" y="30" fill="#8E8E93" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1">ROW / РЯД</text>
      <text x="20" y="65" fill="#E62B1E" font-family="sans-serif" font-size="34" font-weight="900">${formattedRow}</text>

      <!-- Seat Box -->
      <rect x="170" y="0" width="150" height="80" rx="16" fill="#1A1A1E" stroke="#2C2C30" stroke-width="1"/>
      <text x="190" y="30" fill="#8E8E93" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1">SEAT / МЕСТО</text>
      <text x="190" y="65" fill="#FFFFFF" font-family="sans-serif" font-size="34" font-weight="900">${formattedSeat}</text>
    </g>

    <!-- Ticket ID -->
    <text x="60" y="445" fill="#8E8E93" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">TICKET ID: <tspan fill="#E62B1E">${ticketId}</tspan></text>

    <!-- QR Code Container -->
    <rect x="685" y="90" width="260" height="260" rx="24" fill="#FFFFFF"/>
    <image x="700" y="105" width="230" height="230" href="${qrDataUrl}"/>

    <!-- Scan Notice -->
    <text x="815" y="385" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">SCAN FOR ENTRANCE</text>
    <text x="815" y="408" fill="#8E8E93" font-family="sans-serif" font-size="12" text-anchor="middle">Kirishda tekshirish uchun</text>

    <text x="815" y="445" fill="#48484A" font-family="sans-serif" font-size="11" text-anchor="middle" letter-spacing="1">TEDxSergeli 2026</text>
  </svg>
  `;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  return resvg.render().asPng();
}

const texts = {
  welcome: `👋 <b>Привет! Вы в официальном боте TEDxSergeli.</b>\nДо вашего билета остался всего 1 шаг.\n\n🌐 <b>Tilni tanlang / Выберите язык / Choose language:</b>`,
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
    const TICKET_THREAD_ID = process.env.TELEGRAM_TICKET_THREAD_ID;

    // Handle Incoming Messages
    if (update.message) {
      const { chat, from, text, photo, contact, message_id } = update.message;
      const chatId = chat.id;

      // Track user for analytics and broadcasts
      await trackUser(chatId);

      // === SUPER ADMIN COMMAND ENGINE ===
      if (text && (await isSuperAdmin(from, chatId))) {
        
        // 1. Admin Help / Dashboard (/admin or /help_admin)
        if (text === '/admin' || text === '/help_admin') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚡️ <b>TEDxSergeli SUPER ADMIN DASHBOARD</b>\n\n` +
                  `👑 <b>Управление Ролями:</b>\n` +
                  `• <code>/add_admin @username</code> — Назначить Со-Администратора\n` +
                  `• <code>/del_admin @username</code> — Снять Со-Администратора\n` +
                  `• <code>/admins</code> — Список всех Администраторов\n\n` +
                  `🎫 <b>Управление Контролерами Билетов:</b>\n` +
                  `• <code>/add_scanner @username</code> — Добавить волонтера-контролера\n` +
                  `• <code>/del_scanner @username</code> — Удалить контролера\n` +
                  `• <code>/scanners</code> — Список всех активных контролеров\n\n` +
                  `📊 <b>Статистика и Поиск:</b>\n` +
                  `• <code>/stats</code> — Живая статистика билетов и входа\n` +
                  `• <code>/find TEDX-849201</code> — Найти билет по ID\n` +
                  `• <code>/reset_ticket TEDX-849201</code> — Сбросить статус билета в VALID\n\n` +
                  `📢 <b>Рассылки:</b>\n` +
                  `• <code>/broadcast Ваш текст</code> — Рассылка всем пользователям бота`
          });
          return res.status(200).json({ ok: true });
        }

        // 2. Add Super Admin Command: /add_admin @username or /add_admin 123456
        if (text.startsWith('/add_admin')) {
          const target = text.replace('/add_admin', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_admin @username</code>`
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
            text: `👑 <b>Новый Со-Администратор назначен!</b>\n\n👤 <b>Админ:</b> <code>${target}</code>\nТеперь этому пользователю доступны все команды управления.`
          });
          return res.status(200).json({ ok: true });
        }

        // 3. Remove Super Admin Command: /del_admin @username
        if (text.startsWith('/del_admin')) {
          const target = text.replace('/del_admin', '').trim().replace('@', '');
          let extraAdmins = (await kv.get('super_admins')) || [];
          extraAdmins = extraAdmins.filter((a) => a.toLowerCase() !== target.toLowerCase());
          await kv.set('super_admins', extraAdmins);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Со-Администратор удален:</b> <code>${target}</code>`
          });
          return res.status(200).json({ ok: true });
        }

        // 4. List Super Admins: /admins
        if (text === '/admins') {
          const extraAdmins = (await kv.get('super_admins')) || [];
          const listStr = extraAdmins.length > 0
            ? extraAdmins.map((a, i) => `${i + 1}. <code>${a}</code>`).join('\n')
            : '<i>Дополнительные админы не назначены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Список Администраторов TEDxSergeli:</b>\n\n` +
                  `🌟 <b>Главный Создатель (Founder):</b> <code>${SUPER_ADMIN_ID}</code>\n` +
                  `🛡 <b>Со-Администраторы:</b>\n${listStr}`
          });
          return res.status(200).json({ ok: true });
        }

        // 5. Add Scanner Command: /add_scanner @username
        if (text.startsWith('/add_scanner')) {
          const target = text.replace('/add_scanner', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_scanner @username</code>`
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
            text: `✅ <b>Волонтер назначен Контролером билетов!</b>\n\n👤 <b>Контролер:</b> <code>${target}</code>\nМожет сканировать QR-коды на входе.`
          });
          return res.status(200).json({ ok: true });
        }

        // 6. Remove Scanner Command: /del_scanner @username
        if (text.startsWith('/del_scanner')) {
          const target = text.replace('/del_scanner', '').trim().replace('@', '');
          let scanners = (await kv.get('allowed_scanners')) || [];
          scanners = scanners.filter((s) => s.toLowerCase() !== target.toLowerCase());
          await kv.set('allowed_scanners', scanners);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Волонтер удален из контролеров:</b> <code>${target}</code>`
          });
          return res.status(200).json({ ok: true });
        }

        // 7. List Scanners: /scanners
        if (text === '/scanners') {
          const scanners = (await kv.get('allowed_scanners')) || [];
          const listStr = scanners.length > 0
            ? scanners.map((s, i) => `${i + 1}. <code>${s}</code>`).join('\n')
            : '<i>Список пуст. Добавьте волонтеров через /add_scanner @username</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📋 <b>Авторизованные Контролеры билетов:</b>\n\n${listStr}`
          });
          return res.status(200).json({ ok: true });
        }

        // 8. Event Statistics Command: /stats
        if (text === '/stats') {
          const ticketIds = (await kv.get('all_ticket_ids')) || [];
          const allUserIds = (await kv.get('all_user_ids')) || [];

          let validCount = 0;
          let usedCount = 0;

          for (const tid of ticketIds) {
            const ticket = await kv.get(`ticket:${tid}`);
            if (ticket) {
              if (ticket.status === 'used') usedCount++;
              else if (ticket.status === 'valid') validCount++;
            }
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📊 <b>ЖИВАЯ СТАТИСТИКА TEDxSergeli</b>\n\n` +
                  `👥 <b>Всего пользователей в боте:</b> ${allUserIds.length}\n` +
                  `🎟 <b>Выдано билетов (Подтверждено):</b> ${ticketIds.length}\n\n` +
                  `🟢 <b>Прошли на мероприятие (USED):</b> ${usedCount}\n` +
                  `🟡 <b>Ожидают входа (VALID):</b> ${validCount}\n` +
                  `📈 <b>Заполняемость зала:</b> ${ticketIds.length > 0 ? Math.round((usedCount / ticketIds.length) * 100) : 0}%`
          });
          return res.status(200).json({ ok: true });
        }

        // 9. Find Ticket Command: /find TEDX-849201
        if (text.startsWith('/find')) {
          const query = text.replace('/find', '').trim();
          if (!query) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/find TEDX-849201</code>`
            });
            return res.status(200).json({ ok: true });
          }

          let ticket = await kv.get(`ticket:${query}`);
          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${query}</code> не найден.`
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
                  (ticket.used_at ? `🟢 <b>Отсканирован:</b> ${new Date(ticket.used_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })} (@${ticket.scanned_by})` : '')
          });
          return res.status(200).json({ ok: true });
        }

        // 10. Reset Ticket Command (restore VALID status): /reset_ticket TEDX-849201
        if (text.startsWith('/reset_ticket')) {
          const tid = text.replace('/reset_ticket', '').trim();
          let ticket = await kv.get(`ticket:${tid}`);
          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${tid}</code> не найден.`
            });
            return res.status(200).json({ ok: true });
          }

          ticket.status = 'valid';
          delete ticket.used_at;
          delete ticket.scanned_by;
          await kv.set(`ticket:${tid}`, ticket);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Статус билета <code>${tid}</code> успешно сброшен в VALID!</b>\nТеперь этот билет можно отсканировать снова.`
          });
          return res.status(200).json({ ok: true });
        }

        // 11. Broadcast Command: /broadcast Text message
        if (text.startsWith('/broadcast')) {
          const broadcastMsg = text.replace('/broadcast', '').trim();
          if (!broadcastMsg) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/broadcast Ваш текст анонса</code>`
            });
            return res.status(200).json({ ok: true });
          }

          const allUserIds = (await kv.get('all_user_ids')) || [];
          let successCount = 0;

          for (const uid of allUserIds) {
            try {
              const res = await callTelegram('sendMessage', {
                chat_id: uid,
                parse_mode: 'HTML',
                text: `📢 <b>Официальное сообщение TEDxSergeli:</b>\n\n${broadcastMsg}`
              });
              if (res.ok) successCount++;
            } catch {}
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🚀 <b>Рассылка завершена!</b>\n\nУспешно доставлено <b>${successCount} / ${allUserIds.length}</b> пользователям.`
          });
          return res.status(200).json({ ok: true });
        }
      }

      // 1. Handle /start command (Normal start OR QR Code Scanner Deep Link)
      if (text && text.startsWith('/start')) {
        const payload = text.split(' ')[1] || 'direct';

        // Check if this is a Ticket QR Code Scan (e.g., /start scan_TEDX-849201 or /start TEDX-849201)
        if (payload.startsWith('scan_') || payload.startsWith('TEDX-')) {
          const ticketId = payload.replace('scan_', '').trim();

          // 🔒 SECURITY GUARD: Check if the user scanning the code is an authorized scanner/admin
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
            // Mark Ticket as Used
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
            // Ticket was already scanned previously
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

        // Standard user /start registration flow
        let user = { step: 'LANG', source: payload, payment_status: 'none' };
        await kv.set(`user:${chatId}`, user);

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

      // 3. User sends Phone
      if (user.step === 'PHONE') {
        if (contact) {
          user.phone = contact.phone_number;
        } else if (text) {
          user.phone = text;
        }

        if (user.phone) {
          user.step = 'PAYMENT';
          await kv.set(`user:${chatId}`, user);
          
          const lang = user.lang || 'ru';
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: texts.payment[lang],
            reply_markup: { remove_keyboard: true }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // 4. User sends a photo (receipt)
      if (user.step === 'PAYMENT' && photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id;
        user.payment_status = 'pending';
        await kv.set(`user:${chatId}`, user);

        const adminPayload = {
          chat_id: ADMIN_CHAT_ID,
          photo: fileId,
          parse_mode: 'HTML',
          caption: `🧾 <b>Yangi to'lov!</b>\n` +
                   `👤 FIO: <b>${user.name || "Noma'lum"}</b>\n` +
                   `📱 Tel: <code>${user.phone || "Noma'lum"}</code>\n` +
                   `🔗 Manba (Source): ${user.source || 'direct'}\n` +
                   `TG: @${chat.username || chat.first_name || "Ism yo'q"} (ID: <code>${chatId}</code>)`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Tasdiqlash', callback_data: `confirm_${chatId}` },
                { text: '❌ Rad etish', callback_data: `reject_${chatId}` }
              ]
            ]
          }
        };
        if (TICKET_THREAD_ID) {
          adminPayload.message_thread_id = TICKET_THREAD_ID;
        }
        await callTelegram('sendPhoto', adminPayload);

        const lang = user.lang || 'ru';
        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.photoReply[lang],
          reply_to_message_id: message_id,
        });
        
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
        
        let user = (await kv.get(`user:${chatId}`)) || {};
        user.lang = selectedLang;
        user.step = 'NAME';
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

      // Handle Admin Actions
      if (data.startsWith('confirm_') || data.startsWith('reject_')) {
        const [action, userIdStr] = data.split('_');
        const userId = parseInt(userIdStr, 10);
        let user = (await kv.get(`user:${userId}`)) || {};

        // Prevent double processing if admin clicks button multiple times
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
          const row = Math.floor(Math.random() * 15) + 1;
          const seat = Math.floor(Math.random() * 20) + 1;

          // Save official ticket record
          const ticketData = {
            id: ticketId,
            userId: userId,
            name: user.name || 'Mehmon',
            phone: user.phone || 'Noma\'lum',
            row: row,
            seat: seat,
            status: 'valid',
            confirmed_at: new Date().toISOString()
          };
          await kv.set(`ticket:${ticketId}`, ticketData);
          await trackTicket(ticketId);

          user.ticketId = ticketId;
          user.payment_status = 'confirmed';
          await kv.set(`user:${userId}`, user);

          // Get bot username dynamically or use default
          const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TEDxSergeliBot';
          const qrUrl = `https://t.me/${botUsername}?start=scan_${ticketId}`;

          // Generate PNG Image with QR Code
          let photoBuffer = null;
          try {
            photoBuffer = await generateTicketImage({
              name: user.name || 'Mehmon',
              row,
              seat,
              ticketId,
              qrUrl
            });
          } catch (genErr) {
            console.error('Ticket image generation error:', genErr);
          }

          const ticketCaption =
            `🎉 <b>To'lov tasdiqlandi! / Оплата подтверждена! / Payment confirmed!</b>\n\n` +
            `🎟 <b>Sizning rasmiy elektron chiptangiz tayyor! / Ваш официальный электронный билет готов!</b>\n\n` +
            `👤 <b>Ism / Имя:</b> ${user.name || 'Mehmon'}\n` +
            `📍 <b>Qator / Ряд:</b> ${row} | <b>Joy / Место:</b> ${seat}\n` +
            `🔑 <b>Chipta ID / ID Билета:</b> <code>${ticketId}</code>\n\n` +
            `📱 <i>TEDxSergeli anjumaniga kirishda chiptadagi QR-kodni ko'rsating.</i>`;

          // Send Photo if buffer generated, fallback to text message
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
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI (CHIPTA BERILDI)</b>\nID: <code>${ticketId}</code> | Qator ${row}, Joy ${seat}\nTekshirdi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        } else if (action === 'reject') {
          user.payment_status = 'rejected';
          await kv.set(`user:${userId}`, user);

          await callTelegram('sendMessage', {
            chat_id: userId,
            parse_mode: 'HTML',
            text: texts.reject,
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n❌ <b>RAD ETILDI</b>\nRad etdi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        }

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      await callTelegram('answerCallbackQuery', { callback_query_id: id });
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}
