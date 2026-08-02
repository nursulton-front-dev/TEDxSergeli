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
  payment: {
    uz: `👋 <b>Salom!</b>\n\nChipta narxi: <b>49 999 UZS</b>.\nTo'lovni quyidagi kartaga o'tkazing:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>To'lov amalga oshirilgach, chek rasmini shu yerga yuboring.</i>`,
    ru: `👋 <b>Привет!</b>\n\nСтоимость билета: <b>49 999 UZS</b>.\nПереведите деньги на карту:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>После оплаты отправьте фотографию чека прямо сюда.</i>`,
    en: `👋 <b>Hello!</b>\n\nTicket price: <b>49 999 UZS</b>.\nTransfer the money to the card:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>After payment, send the receipt photo here.</i>`
  },
  photoReply: `✅ <b>Chek tekshirishga yuborildi. / Чек отправлен на проверку. / Receipt sent for review.</b>\nKuting... / Ожидайте... / Please wait...`,
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
      const { chat, text, photo, message_id } = update.message;
      const chatId = chat.id;

      // 1. User sends /start ticket
      if (text === '/start ticket' || text === '/start') {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: "🌐 <b>Tilni tanlang / Выберите язык / Choose language:</b>",
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

      // 2. User sends a photo (the receipt)
      if (photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id;

        const adminPayload = {
          chat_id: ADMIN_CHAT_ID,
          photo: fileId,
          parse_mode: 'HTML',
          caption: `🧾 <b>Yangi to'lov!</b>\nKimdan: @${chat.username || chat.first_name || "Ism yo'q"} (ID: <code>${chatId}</code>)`,
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

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.photoReply,
          reply_to_message_id: message_id,
        });
        
        return res.status(200).json({ ok: true });
      }
    }

    // Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const adminUsername = from.username || from.first_name || 'Admin';

      // Handle Language Selection
      if (data.startsWith('lang_')) {
        const selectedLang = data.split('_')[1];
        await callTelegram('editMessageText', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: texts.payment[selectedLang] || texts.payment.ru
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      // Handle Admin Actions
      const [action, userIdStr] = data.split('_');
      const userId = parseInt(userIdStr, 10);

      if (action === 'confirm') {
        // GENERATE RANDOM ROW (1-15) and SEAT (1-20) instead of using database
        const row = Math.floor(Math.random() * 15) + 1;
        const seat = Math.floor(Math.random() * 20) + 1;

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

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}
