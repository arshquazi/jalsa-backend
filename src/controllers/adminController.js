const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// POST /api/admin/login
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET not configured' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message || 'Server error' });
  }
}

// GET /api/admin/dashboard — summary counts
async function dashboard(req, res) {
  try {
    const [rooms, bookings, reservations, enquiries, reviews, subscribers] = await Promise.all([
      prisma.roomBooking.count(),
      prisma.roomBooking.count({ where: { status: 'confirmed' } }),
      prisma.tableReservation.count(),
      prisma.contactEnquiry.count({ where: { read: false } }),
      prisma.review.count({ where: { approved: false } }),
      prisma.newsletterSubscriber.count(),
    ]);

    res.json({ totalBookings: rooms, confirmedBookings: bookings, totalReservations: reservations, unreadEnquiries: enquiries, pendingReviews: reviews, newsletterCount: subscribers });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/admin/change-password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: req.admin.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { login, dashboard, changePassword };
