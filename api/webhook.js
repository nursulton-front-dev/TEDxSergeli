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

// Seat Allocation helper for 200 total seats (4 sectors x 48 seats on Floor 1 + 8 balcony seats on Floor 2)
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

// Generate high-resolution official TEDx Ticket Image with QR Code
async function generateTicketImage({ name, sector, row, seat, seatNumber, ticketId, qrUrl }) {
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    margin: 1,
    width: 300,
    color: {
      dark: '#0E0E11',
      light: '#FFFFFF'
    }
  });

  const activeSector = sector || 1;
  const activeRow = row || 1;
  const activeSeat = seat || 1;

  const formattedSector = String(activeSector).padStart(2, '0');
  const formattedRow = String(activeRow).padStart(2, '0');
  const formattedSeat = String(activeSeat).padStart(2, '0');
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

    <!-- Sector, Row & Seat Boxes -->
    <g transform="translate(60, 315)">
      <!-- Sector Box -->
      <rect x="0" y="0" width="160" height="80" rx="16" fill="#1A1A1E" stroke="#2C2C30" stroke-width="1"/>
      <text x="16" y="30" fill="#8E8E93" font-family="sans-serif" font-size="11" font-weight="bold" letter-spacing="1">SECTOR / СЕКТОР</text>
      <text x="16" y="65" fill="#E62B1E" font-family="sans-serif" font-size="32" font-weight="900">${formattedSector}</text>

      <!-- Row Box -->
      <rect x="180" y="0" width="160" height="80" rx="16" fill="#1A1A1E" stroke="#2C2C30" stroke-width="1"/>
      <text x="196" y="30" fill="#8E8E93" font-family="sans-serif" font-size="11" font-weight="bold" letter-spacing="1">ROW / РЯД</text>
      <text x="196" y="65" fill="#FFFFFF" font-family="sans-serif" font-size="32" font-weight="900">${formattedRow}</text>

      <!-- Seat Box -->
      <rect x="360" y="0" width="160" height="80" rx="16" fill="#1A1A1E" stroke="#2C2C30" stroke-width="1"/>
      <text x="376" y="30" fill="#8E8E93" font-family="sans-serif" font-size="11" font-weight="bold" letter-spacing="1">SEAT / JOY</text>
      <text x="376" y="65" fill="#FFFFFF" font-family="sans-serif" font-size="32" font-weight="900">${formattedSeat}</text>
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
        
        // 0. Hide Keyboard Command
        if (text === '❌ Скрыть меню') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🙈 <b>Клавиатура супер-администратора скрыта.</b>\n\nЧтобы снова открыть меню управления, введите команду <code>/admin</code>`,
            reply_markup: { remove_keyboard: true }
          });
          return res.status(200).json({ ok: true });
        }

        // 1. Admin Help / Dashboard / Instructions (/admin, /help_admin, "ℹ️ Инструкция", /scanner, /checkin)
        if (text === '/admin' || text === '/help_admin' || text === 'ℹ️ Инструкция' || text === '/scanner' || text === '/checkin' || text === '/scan') {
          const appDomain = process.env.VERCEL_URL
            ? (process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
            : 'https://tedxsergeli.vercel.app';
          const scannerAppUrl = `${appDomain}/scanner`;

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
                  `📊 <b>Мониторинг и Управление Билетами:</b>\n` +
                  `• <code>/stats</code> — Живая статистика билетов и входа (кнопка <b>📊 Статистика</b>)\n` +
                  `• <code>/find TEDX-849201</code> — Найти всю информацию о билете\n` +
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

        // 2. Add Super Admin Command: /add_admin @username
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
            text: `👑 <b>Новый Со-Администратор назначен!</b>\n\n👤 <b>Админ:</b> <code>${target}</code>\nТеперь этому пользователю доступны все админ-команды.`,
            reply_markup: ADMIN_KEYBOARD
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
            text: `🗑 <b>Со-Администратор удален:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // 4. List Super Admins: /admins or "👑 Админы"
        if (text === '/admins' || text === '👑 Админы') {
          const extraAdmins = (await kv.get('super_admins')) || [];
          const listStr = extraAdmins.length > 0
            ? extraAdmins.map((a, i) => `${i + 1}. <code>${a}</code>`).join('\n')
            : '<i>Дополнительные админы не назначены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Список Администраторов TEDxSergeli:</b>\n\n` +
                  `🌟 <b>Главный Создатель (Founder):</b> <code>${SUPER_ADMIN_ID}</code>\n` +
                  `🛡 <b>Со-Администраторы:</b>\n${listStr}\n\n` +
                  `💡 <i>Добавить админа: <code>/add_admin @username</code></i>\n` +
                  `💡 <i>Удалить админа: <code>/del_admin @username</code></i>`,
            reply_markup: ADMIN_KEYBOARD
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
            text: `✅ <b>Волонтер назначен Контролером билетов!</b>\n\n👤 <b>Контролер:</b> <code>${target}</code>\nТеперь он может сканировать QR-коды гостей на входе.`,
            reply_markup: ADMIN_KEYBOARD
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
            text: `🗑 <b>Волонтер удален из контролеров:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // 7. List Scanners: /scanners or "📋 Контролеры"
        if (text === '/scanners' || text === '📋 Контролеры') {
          const scanners = (await kv.get('allowed_scanners')) || [];
          const listStr = scanners.length > 0
            ? scanners.map((s, i) => `${i + 1}. <code>${s}</code>`).join('\n')
            : '<i>Список пуст. Добавьте волонтеров через /add_scanner @username</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📋 <b>Авторизованные Контролеры билетов:</b>\n\n${listStr}\n\n` +
                  `💡 <i>Добавить контролера: <code>/add_scanner @username</code></i>\n` +
                  `💡 <i>Удалить контролера: <code>/del_scanner @username</code></i>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // 8. Event Statistics Command: /stats or "📊 Статистика"
        if (text === '/stats' || text === '📊 Статистика') {
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
                  `📈 <b>Заполняемость зала:</b> ${ticketIds.length > 0 ? Math.round((usedCount / ticketIds.length) * 100) : 0}%`,
            reply_markup: ADMIN_KEYBOARD
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
              text: `⚠️ <b>Использование:</b> <code>/find TEDX-849201</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let ticket = await kv.get(`ticket:${query}`);
          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${query}</code> не найден.`,
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

        // 10. Reset Ticket Command (restore VALID status): /reset_ticket TEDX-849201
        if (text.startsWith('/reset_ticket')) {
          const tid = text.replace('/reset_ticket', '').trim();
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

          ticket.status = 'valid';
          delete ticket.used_at;
          delete ticket.scanned_by;
          await kv.set(`ticket:${tid}`, ticket);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Статус билета <code>${tid}</code> успешно сброшен в VALID!</b>\nТеперь этот билет можно отсканировать снова.`,
            reply_markup: ADMIN_KEYBOARD
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
              text: `⚠️ <b>Использование:</b> <code>/broadcast Ваш текст анонса</code>`,
              reply_markup: ADMIN_KEYBOARD
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
            text: `🚀 <b>Рассылка завершена!</b>\n\nУспешно доставлено <b>${successCount} / ${allUserIds.length}</b> пользователям.`,
            reply_markup: ADMIN_KEYBOARD
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

        // Check for pre-selected seat parameter (e.g., /start seat_42 or /start seat-42 or /start SEAT-42 or /start 42)
        let requestedSeat = null;
        if (payload.match(/^seat[_-]?\d+$/i)) {
          requestedSeat = parseInt(payload.replace(/^seat[_-]?/i, ''), 10);
        } else if (/^\d+$/.test(payload)) {
          const num = parseInt(payload, 10);
          if (num >= 1 && num <= 200) requestedSeat = num;
        }

        // Standard user /start registration flow
        let user = { step: 'LANG', source: payload, payment_status: 'none' };
        if (requestedSeat && requestedSeat >= 1 && requestedSeat <= 200) {
          user.seatNumber = requestedSeat;
          user.seatId = `SEAT-${requestedSeat}`;
        }
        await kv.set(`user:${chatId}`, user);

        // Send Super Admin Keyboard greeting if user is Super Admin
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
                    `💳 <b>Karta raqami:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Qabul qiluvchi:</b> TEDxSergeli Team\n\n` +
                    `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
            } else if (userLang === 'en') {
              msg = `✅ <b>Seat selected: #${seatNumber} (Sector ${sector || 1}, Row ${row || 1} / Seat ${seat || 1})</b>\n\n` +
                    `⏳ <b>Attention! This seat is reserved for 15 minutes.</b>\n` +
                    `Please send the payment receipt screenshot within this time.\n\n` +
                    `💳 <b>Amount:</b> 49,999 UZS\n` +
                    `💳 <b>Card Number:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Recipient:</b> TEDxSergeli Team\n\n` +
                    `📸 After payment, please send the receipt screenshot here.`;
            } else {
              msg = `✅ <b>Место выбрано: №${seatNumber} (Сектор ${sector || 1}, ${row || 1}-ряд / ${seat || 1}-место)</b>\n\n` +
                    `⏳ <b>Внимание! Это место забронировано за вами на 15 минут.</b>\n` +
                    `Пожалуйста, отправьте чек об оплате в течение этого времени.\n\n` +
                    `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
                    `💳 <b>Номер карты:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Получатель:</b> TEDxSergeli Team\n\n` +
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

      // 3. User sends Phone -> Move to SELECT_SEAT (Telegram WebApp Mini App)
      if (user.step === 'PHONE') {
        if (contact) {
          user.phone = contact.phone_number;
        } else if (text) {
          user.phone = text;
        }

        if (user.phone) {
          const appDomain = process.env.VERCEL_URL
            ? (process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
            : 'https://tedxsergeli.vercel.app';
          const seatPickerUrl = `${appDomain}/seat-picker`;
          const lang = user.lang || 'ru';

          if (user.seatNumber) {
            user.step = 'PAYMENT';
            await kv.set(`user:${chatId}`, user);

            let msg = '';
            if (lang === 'uz') {
              msg = `📍 <b>Siz tanlagan joy: #${user.seatNumber}</b>\n\n` +
                    `⏳ <i>Ushbu joy siz uchun 15 daqiqaga band qilindi.</i>\n\n` +
                    `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
                    `💳 <b>Karta raqami:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Qabul qiluvchi:</b> TEDxSergeli Team\n\n` +
                    `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
            } else if (lang === 'en') {
              msg = `📍 <b>Your selected seat: #${user.seatNumber}</b>\n\n` +
                    `⏳ <i>This seat is reserved for you for 15 minutes.</i>\n\n` +
                    `💳 <b>Amount:</b> 49,999 UZS\n` +
                    `💳 <b>Card Number:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Recipient:</b> TEDxSergeli Team\n\n` +
                    `📸 After payment, please send the receipt screenshot here.`;
            } else {
              msg = `📍 <b>Ваше выбранное место: №${user.seatNumber}</b>\n\n` +
                    `⏳ <i>Это место забронировано за вами на 15 минут.</i>\n\n` +
                    `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
                    `💳 <b>Номер карты:</b> <code>8600 0000 0000 0000</code>\n` +
                    `👤 <b>Получатель:</b> TEDxSergeli Team\n\n` +
                    `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
            }

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🎭 Joyni o'zgartirish (Схема зала)",
                      web_app: { url: seatPickerUrl }
                    }
                  ]
                ]
              }
            });
          } else {
            user.step = 'SELECT_SEAT';
            await kv.set(`user:${chatId}`, user);

            let msg = '';
            if (lang === 'uz') {
              msg = `🎟️ <b>Telefon raqam saqlandi!</b>\n\nEndi quyidagi tugma orqali interaktiv sxemadan o'zingizga yoqqan joyni tanlang:`;
            } else if (lang === 'en') {
              msg = `🎟️ <b>Phone number saved!</b>\n\nNow select your preferred seat on the interactive hall map below:`;
            } else {
              msg = `🎟️ <b>Номер телефона сохранен!</b>\n\nТеперь выберите удобное место на интерактивной схеме зала:`;
            }

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🎟️ Joyni tanlash (Схема зала)",
                      web_app: { url: seatPickerUrl }
                    }
                  ]
                ]
              }
            });
          }
        }
        return res.status(200).json({ ok: true });
      }

      // 4. User sends a photo (receipt)
      if (user.step === 'PAYMENT' && photo && photo.length > 0) {
        // ⏱️ CHECK IF RESERVATION HAS EXPIRED (15 Minutes Expiry Guard)
        if (user.bookingExpiresAt && Date.now() > user.bookingExpiresAt && user.payment_status !== 'confirmed') {
          if (user.seatNumber) {
            let occupied = (await kv.get('occupied_seats')) || [];
            if (Array.isArray(occupied)) {
              occupied = occupied.filter(s => s !== user.seatNumber);
              await kv.set('occupied_seats', occupied);
            }
          }

          user.seatNumber = null;
          user.seatId = null;
          user.step = 'SELECT_SEAT';
          delete user.bookingExpiresAt;
          await kv.set(`user:${chatId}`, user);

          const lang = user.lang || 'ru';
          const appDomain = process.env.VERCEL_URL
            ? (process.env.VERCEL_URL.startsWith('http') ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
            : 'https://tedxsergeli.vercel.app';
          const seatPickerUrl = `${appDomain}/seat-picker`;

          let expiredMsg = '';
          if (lang === 'uz') {
            expiredMsg = `⚠️ <b>Band qilish vaqti (15 daqiqa) tugadi!</b>\n\n` +
                         `Siz tanlagan joy resurslarni bo'shatish uchun bekor qilindi.\n` +
                         `Iltimos, quyidagi tugma orqali qaytadan joy tanlang:`;
          } else if (lang === 'en') {
            expiredMsg = `⚠️ <b>Reservation time (15 minutes) has expired!</b>\n\n` +
                         `Your reserved seat was released.\n` +
                         `Please select a seat again using the button below:`;
          } else {
            expiredMsg = `⚠️ <b>Время бронирования (15 минут) истекло!</b>\n\n` +
                         `Ваше забронированное место было сброшено.\n` +
                         `Пожалуйста, выберите место заново с помощью кнопки ниже:`;
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: expiredMsg,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎟️ Joyni qayta tanlash (Схема зала)",
                    web_app: { url: seatPickerUrl }
                  }
                ]
              ]
            }
          });

          return res.status(200).json({ ok: true });
        }

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

          // 🎟 1. GLOBAL TICKET COUNTER & SEAT ALLOCATION (Max 200)
          let totalSold = (await kv.get('total_tickets_sold')) || 0;
          totalSold = parseInt(totalSold, 10) || 0;

          let seatNumber = user.seatNumber || (user.seatId ? parseInt(String(user.seatId).replace(/\D/g, ''), 10) : null);

          if (!seatNumber || seatNumber < 1 || seatNumber > 200) {
            totalSold++;
            if (totalSold > 200) totalSold = 200;
            seatNumber = totalSold;
            await kv.set('total_tickets_sold', totalSold);
          }

          let allocatedSeats = (await kv.get('allocated_seats')) || [];
          if (!Array.isArray(allocatedSeats)) allocatedSeats = [];
          if (!allocatedSeats.includes(seatNumber)) {
            allocatedSeats.push(seatNumber);
            await kv.set('allocated_seats', allocatedSeats);
          }

          const seatInfo = getSeatDetails(seatNumber);

          // Save official ticket record
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

          // Get bot username dynamically or use default
          const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TEDxSergeliBot';
          const qrUrl = `https://t.me/${botUsername}?start=scan_${ticketId}`;

          // Generate PNG Image with QR Code
          let photoBuffer = null;
          try {
            photoBuffer = await generateTicketImage({
              name: user.name || 'Mehmon',
              sector: seatInfo.sector,
              row: seatInfo.row,
              seat: seatInfo.seat,
              seatNumber: seatInfo.seatNumber,
              ticketId,
              qrUrl
            });
          } catch (genErr) {
            console.error('Ticket image generation error:', genErr);
          }

          const userLang = user.lang || 'ru';
          let ticketCaption = '';

          if (userLang === 'uz') {
            ticketCaption =
              `🎉 <b>To'lov tasdiqlandi!</b>\n\n` +
              `🎟️ <b>Sizning chiptangiz: #${seatInfo.seatNumber}</b>\n` +
              `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n` +
              `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n\n` +
              `📌 <b>Kirish qoidalari:</b>\n` +
              `• 1️⃣ Tadbir kunida ushbu QR-kodni nazoratchiga ko'rsating.\n` +
              `• 2️⃣ Telefon ekranidan ko'rsatish yoki qog'ozga chiqarib kelish mumkin.\n` +
              `• 3️⃣ Har bir QR-kod faqat 1 marotaba kirish uchun amal qiladi.`;
          } else if (userLang === 'en') {
            ticketCaption =
              `🎉 <b>Payment confirmed!</b>\n\n` +
              `🎟️ <b>Your ticket: #${seatInfo.seatNumber}</b>\n` +
              `📍 <b>Seat:</b> ${seatInfo.sector === 5 ? '2nd Floor (Balcony)' : `Sector ${seatInfo.sector}`}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n` +
              `🔑 <b>Ticket ID:</b> <code>${ticketId}</code>\n\n` +
              `📌 <b>Entrance Rules:</b>\n` +
              `• 1️⃣ Show this QR code to the scanner on the day of the event.\n` +
              `• 2️⃣ You can show it on your phone screen or print on paper.\n` +
              `• 3️⃣ Each QR code is valid for 1 entry only.`;
          } else {
            ticketCaption =
              `🎉 <b>Оплата подтверждена!</b>\n\n` +
              `🎟️ <b>Ваш билет: #${seatInfo.seatNumber}</b>\n` +
              `📍 <b>Место:</b> ${seatInfo.sector === 5 ? '2-Этаж (Балкон)' : `Сектор ${seatInfo.sector}`}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n` +
              `🔑 <b>ID Билета:</b> <code>${ticketId}</code>\n\n` +
              `📌 <b>Правила входа:</b>\n` +
              `• 1️⃣ Обязательно покажите этот QR-код на входе в день мероприятия.\n` +
              `• 2️⃣ Можно показать с экрана телефона или распечатать.\n` +
              `• 3️⃣ Каждый QR-код действителен только для 1 входа.`;
          }

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
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI (CHIPTA BERILDI)</b>\nID: <code>${ticketId}</code> | ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\nTekshirdi: @${adminUsername}`,
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
