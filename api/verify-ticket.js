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

    // Check volunteer authorization if volunteerId is supplied
    if (volunteerId) {
      const superAdminId = '6804139305';
      const adminChatId = String(process.env.ADMIN_CHAT_ID || '');
      const scanners = (await kv.get('allowed_scanners')) || [];
      const superAdmins = (await kv.get('super_admins')) || [];
      const volIdStr = String(volunteerId);

      const isAuthorized =
        volIdStr === superAdminId ||
        volIdStr === adminChatId ||
        (Array.isArray(scanners) && scanners.some(s => String(s).toLowerCase() === volIdStr.toLowerCase())) ||
        (Array.isArray(superAdmins) && superAdmins.some(a => String(a).toLowerCase() === volIdStr.toLowerCase()));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          reason: 'unauthorized',
          message: 'Siz litsenziyalangan nazoratchi emassiz / Доступ ограничен!'
        });
      }
    }

function getSeatDetails(seatNumber) {
  const num = parseInt(seatNumber, 10) || 1;
  const row = Math.ceil(num / 10);
  const seatInRow = ((num - 1) % 10) + 1;
  let sectorName = "Sektor 1";
  if (row > 10) sectorName = "Sektor 2";
  return { row, seat: seatInRow, sectorName };
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
      const checkedTime = ticket.used_at || ticket.checkedInAt
        ? new Date(ticket.used_at || ticket.checkedInAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : 'Ilgari';

      return res.status(409).json({
        success: false,
        reason: 'already_used',
        message: `Chipta allaqachon ishlatilgan! (Kirish vaqti: ${checkedTime})`,
        guest: ticket.name,
        seat: ticket.seatNumber || ticket.seat,
        sector: ticket.sector || ticket.row,
        checkedInAt: ticket.used_at || ticket.checkedInAt
      });
    }

    // Mark as Checked In / Used
    const nowIso = new Date().toISOString();
    ticket.status = 'used';
    ticket.is_checked_in = true;
    ticket.checkedInAt = nowIso;
    ticket.used_at = nowIso;
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
