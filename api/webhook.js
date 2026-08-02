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
      return data.result ? JSON.parse(data.result) : null;
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
        body: JSON.stringify(typeof value === 'object' ? JSON.stringify(value) : value)
      });
    } catch (e) {
      console.error('KV SET Error:', e);
    }
  }
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Helper to call Telegram API
async function callTelegram(method, body) {
  const response = await fetch(`${API_URL}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
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
  confirm: (row, seat) => `🎉 <b>To'lov tasdiqlandi! / Оплата подтверждена! / Payment confirmed!</b>\nSizning chiptangiz 🎟 / Вот ваш билет 🎟 / Here is your ticket 🎟\n\n📍 <b>Qator / Ряд / Row:</b> ${row}\n🪑 <b>Joy / Место / Seat:</b> ${seat}`,
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
      const { chat, text, photo, contact, message_id } = update.message;
      const chatId = chat.id;

      // Fetch user state from Vercel KV
      let user = (await kv.get(`user:${chatId}`)) || {};

      // 1. User sends /start
      if (text && text.startsWith('/start')) {
        const payload = text.split(' ')[1] || 'direct';
        user = { step: 'LANG', source: payload, payment_status: 'none' };
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
          const row = Math.floor(Math.random() * 15) + 1;
          const seat = Math.floor(Math.random() * 20) + 1;

          user.payment_status = 'confirmed';
          await kv.set(`user:${userId}`, user);

          await callTelegram('sendMessage', {
            chat_id: userId,
            parse_mode: 'HTML',
            text: texts.confirm(row, seat),
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI</b>\nBerildi: Qator ${row}, Joy ${seat}\nTekshirdi: @${adminUsername}`,
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
