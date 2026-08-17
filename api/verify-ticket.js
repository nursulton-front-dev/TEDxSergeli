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
      console.error('KV GET Error:', e);
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
      console.error('KV SET Error:', e);
    }
  },
  async setnx(key, value) {
    if (!KV_URL) return false;
    try {
      const res = await fetch(`${KV_URL}/setnx/${key}/${value}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await res.json();
      return data.result === 1;
    } catch (e) {
      return false;
    }
  },
  async expire(key, seconds) {
    if (!KV_URL) return;
    try {
      await fetch(`${KV_URL}/expire/${key}/${seconds}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
    } catch (e) { }
  }
};

// Seat Allocation helper for 100 total seats — must match webhook.js's layout
// (4 sectors of 24 seats / 8 per row, plus a 4-seat balcony sector) so scanners
// always show the guest's real seat/row/sector.
function getSeatDetails(seatNum) {
  const n = Math.max(1, Math.min(100, parseInt(seatNum, 10) || 1));
  let sector = 1;
  let sectorName = "Sektor 1";
  let row = 1;
  let seat = 1;

  if (n <= 24) {
    sector = 1; sectorName = "Sektor 1";
    row = Math.floor((n - 1) / 8) + 1; seat = ((n - 1) % 8) + 1;
  } else if (n <= 48) {
    sector = 2; sectorName = "Sektor 2";
    const seatInSector = n - 24;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else if (n <= 72) {
    sector = 3; sectorName = "Sektor 3";
    const seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else if (n <= 96) {
    sector = 4; sectorName = "Sektor 4";
    const seatInSector = n - 72;
    row = Math.floor((seatInSector - 1) / 8) + 1; seat = ((seatInSector - 1) % 8) + 1;
  } else {
    sector = 5; sectorName = "2-Etaj (Balkon)";
    row = 1; seat = n - 96;
  }

  return { seatNumber: n, sector, sectorName, row, seat, seatId: `SEAT-${n}` };
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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { ticketId, volunteerId } = req.body || {};

    if (!ticketId) {
      return res.status(400).json({ success: false, reason: 'missing_id', message: 'Chipta kodi ko\'rsatilmadi!' });
    }

    let cleanTicketId = String(ticketId)
      .replace(/^.*start=scan_/, '')
      .replace(/^scan_/, '')
      .trim();

    if (/^\d{6}$/.test(cleanTicketId)) {
      cleanTicketId = `TEDX-${cleanTicketId}`;
    }

    // Volunteer authorization is mandatory — this endpoint is public (CORS *),
    // so without this check anyone could check in or invalidate any ticket.
    if (!volunteerId) {
      return res.status(401).json({
        success: false,
        reason: 'unauthorized',
        message: 'Nazoratchi aniqlanmadi / Volunteer ID required!'
      });
    }

    const superAdminId = '6804139305';
    const adminChatId = String(process.env.ADMIN_CHAT_ID || '');
    const scanners = (await kv.get('allowed_scanners')) || [];
    const superAdmins = (await kv.get('super_admins')) || [];
    const volIdStr = String(volunteerId);

    const isAuthorizedScanner =
      volIdStr === superAdminId ||
      volIdStr === adminChatId ||
      (Array.isArray(scanners) && scanners.some(s => String(s).toLowerCase() === volIdStr.toLowerCase())) ||
      (Array.isArray(superAdmins) && superAdmins.some(a => String(a).toLowerCase() === volIdStr.toLowerCase()));

    if (!isAuthorizedScanner) {
      return res.status(403).json({
        success: false,
        reason: 'unauthorized',
        message: 'Siz litsenziyalangan nazoratchi emassiz / Доступ ограничен!'
      });
    }

    // Attempt to acquire a short-lived lock to prevent duplicate concurrent requests
    const lockKey = `lock:verify:${cleanTicketId}`;
    const acquired = await kv.setnx(lockKey, "1");
    if (acquired) {
      await kv.expire(lockKey, 3);
    } else {
      return res.status(429).json({
        success: false,
        reason: 'too_many_requests',
        message: 'Kuting, chipta tekshirilmoqda...'
      });
    }

    let ticket = await kv.get(`ticket:${cleanTicketId}`);

    if (!ticket) {
      const allUserIds = (await kv.get('all_user_ids')) || [];
      for (const uid of allUserIds) {
        const u = await kv.get(`user:${uid}`);
        if (u && u.ticketId === cleanTicketId) {
          const seatInfo = getSeatDetails(u.seatNumber || 1);
          ticket = {
            id: u.ticketId,
            userId: uid,
            name: u.name || 'Mehmon',
            phone: u.phone || 'Noma\'lum',
            seat: seatInfo.seat,
            row: seatInfo.row,
            seatNumber: u.seatNumber || 1,
            status: u.ticket_status || (u.payment_status === 'confirmed' ? 'paid' : 'valid'),
            created_at: u.updated_at || new Date().toISOString(),
            confirmed_at: u.confirmed_at || new Date().toISOString()
          };
          await kv.set(`ticket:${cleanTicketId}`, ticket);
          break;
        }
      }
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        reason: 'invalid',
        message: 'Chipta topilmadi yoki to\'lanmagan!'
      });
    }

    if (ticket.status === 'used' || ticket.is_checked_in) {
      const checkedTime = ticket.tashkentTime || (ticket.used_at || ticket.checkedInAt
        ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ticket.used_at || ticket.checkedInAt))
        : 'Ilgari');

      const checkedByStr = ticket.checkedInBy ? ` (@${ticket.checkedInBy})` : '';

      return res.status(409).json({
        success: false,
        reason: 'already_used',
        message: `❌ CHIPTA ISHLATILGAN! Kirgan vaqti: ${checkedTime}${checkedByStr}`,
        guest: ticket.name,
        seat: ticket.seatNumber || ticket.seat,
        sector: ticket.sector || ticket.row,
        checkedInAt: checkedTime
      });
    }

    // Mark as Checked In / Used
    const now = new Date();
    const nowIso = now.toISOString();
    const tashkentTimeStr = new Intl.DateTimeFormat('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);

    ticket.status = 'used';
    ticket.is_checked_in = true;
    ticket.checkedInAt = nowIso;
    ticket.used_at = nowIso;
    ticket.tashkentTime = tashkentTimeStr;
    ticket.checkedInBy = volunteerId || 'scanner_app';

    await kv.set(`ticket:${cleanTicketId}`, ticket);

    return res.status(200).json({
      success: true,
      reason: 'ok',
      message: 'KIRISHGA RUXSAT!',
      guest: ticket.name || 'Mehmon',
      seat: ticket.seatNumber || ticket.seat || 1,
      sector: ticket.sector || ticket.row || 1,
      row: ticket.row || 1,
      seatInRow: ticket.seat || 1,
      ticketId: cleanTicketId
    });
  } catch (err) {
    console.error('Verify Ticket API Error:', err);
    return res.status(500).json({ success: false, reason: 'server_error', message: 'Serverda xatolik yuz berdi!' });
  }
}
