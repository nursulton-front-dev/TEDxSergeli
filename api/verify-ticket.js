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

    const cleanTicketId = String(ticketId).replace('scan_', '').replace(/^https?:\/\/t\.me\/[^\?]+\?start=scan_/, '').trim();

    // Check volunteer authorization if volunteerId is supplied
    if (volunteerId) {
      const superAdminId = parseInt(process.env.SUPER_ADMIN_ID || '1338879669', 10);
      const volunteers = (await kv.get('volunteers')) || [];
      const admins = (await kv.get('admins')) || [];
      const volId = parseInt(volunteerId, 10);

      const isAuthorized =
        volId === superAdminId ||
        (Array.isArray(volunteers) && volunteers.includes(volId)) ||
        (Array.isArray(admins) && admins.includes(volId));

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          reason: 'unauthorized',
          message: 'Siz litsenziyalangan nazoratchi emassiz / Доступ ограничен!'
        });
      }
    }

    let ticket = await kv.get(`ticket:${cleanTicketId}`);

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
