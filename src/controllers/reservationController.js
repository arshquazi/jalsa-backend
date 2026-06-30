const prisma = require('../config/database');
const { sendTableReservationEmails } = require('../config/email');

// POST /api/reservations — create table reservation
async function createReservation(req, res) {
  const { name, email, phone, date, time, partySize, occasion, notes } = req.body;

  try {
    const reservationDate = new Date(date);

    if (reservationDate < new Date()) {
      return res.status(422).json({ error: 'Reservation date must be in the future' });
    }

    // Prevent double-booking: max 10 reservations per slot (configurable)
    const MAX_COVERS_PER_SLOT = 50; // total guests allowed per time slot
    const existingForSlot = await prisma.tableReservation.aggregate({
      where: {
        date: {
          gte: new Date(reservationDate.toDateString()),
          lt: new Date(new Date(reservationDate.toDateString()).getTime() + 86400000),
        },
        time,
        status: { not: 'cancelled' },
      },
      _sum: { partySize: true },
    });

    const totalCovers = (existingForSlot._sum.partySize || 0) + parseInt(partySize);
    if (totalCovers > MAX_COVERS_PER_SLOT) {
      return res.status(409).json({ error: 'This time slot is fully booked. Please choose another time.' });
    }

    const reservation = await prisma.tableReservation.create({
      data: {
        name,
        email,
        phone,
        date: reservationDate,
        time,
        partySize: parseInt(partySize),
        occasion,
        notes,
        status: 'confirmed',
      },
    });

    sendTableReservationEmails({ reservation }).catch((e) =>
      console.error('Email send failed:', e.message)
    );

    res.status(201).json({ message: 'Table reserved successfully', reservationId: reservation.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/reservations/slots — check available time slots for a date
async function getAvailableSlots(req, res) {
  const { date } = req.query;
  if (!date) return res.status(422).json({ error: 'date is required' });

  const SLOTS = ['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  const MAX_COVERS = 50;

  try {
    const day = new Date(date);
    const nextDay = new Date(day.getTime() + 86400000);

    const slotData = await prisma.tableReservation.groupBy({
      by: ['time'],
      where: {
        date: { gte: day, lt: nextDay },
        status: { not: 'cancelled' },
      },
      _sum: { partySize: true },
    });

    const bookedMap = {};
    slotData.forEach((s) => { bookedMap[s.time] = s._sum.partySize || 0; });

    const slots = SLOTS.map((time) => ({
      time,
      available: (bookedMap[time] || 0) < MAX_COVERS,
      remaining: MAX_COVERS - (bookedMap[time] || 0),
    }));

    res.json(slots);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminListReservations(req, res) {
  try {
    const reservations = await prisma.tableReservation.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(reservations);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminUpdateReservationStatus(req, res) {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(422).json({ error: 'Invalid status' });

  try {
    const reservation = await prisma.tableReservation.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(reservation);
  } catch {
    res.status(404).json({ error: 'Reservation not found' });
  }
}

module.exports = { createReservation, getAvailableSlots, adminListReservations, adminUpdateReservationStatus };
