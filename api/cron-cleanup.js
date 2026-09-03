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
      if (!data.result) return null;
      let parsed = JSON.parse(data.result);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (_err) { }
      }
      return parsed;
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
  try {
    const now = Date.now();
    let occupied = (await kv.get('occupied_seats')) || [];
    if (!Array.isArray(occupied)) occupied = [];

    const active = occupied.filter(item => item && item.seat && item.expiresAt && item.expiresAt > now);
    const releasedCount = occupied.length - active.length;
    await kv.set('occupied_seats', active);

    // Clean up expired pending states in user profiles
    const allUserIds = (await kv.get('all_user_ids')) || [];
    let usersCleaned = 0;
    if (Array.isArray(allUserIds)) {
      for (const uid of allUserIds) {
        const u = await kv.get(`user:${uid}`);
        if (u && u.payment_status === 'pending_payment' && u.bookingExpiresAt && u.bookingExpiresAt <= now) {
          delete u.seatNumber;
          delete u.seatId;
          delete u.bookingExpiresAt;
          u.payment_status = 'expired_hold';
          await kv.set(`user:${uid}`, u);
          usersCleaned++;
        }
      }
    }

    return res.status(200).json({
      ok: true,
      releasedSeats: releasedCount,
      usersCleaned,
      message: `Cleaned ${releasedCount} expired holds and ${usersCleaned} user pending states.`
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
