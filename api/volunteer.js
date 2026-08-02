export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, message } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const threadId = process.env.TELEGRAM_VOLUNTEER_THREAD_ID;

  if (!botToken || chatIds.length === 0) {
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_IDS is not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedPhone = phone.trim().slice(0, 30);
  const trimmedMessage = typeof message === 'string' ? message.trim().slice(0, 1000) : '';

  const text = `🔥 <b>Yangi volontyor arizasi!</b>\n📍 <i>TEDxSergeliSpecializedSchool</i>\n\n👤 <b>Ism:</b> ${trimmedName}\n📞 <b>Telefon:</b> ${trimmedPhone}${trimmedMessage ? `\n💬 <b>Xabar:</b>\n<i>${trimmedMessage}</i>` : ''}`;

  try {
    const results = await Promise.all(
      chatIds.map((chatId) => {
        const payload = {
          chat_id: chatId,
          text,
          parse_mode: 'HTML'
        };
        if (threadId) {
          payload.message_thread_id = threadId;
        }
        return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      })
    );

    const allFailed = results.every((r) => !r.ok);
    if (allFailed) {
      throw new Error('All Telegram deliveries failed');
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to notify Telegram', err);
    return res.status(502).json({ error: 'Failed to send notification' });
  }
}
