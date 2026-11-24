# Mastro Tickets — Environment Variables & Configuration Reference

> **Source Verification**: Extracted directly via full codebase scan (`grep` across `server.ts`, `vite.config.ts`, `src/`, `.env.example`, and `backend/`).
> **Security Policy**: Zero secret values are printed in this document.

---

## 1. Active Node.js Server Environment Variables (`server.ts` & `vite.config.ts`)

These variables are read server-side via `process.env` (never exposed to browser bundles):

| Variable Name | File & Line | Required? | Default / Fallback | Purpose |
|---|---|---|---|---|
| `PORT` | `/server.ts:8` | Optional | `3000` | HTTP listen port for Express server |
| `NODE_ENV` | `/server.ts:9` | Recommended | `undefined` (dev mode) | Set to `production` to serve `/dist` static bundle instead of Vite dev middleware |
| `CLOUDINARY_CLOUD_NAME` | `/server.ts:30` | Required for uploads | Parsed from `CLOUDINARY_URL` if unset | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | `/server.ts:31` | Required for uploads | Parsed from `CLOUDINARY_URL` if unset | Cloudinary API key (server-side) |
| `CLOUDINARY_API_SECRET` | `/server.ts:32` | Required for uploads | Parsed from `CLOUDINARY_URL` if unset | Cloudinary API secret used to compute SHA-1 upload signatures |
| `CLOUDINARY_URL` | `/server.ts:35` | Alternative to 3 vars above | `""` | Standard Cloudinary connection URI (`cloudinary://<key>:<secret>@<cloud>`) |
| `DISABLE_HMR` | `/vite.config.ts:17,19` | Optional | `undefined` (HMR enabled) | Set to `'true'` to disable Vite HMR & file watching (used in AI Studio preview) |

---

## 2. Active Frontend Environment Variables (`src/` via `import.meta.env`)

Vite inlines `VITE_*` variables into the client JavaScript bundle at build time. **Never place private secrets in `VITE_*` variables.**

| Variable Name | File & Line | Required? | Default / Fallback in Code | Purpose |
|---|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | `/src/firebase.ts:16` | Optional (has fallback) | Hardcoded fallback for `mastro-tickets` (`[REDACTED]`) | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `/src/firebase.ts:17` | Optional (has fallback) | `mastro-tickets.firebaseapp.com` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `/src/firebase.ts:18` | Optional (has fallback) | `mastro-tickets` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `/src/firebase.ts:19` | Optional (has fallback) | `mastro-tickets.firebasestorage.app` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `/src/firebase.ts:20` | Optional (has fallback) | `666809364882` | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `/src/firebase.ts:21` | Optional (has fallback) | `1:666809364882:web:3aa19e7e7a450b13f2914b` | Firebase Web App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `/src/firebase.ts:22` | Optional (has fallback) | `G-5FTBLF079K` | Google Analytics / Firebase Measurement ID |
| `VITE_FIREBASE_DATABASE_ID` | `/src/firebase.ts:27` | Optional | `undefined` (uses `(default)` Firestore DB) | Override named Cloud Firestore database ID |
| `VITE_CLOUDINARY_CLOUD_NAME` | `/src/services/cloudinaryService.ts:56,104,115` | Optional | `""` | Fallback unsigned browser-direct Cloudinary cloud name (used only if server `503` unconfigured) |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `/src/services/cloudinaryService.ts:57,105,116` | Optional | `""` | Fallback unsigned Cloudinary upload preset |
| `VITE_API_BASE_URL` | `/src/services/apiClient.ts:24` | Optional | Empty in dev/AI Studio; auto-infers `https://api.<host>` on `mastrotickets.co`/`.ae` | Base URL for optional legacy PHP REST API |

---

## 3. Legacy PHP Backend Environment Variables (`/backend/.env.example` & `/backend/src/`)

Used **only** if deploying the inactive `/backend/` PHP REST API on an external Apache/PHP VPS:

| Variable Name | Defined in `backend/.env.example` | Read in PHP Code | Notes / Mismatches |
|---|---|---|---|
| `APP_ENV` | Yes (`production`) | `CorsMiddleware`, `HealthController`, `StripeService` | When `development`, disables Stripe webhook signature check if secret missing! |
| `APP_DEBUG` | Yes (`false`) | `index.php`, `Database.php` | Controls verbose error output |
| `APP_URL` | Yes | Not read in PHP code | Unused in current PHP source |
| `FRONTEND_URL` | Yes | `StripeService.php:29` | Used for Stripe `success_url` & `cancel_url` |
| `CORS_ALLOWED_ORIGINS` | Yes | `CorsMiddleware.php:12` | Comma-separated allowed browser origins |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_CHARSET` | Yes | `Database.php:26-31` | MySQL/MariaDB PDO credentials |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` | Yes | Not read in PHP code | `AdminController.php` queries `admin_users` table instead |
| `ADMIN_API_KEY` | **Missing from `.env.example`** | `AuthMiddleware.php:23` | Optional root Bearer token bypass |
| `JWT_SECRET` | Yes | `AuthMiddleware.php:85,103` | HS256 JWT signing key (dangerous hardcoded fallback if omitted) |
| `JWT_EXPIRY_HOURS` | Yes (`24`) | Not read in PHP code | Controllers hardcode `86400 * 7` (7 days) |
| `GOOGLE_CLIENT_ID` | **Missing from `.env.example`** | `AuthController.php:171` | Validates Google OAuth `aud` claim on `/api/v1/auth/google` |
| `STRIPE_SECRET_KEY` | Yes | `StripeService.php:15` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | `StripeService.php:94` | Stripe webhook HMAC signing secret |
| `STRIPE_CURRENCY` | Yes (`usd`) | Not read in PHP code | Hardcoded `'USD'` in `CheckoutController` |
| `RESEND_API_KEY` | Yes | `EmailService.php:34` | Resend transactional email API key |
| `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` | Yes | **MISMATCH!** `EmailService.php:35-36` reads `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | Must align variable names before using PHP `EmailService` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | Not read in PHP code | Cloudinary upload is implemented in Node `/server.ts`, not PHP |
| `RESERVATION_EXPIRY_MINUTES`, `DEFAULT_TAX_RATE`, `SERVICE_FEE_PERCENTAGE` | Yes | Not read in PHP code | Hardcoded (`10` minutes) in `ReservationService.php` |

---

## 4. Recommended Production `.env` Template (Active Node.js + Firebase Stack)

```bash
# Node.js Server
NODE_ENV=production
PORT=3000

# Cloudinary (Server-side signed uploads via /api/uploads/cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Firebase Web SDK (Public client config — optional overrides for mastro-tickets)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
# VITE_FIREBASE_DATABASE_ID=

# Planned Server-Side Integrations (Not yet wired in server.ts)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# RESEND_API_KEY=
# FIREBASE_SERVICE_ACCOUNT_JSON=
```
