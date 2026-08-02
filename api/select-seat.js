const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const kv = {
  async get(key) {
    if (!KV_URL) return null;
    try {
      const res = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await res.json();
      if (!data.result) return null;
      let parsed = JSON.parse(data.result);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (_err) {}
      }
      return parsed;
    } catch (e) {
      return null;
    }
  },
  async set(key, value, ttl) {
    if (!KV_URL) return;
    try {
      const url = ttl ? `${KV_URL}/set/${key}?EX=${ttl}` : `${KV_URL}/set/${key}`;
      await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: typeof value === 'object' ? JSON.stringify(value) : String(value)
      });
    } catch (e) {
      console.error('KV SET Error:', e);
    }
  }
};

async function callTelegram(method, body) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error(`Telegram API ${method} Error:`, e);
    return null;
  }
}

function getSeatDetails(seatNum) {
  const n = Math.max(1, Math.min(200, seatNum || 1));
  let sector = 1;
  let sectorName = "Sektor 1";
  let seatInSector = n;
  let row = 1;
  let seat = 1;

  if (n <= 48) {
    sector = 1; sectorName = "Sektor 1"; seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1; seat = ((n - 1) % 8) + 1;
  } else if (n <= 96) {
    sector = 2; sectorName = "Sektor 2"; seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else if (n <= 144) {
    sector = 3; sectorName = "Sektor 3"; seatInSector = n - 96;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else if (n <= 192) {
    sector = 4; sectorName = "Sektor 4"; seatInSector = n - 144;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else {
    sector = 5; sectorName = "2-Etaj (Balkon)"; seatInSector = n - 192;
    row = 1; seat = seatInSector;
  }

  return { seatNumber: n, sector, sectorName, row, seat, seatId: `SEAT-${n}` };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { chatId, seatNumber } = req.body || {};

    if (!seatNumber) {
      return res.status(400).json({ ok: false, error: 'seatNumber is required' });
    }

    const sNum = parseInt(seatNumber, 10);
    const seatInfo = getSeatDetails(sNum);

    // Update occupied seats list in Upstash Redis
    let occupied = (await kv.get('occupied_seats')) || [];
    if (!Array.isArray(occupied)) occupied = [];
    if (!occupied.includes(sNum)) {
      occupied.push(sNum);
      await kv.set('occupied_seats', occupied, 900);
    }

    if (chatId) {
      let user = (await kv.get(`user:${chatId}`)) || {};
      user.chatId = chatId;
      user.seatNumber = sNum;
      user.seatId = seatInfo.seatId;
      user.sector = seatInfo.sector;
      user.row = seatInfo.row;
      user.seat = seatInfo.seat;
      user.step = 'PAYMENT';
      user.payment_status = 'pending_payment';
      user.bookingExpiresAt = Date.now() + 15 * 60 * 1000;

      await kv.set(`user:${chatId}`, user);

      const userLang = user.lang || 'uz';
      let msg = '';
      if (userLang === 'uz') {
        msg = `✅ <b>Joy tanlandi: #${sNum} (${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin)</b>\n\n` +
          `⏳ <b>Diqqat! Ushbu joy siz uchun 15 daqiqa davomida band qilinadi.</b>\n` +
          `Shu vaqt ichida to'lov chekini (скриншот) yuborishingiz kerak.\n\n` +
          `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
          `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
          `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
          `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
      } else if (userLang === 'en') {
        msg = `✅ <b>Seat selected: #${sNum} (${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat})</b>\n\n` +
          `⏳ <b>Attention! This seat is reserved for 15 minutes.</b>\n` +
          `Please send the payment receipt screenshot within this time.\n\n` +
          `💳 <b>Amount:</b> 49,999 UZS\n` +
          `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
          `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
          `📸 After payment, please send the receipt screenshot here.`;
      } else {
        msg = `✅ <b>Место выбрано: №${sNum} (${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место)</b>\n\n` +
          `⏳ <b>Внимание! Это место забронировано за вами на 15 минут.</b>\n` +
          `Пожалуйста, отправьте чек об оплате в течение этого времени.\n\n` +
          `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
          `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
          `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
          `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
      }

      const PUBLIC_DOMAIN = process.env.PUBLIC_URL || 'https://tedx-sergeli.vercel.app';
      await callTelegram('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text: msg,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: userLang === 'uz' ? "🔄 Joyni o'zgartirish" : userLang === 'en' ? "🔄 Change Seat" : "🔄 Сменить место",
                web_app: { url: `${PUBLIC_DOMAIN}/seat-picker` }
              }
            ]
          ]
        }
      });
    }

    return res.status(200).json({
      ok: true,
      seatNumber: sNum,
      seatInfo
    });
  } catch (err) {
    console.error('API /select-seat error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
