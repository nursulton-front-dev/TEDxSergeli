import QRCode from 'qrcode';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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
        try { parsed = JSON.parse(parsed); } catch (_err) { }
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
const VOLUNTEER_THREAD_ID = process.env.TELEGRAM_VOLUNTEER_THREAD_ID || process.env.VOLUNTEER_TOPIC_ID || '2';
const TICKET_THREAD_ID = process.env.TELEGRAM_TICKET_THREAD_ID || process.env.TOPIC_ID_TICKETS || process.env.TICKETS_TOPIC_ID || process.env.ADMIN_TOPIC_ID || '4';
const SUPER_ADMIN_ID = '6804139305'; // Founder Telegram ID
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Production WebApp Domain (Prevents Vercel preview login wall)
const PUBLIC_DOMAIN = process.env.PUBLIC_URL || 'https://tedx-sergeli.vercel.app';

const ADMIN_KEYBOARD = {
  keyboard: [
    [{ text: "📊 Статистика" }, { text: "🏷 Промокоды" }],
    [{ text: "📋 Контролеры" }, { text: "👑 Админы" }],
    [{ text: "ℹ️ Инструкция" }, { text: "❌ Скрыть меню" }]
  ],
  resize_keyboard: true,
  persistent: true
};

// Controller / Ticket Scanner Persistent Bottom Keyboard Menu
const SCANNER_KEYBOARD = {
  keyboard: [
    [
      {
        text: "📱 Входной QR-Сканер",
        web_app: { url: `${PUBLIC_DOMAIN}/scanner` }
      }
    ],
    [{ text: "🔍 Проверить билет по ID" }, { text: "📖 Инструкция контролера" }]
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

// Promo Code Helper Functions
async function getPromos() {
  const promos = await kv.get('promos');
  return (promos && typeof promos === 'object') ? promos : {};
}

async function savePromos(promos) {
  await kv.set('promos', promos);
}

function calculateDiscount(basePrice, promo) {
  if (!promo) return { finalPrice: basePrice, discountAmount: 0, isValid: false, reason: 'not_found' };

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { finalPrice: basePrice, discountAmount: 0, isValid: false, reason: 'limit_exceeded' };
  }

  let discountAmount = 0;
  if (promo.discountType === 'percent') {
    discountAmount = Math.round((basePrice * promo.discountValue) / 100);
  } else {
    discountAmount = promo.discountValue;
  }

  let finalPrice = Math.max(0, basePrice - discountAmount);
  return { finalPrice, discountAmount, isValid: true, reason: 'ok' };
}

// Render Interactive Promo Code List with Inline Keyboards (Edit, Delete, Create)
async function renderPromoList(chatId, messageId = null) {
  const promos = await getPromos();
  const promoList = Object.values(promos);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TEDxSergeliSpecializedSchool_bot';

  let text = `🏷 <b>УПРАВЛЕНИЕ ПРОМОКОДАМИ TEDxSergeli</b>\n\n`;
  const inline_keyboard = [];

  if (promoList.length === 0) {
    text += `<i>Промокоды пока не созданы.</i>\n\n` +
      `Вы можете создать новый промокод в 1 клик через кнопку <b>«➕ Создать промокод»</b> ниже или командой:\n` +
      `<code>/add_promo VIP 100%</code>`;
  } else {
    text += `📊 <b>Активные промокоды (${promoList.length}):</b>\n\n`;
    promoList.forEach((p, idx) => {
      const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
      const limitStr = p.maxUses > 0 ? `${p.usedCount || 0}/${p.maxUses}` : `${p.usedCount || 0} (безлимит)`;
      const deepLink = `https://t.me/${botUsername}?start=promo_${p.code}`;

      text += `${idx + 1}. 🔑 <b><code>${p.code}</code></b> — Скидка: <b>${discStr}</b>\n` +
        `   📊 Использовано: ${limitStr} | Создал: ${p.createdBy || 'Admin'}\n` +
        `   🔗 <code>${deepLink}</code>\n\n`;

      inline_keyboard.push([
        { text: `✏️ Изменить ${p.code}`, callback_data: `edit_promo_${p.code}` },
        { text: `🗑 Удалить`, callback_data: `del_promo_${p.code}` }
      ]);
    });
  }

  inline_keyboard.push([
    { text: "➕ Создать промокод", callback_data: "promo_create_wizard" },
    { text: "🔄 Обновить список", callback_data: "refresh_promos" }
  ]);

  if (messageId) {
    return await callTelegram('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      text,
      reply_markup: { inline_keyboard }
    });
  } else {
    return await callTelegram('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text,
      reply_markup: { inline_keyboard }
    });
  }
}


// Helper to issue ticket for user (used by Admin Confirm and 100% Free Promo codes)
async function issueTicketForUser({ userId, user, seatNumber, confirmedBy, promoCode }) {
  const ticketId = `TEDX-${Math.floor(100000 + Math.random() * 900000)}`;

  let allocatedSeats = (await kv.get('allocated_seats')) || [];
  if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

  let finalSeatNum = seatNumber || user.seatNumber;

  if (!finalSeatNum || finalSeatNum < 1 || finalSeatNum > 100) {
    const activeOccupied = await getActiveOccupiedSeats();
    const occupiedSeats = activeOccupied.map(i => i.seat);
    const taken = new Set([...allocatedSeats, ...occupiedSeats]);
    let next = 1;
    while (taken.has(next) && next <= 100) next++;
    finalSeatNum = Math.min(100, next);
  }

  if (!allocatedSeats.includes(finalSeatNum)) {
    allocatedSeats.push(finalSeatNum);
    await kv.set('allocated_seats', allocatedSeats);
  }

  const totalSold = allocatedSeats.length;
  await kv.set('total_tickets_sold', totalSold);

  let activeOccupied = await getActiveOccupiedSeats();
  const initialLen = activeOccupied.length;
  activeOccupied = activeOccupied.filter(i => i.seat !== finalSeatNum);
  if (activeOccupied.length !== initialLen) {
    await kv.set('occupied_seats', activeOccupied);
  }

  const seatInfo = getSeatDetails(finalSeatNum);

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
    promoCode: promoCode || null,
    confirmed_at: new Date().toISOString()
  };
  await kv.set(`ticket:${ticketId}`, ticketData);
  await trackTicket(ticketId);

  user.ticketId = ticketId;
  user.seatNumber = seatInfo.seatNumber;
  user.seatId = seatInfo.seatId;
  user.payment_status = 'confirmed';
  user.confirmed_at = ticketData.confirmed_at;
  await kv.set(`user:${userId}`, user);

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TEDxSergeliSpecializedSchool_bot';
  const qrUrl = `https://t.me/${botUsername}?start=scan_${ticketId}`;

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
      `🎉 <b>${promoCode ? 'Promo-kod orqali tasdiqlandi!' : "To'lov tasdiqlandi!"}</b>\n\n` +
      `🎟️ <b>TEDxSergeli Specialized School — Rasmiy Elektron Chipta</b>\n\n` +
      `👤 <b>Mehmon:</b> ${user.name || 'Mehmon'}\n` +
      `📍 <b>Sektor:</b> ${seatInfo.sectorName}\n` +
      `📐 <b>O'rin:</b> ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (Umumiy №${seatInfo.seatNumber})\n` +
      `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n\n` +
      `📅 <b>Sana:</b> 4-sentabr, 2026\n` +
      `📍 <b>Manzil:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Ixtisoslashtirilgan Maktabi (Google Maps)</a>\n\n` +
      `📌 <b>Kirish qoidalari (TEDx Rules):</b>\n` +
      `• 1️⃣ Tadbir kunida ushbu QR-kodni nazoratchiga ko'rsating.\n` +
      `• 2️⃣ Eshiklar soat 14:30 da yopiladi. Kechikmang!\n` +
      `• 3️⃣ Har bir QR-kod faqat 1 marotaba kirish uchun amal qiladi.\n\n` +
      `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
  } else if (userLang === 'en') {
    ticketCaption =
      `🎉 <b>${promoCode ? 'Confirmed via Promo Code!' : 'Payment confirmed!'}</b>\n\n` +
      `🎟️ <b>TEDxSergeli Specialized School — Official Ticket</b>\n\n` +
      `👤 <b>Guest:</b> ${user.name || 'Guest'}\n` +
      `📍 <b>Sector:</b> ${seatInfo.sector === 5 ? '2nd Floor (Balcony)' : `Sector ${seatInfo.sector}`}\n` +
      `📐 <b>Seat:</b> Row ${seatInfo.row} / Seat ${seatInfo.seat} (Total №${seatInfo.seatNumber})\n` +
      `🔑 <b>Ticket ID:</b> <code>${ticketId}</code>\n\n` +
      `📅 <b>Date:</b> September 4, 2026\n` +
      `📍 <b>Location:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Specialized School (Google Maps)</a>\n\n` +
      `📌 <b>Entrance Rules (TEDx Rules):</b>\n` +
      `• 1️⃣ Show this QR code to the scanner on the day of the event.\n` +
      `• 2️⃣ Doors close at 14:30. Please arrive on time!\n` +
      `• 3️⃣ Each QR code is valid for 1 entry only.\n\n` +
      `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
  } else {
    ticketCaption =
      `🎉 <b>${promoCode ? 'Подтверждено по промокоду!' : 'Оплата подтверждена!'}</b>\n\n` +
      `🎟️ <b>TEDxSergeli Specialized School — Официальный электронный билет</b>\n\n` +
      `👤 <b>Гость:</b> ${user.name || 'Гость'}\n` +
      `📍 <b>Сектор:</b> ${seatInfo.sector === 5 ? '2-Этаж (Балкон)' : `Сектор ${seatInfo.sector}`}\n` +
      `📐 <b>Место:</b> ${seatInfo.row}-ряд / ${seatInfo.seat}-место (Общий №${seatInfo.seatNumber})\n` +
      `🔑 <b>ID Билета:</b> <code>${ticketId}</code>\n\n` +
      `📅 <b>Дата:</b> 4 сентября 2026\n` +
      `📍 <b>Адрес:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Специализированная школа Сергели (Google Maps)</a>\n\n` +
      `📌 <b>Правила входа (Правила TEDx):</b>\n` +
      `• 1️⃣ Покажите этот QR-код контролеру на входе в день мероприятия.\n` +
      `• 2️⃣ Двери закрываются в 14:30. Пожалуйста, не опаздывайте!\n` +
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

  if (ADMIN_CHAT_ID) {
    const groupTicketCaption =
      `🎟️ <b>YANGI CHIPTA ${promoCode ? `(PROMO-KOD: ${promoCode})` : 'BERILDI'}!</b>\n\n` +
      `👤 <b>Ism:</b> ${user.name || 'Mehmon'}\n` +
      `📍 <b>Joy:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
      `📱 <b>Tel / Telegram:</b> <code>${user.phone || 'Noma\'lum'}</code>\n` +
      `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n` +
      `💳 <b>Summa:</b> ${promoCode ? (user.finalPrice ? `${user.finalPrice.toLocaleString()} UZS` : '0 UZS (BEPUL)') : '49,999 UZS'}\n` +
      `✅ <b>Tasdiqladi:</b> ${confirmedBy || (promoCode ? `Promo-kod (${promoCode})` : 'System')}`;

    try {
      if (photoBuffer) {
        await callTelegramPhoto(ADMIN_CHAT_ID, photoBuffer, groupTicketCaption);
      } else {
        await callTelegram('sendMessage', {
          chat_id: ADMIN_CHAT_ID,
          parse_mode: 'HTML',
          text: groupTicketCaption
        });
      }
    } catch (dupErr) {
      console.error('Failed to duplicate ticket to admin chat:', dupErr);
    }
  }

  return { ticketId, seatInfo };
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

// Seat Reservation Helper
async function getActiveOccupiedSeats() {
  let occupied = (await kv.get('occupied_seats')) || [];
  if (!Array.isArray(occupied)) occupied = [];
  const now = Date.now();
  let changed = false;
  const active = [];
  for (let item of occupied) {
    if (typeof item === 'object' && item.seat && item.expiresAt) {
      if (item.expiresAt > now) {
        active.push(item);
      } else {
        changed = true;
      }
    } else {
      // old format (just numbers) -> remove them
      changed = true;
    }
  }
  if (changed) {
    await kv.set('occupied_seats', active);
  }
  return active;
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

// Seat Allocation helper for 100 total seats
function getSeatDetails(seatNum) {
  const n = Math.max(1, Math.min(100, parseInt(seatNum, 10) || 1));
  let sector = 1;
  let sectorName = "Sektor 1";
  let seatInSector = n;
  let row = 1;
  let seat = 1;
  let floor = 1;

  if (n <= 24) {
    sector = 1;
    sectorName = "Sektor 1";
    seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1;
    seat = ((n - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 48) {
    sector = 2;
    sectorName = "Sektor 2";
    seatInSector = n - 24;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 72) {
    sector = 3;
    sectorName = "Sektor 3";
    seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 96) {
    sector = 4;
    sectorName = "Sektor 4";
    seatInSector = n - 72;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else {
    sector = 5;
    sectorName = "2-Etaj (Balkon)";
    seatInSector = n - 96;
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

      // === GLOBAL INSTRUCTION & HELP COMMAND (Universal for all roles) ===
      if (text && (text.includes('Инструкция') || text.includes('инструкция') || text === '/help' || text === '/instruction' || text === '/help_admin' || text === 'Справка')) {
        if (await isSuperAdmin(from, chatId)) {
          const scannerAppUrl = `${PUBLIC_DOMAIN}/scanner`;
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚡️ <b>TEDxSergeli SUPER ADMIN DASHBOARD & ИНСТРУКЦИЯ</b>\n\n` +
              `📱 <b>Входной контроль по QR-кодам:</b>\n` +
              `Нажмите кнопку ниже, чтобы открыть веб-сканер билетов прямо в Telegram!\n\n` +
              `👑 <b>Управление Администраторами:</b>\n` +
              `• <code>/add_admin @username</code> — Назначить Со-Администратора\n` +
              `• <code>/del_admin @username</code> — Снять Со-Администратора\n` +
              `• <code>/admins</code> — Список всех Администраторов (кнопка <b>👑 Админы</b>)\n\n` +
              `🏷 <b>Система Промокодов:</b>\n` +
              `• Нажмите кнопку <b>🏷 Промокоды</b> или <code>/promos</code> — Интерактивное меню (Создание, Редактирование, Удаление в 1 клик)\n` +
              `• <code>/add_promo <КОД> <СКИДКА> [ЛИМИТ]</code> — Быстрое создание\n` +
              `• <code>/edit_promo <КОД> <СКИДКА> [ЛИМИТ]</code> — Редактирование промокода\n` +
              `• <code>/del_promo <КОД></code> — Удаление промокода\n\n` +
              `🎫 <b>Управление Контролерами Билетов:</b>\n` +
              `• <code>/add_scanner @username</code> — Назначить волонтера-контролера\n` +
              `• <code>/del_scanner @username</code> — Удалить контролера\n` +
              `• <code>/scanners</code> — Список контролеров (кнопка <b>📋 Контролеры</b>)\n\n` +
              `📊 <b>Мониторинг и База Данных:</b>\n` +
              `• <code>/stats</code> — Живая статистика билетов (кнопка <b>📊 Статистика</b>)\n` +
              `• <code>/export</code> — Выгрузка реестра билетов в Excel / CSV\n` +
              `• <code>/find TEDX-849201</code> — Найти информацию о билете\n` +
              `• <code>/reset_ticket TEDX-849201</code> — Сбросить статус билета\n` +
              `• <code>/reset_db</code> — Очистить базу данных\n\n` +
              `📢 <b>Массовые Рассылки:</b>\n` +
              `• <code>/broadcast Ваш текст</code> — Отправить анонс всем пользователям`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📷 QR-Сканерни очиш / Открыть QR-Сканер", web_app: { url: scannerAppUrl } }],
                [{ text: "🏷 Промокоды (Меню управления)", callback_data: "refresh_promos" }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        } else if (await isAuthorizedScanner(from, chatId)) {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📖 <b>ИНСТРУКЦИЯ ДЛЯ КОНТРОЛЁРОВ TEDxSergeli:</b>\n\n` +
              `1️⃣ <b>Проверка через QR-сканер:</b>\n` +
              `• Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу.\n` +
              `• Наведите камеру на QR-код на билете гостя.\n` +
              `• Зелёный экран = ГОСТЬ ПРОПУЩЕН ✅\n` +
              `• Красный экран = БИЛЕТ УЖЕ ИСПОЛЬЗОВАН 🛑\n\n` +
              `2️⃣ <b>Проверка вручную (без QR):</b>\n` +
              `• Отправьте боту <code>/find ID</code> (например, <code>/find TEDX-947695</code>).\n` +
              `• Или нажмите <b>🔍 Проверить билет по ID</b>.\n` +
              `• Бот покажет статус билета, ФИО гостя и место.`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        } else {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `ℹ️ <b>ИНСТРУКЦИЯ И СПРАВКА TEDxSergeli</b>\n\n` +
              `🎟 <b>Как приобрести билет:</b>\n` +
              `1. Введите <code>/start</code> или нажмите <b>«Перезапустить»</b>.\n` +
              `2. Выберите удобный язык (O'zbekcha / Русский / English).\n` +
              `3. Введите ваше ФИО и номер телефона.\n` +
              `4. Выберите желаемое место в зале.\n` +
              `5. Введите промокод (при наличии) и загрузите скриншот чека об оплате.\n\n` +
              `📌 <b>Правила входа:</b>\n` +
              `• После подтверждения вы получите электронный билет с QR-кодом.\n` +
              `• Предъявите QR-код контролеру на входе в день мероприятия.`
          });
          return res.status(200).json({ ok: true });
        }
      }

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
        if (text.startsWith('/reset_db') || text.startsWith('/clear_db')) {
          if (text.includes('force')) {
            const allTicketIds = (await kv.get('all_ticket_ids')) || [];
            if (Array.isArray(allTicketIds)) {
              for (const tid of allTicketIds) {
                await kv.set(`ticket:${tid}`, null);
              }
            }

            const allUserIds = (await kv.get('all_user_ids')) || [];
            if (Array.isArray(allUserIds)) {
              for (const uid of allUserIds) {
                await kv.set(`user:${uid}`, null);
              }
            }

            await kv.set('occupied_seats', []);
            await kv.set('allocated_seats', []);
            await kv.set('total_tickets_sold', 0);
            await kv.set('all_ticket_ids', []);
            await kv.set('all_user_ids', []);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `✅ <b>BAZA TO'LIQ TOZALANDI! / БАЗА ОЧИЩЕНА!</b>\nBarcha chiptalar, band qilingan joylar va foydalanuvchilar nollashtirildi (0/100).`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          // Ask for confirmation
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚠️ <b>DIQQAT! Baza ma'lumotlarini nolga tushirmoqchimisiz?</b>\n\nUshbu amal barcha sotilgan chiptalarni, band qilingan joylarni va foydalanuvchi ma'lumotlarini butunlay o'chirib tashlaydi (0/100).`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔥 Ha, bazani tozalash", callback_data: "confirm_reset_db" },
                  { text: "❌ Bekor qilish", callback_data: "cancel_reset_db" }
                ]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // Admin Dashboard / Help
        if (text === '/admin' || text === '/help_admin' || text === '/scanner' || text === '/checkin' || text === '/scan') {
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
              `🏷 <b>Система Промокодов:</b>\n` +
              `• Нажмите кнопку <b>🏷 Промокоды</b> или <code>/promos</code> — Интерактивное меню управления\n` +
              `• <code>/add_promo <КОД> <СКИДКА> [ЛИМИТ]</code> — Создать промокод\n` +
              `• <code>/edit_promo <КОД> <СКИДКА> [ЛИМИТ]</code> — Редактировать промокод\n` +
              `• <code>/del_promo <КОД></code> — Удалить промокод\n\n` +
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

        // Create / Add Promo Code Command
        if (text.startsWith('/add_promo')) {
          const parts = text.trim().split(/\s+/);
          const code = (parts[1] || '').toUpperCase().trim();
          const discountRaw = (parts[2] || '').trim();
          const limitRaw = parseInt(parts[3] || '0', 10) || 0;

          if (!code || !discountRaw) {
            await renderPromoList(chatId);
            return res.status(200).json({ ok: true });
          }

          let discountType = 'fixed';
          let discountValue = 0;

          if (discountRaw.endsWith('%')) {
            discountType = 'percent';
            discountValue = Math.min(100, Math.max(1, parseInt(discountRaw.replace('%', ''), 10) || 0));
          } else {
            discountType = 'fixed';
            discountValue = Math.max(1, parseInt(discountRaw.replace(/\D/g, ''), 10) || 0);
          }

          const promos = await getPromos();
          const creator = from.username ? `@${from.username}` : (from.first_name || String(from.id));

          promos[code] = {
            code,
            discountType,
            discountValue,
            maxUses: limitRaw,
            usedCount: promos[code]?.usedCount || 0,
            createdBy: creator,
            createdAt: new Date().toISOString()
          };

          await savePromos(promos);
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }

        // Edit Promo Code Command (/edit_promo <КОД> <СКИДКА> [ЛИМИТ])
        if (text.startsWith('/edit_promo')) {
          const parts = text.trim().split(/\s+/);
          const code = (parts[1] || '').toUpperCase().trim();
          const discountRaw = (parts[2] || '').trim();
          const limitRaw = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

          const promos = await getPromos();
          if (!code || !promos[code]) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/edit_promo <КОД> <СКИДКА> [ЛИМИТ]</code>\n\nПример: <code>/edit_promo VIP 100% 20</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          if (discountRaw) {
            if (discountRaw.endsWith('%')) {
              promos[code].discountType = 'percent';
              promos[code].discountValue = Math.min(100, Math.max(1, parseInt(discountRaw.replace('%', ''), 10) || 0));
            } else {
              promos[code].discountType = 'fixed';
              promos[code].discountValue = Math.max(1, parseInt(discountRaw.replace(/\D/g, ''), 10) || 0);
            }
          }

          if (limitRaw !== undefined && !isNaN(limitRaw)) {
            promos[code].maxUses = Math.max(0, limitRaw);
          }

          promos[code].updatedAt = new Date().toISOString();
          await savePromos(promos);
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }

        // Delete Promo Code
        if (text.startsWith('/del_promo')) {
          const code = text.replace('/del_promo', '').trim().toUpperCase();
          if (!code) {
            await renderPromoList(chatId);
            return res.status(200).json({ ok: true });
          }

          const promos = await getPromos();
          if (promos[code]) {
            delete promos[code];
            await savePromos(promos);
          }
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }

        // List Promo Codes (/promos or 🏷 Промокоды)
        if (text === '/promos' || text.includes('Промокоды')) {
          await renderPromoList(chatId);
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
        if (text === '/admins' || text.includes('Админы')) {
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
        if (text === '/scanners' || text.includes('Контролеры')) {
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

        // Statistics & Live Monitoring (Idea 4)
        if (text === '/stats' || text.includes('Статистика') || text === '/live_stats') {
          const totalSold = parseInt((await kv.get('total_tickets_sold')) || 0, 10);
          const allocatedSeats = (await kv.get('allocated_seats')) || [];
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          const allUserIds = (await kv.get('all_user_ids')) || [];
          const occupiedSeats = await getActiveOccupiedSeats();

          const displaySold = Math.max(
            totalSold,
            Array.isArray(allocatedSeats) ? allocatedSeats.length : 0,
            Array.isArray(allTicketIds) ? allTicketIds.length : 0
          );

          let scannedCount = 0;
          for (const tid of allTicketIds) {
            const t = await kv.get(`ticket:${tid}`);
            if (t && (t.status === 'used' || t.is_checked_in)) scannedCount++;
          }

          const currentTashkentTime = new Intl.DateTimeFormat('uz-UZ', {
            timeZone: 'Asia/Tashkent',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(new Date());

          const entryPercent = displaySold > 0 ? Math.round((scannedCount / displaySold) * 100) : 0;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📊 <b>TEDxSergeli LIVE MONITORING & STATISTIKA:</b>\n\n` +
              `👥 <b>Botdagi foydalanuvchilar:</b> ${allUserIds.length} ta\n` +
              `🎟 <b>Sotilgan chiptalar:</b> ${displaySold} / 100\n` +
              `⏳ <b>Vaqtincha band qilingan joylar:</b> ${occupiedSeats.length}\n\n` +
              `🟢 <b>Tadbirga kirganlar (Checked In):</b> <b>${scannedCount} ta (${entryPercent}%)</b>\n` +
              `⏳ <b>Kirishi kutilayotganlar:</b> <b>${displaySold - scannedCount} ta</b>\n\n` +
              `🕒 <b>Vaqt (Toshkent vaqti UTC+5):</b> <code>${currentTashkentTime}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Export CSV Command (Idea 1)
        if (text === '/export' || text === '/export_csv') {
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          let csvRows = ['Chipta_ID,Ism,Telefon,Sektor,Qator,Orin,Holati,Berilgan_Vaqti_UTC5,Kirgan_Vaqti_UTC5'];

          for (const tid of allTicketIds) {
            const t = await kv.get(`ticket:${tid}`);
            if (t) {
              const name = `"${(t.name || 'Mehmon').replace(/"/g, '""')}"`;
              const phone = `"${(t.phone || 'Noma\'lum').replace(/"/g, '""')}"`;
              const sector = `"${t.sectorName || 'Sektor 1'}"`;
              const status = (t.status === 'used' || t.is_checked_in) ? 'ISHLATILGAN (Kirdi)' : 'FAOL (Kirmadi)';
              const confirmedAt = t.confirmed_at
                ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.confirmed_at))
                : '-';
              const checkedInAt = t.tashkentTime || (t.used_at
                ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.used_at))
                : '-');

              csvRows.push(`${t.id || tid},${name},${phone},${sector},${t.row || 1},${t.seat || 1},${status},${confirmedAt},${checkedInAt}`);
            }
          }

          const csvBuffer = Buffer.from(csvRows.join('\n'), 'utf-8');

          try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', `📊 <b>TEDxSergeli Chiptalar Ro'yxati (CSV / Excel)</b>\n\nJami chiptalar: <b>${allTicketIds.length} ta</b>\nVaqt mintaqasi: <b>UTC+5 (Toshkent vaqti)</b>`);
            formData.append('parse_mode', 'HTML');
            formData.append('document', new Blob([csvBuffer], { type: 'text/csv' }), 'tedx_sergeli_tickets.csv');

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
              method: 'POST',
              body: formData
            });
          } catch (expErr) {
            console.error('Failed to send CSV document:', expErr);
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `📄 <b>CSV MA'LUMOTLAR:</b>\n\n<pre>${csvRows.slice(0, 15).join('\n')}</pre>`,
              reply_markup: ADMIN_KEYBOARD
            });
          }

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

          const formattedCreated = ticket.confirmed_at ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.confirmed_at)) : 'Noma\'lum';
          const formattedUsed = ticket.tashkentTime || (ticket.used_at ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.used_at)) : null);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>CHIPTA HAQIDA MA'LUMOT:</b>\n\n` +
              `🎟 <b>ID:</b> <code>${ticket.id}</code>\n` +
              `👤 <b>Mehmon:</b> ${ticket.name}\n` +
              `📱 <b>Tel:</b> <code>${ticket.phone}</code>\n` +
              `📍 <b>Sektor:</b> ${ticket.sectorName || 'Sektor 1'} | <b>Qator:</b> ${ticket.row} | <b>O'rin:</b> ${ticket.seat}\n` +
              `🔴 <b>Holati:</b> <b>${(ticket.status || 'valid').toUpperCase()}</b>\n` +
              `🕒 <b>Berilgan vaqti (UTC+5):</b> ${formattedCreated}\n` +
              (formattedUsed ? `🟢 <b>Skanerlangan vaqti (UTC+5):</b> ${formattedUsed} (${ticket.checkedInBy || 'scanned'})` : ''),
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Reset Ticket Status back to VALID (e.g. after an accidental scan)
        if (text.startsWith('/reset_ticket')) {
          const tid = text.replace('/reset_ticket', '').trim().toUpperCase();
          if (!tid) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/reset_ticket TEDX-849201</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let resetTicket = await kv.get(`ticket:${tid}`);
          if (!resetTicket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${tid}</code> не найден.`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          resetTicket.status = 'valid';
          resetTicket.is_checked_in = false;
          delete resetTicket.used_at;
          delete resetTicket.checkedInAt;
          delete resetTicket.tashkentTime;
          delete resetTicket.checkedInBy;
          delete resetTicket.scanned_by;
          await kv.set(`ticket:${tid}`, resetTicket);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Статус билета сброшен на VALID!</b>\n\n` +
              `🎟 <b>ID:</b> <code>${tid}</code>\n` +
              `👤 <b>Гость:</b> ${resetTicket.name || 'Mehmon'}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Broadcast (Idea 2)
        if (text.startsWith('/broadcast')) {
          // Already gated by isSuperAdmin() at the top of this command engine —
          // no separate ADMIN_IDS check here, otherwise co-admins added via
          // /add_admin (tracked in KV) would be wrongly denied broadcast rights.
          const broadcastMsg = text.replace('/broadcast', '').trim();
          const isReply = !!update.message.reply_to_message;

          if (!broadcastMsg && !isReply) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Foydalanish:</b> <code>/broadcast E'lon matni</code>\nИли ответьте на сообщение (Reply) командой <code>/broadcast</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          const allUserIds = (await kv.get('all_user_ids')) || [];
          let successCount = 0;
          let failCount = 0;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            text: `⏳ Рассылка начата для ${allUserIds.length} пользователей. Пожалуйста, подождите...`
          });

          for (const uid of allUserIds) {
            try {
              let r;
              if (isReply) {
                r = await callTelegram('copyMessage', {
                  chat_id: uid,
                  from_chat_id: chatId,
                  message_id: update.message.reply_to_message.message_id
                });
              } else {
                r = await callTelegram('sendMessage', {
                  chat_id: uid,
                  parse_mode: 'HTML',
                  text: `📢 <b>TEDxSergeli Rasmiy E'lon:</b>\n\n${broadcastMsg}`
                });
              }
              if (r && r.ok) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (_bErr) {
              failCount++;
            }
            // Sleep for 40ms to avoid 429 Too Many Requests
            await new Promise(resolve => setTimeout(resolve, 40));
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Рассылка завершена!</b>\n• Успешно доставлено: ${successCount}\n• Заблокировали бота / Ошибки: ${failCount}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }
      }

      // === CONTROLLER / SCANNER VOLUNTEER COMMAND ENGINE ===
      if (text && (await isAuthorizedScanner(from, chatId))) {
        if (text === '📖 Инструкция контролера' || text === '/scanner_help') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📖 <b>ИНСТРУКЦИЯ ДЛЯ КОНТРОЛЁРОВ TEDxSergeli:</b>\n\n` +
              `1️⃣ <b>Проверка через QR-сканер:</b>\n` +
              `• Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу.\n` +
              `• Наведите камеру на QR-код на билете гостя.\n` +
              `• Зелёный экран = ГОСТЬ ПРОПУЩЕН ✅\n` +
              `• Красный экран = БИЛЕТ УЖЕ ИСПОЛЬЗОВАН 🛑\n\n` +
              `2️⃣ <b>Проверка вручную (без QR):</b>\n` +
              `• Отправьте боту <code>/find ID</code> (например, <code>/find 947695</code>).\n` +
              `• Или нажмите <b>🔍 Проверить билет по ID</b>.\n` +
              `• Бот покажет статус билета, ФИО гостя и место.`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        if (text === '🔍 Проверить билет по ID' || text === '/control') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>Проверка билета по ID:</b>\n\nОтправьте команду в формате:\n<code>/find ID_БИЛЕТА</code>\n\nПример: <code>/find TEDX-947695</code> или <code>/find 947695</code>`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Find Ticket command for controllers & admins
        if (text.startsWith('/find')) {
          const rawId = text.replace('/find', '').trim();
          let cleanTid = rawId.replace(/^.*start=scan_/, '').replace(/^scan_/, '').trim().toUpperCase();
          if (/^\d{6}$/.test(cleanTid)) {
            cleanTid = `TEDX-${cleanTid}`;
          }

          let ticket = await kv.get(`ticket:${cleanTid}`);
          if (!ticket && rawId) {
            ticket = await kv.get(`ticket:${rawId}`);
          }

          if (!ticket) {
            const targetId = cleanTid || rawId;
            const allUserIds = (await kv.get('all_user_ids')) || [];
            for (const uid of allUserIds) {
              const u = await kv.get(`user:${uid}`);
              if (u && u.ticketId === targetId) {
                const seatInfo = getSeatDetails(u.seatNumber || 1);
                ticket = {
                  id: u.ticketId,
                  userId: uid,
                  name: u.name || 'Mehmon',
                  phone: u.phone || 'Noma\'lum',
                  seat: seatInfo.seat,
                  row: seatInfo.row,
                  seatNumber: u.seatNumber || 1,
                  status: u.ticket_status || (u.payment_status === 'confirmed' ? 'paid' : 'valid'),
                  created_at: u.updated_at || Date.now(),
                  confirmed_at: u.confirmed_at || Date.now()
                };
                await kv.set(`ticket:${targetId}`, ticket);
                break;
              }
            }
          }

          const activeKeyboard = (await isSuperAdmin(from, chatId)) ? ADMIN_KEYBOARD : SCANNER_KEYBOARD;

          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${cleanTid || rawId}</code> не найден в системе.`,
              reply_markup: activeKeyboard
            });
            return res.status(200).json({ ok: true });
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>ИНФОРМАЦИЯ О БИЛЕТЕ:</b>\n\n` +
              `🎟 <b>ID:</b> <code>${ticket.id}</code>\n` +
              `👤 <b>Гость:</b> ${ticket.name || 'Mehmon'}\n` +
              `📱 <b>Тел:</b> <code>${ticket.phone || 'Noma\'lum'}</code>\n` +
              `📍 <b>Ряд:</b> ${ticket.row} | <b>Место:</b> ${ticket.seat} (№${ticket.seatNumber})\n` +
              `🔴 <b>Статус:</b> <b>${(ticket.status || 'valid').toUpperCase()}</b>\n` +
              `🕒 <b>Выдан:</b> ${ticket.confirmed_at ? new Date(ticket.confirmed_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }) : 'Ранее'}\n` +
              (ticket.used_at ? `🟢 <b>Отсканирован:</b> ${new Date(ticket.used_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })} (@${ticket.scanned_by})` : ''),
            reply_markup: activeKeyboard
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

        // Check existing user state
        let existingUser = (await kv.get(`user:${chatId}`)) || {};

        // If user already has a confirmed ticket, show their active ticket info
        if (existingUser.payment_status === 'confirmed' && existingUser.ticketId) {
          const userLang = existingUser.lang || 'ru';
          const ticket = await kv.get(`ticket:${existingUser.ticketId}`);
          const seatInfo = getSeatDetails(existingUser.seatNumber || (ticket ? ticket.seatNumber : 1));

          let msg = '';
          if (userLang === 'uz') {
            msg = `🎉 <b>Hush kelibsiz! Sizda faol TEDxSergeli elektron chiptangiz bor.</b>\n\n` +
              `🎟 <b>Chipta ID:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n` +
              `👤 <b>Ism:</b> ${existingUser.name || 'Mehmon'}\n\n` +
              `📱 <i>Kirish joyida chiptangizdagi QR-kodni ko'rsatishingiz kifoya.</i>`;
          } else if (userLang === 'en') {
            msg = `🎉 <b>Welcome back! You have an active TEDxSergeli ticket.</b>\n\n` +
              `🎟 <b>Ticket ID:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n` +
              `👤 <b>Name:</b> ${existingUser.name || 'Guest'}\n\n` +
              `📱 <i>Just show your QR code ticket at the entrance.</i>`;
          } else {
            msg = `🎉 <b>С возвращением! У вас есть активный электронный билет TEDxSergeli.</b>\n\n` +
              `🎟 <b>ID Билета:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n` +
              `👤 <b>Имя:</b> ${existingUser.name || 'Гость'}\n\n` +
              `📱 <i>На входе достаточно показать ваш QR-код билет.</i>`;
          }

          if (await isSuperAdmin(from, chatId)) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `👑 <b>Вы авторизованы как Super Admin TEDxSergeli!</b>\n\n${msg}`,
              reply_markup: ADMIN_KEYBOARD
            });
          } else {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg
            });
          }
          return res.status(200).json({ ok: true });
        }

        // Check if user is an authorized ticket controller/scanner
        if (await isAuthorizedScanner(from, chatId) && !(await isSuperAdmin(from, chatId))) {
          const volunteerName = from ? (from.first_name || from.username || 'Kontroler') : 'Kontroler';
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🎫 <b>Hush kelibsiz, ${volunteerName}! / Здравствуйте!</b>\n\n` +
              `✅ <b>Siz TEDxSergeli rasmiy chipta nazoratchisisiz (Контролёр).</b>\n` +
              `Вам открыт доступ к входному контролю билетов на мероприятии.\n\n` +
              `📌 <b>Как проверять билеты:</b>\n` +
              `1️⃣ Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу, чтобы открыть сканер прямо в Telegram.\n` +
              `2️⃣ Наведите камеру на QR-код участника.\n` +
              `3️⃣ Если QR-код не сканируется, используйте кнопку <b>🔍 Проверить по ID</b> или команду <code>/find ID</code>.\n\n` +
              `<i>Успешной работы на мероприятии!</i>`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Standard registration start for new users
        let promoCodeFromPayload = null;
        if (payload.startsWith('promo_')) {
          promoCodeFromPayload = payload.replace('promo_', '').trim().toUpperCase();
        } else if (payload && payload !== 'direct') {
          const allPromos = await getPromos();
          if (allPromos[payload.toUpperCase()]) {
            promoCodeFromPayload = payload.toUpperCase();
          }
        }

        let user = {
          ...existingUser,
          chatId,
          step: existingUser.step || 'LANG',
          source: payload,
          promoCode: promoCodeFromPayload || existingUser.promoCode || null,
          payment_status: existingUser.payment_status || 'none'
        };
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
            const allocatedSeats = (await kv.get('allocated_seats')) || [];
            let activeOccupied = await getActiveOccupiedSeats();
            const isOwnSeat = user.seatNumber === seatNumber;
            const isTaken = !isOwnSeat && (
              (Array.isArray(allocatedSeats) && allocatedSeats.includes(seatNumber)) ||
              activeOccupied.some(i => i.seat === seatNumber)
            );

            if (isTaken) {
              const userLang = user.lang || 'ru';
              const takenMsg = userLang === 'uz'
                ? `⚠️ <b>Kechirasiz, #${seatNumber} joyi band qilib bo'lingan.</b>\nIltimos, boshqa joy tanlang.`
                : userLang === 'en'
                  ? `⚠️ <b>Sorry, seat #${seatNumber} was just taken.</b>\nPlease pick another seat.`
                  : `⚠️ <b>Извините, место №${seatNumber} уже занято.</b>\nПожалуйста, выберите другое место.`;

              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: takenMsg,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: userLang === 'uz' ? "🔄 Joy tanlash" : userLang === 'en' ? "🔄 Pick a seat" : "🔄 Выбрать место",
                        web_app: { url: `${PUBLIC_DOMAIN}/seat-picker` }
                      }
                    ]
                  ]
                }
              });
              return res.status(200).json({ ok: true });
            }

            // Release this user's previous hold (if any) and take the new seat
            activeOccupied = activeOccupied.filter(i => i.seat !== seatNumber && i.seat !== user.seatNumber);
            activeOccupied.push({ seat: seatNumber, expiresAt: Date.now() + 15 * 60 * 1000 });
            await kv.set('occupied_seats', activeOccupied);

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

            const seatPickerUrl = `${PUBLIC_DOMAIN}/seat-picker`;
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: userLang === 'uz' ? "🔄 Joyni o'zgartirish" : userLang === 'en' ? "🔄 Change Seat" : "🔄 Сменить место",
                      web_app: { url: seatPickerUrl }
                    }
                  ]
                ]
              }
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

      // 3. User sends Phone -> Auto-assign next sequential seat and check Promo Code / Payment
      if (user.step === 'PHONE') {
        if (contact) {
          user.phone = contact.phone_number;
        } else if (text) {
          user.phone = text;
        }

        if (user.phone) {
          let allocatedSeats = (await kv.get('allocated_seats')) || [];
          let activeOccupied = await getActiveOccupiedSeats();

          if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

          const occupiedSeatNumbers = activeOccupied.map(i => i.seat);
          const allTaken = new Set([...occupiedSeatNumbers, ...allocatedSeats]);

          let nextSeatNumber = 1;
          while (allTaken.has(nextSeatNumber) && nextSeatNumber <= 100) {
            nextSeatNumber++;
          }
          if (nextSeatNumber > 100) nextSeatNumber = 100;

          activeOccupied = activeOccupied.filter(i => i.seat !== nextSeatNumber);
          activeOccupied.push({ seat: nextSeatNumber, expiresAt: Date.now() + 15 * 60 * 1000 });
          await kv.set('occupied_seats', activeOccupied);

          user.seatNumber = nextSeatNumber;
          user.seatId = `SEAT-${nextSeatNumber}`;
          user.bookingExpiresAt = Date.now() + 15 * 60 * 1000;

          // Check if user came via Promo Code deep link
          if (user.promoCode) {
            const promos = await getPromos();
            const promo = promos[user.promoCode.toUpperCase()];
            const discountInfo = calculateDiscount(49999, promo);

            if (discountInfo.isValid) {
              user.appliedDiscount = discountInfo.discountAmount;
              user.finalPrice = discountInfo.finalPrice;

              if (discountInfo.finalPrice === 0) {
                // 100% Free Ticket
                promo.usedCount = (promo.usedCount || 0) + 1;
                await savePromos(promos);

                await issueTicketForUser({
                  userId: chatId,
                  user,
                  confirmedBy: `Promo-kod (${user.promoCode})`,
                  promoCode: user.promoCode
                });
                return res.status(200).json({ ok: true });
              }
            }
          }

          // Move to PROMO step to ask for promo code or skip
          user.step = 'PROMO';
          await kv.set(`user:${chatId}`, user);

          const lang = user.lang || 'ru';
          let promoPrompt = '';
          let skipBtnText = '';

          if (lang === 'uz') {
            promoPrompt = `🏷 <b>Sizda promo-kod bormi?</b>\n\nAgar chegirma yoki bepul chipta uchun promo-kodingiz bo'lsa, uni hozir yozib yuboring.\nAks holda <b>«➡️ O'tkazib yuborish»</b> tugmasini bosing.`;
            skipBtnText = "➡️ O'tkazib yuborish";
          } else if (lang === 'en') {
            promoPrompt = `🏷 <b>Do you have a promo code?</b>\n\nIf you have a promo code for a discount or free ticket, enter it now.\nOtherwise, tap <b>«➡️ Skip»</b>.`;
            skipBtnText = "➡️ Skip";
          } else {
            promoPrompt = `🏷 <b>У вас есть промокод?</b>\n\nЕсли у вас есть промокод на скидку или бесплатный билет, введите его прямо сейчас.\nЕсли нет, нажмите кнопку <b>«➡️ Пропустить»</b>.`;
            skipBtnText = "➡️ Пропустить";
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: promoPrompt,
            reply_markup: {
              inline_keyboard: [
                [{ text: skipBtnText, callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Handle user entering Promo Code (Step: PROMO)
      if (user.step === 'PROMO' && text) {
        const inputCode = text.trim().toUpperCase();
        const promos = await getPromos();
        const promo = promos[inputCode];

        if (!promo) {
          const lang = user.lang || 'ru';
          let errText = lang === 'uz'
            ? `❌ <b>Promo-kod topilmadi.</b> Qaytadan kiriting yoki <b>«➡️ O'tkazib yuborish»</b> tugmasini bosing.`
            : lang === 'en'
              ? `❌ <b>Promo code not found.</b> Try again or tap <b>«➡️ Skip»</b>.`
              : `❌ <b>Промокод не найден.</b> Попробуйте еще раз или нажмите <b>«➡️ Пропустить»</b>.`;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: errText,
            reply_markup: {
              inline_keyboard: [
                [{ text: lang === 'uz' ? "➡️ O'tkazib yuborish" : lang === 'en' ? "➡️ Skip" : "➡️ Пропустить", callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        const discountInfo = calculateDiscount(49999, promo);
        if (!discountInfo.isValid) {
          const lang = user.lang || 'ru';
          let errText = discountInfo.reason === 'limit_exceeded'
            ? (lang === 'uz' ? `❌ <b>Ushbu promo-kodning foydalanish soni tugagan.</b>` : `❌ <b>Лимит использования этого промокода исчерпан.</b>`)
            : (lang === 'uz' ? `❌ <b>Promo-kod yaroqsiz.</b>` : `❌ <b>Промокод недействителен.</b>`);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: errText,
            reply_markup: {
              inline_keyboard: [
                [{ text: lang === 'uz' ? "➡️ O'tkazib yuborish" : lang === 'en' ? "➡️ Skip" : "➡️ Пропустить", callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // Promo code is VALID!
        user.promoCode = inputCode;
        user.appliedDiscount = discountInfo.discountAmount;
        user.finalPrice = discountInfo.finalPrice;

        if (discountInfo.finalPrice === 0) {
          // 100% Free Ticket!
          promo.usedCount = (promo.usedCount || 0) + 1;
          await savePromos(promos);

          await issueTicketForUser({
            userId: chatId,
            user,
            confirmedBy: `Promo-kod (${inputCode})`,
            promoCode: inputCode
          });
          return res.status(200).json({ ok: true });
        }

        // Partial discount - proceed to PAYMENT
        user.step = 'PAYMENT';
        user.payment_status = 'pending_payment';
        await kv.set(`user:${chatId}`, user);

        const lang = user.lang || 'ru';
        const discStr = promo.discountType === 'percent' ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString()} UZS`;
        const seatInfo = getSeatDetails(user.seatNumber || 1);
        let msg = '';

        if (lang === 'uz') {
          msg = `✅ <b>Promo-kod <code>${inputCode}</code> qabul qilindi!</b> (${discStr} chegirma)\n\n` +
            `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n\n` +
            `💳 <b>To'lov miqdori:</b> <s>49 999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
            `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
            `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
        } else if (lang === 'en') {
          msg = `✅ <b>Promo code <code>${inputCode}</code> applied!</b> (${discStr} discount)\n\n` +
            `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n\n` +
            `💳 <b>Amount:</b> <s>49,999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
            `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
            `📸 After payment, please send the receipt screenshot here.`;
        } else {
          msg = `✅ <b>Промокод <code>${inputCode}</code> применен!</b> (Скидка ${discStr})\n\n` +
            `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n\n` +
            `💳 <b>Сумма к оплате:</b> <s>49 999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
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

        // Notify Admin Group for approval
        const targetAdminGroup = ADMIN_CHAT_ID || SUPER_ADMIN_ID;

        if (targetAdminGroup) {
          const seatInfo = getSeatDetails(user.seatNumber || 1);
          const receiptPayload = {
            chat_id: targetAdminGroup,
            photo: photoFileId,
            caption: `📥 <b>YANGI TO'LOV CHEKI!</b>\n\n` +
              `👤 <b>Ism:</b> ${user.name || 'Noma\'lum'}\n` +
              `📱 <b>Tel:</b> <code>${user.phone || 'Noma\'lum'}</code>\n` +
              `📍 <b>Mavjud joy:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
              `🌐 <b>Til:</b> ${(user.lang || 'uz').toUpperCase()}\n` +
              `🆔 <b>User ID:</b> <code>${chatId}</code>`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Tasdiqlash", callback_data: `confirm_${chatId}` },
                  { text: "❌ Rad etish", callback_data: `reject_${chatId}` }
                ]
              ]
            }
          };

          const targetTicketThread = TICKET_THREAD_ID || '4';
          if (targetTicketThread) {
            receiptPayload.message_thread_id = parseInt(targetTicketThread, 10);
          }

          await callTelegram('sendPhoto', receiptPayload);
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

      if (data === 'confirm_reset_db') {
        const allTicketIds = (await kv.get('all_ticket_ids')) || [];
        if (Array.isArray(allTicketIds)) {
          for (const tid of allTicketIds) {
            await kv.set(`ticket:${tid}`, null);
          }
        }

        const allUserIds = (await kv.get('all_user_ids')) || [];
        if (Array.isArray(allUserIds)) {
          for (const uid of allUserIds) {
            await kv.set(`user:${uid}`, null);
          }
        }

        await kv.set('occupied_seats', []);
        await kv.set('allocated_seats', []);
        await kv.set('total_tickets_sold', 0);
        await kv.set('all_ticket_ids', []);
        await kv.set('all_user_ids', []);

        await callTelegram('editMessageText', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `✅ <b>BAZA TO'LIQ TOZALANDI! / БАЗА ОЧИЩЕНА!</b>\nBarcha chiptalar, band qilingan joylar va foydalanuvchilar nollashtirildi (0/100).`
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data === 'cancel_reset_db') {
        await callTelegram('editMessageText', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `❌ <b>Bazani tozalash bekor qilindi. / Очистка отменена.</b>`
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      // Handle Promo Code Management Callbacks
      if (data === 'refresh_promos') {
        await renderPromoList(chatId, message.message_id);
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data === 'promo_create_wizard') {
        const text = `➕ <b>СОЗДАНИЕ НОВОГО ПРОМОКОДА</b>\n\n` +
          `Выберите готовый шаблон для создания в 1 клик или отправьте команду вручную:\n\n` +
          `<b>Быстрые шаблоны:</b>\n` +
          `• <b>VIP 100%</b> — Бесплатный VIP билет (код VIP100)\n` +
          `• <b>20% Скидка</b> — Скидка 20% для первых 50 чел. (код SALE20)\n` +
          `• <b>10,000 UZS</b> — Скидка 10,000 UZS для 100 чел. (код SAVE10K)\n` +
          `• <b>100% Одноразовый</b> — Случайный 100% код на 1 использование\n\n` +
          `<b>Формат создания вручную:</b>\n` +
          `<code>/add_promo <КОД> <СКИДКА> [ЛИМИТ]</code>`;

        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🎟 VIP 100% (VIP100)", callback_data: "gen_promo_vip" },
                { text: "🏷 20% Скидка (SALE20)", callback_data: "gen_promo_20" }
              ],
              [
                { text: "💰 10,000 UZS (SAVE10K)", callback_data: "gen_promo_10k" },
                { text: "🎲 100% Одноразовый", callback_data: "gen_promo_rand" }
              ],
              [
                { text: "🔙 Назад в список", callback_data: "refresh_promos" }
              ]
            ]
          }
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('gen_promo_')) {
        const type = data.replace('gen_promo_', '');
        const promos = await getPromos();
        const creator = from.username ? `@${from.username}` : (from.first_name || String(from.id));
        let code = '';
        let discountType = 'percent';
        let discountValue = 100;
        let maxUses = 0;

        if (type === 'vip') {
          code = 'VIP100';
          discountType = 'percent';
          discountValue = 100;
          maxUses = 0;
        } else if (type === '20') {
          code = 'SALE20';
          discountType = 'percent';
          discountValue = 20;
          maxUses = 50;
        } else if (type === '10k') {
          code = 'SAVE10K';
          discountType = 'fixed';
          discountValue = 10000;
          maxUses = 100;
        } else if (type === 'rand') {
          code = `FREE${Math.floor(1000 + Math.random() * 9000)}`;
          discountType = 'percent';
          discountValue = 100;
          maxUses = 1;
        }

        promos[code] = {
          code,
          discountType,
          discountValue,
          maxUses,
          usedCount: promos[code]?.usedCount || 0,
          createdBy: creator,
          createdAt: new Date().toISOString()
        };

        await savePromos(promos);
        await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `✅ Промокод ${code} создан!` });
        await renderPromoList(chatId, message.message_id);
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('edit_promo_')) {
        const code = data.replace('edit_promo_', '');
        const promos = await getPromos();
        const p = promos[code];

        if (!p) {
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: "❌ Промокод не найден!" });
          await renderPromoList(chatId, message.message_id);
          return res.status(200).json({ ok: true });
        }

        const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
        const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

        const text = `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${p.code}</code></b>\n\n` +
          `🏷 <b>Текущая скидка:</b> <b>${discStr}</b>\n` +
          `🔢 <b>Лимит использования:</b> <b>${limitStr}</b>\n` +
          `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
          `👤 <b>Создатель:</b> ${p.createdBy || 'Admin'}\n\n` +
          `Выберите новое значение скидки или лимита в 1 клик:`;

        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
              ],
              [
                { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
              ],
              [
                { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
              ],
              [
                { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                { text: "🔙 Назад в список", callback_data: "refresh_promos" }
              ]
            ]
          }
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('set_disc_')) {
        const parts = data.replace('set_disc_', '').split('_');
        const code = parts[0];
        const valType = parts[1];

        const promos = await getPromos();
        if (promos[code]) {
          if (valType.endsWith('p')) {
            promos[code].discountType = 'percent';
            promos[code].discountValue = parseInt(valType.replace('p', ''), 10) || 100;
          } else if (valType.endsWith('k')) {
            promos[code].discountType = 'fixed';
            promos[code].discountValue = (parseInt(valType.replace('k', ''), 10) || 10) * 1000;
          }
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `✅ Скидка для ${code} изменена!` });
        }

        const p = promos[code];
        if (p) {
          const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
          const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML',
            text: `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${p.code}</code></b>\n\n` +
              `🏷 <b>Текущая скидка:</b> <b>${discStr}</b>\n` +
              `🔢 <b>Лимит использования:</b> <b>${limitStr}</b>\n` +
              `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
              `👤 <b>Создатель:</b> ${p.createdBy || 'Admin'}\n\n` +
              `✅ <i>Скидка успешно обновлена!</i>`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                  { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                  { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
                ],
                [
                  { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                  { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
                ],
                [
                  { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                  { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                  { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
                ],
                [
                  { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                  { text: "🔙 Назад в список", callback_data: "refresh_promos" }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('set_limit_')) {
        const parts = data.replace('set_limit_', '').split('_');
        const code = parts[0];
        const limitVal = parseInt(parts[1], 10) || 0;

        const promos = await getPromos();
        if (promos[code]) {
          promos[code].maxUses = limitVal;
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `✅ Лимит для ${code} изменен!` });
        }

        const p = promos[code];
        if (p) {
          const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
          const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML',
            text: `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${p.code}</code></b>\n\n` +
              `🏷 <b>Текущая скидка:</b> <b>${discStr}</b>\n` +
              `🔢 <b>Лимит использования:</b> <b>${limitStr}</b>\n` +
              `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
              `👤 <b>Создатель:</b> ${p.createdBy || 'Admin'}\n\n` +
              `✅ <i>Лимит успешно обновлен!</i>`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                  { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                  { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
                ],
                [
                  { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                  { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
                ],
                [
                  { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                  { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                  { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
                ],
                [
                  { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                  { text: "🔙 Назад в список", callback_data: "refresh_promos" }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('del_promo_')) {
        const code = data.replace('del_promo_', '');
        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `⚠️ <b>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</b>\n\nВы действительно хотите удалить промокод <code>${code}</code>?`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔥 Да, удалить", callback_data: `confirm_del_${code}` },
                { text: "❌ Отмена", callback_data: "refresh_promos" }
              ]
            ]
          }
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('confirm_del_')) {
        const code = data.replace('confirm_del_', '');
        const promos = await getPromos();
        if (promos[code]) {
          delete promos[code];
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `🗑 Промокод ${code} удален` });
        }
        await renderPromoList(chatId, message.message_id);
        return res.status(200).json({ ok: true });
      }


      // Handle Skip Promo Callback
      if (data === 'skip_promo') {
        let user = (await kv.get(`user:${chatId}`)) || {};
        user.step = 'PAYMENT';
        user.payment_status = 'pending_payment';
        user.finalPrice = 49999;
        await kv.set(`user:${chatId}`, user);

        const lang = user.lang || 'ru';
        const seatInfo = getSeatDetails(user.seatNumber || 1);
        let msg = '';
        if (lang === 'uz') {
          msg = `✅ <b>Siz uchun navbatdagi joy ajratildi: #${seatInfo.seatNumber}</b>\n` +
            `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n\n` +
            `⏳ <b>Eslatma:</b> To'lov chekini yuborish uchun sizda <b>15 daqiqa</b> bor.\n\n` +
            `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
            `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
            `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
        } else if (lang === 'en') {
          msg = `✅ <b>Next available seat assigned to you: #${seatInfo.seatNumber}</b>\n` +
            `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n\n` +
            `⏳ <b>Notice:</b> You have <b>15 minutes</b> to send your payment receipt screenshot.\n\n` +
            `💳 <b>Amount:</b> 49,999 UZS\n` +
            `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
            `📸 After payment, please send the receipt screenshot here.`;
        } else {
          msg = `✅ <b>Вам выделено следующее место по очереди: №${seatInfo.seatNumber}</b>\n` +
            `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n\n` +
            `⏳ <b>Внимание:</b> У вас есть <b>15 минут</b> на отправку чека об оплате.\n\n` +
            `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
            `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
            `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: msg
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
          const { ticketId, seatInfo } = await issueTicketForUser({
            userId,
            user,
            seatNumber: user.seatNumber,
            confirmedBy: `@${adminUsername}`,
            promoCode: user.promoCode || null
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI (CHIPTA YUBORILDI)</b>\nID: <code>${ticketId}</code> | ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\nTasdiqladi: @${adminUsername}`,
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
            caption: `${message.caption || ''}\n\n❌ <b>RAD ETILDI</b>\nRad etdi: @${adminUsername}`,
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
