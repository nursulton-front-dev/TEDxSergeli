import { kv } from '@vercel/kv';

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
        const msg = `👋 <b>Salom! / Привет! / Hello!</b>

🇺🇿 Chipta narxi: <b>50 000 UZS</b>. To'lovni quyidagi kartaga o'tkazing va chek rasmini shu yerga yuboring.
🇷🇺 Стоимость билета: <b>50 000 UZS</b>. Переведите деньги на карту и отправьте фото чека сюда.
🇬🇧 Ticket price: <b>50 000 UZS</b>. Transfer the money to the card and send the receipt photo here.

💳 <code>5614 6822 1091 3879</code>
👤 Abidjanov Baxtiyor`;

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: msg,
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
          caption: `🧾 <b>Новая оплата!</b>\nОт: @${chat.username || chat.first_name || 'Без имени'} (ID: <code>${chatId}</code>)`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Подтвердить', callback_data: `confirm_${chatId}` },
                { text: '❌ Отклонить', callback_data: `reject_${chatId}` }
              ]
            ]
          }
        };
        if (TICKET_THREAD_ID) {
          adminPayload.message_thread_id = TICKET_THREAD_ID;
        }
        await callTelegram('sendPhoto', adminPayload);

        const replyMsg = `✅ <b>Chek tekshirishga yuborildi. / Чек отправлен на проверку. / Receipt sent for review.</b>
Kuting... / Ожидайте... / Please wait...`;

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: replyMsg,
          reply_to_message_id: message_id,
        });
        
        return res.status(200).json({ ok: true });
      }
    }

    // Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const { id, data, message, from } = update.callback_query;
      const [action, userIdStr] = data.split('_');
      const userId = parseInt(userIdStr, 10);
      const adminUsername = from.username || from.first_name || 'Admin';

      if (action === 'confirm') {
        const ticketNum = await kv.incr('tedx_tickets_sold');
        const row = Math.ceil(ticketNum / 20);
        const seat = ticketNum % 20 === 0 ? 20 : ticketNum % 20;

        const successMsg = `🎉 <b>To'lov tasdiqlandi! / Оплата подтверждена! / Payment confirmed!</b>
Sizning chiptangiz 🎟 / Вот ваш билет 🎟 / Here is your ticket 🎟

📍 <b>Qator / Ряд / Row:</b> ${row}
🪑 <b>Joy / Место / Seat:</b> ${seat}`;

        await callTelegram('sendMessage', {
          chat_id: userId,
          parse_mode: 'HTML',
          text: successMsg,
        });

        await callTelegram('editMessageCaption', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          caption: `${message.caption || ''}\n\n✅ <b>ОПЛАЧЕНО</b>\nВыдано: Ряд ${row}, Место ${seat}\nПроверил: @${adminUsername}`,
          reply_markup: { inline_keyboard: [] }
        });
      } else if (action === 'reject') {
        const rejectMsg = `❌ <b>To'lov tasdiqlanmadi. / Оплата не подтверждена. / Payment not confirmed.</b>
Iltimos, chekni tekshiring. / Пожалуйста, проверьте чек. / Please check your receipt.`;

        await callTelegram('sendMessage', {
          chat_id: userId,
          parse_mode: 'HTML',
          text: rejectMsg,
        });

        await callTelegram('editMessageCaption', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          caption: `${message.caption || ''}\n\n❌ <b>ОТКЛОНЕНО</b>\nОтклонил: @${adminUsername}`,
          reply_markup: { inline_keyboard: [] }
        });
      }

      await callTelegram('answerCallbackQuery', {
        callback_query_id: id,
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
}
