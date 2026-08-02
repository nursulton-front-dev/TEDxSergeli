const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const kv = {
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await kv.set('occupied_seats', []);
    await kv.set('allocated_seats', []);
    await kv.set('total_tickets_sold', 0);

    return res.status(200).json({
      ok: true,
      message: '✅ Vercel KV Database reset! All seats (occupied/allocated) and total_tickets_sold cleared.'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
