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

// Filters out expired/legacy-format holds and persists the cleanup, mirroring webhook.js
async function getActiveOccupiedSeats() {
  let occupied = (await kv.get('occupied_seats')) || [];
  if (!Array.isArray(occupied)) occupied = [];
  const now = Date.now();
  let changed = false;
  const active = [];
  for (const item of occupied) {
    if (item && typeof item === 'object' && item.seat && item.expiresAt) {
      if (item.expiresAt > now) {
        active.push(item);
      } else {
        changed = true;
      }
    } else {
      changed = true;
    }
  }
  if (changed) {
    await kv.set('occupied_seats', active);
  }
  return active;
}

// Helper to fetch seat occupant details for admin and map inspector
async function getSeatsDetailsMap() {
  const allUserIds = (await kv.get('all_user_ids')) || [];
  const allTicketIds = (await kv.get('all_ticket_ids')) || [];
  const activeOccupied = await getActiveOccupiedSeats();

  const detailsMap = {};

  if (Array.isArray(allUserIds)) {
    for (const uid of allUserIds) {
      try {
        const u = await kv.get(`user:${uid}`);
        if (u && u.seatNumber) {
          detailsMap[u.seatNumber] = {
            seatNumber: u.seatNumber,
            type: u.payment_status === 'confirmed' ? 'CONFIRMED' : 'PENDING',
            guest: u.name || 'Mehmon',
            username: u.username ? `@${u.username.replace(/^@/, '')}` : '',
            phone: u.phone || '',
            ticketId: u.ticketId || '',
            ticketType: u.ticket_type || 'Standard',
            paymentStatus: u.payment_status || 'unknown',
            isCheckedIn: !!u.is_checked_in
          };
        }
      } catch (_e) {}
    }
  }

  if (Array.isArray(allTicketIds)) {
    for (const tid of allTicketIds) {
      try {
        const t = await kv.get(`ticket:${tid}`);
        if (t && (t.seatNumber || t.seat)) {
          const sNum = t.seatNumber || t.seat;
          if (!detailsMap[sNum]) {
            detailsMap[sNum] = {
              seatNumber: sNum,
              type: 'CONFIRMED',
              guest: t.name || 'Mehmon',
              username: t.username ? `@${t.username.replace(/^@/, '')}` : '',
              phone: t.phone || '',
              ticketId: t.id || tid,
              ticketType: t.ticket_type || 'Standard',
              paymentStatus: t.status || 'paid',
              isCheckedIn: t.status === 'used' || !!t.is_checked_in,
              checkedInAt: t.tashkentTime || t.used_at || null
            };
          } else {
            if (t.status === 'used' || t.is_checked_in) {
              detailsMap[sNum].isCheckedIn = true;
              detailsMap[sNum].checkedInAt = t.tashkentTime || t.used_at || null;
            }
            if (t.id && !detailsMap[sNum].ticketId) {
              detailsMap[sNum].ticketId = t.id;
            }
          }
        }
      } catch (_e) {}
    }
  }

  if (Array.isArray(activeOccupied)) {
    for (const hold of activeOccupied) {
      if (hold && hold.seat && !detailsMap[hold.seat]) {
        detailsMap[hold.seat] = {
          seatNumber: hold.seat,
          type: 'HOLD',
          guest: 'Band qilinmoqda (Hold)',
          expiresAt: hold.expiresAt
        };
      }
    }
  }

  return detailsMap;
}

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
      const activeOccupied = await getActiveOccupiedSeats();
      const totalSold = (await kv.get('total_tickets_sold')) || 0;

      // Merge allocated and actively-held seats into a unique list of taken seat numbers
      const allOccupied = Array.from(
        new Set([
          ...(Array.isArray(allocatedSeats) ? allocatedSeats : []),
          ...activeOccupied.map((i) => i.seat)
        ])
      );

      const { details, admin } = req.query || {};
      let seatsDetails = undefined;
      if (details === 'true' || admin === 'true' || details === '1' || admin === '1') {
        seatsDetails = await getSeatsDetailsMap();
      }

      return res.status(200).json({
        ok: true,
        occupiedSeats: allOccupied,
        seatsDetails,
        totalSold: parseInt(totalSold, 10) || allOccupied.length,
        totalCapacity: 100
      });
    }

    if (req.method === 'POST') {
      const { seatNumber } = req.body || {};
      const num = parseInt(seatNumber, 10);

      if (isNaN(num) || num < 1 || num > 100) {
        return res.status(400).json({ ok: false, error: 'Invalid seat number' });
      }

      const allocatedSeats = (await kv.get('allocated_seats')) || [];
      let activeOccupied = await getActiveOccupiedSeats();

      if ((Array.isArray(allocatedSeats) && allocatedSeats.includes(num)) || activeOccupied.some((i) => i.seat === num)) {
        return res.status(409).json({ ok: false, error: 'Seat already occupied' });
      }

      // Temporarily hold seat for 15 minutes, matching the webhook's booking window
      activeOccupied.push({ seat: num, expiresAt: Date.now() + 15 * 60 * 1000 });
      await kv.set('occupied_seats', activeOccupied);

      return res.status(200).json({
        ok: true,
        seatNumber: num,
        seatId: `SEAT-${num}`,
        expiresInSeconds: 900
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Seats API Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
