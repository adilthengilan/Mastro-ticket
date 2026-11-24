# Mastro Tickets — Backend Architecture Documentation

> **Active Runtime Backend**: `/server.ts` (Node.js + Express 4.22 + Multer 2.5 + Vite 8 middleware, 205 lines).
> **Legacy / Dormant Backend**: `/backend/` (PHP 8.2 + MySQL/MariaDB + Apache 2.4, 28 files, 3,795 lines — NOT executed by `npm run dev` or `npm start`).

---

## 1. Active Express Backend (`/server.ts`)

### 1.1 Initialization & Runtime Setup
- **Entry Point**: `/server.ts`
- **Env Loading**: `import 'dotenv/config'` (line 1) loads `.env` from workspace root into `process.env`.
- **Port & Host**: `PORT = Number(process.env.PORT) || 3000`, bound to `0.0.0.0` (lines 8, 198).
- **Environment Mode**: `IS_PROD = process.env.NODE_ENV === 'production'` (line 9).
- **Hardening**: `app.disable('x-powered-by')` (line 70).
- **Body Parsing**: `app.use(express.json({ limit: '1mb' }))` (line 71).

### 1.2 Middleware & Feature Audit
| Capability | Implemented in `/server.ts`? | Details |
|---|---|---|
| JSON body parser | **Yes** | `express.json({ limit: '1mb' })` |
| Multipart upload | **Yes** | `multer({ storage: memoryStorage(), limits: { fileSize: 10MB, files: 1 }, fileFilter })` |
| Authentication middleware | **NO** | Zero Firebase ID token or session checks on any route |
| Authorization / RBAC | **NO** | Upload route is publicly callable |
| CORS middleware | **NO** | Relies on same-origin SPA serving |
| Rate limiting | **NO** | No `express-rate-limit` or throttling |
| Security headers (`helmet`, CSP, HSTS) | **NO** | Only `x-powered-by` disabled |
| Structured logging | **NO** | `console.log` / `console.error` only |
| Background jobs / Cron | **NO** | No reservation expiration sweeper |
| Graceful shutdown (`SIGTERM`/`SIGINT`) | **NO** | No `server.close()` handler |
| Stripe / Payment routes | **NO** | Absent from `server.ts` |
| Email / Resend / SMTP routes | **NO** | Absent from `server.ts` |
| Firebase Admin SDK | **NO** | Absent from `server.ts` and `package.json` |

### 1.3 Cloudinary Upload Signing & Upload Security (`/server.ts` lines 16–166)
1. **Configuration Resolution (`resolveCloudinaryConfig`)**:
   - Reads `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - Falls back to parsing `CLOUDINARY_URL` (`cloudinary://<apiKey>:<apiSecret>@<cloudName>`) via Node's `URL` parser.
2. **Upload Validation (`multer`)**:
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
   - File size cap: `10 * 1024 * 1024` bytes (10 MB), `files: 1`.
   - Allowed folder whitelist: `mastrotickets/events`, `mastrotickets/tickets`, `mastrotickets/concerts`, `mastrotickets/packages`.
3. **SHA-1 Signature Calculation (`signCloudinaryParams`)**:
   - Sorts non-empty params (`folder`, `timestamp`) lexicographically, joins as `k=v&...`, appends `apiSecret`, and computes `crypto.createHash('sha1').update(...).digest('hex')`.
4. **Upstream Dispatch**:
   - Constructs a standard `FormData` with `new Blob([req.file.buffer], { type: req.file.mimetype })`, `api_key`, `timestamp`, `folder`, and `signature`.
   - Sends `POST https://api.cloudinary.com/v1_1/${cloudName}/image/upload`.
5. **Error Handling**:
   - Custom error handler catches `multer.MulterError` (`LIMIT_FILE_SIZE` -> 400) and `fileFilter` errors (-> 400).
   - Returns `503` if Cloudinary env vars are unconfigured; `502` on upstream failure.
   - **No magic-byte verification**: relies on client-supplied `file.mimetype` (Cloudinary performs server-side image decoding, which partially mitigates disguised files).

### 1.4 Static Asset Serving & SPA Fallback (`/server.ts` lines 168–204)
- **Production (`NODE_ENV=production`)**:
  - Serves static bundle from `path.resolve(__dirname, 'dist')` using `express.static`.
  - Fallback `app.get('*', ...)` rejects unmatched `/api/*` paths with `404 { error: 'API route not found.' }`, and sends `dist/index.html` for all other SPA paths (returns `500` if `dist/index.html` is missing).
- **Development (`NODE_ENV !== 'production'`)**:
  - Dynamically imports `vite` and attaches `vite.middlewares` in `middlewareMode: true`, `appType: 'spa'`.

---

## 2. Legacy / Dormant PHP REST API (`/backend/`)

### 2.1 Overview & Active Relationship
The `/backend/` directory contains a complete PHP 8.2 + MySQL/MariaDB REST API designed for Hostinger VPS (`api.mastrotickets.co`, Apache 2.4).
- **Is it running in the current AI Studio / Node.js environment?** **No.**
- **Does active frontend code reference it?** Partially — `/src/services/apiClient.ts` checks `import.meta.env.VITE_API_BASE_URL` or whether `window.location.hostname` ends with `mastrotickets.co` or `mastrotickets.ae`. When neither is true (e.g., localhost, AI Studio preview, or custom domains without `VITE_API_BASE_URL`), `apiClient.isRemoteApiConfigured()` returns `false` and **zero requests are ever sent to the PHP API**.

### 2.2 PHP Components Inspected
- **Front Controller**: `/backend/public/index.php` — loads `.env`, applies `CorsMiddleware`, dispatches 20 `/api/v1/*` routes via exact/regex matching.
- **Database**: `/backend/src/Config/Database.php` — PDO MySQL singleton (`ATTR_EMULATE_PREPARES => false`, `utf8mb4`).
- **Auth Middleware**: `/backend/src/Middleware/AuthMiddleware.php` — HS256 JWT + `ADMIN_API_KEY` header verification.
- **Services**:
  - `ReservationService.php`: MySQL `SELECT ... FOR UPDATE` pessimistic row locks, 10-minute holds, deterministic idempotency keys (`RES-IDEM-*`), sorted item locks (deadlock prevention), automatic expired reservation reclamation.
  - `StripeService.php`: Direct `curl` calls to `https://api.stripe.com/v1/checkout/sessions`, HMAC-SHA256 `Stripe-Signature` verification (5-min replay window), `checkout.session.completed` order + ticket issuance.
  - `EmailService.php`: Direct `curl` calls to `https://api.resend.com/emails` with HTML Mobile Ticket Transfer template and `email_jobs` outbox insert.
  - `TicketNumberGenerator.php`: Cryptographic `random_int` generator (`MST-<CODE>-<8CHARS>`) with MySQL uniqueness check.

### 2.3 Critical Bugs & Schema Mismatches Found Inside Legacy `/backend/`
Direct code-to-SQL inspection uncovered **8 breaking bugs** if `/backend/` were deployed as-is:
1. **`admin_users` missing columns**: `schema.sql` lacks `name` and `is_active`, but `AdminController.php:32` and `AuthMiddleware.php:44` query both (`SQLSTATE[42S22] Column not found`).
2. **`ticket_types.category` missing**: `schema.sql` defines `category_slug`, but `EventController.php:82`, `StripeService.php:169`, and `TicketController.php:38` reference `category`.
3. **`reservation_items` missing columns**: `schema.sql` defines `seat_details_json` and has no `total_price`, but `ReservationService.php:193,304` inserts/selects `total_price` and `seat_details`.
4. **`orders` missing columns**: `schema.sql` uses normalized `billing_street`/`billing_city` and an `order_items` table, but `StripeService.php:180` and `OrderController.php:64-65` read/write non-existent `billing_address` and `items_json` columns.
5. **`issued_tickets` column mismatch**: `schema.sql` defines `row` and `seat` (no `download_url`), whereas `OrderController.php:44-52` and `TicketController.php:91` read `row_num`, `seat_num`, and `download_url`.
6. **Discount ignored in Stripe charge**: `CheckoutController.php:150` computes `$finalTotal` after discount, but `StripeService.php:33` bills full `unitPrice + fee` line items to Stripe without passing any discount/coupon.
7. **Env variable name mismatch**: `EmailService.php:35-36` reads `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME`, whereas `backend/.env.example:38-39` defines `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME`.
8. **Unused Composer packages**: `backend/composer.json` lists `stripe/stripe-php`, `resend/resend-php`, `cloudinary/cloudinary_php`, `google/cloud-firestore`, `kreait/firebase-php`, and `vlucas/phpdotenv`, yet none of the PHP files actually import or instantiate those SDKs (raw `curl` + custom `Env.php` are used instead).
