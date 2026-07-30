export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, age, school, contact } = req.body ?? {};

  if (!name?.trim() || !age?.trim() || !school?.trim() || !contact?.trim()) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (!botToken || chatIds.length === 0) {
    console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_IDS is not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedAge = age.trim().slice(0, 20);
  const trimmedSchool = school.trim().slice(0, 100);
  const trimmedContact = contact.trim().slice(0, 100);

  const text = `
🆕 <b>Yangi volontyor arizasi — TEDxSergeli</b>

👤 <b>Ism:</b> ${trimmedName}
📅 <b>Yosh:</b> ${trimmedAge}
🎓 <b>O'qish joyi:</b> ${trimmedSchool}
📞 <b>Aloqa:</b> ${trimmedContact}
  `.trim();

  try {
    const results = await Promise.all(
      chatIds.map((chatId) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        })
      )
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
