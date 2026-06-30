# Jalsa Hotel & Resort — Backend API

Complete production-ready backend for the Jalsa Hotel & Resort website built in Google Stitch.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + Express |
| Database | SQLite (local) → PostgreSQL (production) |
| ORM | Prisma |
| Auth | JWT (bcrypt password hashing) |
| Email | Nodemailer |
| Security | Helmet, CORS, express-rate-limit, express-validator |

---

## Quick Start (Local)

```bash
# 1. Navigate to backend folder
cd "jalsa website/backend"

# 2. Copy environment file and fill in your values
cp .env.example .env

# 3. Install, migrate DB, seed sample data — all in one command
npm run setup

# 4. Start dev server
npm run dev
```

Server runs at: **http://localhost:4000**  
Admin panel: **http://localhost:4000/admin**  
Health check: **http://localhost:4000/health**

---

## Environment Variables (.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./jalsa.db` / PostgreSQL: `postgresql://...` |
| `PORT` | Server port (default: 4000) |
| `JWT_SECRET` | Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | SMTP username / Gmail address |
| `EMAIL_PASS` | SMTP password / Gmail App Password |
| `ADMIN_EMAIL` | Email address that receives all notifications |
| `RESORT_NAME` | Resort name used in emails |
| `RESORT_PHONE` | Phone number shown in emails |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins for CORS |
| `ADMIN_DEFAULT_EMAIL` | First-run admin login email |
| `ADMIN_DEFAULT_PASSWORD` | First-run admin login password (change immediately!) |

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | List all active rooms |
| GET | `/api/rooms/:slug` | Single room by slug |
| POST | `/api/rooms/availability` | Check room availability for dates |
| POST | `/api/bookings` | Create a room booking |
| GET | `/api/reservations/slots?date=YYYY-MM-DD` | Available time slots |
| POST | `/api/reservations` | Create a table reservation |
| GET | `/api/menu` | Full menu grouped by category |
| GET | `/api/gallery?category=rooms` | Gallery images (optional category filter) |
| GET | `/api/reviews` | Approved reviews/testimonials |
| POST | `/api/reviews` | Submit a review (pending approval) |
| POST | `/api/contact` | Submit a contact enquiry |
| POST | `/api/newsletter` | Subscribe to newsletter |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Get JWT token |
| GET | `/api/admin/dashboard` | Summary counts |
| POST | `/api/admin/change-password` | Change admin password |
| GET | `/api/admin/bookings` | All room bookings |
| PATCH | `/api/admin/bookings/:id/status` | Update booking status |
| GET | `/api/admin/reservations` | All table reservations |
| PATCH | `/api/admin/reservations/:id/status` | Update reservation status |
| GET/POST | `/api/admin/rooms` | List / create rooms |
| PUT/DELETE | `/api/admin/rooms/:id` | Update / deactivate room |
| GET | `/api/admin/menu` | Full menu (including unavailable) |
| POST | `/api/admin/menu/categories` | Create menu category |
| POST | `/api/admin/menu/items` | Create menu item |
| PUT/DELETE | `/api/admin/menu/items/:id` | Update / delete menu item |
| GET/POST | `/api/admin/gallery` | List / add gallery image |
| PUT/DELETE | `/api/admin/gallery/:id` | Update / delete image |
| GET | `/api/admin/reviews` | All reviews (including pending) |
| PATCH | `/api/admin/reviews/:id/approve` | Approve a review |
| DELETE | `/api/admin/reviews/:id` | Delete review |
| GET | `/api/admin/enquiries` | All contact enquiries |
| PATCH | `/api/admin/enquiries/:id/read` | Mark enquiry as read |
| DELETE | `/api/admin/enquiries/:id` | Delete enquiry |
| GET | `/api/admin/newsletter` | All subscribers |
| DELETE | `/api/admin/newsletter/:id` | Remove subscriber |

---

## Switching to PostgreSQL

1. In `.env`, comment out the SQLite line and set:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/jalsa_resort"
   ```
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
3. Run `npm run db:migrate`

---

## Deployment Guide

### Backend → Railway (free tier)

1. Push `backend/` folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a PostgreSQL plugin in Railway dashboard
4. Set all environment variables from `.env.example` in Railway's Variables tab
5. Railway auto-detects `npm start` and deploys
6. Copy the public URL (e.g. `https://jalsa-backend.up.railway.app`)

### Backend → Render (free tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Set Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && node prisma/seed.js`
4. Set Start Command: `npm start`
5. Add environment variables
6. Copy the public URL

### Frontend → Hostinger

1. Upload all files from `stitch_jalsa_resort_web_experience/` to Hostinger via File Manager or FTP
2. In `api.js`, change:
   ```js
   const JALSA_API = window.JALSA_API_URL || 'http://localhost:4000/api';
   ```
   to your live backend URL, OR add this before the `<script src="../api.js">` tag on every page:
   ```html
   <script>window.JALSA_API_URL = 'https://your-backend.railway.app/api';</script>
   ```
3. Update `ALLOWED_ORIGINS` in your backend `.env` to include your Hostinger domain

---

## Admin Panel

Visit `/admin` on your backend URL.

Default credentials (set in `.env`):
- Email: `admin@jalsaresort.com`
- Password: `Admin@Jalsa2024`

**Change the password immediately after first login** via Settings → Change Password.

---

## Feature Checklist

- [x] Room booking form → saves to DB, confirmation email to guest + admin
- [x] Double-booking prevention (atomic transaction)
- [x] Table reservation form → saves to DB, emails sent
- [x] Time slot capacity check (max 50 covers per slot)
- [x] Dynamic menu loads from DB (categories + items, veg/non-veg tag)
- [x] Admin can add/edit/delete menu items and toggle availability
- [x] Dynamic rooms served from DB with amenities and images
- [x] Contact/enquiry form → saves to DB, email to admin + auto-reply to guest
- [x] Gallery images served from DB, filterable by category
- [x] Reviews submitted by guests → admin approval before showing publicly
- [x] Newsletter signup saved to DB
- [x] Admin dashboard: login (JWT), view all bookings/reservations, manage everything
- [x] bcrypt password hashing
- [x] Helmet security headers
- [x] Rate limiting on all public forms (10 req / 15 min)
- [x] Input validation and sanitization on every endpoint
- [x] CORS configured for frontend domain
- [x] Frontend design pixel-identical to Stitch (no visual changes)

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # DB schema (SQLite/PostgreSQL)
│   └── seed.js             # Sample data (rooms, menu, gallery, admin)
├── src/
│   ├── app.js              # Express app entry point
│   ├── config/
│   │   ├── database.js     # Prisma client singleton
│   │   └── email.js        # Nodemailer + email templates
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   ├── rateLimit.js    # Rate limiters
│   │   └── validate.js     # express-validator helper
│   ├── routes/
│   │   ├── public.js       # Public API routes
│   │   └── admin.js        # Protected admin routes
│   └── controllers/        # Business logic per feature
│       ├── adminController.js
│       ├── bookingController.js
│       ├── reservationController.js
│       ├── menuController.js
│       ├── galleryController.js
│       ├── reviewController.js
│       ├── contactController.js
│       └── newsletterController.js
├── admin/
│   └── index.html          # Admin dashboard UI
├── .env                    # Your local secrets (not committed)
├── .env.example            # Template for all variables
└── package.json
```
