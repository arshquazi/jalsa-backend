const router = require('express').Router();
const { body, query } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { formLimiter } = require('../middleware/rateLimit');

const bookingCtrl = require('../controllers/bookingController');
const reservationCtrl = require('../controllers/reservationController');
const menuCtrl = require('../controllers/menuController');
const galleryCtrl = require('../controllers/galleryController');
const reviewCtrl = require('../controllers/reviewController');
const contactCtrl = require('../controllers/contactController');
const newsletterCtrl = require('../controllers/newsletterController');

// ── Rooms ─────────────────────────────────────────────────────
router.get('/rooms', bookingCtrl.listRooms);
router.get('/rooms/:slug', bookingCtrl.getRoom);
router.post('/rooms/availability',
  [body('roomId').isInt(), body('checkIn').isISO8601(), body('checkOut').isISO8601(), handleValidation],
  bookingCtrl.checkAvailability
);

// ── Bookings ──────────────────────────────────────────────────
router.post('/bookings',
  formLimiter,
  [
    body('roomId').isInt({ min: 1 }),
    body('firstName').trim().notEmpty().escape(),
    body('lastName').trim().notEmpty().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty(),
    body('checkIn').isISO8601(),
    body('checkOut').isISO8601(),
    body('guests').isInt({ min: 1, max: 20 }),
    body('specialRequests').optional().trim().escape(),
    handleValidation,
  ],
  bookingCtrl.createBooking
);

// ── Table Reservations ────────────────────────────────────────
router.get('/reservations/slots',
  [query('date').isISO8601(), handleValidation],
  reservationCtrl.getAvailableSlots
);
router.post('/reservations',
  formLimiter,
  [
    body('name').trim().notEmpty().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty(),
    body('date').isISO8601(),
    body('time').matches(/^\d{2}:\d{2}$/),
    body('partySize').isInt({ min: 1, max: 30 }),
    body('occasion').optional().trim().escape(),
    body('notes').optional().trim().escape(),
    handleValidation,
  ],
  reservationCtrl.createReservation
);

// ── Menu ──────────────────────────────────────────────────────
router.get('/menu', menuCtrl.getMenu);

// ── Gallery ───────────────────────────────────────────────────
router.get('/gallery', galleryCtrl.getGallery);

// ── Reviews ───────────────────────────────────────────────────
router.get('/reviews', reviewCtrl.getReviews);
router.post('/reviews',
  formLimiter,
  [
    body('name').trim().notEmpty().escape(),
    body('email').isEmail().normalizeEmail(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('title').optional().trim().escape(),
    body('body').trim().notEmpty().escape(),
    handleValidation,
  ],
  reviewCtrl.submitReview
);

// ── Contact ───────────────────────────────────────────────────
router.post('/contact',
  formLimiter,
  [
    body('name').trim().notEmpty().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('subject').trim().notEmpty().escape(),
    body('message').trim().notEmpty().escape(),
    handleValidation,
  ],
  contactCtrl.submitEnquiry
);

// ── Newsletter ────────────────────────────────────────────────
router.post('/newsletter',
  formLimiter,
  [body('email').isEmail().normalizeEmail(), body('name').optional().trim().escape(), handleValidation],
  newsletterCtrl.subscribe
);

module.exports = router;
