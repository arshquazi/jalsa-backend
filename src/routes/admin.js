const router = require('express').Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

const adminCtrl = require('../controllers/adminController');
const bookingCtrl = require('../controllers/bookingController');
const reservationCtrl = require('../controllers/reservationController');
const menuCtrl = require('../controllers/menuController');
const galleryCtrl = require('../controllers/galleryController');
const reviewCtrl = require('../controllers/reviewController');
const contactCtrl = require('../controllers/contactController');
const newsletterCtrl = require('../controllers/newsletterController');

// ── Auth ──────────────────────────────────────────────────────
router.post('/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty(), handleValidation],
  adminCtrl.login
);

// Everything below requires a valid JWT
router.use(requireAuth);

router.get('/dashboard', adminCtrl.dashboard);
router.post('/change-password', adminCtrl.changePassword);

// ── Bookings ──────────────────────────────────────────────────
router.get('/bookings', bookingCtrl.adminListBookings);
router.patch('/bookings/:id/status', bookingCtrl.adminUpdateBookingStatus);

// ── Reservations ──────────────────────────────────────────────
router.get('/reservations', reservationCtrl.adminListReservations);
router.patch('/reservations/:id/status', reservationCtrl.adminUpdateReservationStatus);

// ── Rooms ─────────────────────────────────────────────────────
router.get('/rooms', bookingCtrl.adminListRooms);
router.post('/rooms', bookingCtrl.adminCreateRoom);
router.put('/rooms/:id', bookingCtrl.adminUpdateRoom);
router.delete('/rooms/:id', bookingCtrl.adminDeleteRoom);

// ── Menu ──────────────────────────────────────────────────────
router.get('/menu', menuCtrl.adminGetMenu);
router.post('/menu/categories', menuCtrl.adminCreateCategory);
router.post('/menu/items', menuCtrl.adminCreateItem);
router.put('/menu/items/:id', menuCtrl.adminUpdateItem);
router.delete('/menu/items/:id', menuCtrl.adminDeleteItem);

// ── Gallery ───────────────────────────────────────────────────
router.get('/gallery', galleryCtrl.adminListImages);
router.post('/gallery', galleryCtrl.adminCreateImage);
router.put('/gallery/:id', galleryCtrl.adminUpdateImage);
router.delete('/gallery/:id', galleryCtrl.adminDeleteImage);

// ── Reviews ───────────────────────────────────────────────────
router.get('/reviews', reviewCtrl.adminListReviews);
router.patch('/reviews/:id/approve', reviewCtrl.adminApproveReview);
router.delete('/reviews/:id', reviewCtrl.adminDeleteReview);

// ── Contact Enquiries ─────────────────────────────────────────
router.get('/enquiries', contactCtrl.adminListEnquiries);
router.patch('/enquiries/:id/read', contactCtrl.adminMarkRead);
router.delete('/enquiries/:id', contactCtrl.adminDeleteEnquiry);

// ── Newsletter ────────────────────────────────────────────────
router.get('/newsletter', newsletterCtrl.adminListSubscribers);
router.delete('/newsletter/:id', newsletterCtrl.adminDeleteSubscriber);

module.exports = router;
