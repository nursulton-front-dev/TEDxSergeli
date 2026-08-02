const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

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
      console.error('KV GET Error:', e);
      return null;
    }
  },
  async set(key, value, exSeconds) {
    if (!KV_URL) return;
    try {
      const url = exSeconds ? `${KV_URL}/set/${key}?EX=${exSeconds}` : `${KV_URL}/set/${key}`;
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const allocatedSeats = (await kv.get('allocated_seats')) || [];
      const occupiedSeats = (await kv.get('occupied_seats')) || [];
      const totalSold = (await kv.get('total_tickets_sold')) || 0;

      // Merge allocated and occupied seats into a unique list of taken seat numbers
      const allOccupied = Array.from(
        new Set([...(Array.isArray(allocatedSeats) ? allocatedSeats : []), ...(Array.isArray(occupiedSeats) ? occupiedSeats : [])])
      );

      return res.status(200).json({
        ok: true,
        occupiedSeats: allOccupied,
        totalSold: parseInt(totalSold, 10) || allOccupied.length,
        totalCapacity: 200
      });
    }

    if (req.method === 'POST') {
      const { seatNumber, userId } = req.body || {};
      const num = parseInt(seatNumber, 10);

      if (isNaN(num) || num < 1 || num > 200) {
        return res.status(400).json({ ok: false, error: 'Invalid seat number' });
      }

      const allocatedSeats = (await kv.get('allocated_seats')) || [];
      const occupiedSeats = (await kv.get('occupied_seats')) || [];

      if (allocatedSeats.includes(num) || occupiedSeats.includes(num)) {
        return res.status(409).json({ ok: false, error: 'Seat already occupied' });
      }

      // Temporarily hold seat for 10 minutes (600s)
      let currentOccupied = Array.isArray(occupiedSeats) ? occupiedSeats : [];
      if (!currentOccupied.includes(num)) {
        currentOccupied.push(num);
        await kv.set('occupied_seats', currentOccupied, 600);
      }

      return res.status(200).json({
        ok: true,
        seatNumber: num,
        seatId: `SEAT-${num}`,
        expiresInSeconds: 600
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Seats API Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
