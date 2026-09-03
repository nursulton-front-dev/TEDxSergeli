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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Fix Sultonov Farrux (Seat #3)
    let sultonovTicket = (await kv.get('ticket:TEDX-299770')) || {};
    sultonovTicket = {
      ...sultonovTicket,
      id: 'TEDX-299770',
      name: 'Sultonov Farrux Nematullayevich',
      phone: sultonovTicket.phone || '998903586025',
      seatNumber: 3,
      seatId: 'SEAT-3',
      sector: 1,
      sectorName: 'Sektor 1',
      row: 1,
      seat: 3,
      status: 'valid',
      ticket_status: 'ACTIVE',
      is_manual_issue: false,
      issued_by: null,
      ticket_type: 'Standard'
    };
    await kv.set('ticket:TEDX-299770', sultonovTicket);

    // 2. Fix Baxtiyorov Ilyos (Seat #4)
    let baxtiyorovTicket = (await kv.get('ticket:TEDX-221938')) || {};
    baxtiyorovTicket = {
      ...baxtiyorovTicket,
      id: 'TEDX-221938',
      name: 'Baxtiyorov Ilyos',
      phone: baxtiyorovTicket.phone || '932305833',
      seatNumber: 4,
      seatId: 'SEAT-4',
      sector: 1,
      sectorName: 'Sektor 1',
      row: 1,
      seat: 4,
      status: 'valid',
      ticket_status: 'ACTIVE',
      is_manual_issue: false,
      issued_by: null,
      ticket_type: 'Standard'
    };
    await kv.set('ticket:TEDX-221938', baxtiyorovTicket);

    // 3. Fix Gofurova Robiya (TEDX-216844) -> Reassign to Seat #15
    let gofurovaTicket = (await kv.get('ticket:TEDX-216844')) || {};
    gofurovaTicket = {
      ...gofurovaTicket,
      id: 'TEDX-216844',
      name: 'Gofurova Robiya',
      phone: gofurovaTicket.phone || '998901112233',
      seatNumber: 15,
      seatId: 'SEAT-15',
      sector: 1,
      sectorName: 'Sektor 1',
      row: 2,
      seat: 7,
      status: 'valid',
      ticket_status: 'ACTIVE',
      is_manual_issue: false,
      issued_by: null,
      ticket_type: 'Standard'
    };
    await kv.set('ticket:TEDX-216844', gofurovaTicket);

    // 4. Restore Muhammadyusuf Karimov (Seat #2, TEDX-570963)
    let karimovTicket = {
      id: 'TEDX-570963',
      name: 'Muhammadyusuf Karimov',
      phone: '998900000000',
      seatNumber: 2,
      seatId: 'SEAT-2',
      sector: 1,
      sectorName: 'Sektor 1',
      row: 1,
      seat: 2,
      status: 'valid',
      ticket_status: 'ACTIVE',
      is_manual_issue: false,
      issued_by: null,
      ticket_type: 'Standard'
    };
    await kv.set('ticket:TEDX-570963', karimovTicket);

    // 5. Relocate Boynazarov Fayozbek -> Seat #16 with new unique Ticket ID TEDX-771829 (HOLD)
    const allUserIds = (await kv.get('all_user_ids')) || [];
    for (const uid of allUserIds) {
      let u = await kv.get(`user:${uid}`);
      if (u && (u.name === 'Boynazarov Fayozbek' || u.phone === '+998942165969' || u.seatNumber === 2)) {
        if (u.payment_status === 'pending_payment') {
          u.seatNumber = 16;
          u.seatId = 'SEAT-16';
          u.ticketId = 'TEDX-771829';
          u.payment_status = 'pending_payment';
          u.bookingExpiresAt = Date.now() + 15 * 60 * 1000;
          await kv.set(`user:${uid}`, u);
        }
      }
    }

    // 6. Update allocated_seats (13 confirmed paid seats)
    const allocatedSeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15];
    await kv.set('allocated_seats', allocatedSeats);

    // 7. Update all_ticket_ids list
    let allTicketIds = (await kv.get('all_ticket_ids')) || [];
    const requiredTickets = ['TEDX-300571', 'TEDX-570963', 'TEDX-299770', 'TEDX-221938', 'TEDX-766496', 'TEDX-401405', 'TEDX-816468', 'TEDX-927917', 'TEDX-942857', 'TEDX-216372', 'TEDX-829776', 'TEDX-942635', 'TEDX-216844'];
    for (const tid of requiredTickets) {
      if (!allTicketIds.includes(tid)) allTicketIds.push(tid);
    }
    await kv.set('all_ticket_ids', allTicketIds);

    // 8. Clean occupied_seats (holds)
    let activeOccupied = (await kv.get('occupied_seats')) || [];
    activeOccupied = activeOccupied.filter(i => i && i.seat && !allocatedSeats.includes(i.seat));
    activeOccupied.push({ seat: 16, expiresAt: Date.now() + 15 * 60 * 1000 }); // Fayozbek on seat 16
    await kv.set('occupied_seats', activeOccupied);

    return res.status(200).json({
      ok: true,
      message: '✅ Database migration and seat conflict resolution executed successfully!',
      allocatedSeats,
      ticketIds: allTicketIds
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
