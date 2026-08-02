const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const kv = {
  async get(key) {
    if (!KV_URL) return null;
    try {
      const res = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await res.json();
      return data.result ? JSON.parse(data.result) : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    if (!KV_URL) return;
    try {
      await fetch(`${KV_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: typeof value === 'object' ? JSON.stringify(value) : String(value)
      });
    } catch (e) {
      console.error('KV SET error:', e);
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

    return res.status(200).json({
      ok: true,
      message: '✅ Complete Database Reset Successful! All tickets, users, and seats wiped clean.'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
