require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const { apiLimiter } = require('./middleware/rateLimit');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust Railway's reverse proxy (required for express-rate-limit v7+)
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://fonts.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.tailwindcss.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", 'http://localhost:4000', 'https:'],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow: no origin (curl/Postman), same-origin (admin panel), or listed origins
      if (!origin || allowedOrigins.includes(origin) || origin === process.env.RAILWAY_PUBLIC_DOMAIN) return cb(null, true);
      cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body & compression ────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate limit all API routes ─────────────────────────────────
app.use('/api', apiLimiter);

// ── API routes ────────────────────────────────────────────────
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// ── Admin dashboard UI ────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// ── Serve Stitch frontend files ───────────────────────────────
// Allows the preview panel to load HTML pages directly on port 4000
const frontendPath = path.join(__dirname, '../../stitch_jalsa_resort_web_experience');
app.use(express.static(frontendPath));
// Root → redirect to homepage
app.get('/', (req, res) => {
  res.redirect('/jalsa_hotel_resort_homepage_premium_motion/code.html');
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Email diagnostic (token-protected to prevent abuse of the mail quota) ──
// Usage: /health/email?token=<JWT_SECRET>&to=you@example.com
app.get('/health/email', async (req, res) => {
  if (!process.env.JWT_SECRET || req.query.token !== process.env.JWT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { runEmailDiagnostic } = require('./config/email');
  try {
    const result = await runEmailDiagnostic(req.query.to);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏨 Jalsa Resort API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Admin panel: http://0.0.0.0:${PORT}/admin`);
  console.log(`❤️  Health check: http://0.0.0.0:${PORT}/health\n`);
});

module.exports = app;
