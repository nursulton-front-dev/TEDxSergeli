import { Resvg } from '@resvg/resvg-js';
import QRCode from 'qrcode';

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Lightweight KV implementation to avoid @vercel/kv deprecation issues
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
        try { parsed = JSON.parse(parsed); } catch(e) {}
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
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

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
  const safeName = escapeXml(name);

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

      // 1. Handle /start command (Normal start OR QR Code Scanner Deep Link)
      if (text && text.startsWith('/start')) {
        const payload = text.split(' ')[1] || 'direct';

        // Check if this is a Ticket QR Code Scan (e.g., /start scan_TEDX-849201 or /start TEDX-849201)
        if (payload.startsWith('scan_') || payload.startsWith('TEDX-')) {
          const ticketId = payload.replace('scan_', '').trim();
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
