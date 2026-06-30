const prisma = require('../config/database');
const { sendRoomBookingEmails } = require('../config/email');

// GET /api/rooms — public: list active rooms
async function listRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { pricePerNight: 'asc' },
    });
    // Parse JSON strings to arrays
    const parsed = rooms.map((r) => ({
      ...r,
      amenities: JSON.parse(r.amenities),
      images: JSON.parse(r.images),
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/rooms/:slug — single room
async function getRoom(req, res) {
  try {
    const room = await prisma.room.findUnique({ where: { slug: req.params.slug } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({ ...room, amenities: JSON.parse(room.amenities), images: JSON.parse(room.images) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/rooms/availability — check if a room is free for the given dates
async function checkAvailability(req, res) {
  const { roomId, checkIn, checkOut } = req.body;
  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(422).json({ error: 'Check-out must be after check-in' });
    }

    // Overlapping booking exists if: existing.checkIn < requestedCheckOut AND existing.checkOut > requestedCheckIn
    const conflict = await prisma.roomBooking.findFirst({
      where: {
        roomId: parseInt(roomId),
        status: { not: 'cancelled' },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    res.json({ available: !conflict });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/bookings — create a booking
async function createBooking(req, res) {
  const { roomId, firstName, lastName, email, phone, checkIn, checkOut, guests, specialRequests } = req.body;

  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(422).json({ error: 'Check-out must be after check-in' });
    }

    const room = await prisma.room.findUnique({ where: { id: parseInt(roomId) } });
    if (!room || !room.isActive) return res.status(404).json({ error: 'Room not found' });

    if (guests > room.maxOccupancy) {
      return res.status(422).json({ error: `Room capacity is ${room.maxOccupancy} guests` });
    }

    // Double-booking check (atomic: inside transaction)
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.roomBooking.findFirst({
        where: {
          roomId: room.id,
          status: { not: 'cancelled' },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (conflict) {
        throw new Error('UNAVAILABLE');
      }

      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const totalAmount = room.pricePerNight * nights;

      return tx.roomBooking.create({
        data: {
          roomId: room.id,
          firstName,
          lastName,
          email,
          phone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: parseInt(guests),
          specialRequests,
          totalAmount,
          status: 'confirmed',
        },
      });
    });

    // Fire-and-forget emails (don't block the response)
    sendRoomBookingEmails({ booking, room }).catch((e) =>
      console.error('Email send failed:', e.message)
    );

    res.status(201).json({ message: 'Booking confirmed', bookingId: booking.id, totalAmount: booking.totalAmount });
  } catch (e) {
    if (e.message === 'UNAVAILABLE') {
      return res.status(409).json({ error: 'Room is not available for the selected dates' });
    }
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

// ── Admin ───────────────────────────────────────────────────────

async function adminListBookings(req, res) {
  try {
    const bookings = await prisma.roomBooking.findMany({
      include: { room: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminUpdateBookingStatus(req, res) {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(422).json({ error: 'Invalid status' });

  try {
    const booking = await prisma.roomBooking.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json(booking);
  } catch {
    res.status(404).json({ error: 'Booking not found' });
  }
}

// Admin: manage rooms
async function adminListRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { pricePerNight: 'asc' } });
    res.json(rooms.map((r) => ({ ...r, amenities: JSON.parse(r.amenities), images: JSON.parse(r.images) })));
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminCreateRoom(req, res) {
  const { name, slug, description, pricePerNight, maxOccupancy, amenities, images } = req.body;
  try {
    const room = await prisma.room.create({
      data: {
        name, slug, description,
        pricePerNight: parseFloat(pricePerNight),
        maxOccupancy: parseInt(maxOccupancy),
        amenities: JSON.stringify(amenities || []),
        images: JSON.stringify(images || []),
      },
    });
    res.status(201).json(room);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Slug already exists' });
    res.status(500).json({ error: 'Server error' });
  }
}

async function adminUpdateRoom(req, res) {
  const { name, slug, description, pricePerNight, maxOccupancy, amenities, images, isActive } = req.body;
  try {
    const room = await prisma.room.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name, slug, description,
        pricePerNight: pricePerNight ? parseFloat(pricePerNight) : undefined,
        maxOccupancy: maxOccupancy ? parseInt(maxOccupancy) : undefined,
        amenities: amenities ? JSON.stringify(amenities) : undefined,
        images: images ? JSON.stringify(images) : undefined,
        isActive,
      },
    });
    res.json(room);
  } catch {
    res.status(404).json({ error: 'Room not found' });
  }
}

async function adminDeleteRoom(req, res) {
  try {
    await prisma.room.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ message: 'Room deactivated' });
  } catch {
    res.status(404).json({ error: 'Room not found' });
  }
}

module.exports = {
  listRooms, getRoom, checkAvailability, createBooking,
  adminListBookings, adminUpdateBookingStatus,
  adminListRooms, adminCreateRoom, adminUpdateRoom, adminDeleteRoom,
};
