# MASTRO TICKETS — COMPLETE CODEBASE, ARCHITECTURE & TECHNICAL DOCUMENTATION

> **Document Type**: Production-Oriented Technical Extraction & Engineering Audit
> **Repository**: Mastro Tickets (Formula 1 & Live Event Ticketing Marketplace — Hungaroring, Budapest, Hungary; USD `$` pricing)
> **Inspection Coverage**: **100% of source, configuration, Firestore rules, and legacy backend files inspected directly.** No application code, rules, or configs were modified during this extraction.
> **Security Hygiene**: All actual secrets, API keys, hardcoded passwords, bcrypt hashes, and personal admin emails discovered in source code are strictly `[REDACTED]` with exact file/line citations.

---

## Companion Documentation Package

This master document consolidates Parts 1–18 in full. Dedicated standalone volumes are also provided in the workspace root and bundled into `MASTRO_TICKETS_DOCUMENTATION.zip`:

1. `MASTRO_TICKETS_COMPLETE_TECHNICAL_DOCUMENTATION.md` *(this master document)*
2. `MASTRO_TICKETS_CODEBASE_FILE_INDEX.md`
3. `MASTRO_TICKETS_ARCHITECTURE.md`
4. `MASTRO_TICKETS_DATABASE_SCHEMA.md`
5. `MASTRO_TICKETS_API_REFERENCE.md`
6. `MASTRO_TICKETS_FRONTEND_DOCUMENTATION.md`
7. `MASTRO_TICKETS_BACKEND_DOCUMENTATION.md`
8. `MASTRO_TICKETS_SECURITY_AUDIT.md`
9. `MASTRO_TICKETS_DEPLOYMENT_GUIDE.md`
10. `MASTRO_TICKETS_ENVIRONMENT_VARIABLES.md`
11. `MASTRO_TICKETS_FEATURE_STATUS.md`

---

# PART 1 — COMPLETE PROJECT STRUCTURE

### 1.1 Repository Directory Tree
```text
/ (workspace root)
├── .env.example
├── bun.lock
├── eslint.config.js
├── firebase-blueprint.json
├── firestore.rules
├── firestore.rules.test.ts
├── index.html
├── metadata.json
├── package.json
├── security_spec.md
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── public/assets/aistudio/
│   ├── c40989f7f37e133e5c8f5f03ae7efcc5_a085ea05.webp
│   ├── d0e7fa41e5234eb4511326c4bada0ff7_5cf4ba31.jpg
│   ├── d0e7fa41e5234eb4511326c4bada0ff7_d9e81e7f.jpg
│   ├── mastro-logo_504ab54e.png
│   ├── mastrotickets-design-system_d65400ac.md
│   ├── Paste_October_27__2026_-_6_04PM_7aa0a541
│   └── Screenshot_2026-10-27_182941_7da799b4.png
├── src/
│   ├── App.tsx (215 lines)
│   ├── firebase.ts (136 lines)
│   ├── index.css (106 lines)
│   ├── main.tsx (6 lines)
│   ├── types/
│   │   ├── api.ts (196 lines)
│   │   └── index.ts (309 lines)
│   ├── services/
│   │   ├── adminService.ts (19 lines — UNUSED)
│   │   ├── apiClient.ts (212 lines — OPTIONAL/DORMANT)
│   │   ├── authService.ts (90 lines — MOSTLY UNUSED)
│   │   ├── checkoutService.ts (42 lines — OPTIONAL)
│   │   ├── cloudinaryService.ts (150 lines — ACTIVE)
│   │   ├── eventsService.ts (16 lines — OPTIONAL)
│   │   ├── firestoreRepository.ts (607 lines — ACTIVE CORE)
│   │   ├── orderConfirmationTemplate.ts (127 lines — ACTIVE)
│   │   ├── ordersService.ts (15 lines — UNUSED)
│   │   ├── purchaseFeedService.ts (88 lines — ACTIVE)
│   │   ├── qaAuditRunner.ts (285 lines — SIMULATED STUB)
│   │   ├── store.tsx (2,596 lines — ACTIVE CORE)
│   │   └── ticketsService.ts (21 lines — OPTIONAL)
│   ├── components/
│   │   ├── ConcertsSection.tsx (126 lines — UNUSED)
│   │   ├── ErrorBoundary.tsx (105 lines — ACTIVE)
│   │   ├── Footer.tsx (201 lines — ACTIVE)
│   │   ├── GrandPrixCard.tsx (90 lines — ACTIVE)
│   │   ├── Header.tsx (370 lines — ACTIVE)
│   │   ├── Hero.tsx (280 lines — ACTIVE)
│   │   ├── LivePurchaseToast.tsx (157 lines — ACTIVE)
│   │   ├── PremiumSection.tsx (117 lines — UNUSED)
│   │   ├── RaceDaySelector.tsx (91 lines — UNUSED)
│   │   ├── ScrollingTrustBanner.tsx (229 lines — ACTIVE)
│   │   ├── TicketQuantityModal.tsx (299 lines — ACTIVE)
│   │   └── YasConciergeWidget.tsx (162 lines — ACTIVE)
│   └── pages/
│       ├── AccountPage.tsx (688 lines)
│       ├── AdminPanel.tsx (3,284 lines)
│       ├── AuthPage.tsx (470 lines)
│       ├── CartPage.tsx (439 lines)
│       ├── CheckoutPage.tsx (684 lines)
│       ├── HelpPage.tsx (179 lines)
│       ├── HomePage.tsx (357 lines)
│       ├── OrderConfirmationPage.tsx (435 lines)
│       ├── PrintableTicketPage.tsx (233 lines)
│       ├── RaceDetailPage.tsx (1,097 lines)
│       ├── RacesPage.tsx (225 lines)
│       └── TicketVerificationPage.tsx (295 lines)
└── backend/ (28 files, 3,795 lines — LEGACY / INACTIVE PHP 8.2 + MYSQL API)
    ├── .env.example, README.md, composer.json, firestore.rules
    ├── apache/mastrotickets-api.conf
    ├── database/schema.sql
    ├── public/.htaccess, public/index.php
    └── src/{autoload.php, Config/, Controllers/, Http/, Middleware/, Services/}
```

For the complete per-file responsibility, export, dependency, and usage table across all 80+ files, see `MASTRO_TICKETS_CODEBASE_FILE_INDEX.md`.

---

# PART 2 — COMPLETE TECHNOLOGY STACK

### 2.1 Frontend Stack (Verified from `package.json` & `bun.lock`)
- **UI Framework**: React `^19.0.1` (resolved `19.3.1`), `react-dom` `19.3.1`
- **Language**: TypeScript `^7.0.2` (resolved `7.0.2`)
- **Build Tool**: Vite `^8.3.0` (resolved `8.3.8`) + `@vitejs/plugin-react` `6.3.0`
- **Styling**: Tailwind CSS `^4.3.3` (resolved `4.3.5`) via `@tailwindcss/vite` `4.3.5` and `@import "tailwindcss";` in `src/index.css`
- **Icons**: `lucide-react` `^0.546.0` (resolved `0.546.0`)
- **Animations**: `motion` `^12.23.24` (resolved `12.43.0`) installed; UI relies primarily on Tailwind CSS animations & transitions
- **Routing**: Custom History API router in `src/App.tsx` (no `react-router-dom`)
- **State Management**: Single React Context (`StoreProvider` / `useStore` in `src/services/store.tsx`) + `localStorage` + Firestore `onSnapshot`
- **Forms & Date/Time**: Native HTML5 form validation & JavaScript `Date` (no Zod, React Hook Form, Day.js, or date-fns)
- **Typography**: Google Fonts (`Barlow Condensed`, `Inter`, `JetBrains Mono`) loaded in `index.html`

### 2.2 Active Backend Stack (`/server.ts`)
- **Runtime**: Node.js (`v22.23.2` observed; `tsx` `4.23.15` for `npm run dev`)
- **HTTP Server**: Express `^4.21.2` (resolved `4.22.3`)
- **Uploads**: Multer `^2.5.0` (resolved `2.5.0`, memory storage, 10MB max)
- **Env Management**: `dotenv` `^17.2.3` (resolved `17.4.2`)
- **Auth/Rate-Limit/Logging/Background Jobs**: **None implemented** in `server.ts`

### 2.3 Database & Authentication
- **Database**: Firebase Cloud Firestore (`firebase` JS SDK `13.4.0`), project `mastro-tickets`, `experimentalAutoDetectLongPolling: true`.
- **Auth**: Firebase Authentication (`GoogleAuthProvider` popup + Email/Password + `sendEmailVerification` + `sendPasswordResetEmail`).

### 2.4 External Integrations
- **Cloudinary**: Active signed server upload (`server.ts` -> `api.cloudinary.com/v1_1/:cloud/image/upload`) + optional unsigned client preset fallback (`cloudinaryService.ts`).
- **Stripe**: **SIMULATED** in active Node+Firestore runtime (`store.tsx:createOrder`); real cURL Stripe Checkout & HMAC webhook verification exist only in **legacy inactive** `/backend/src/Services/StripeService.php`.
- **Resend Email**: **SIMULATED** in active Node+Firestore runtime (writes `EmailJob` doc with `status: 'delivered'` without HTTP/SMTP call); real Resend cURL dispatch exists only in **legacy inactive** `/backend/src/Services/EmailService.php`.
- **QR Code Generation**: External `https://api.qrserver.com/v1/create-qr-code/` via `<img src>` in `OrderConfirmationPage.tsx`.
- **Analytics**: Firebase Analytics (`getAnalytics(app)` guarded by `isSupported()`).

---

# PART 3 — FRONTEND ARCHITECTURE

### 3.1 Pages Inventory (12 Active Pages)
1. **`HomePage.tsx`** (`/` & fallback): Hero banner with Budapest countdown, `ScrollingTrustBanner`, featured Hungarian GP showcase, upcoming races grid (`GrandPrixCard`), buyer guarantees.
2. **`RacesPage.tsx`** (`/races`): Full F1 calendar with search and region filters.
3. **`RaceDetailPage.tsx`** (`/races/:slug`): Circuit telemetry, schedule, SVG track map, `TicketQuantityModal` (1–8 tickets), category/race-day filter tabs, stock indicators, confirmation dialog, and atomic 10-minute reservation (`reserveSelectionForCheckout`).
4. **`CartPage.tsx`** (`/cart`): Active reservation countdown, line items, quantity controls, promo code application (`BUDAPEST2026`, `HUNGARORING15`, `VIP400`), USD totals (subtotal, service fee, discount, 10% tax).
5. **`CheckoutPage.tsx`** (`/checkout`): Guest/authenticated billing & contact form, reservation timer, Stripe cancel query handler (`?status=cancelled&reservation_id=...`), remote PHP Stripe redirect (when configured) OR active simulated card form (`cardNumber`, `expiry`, `cvc` in React state -> `store.createOrder`).
6. **`OrderConfirmationPage.tsx`** (`/order-confirmed`, `/order-confirmed/:orderId`, `/booking-confirmation/:orderId`, `/orders/:orderId/tickets`): Receipt, external QR code (`api.qrserver.com`), print/download links, simulated email resend, guest-to-account CTA. *(Legacy copy defect: line 301 shows `08:00 GST`.)*
7. **`PrintableTicketPage.tsx`** (`/tickets/print/:ticketNumber`): Chromeless print layout (`window.print()`). *(Defects: static identical CSS barcode bars, static `<QrCode />` icon, legacy `mastrotickets.ae` URL at line 212.)*
8. **`TicketVerificationPage.tsx`** (`/ticket-enquiry`, `/verify-ticket`, `/verify-ticket/:ticketNumber`): Public ticket lookup masking attendee name (`J*** D***`). *(Limitation: only searches locally loaded `orders`, so public cross-device verification fails under Firestore rules.)*
9. **`AuthPage.tsx`** (`/login`, `/register`, `/auth`): Firebase Google Sign-In, Email/Password Sign-In & Registration, Password Reset.
10. **`AccountPage.tsx`** (`/account`): Guest portal (browser-local guest orders + link CTA) and Authenticated 4-tab dashboard (`My Orders`, `My Tickets`, `Receipts & Invoices`, `My Profile`) with email verification & guest-order claiming.
11. **`HelpPage.tsx`** (`/help`): 6 Budapest/Hungaroring FAQs + UI-only concierge form (does not save or send messages).
12. **`AdminPanel.tsx`** (`/admin`, `/admin/*`, `/admin-panel/*`): 11-tab admin workspace (Dashboard, Events CRUD + Cloudinary, Tickets & Issued Passes + Cloudinary + Void/Reissue, Inventory Ledger, Categories CRUD, Orders & Refunds, Email Queue/Composer, Discounts CRUD, Audit Logs, QA Runner, System Health).

### 3.2 Components Inventory (9 Active, 3 Unused)
- **Active**: `Header`, `Footer`, `Hero`, `GrandPrixCard`, `TicketQuantityModal`, `ScrollingTrustBanner`, `LivePurchaseToast`, `YasConciergeWidget` (static FAQ matcher, no LLM), `ErrorBoundary`.
- **Unused (0 imports)**: `ConcertsSection.tsx`, `PremiumSection.tsx`, `RaceDaySelector.tsx`.

### 3.3 State Management (`src/services/store.tsx`)
- Hydrates initial state from `localStorage`, attaches 11 Firestore `onSnapshot` listeners (`events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts`, `reservations`, plus role-scoped `orders`, and admin-only `emailJobs`, `inventoryLedger`, `auditLogs`).
- Runs a `1000ms` `setInterval` tracking `activeReservation.expiresAt` and invoking `releaseReservationTransaction` when countdown hits zero.
- Mirrors nearly all collections back into `localStorage` on every state change (including customer PII in `orders`, `emailJobs`, `auditLogs`).

---

# PART 4 — BACKEND ARCHITECTURE

### 4.1 Active Server (`/server.ts`)
- Express `4.22.3` on `0.0.0.0:${PORT || 3000}`, `app.disable('x-powered-by')`, `express.json({ limit: '1mb' })`.
- **Active Routes (2 total)**:
  1. `GET /api/uploads/cloudinary/status`: Returns `{ configured, cloudName, allowedFolders, maxBytes }`.
  2. `POST /api/uploads/cloudinary`: Multer memory upload (`10MB`, 1 file, `JPG/PNG/WebP/AVIF`), folder whitelist (`mastrotickets/{events,tickets,concerts,packages}`), SHA-1 signed upload to Cloudinary API (`201 Created`). **No auth, no RBAC, no rate limiting, no CORS middleware.**
- **Serving Mode**: Vite dev middleware when `NODE_ENV !== 'production'`; `express.static('dist')` + SPA fallback `dist/index.html` when `NODE_ENV === 'production'`.

### 4.2 Legacy PHP Backend (`/backend/`)
- 20 `/api/v1/*` routes in `/backend/public/index.php` targeting MySQL 8/MariaDB + Apache 2.4 (`api.mastrotickets.co`).
- **Dormant** unless `VITE_API_BASE_URL` is configured or frontend is served on `mastrotickets.co`/`.ae`.
- Contains **8 SQL schema-to-code column/env mismatches** documented in `MASTRO_TICKETS_BACKEND_DOCUMENTATION.md`.

---

# PART 5 — FIREBASE & FIRESTORE ARCHITECTURE

### 5.1 Collections (13 Domain + 1 Probe)
`events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts`, `reservations`, `orders`, `users`, `admins`, `emailJobs`, `inventoryLedger`, `auditLogs`, plus `test/connection`.

### 5.2 Atomic Inventory Transactions (`/src/services/firestoreRepository.ts`)
- **`reserveTicketsTransaction(reservation, items)`**: `runTransaction` reading all requested `tickets/{id}`, validating `availableQuantity >= qty && status !== 'sold_out'`, decrementing stock, recomputing status (`sold_out`/`low_inventory`/`available`), writing `reservations/{id}` (`status: 'active'`, `expiresAt: +10m`), and appending `inventoryLedger`.
  - *Caveat*: On `PERMISSION_DENIED`, `store.tsx:1207` falls back to `localStorage` (breaks multi-user concurrency).
- **`releaseReservationTransaction(reservationId, reason)`**: Idempotently checks `status === 'active'`, restores `Math.min(capacity, availableQuantity + qty)`, updates reservation to `expired` or `released`, logs `RESERVATION_EXPIRED_RELEASED`.
  - *Caveat*: Only triggered client-side; closing browser tab leaves reservations permanently active.
- **`completeOrderTransaction(order, reservationId?)`** *(actual symbol name, not `confirmOrderTransaction`)*: Reads reservation; if `active`, skips re-deducting ticket stock (prevents double deduction), writes `orders/{id}` with embedded `tickets: IssuedTicket[]`, marks reservation `confirmed`, logs `PAYMENT_CONFIRMED_DEDUCTED`.
  - *Caveat*: Executes from browser client without server-verified payment.

---

# PART 6 — COMPLETE AUTHENTICATION & USER SYSTEM

- **Providers**: Firebase Google Sign-In (`signInWithPopup`) and Firebase Email/Password (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `sendEmailVerification`).
- **Session Lifecycle**: Managed by Firebase Auth `onAuthStateChanged(auth, ...)` in `store.tsx`, loading `users/{uid}` profile and attaching scoped `orders` listener (`where('customerId', '==', uid)`).
- **Guest Checkout**: Fully supported without sign-in; order written with `customerId: 'guest'`, `isGuest: true`, and order ID tracked in browser `guestOrderIds`.
- **Guest Order Claiming**: Triggered automatically on verified Google Sign-In or manually via `verifyAccountEmail()` / `claimGuestOrdersForCurrentUser()`. Executes `claimGuestOrdersInFirestore(uid, email)` which queries `orders` where `customerEmail == email` and batch-updates eligible guest orders (`customerId = uid`, `isGuest = false`, `claimedAt = ISO`).
- **Admin Role Resolution**:
  - `store.tsx` checks Firebase Auth email against hardcoded allowlist (`[REDACTED_ADMIN_EMAIL]`, `admin@mastrotickets.co`) and `users/{uid}.role === 'admin'`.
  - `firestore.rules` checks `admins/{uid}`, `admins/{email}`, `users/{uid}.role == 'admin'`, and the same allowlist.
  - **CRITICAL FLAW**: `AdminPanel.tsx` separately accepts hardcoded credentials (`mastrotickets` / `[REDACTED_HARDCODED_PASSWORD]`), trusts `localStorage.getItem('mastrotickets_admin_auth')`, and grants Admin UI entry to **any** Firebase Email/Password user regardless of role!

---

# PART 7 — COMPLETE BOOKING & TICKET MANAGEMENT LIFECYCLE

1. **Discovery**: Buyer browses `HomePage` / `RacesPage` -> selects `Formula 1 Hungarian Grand Prix 2026` (`/races/hungarian-grand-prix-2026`).
2. **Quantity & Category Selection**: `TicketQuantityModal` captures 1–8 tickets -> filters tickets with `availableQuantity >= qty` -> confirmation dialog displays USD price + fee.
3. **10-Minute Atomic Hold**: `reserveSelectionForCheckout()` releases any prior hold and runs `reserveTicketsTransaction()` -> decrements `tickets.availableQuantity`, creates `reservations/{id}` (`+10m`), starts 1-second countdown banner across `Header`, `CartPage`, and `CheckoutPage`.
4. **Discount Application**: `applyDiscountCode()` checks active status, expiry date, usage limit, and `minSpend` (seeded codes: `BUDAPEST2026`, `HUNGARORING15`, `VIP400`).
5. **Checkout & Issuance**: `createOrder()` validates totals (subtotal + fee - discount + 10% tax), runs simulated 600ms payment, generates order number `MST-2026-NNNNNN`, generates per-seat `IssuedTicket` objects (`MST-HUN26-XXXXXXXX`, barcode `BAR...`, row/seat allocation), commits `completeOrderTransaction()`, logs simulated `EmailJob`, and navigates to `/order-confirmed/:orderId`.
6. **Post-Issuance Management**: Admins can inspect orders, trigger simulated refunds (`refundOrder` restocks tickets and marks passes void), or void/reissue individual passes (`voidTicket`, `reissueTicket` generates a new unique `ticketNumber` and invalidates the old pass).

---

# PART 8 — PAYMENT ARCHITECTURE

- **Active Runtime (`server.ts` + `store.tsx`)**: **100% SIMULATED.**
  - `CheckoutPage.tsx` collects card number, expiry, CVC, and cardholder name in React component state (PCI-DSS risk if exposed to real cards).
  - `store.createOrder()` waits 600ms and generates synthetic `paymentId = 'pi_verified_...'` and `stripeSessionId = 'cs_verified_...'`.
  - No Stripe SDK (`stripe` or `@stripe/stripe-js`) is installed in `package.json`.
  - Refunds (`store.refundOrder`) mutate Firestore/local state only; no payment processor refund API is called.
- **Legacy PHP Runtime (`/backend/src/Services/StripeService.php`)**: Implements real cURL `POST https://api.stripe.com/v1/checkout/sessions` and HMAC-SHA256 `POST /api/v1/webhooks/stripe` fulfillment, but is **inactive** and has a bug where validated discounts are omitted from Stripe line items.

---

# PART 9 — EMAIL & NOTIFICATION SYSTEM

- **Active Runtime**: **SIMULATED / LOG-ONLY.**
  - `/src/services/orderConfirmationTemplate.ts` generates a clean Mobile Ticket Transfer HTML/text email template referencing `https://mastrotickets.co`.
  - `store.tsx` (`createOrder`, `resendConfirmationEmail`, `sendCustomEmail`, `retryEmailJob`, `refundOrder`) creates `EmailJob` records with `status: 'delivered'` and displays `"Email sent via Resend API"`, **without making any HTTP or SMTP call**. No Resend SDK or SMTP mailer exists in `package.json` or `server.ts`.
- **Legacy PHP Runtime (`/backend/src/Services/EmailService.php`)**: Implements real cURL dispatch to `https://api.resend.com/emails`, but reads `MAIL_FROM_ADDRESS` instead of `EMAIL_FROM_ADDRESS` defined in `backend/.env.example`.

---

# PART 10 — CLOUDINARY & MEDIA ARCHITECTURE

- **Active Server Proxy (`/server.ts`)**:
  - `GET /api/uploads/cloudinary/status` checks `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET` (or `CLOUDINARY_URL`).
  - `POST /api/uploads/cloudinary` validates MIME (`JPG/PNG/WebP/AVIF`), 10MB limit, 4 allowed folders (`mastrotickets/{events,tickets,concerts,packages}`), signs parameters with SHA-1 + `CLOUDINARY_API_SECRET`, uploads to Cloudinary, and returns `{ url, publicId, width, height, format, bytes, folder }`.
- **Client Integration (`/src/services/cloudinaryService.ts`, `/src/pages/AdminPanel.tsx`)**:
  - Used in Add Event, Edit Event, Add Ticket, and Edit Ticket modals.
  - Prevents saving while a `blob:` preview URL or active upload is in progress.
  - Falls back to direct unsigned browser upload ONLY if server returns `503` AND both `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are configured.
- **Security Gap**: `POST /api/uploads/cloudinary` lacks authentication, admin check, and rate limiting.

---

# PART 11 — ADMIN PANEL ARCHITECTURE (`/src/pages/AdminPanel.tsx`, 3,284 lines)

11 sidebar modules:
1. **Dashboard Overview**: Gross sales, total bookings, tickets issued, remaining inventory, recent 5 orders *(contains hardcoded `"+18.4% live pace"` badge)*.
2. **Grand Prix Events**: Search, inspect modal, Add/Edit Event modals with Cloudinary banner uploader, Delete Event (cascades associated tickets).
3. **Tickets & Verification**: Two subtabs — *Product Catalog & Stock* (filter by event/category/search, Add/Edit with Cloudinary uploader, Delete) and *Issued Passes Registry* (Verify, Print, Void via `prompt()`, Reissue via `prompt()`).
4. **Inventory Ledger**: Chronological double-entry stock mutation log (`RESERVATION_CREATED`, `PAYMENT_CONFIRMED_DEDUCTED`, `RESERVATION_EXPIRED_RELEASED`, `REFUND_RESTOCKED`, `ADMIN_ADJUSTED`).
5. **Categories & Sectors**: Grid cards + Add/Edit/Delete modals.
6. **Bookings & Orders**: Filter chips (`all`, `confirmed`, `refunded`, `pending_payment`, `email_failed`), search, Order Details modal with barcodes, simulated Resend Email & Refund actions.
7. **Email Writing & Queue**: Outbox table with simulated Retry + Compose Email modal (`custom_announcement`, `race_schedule_update`, `ticket_delivery`, `customer_support`).
8. **Promo & Discounts**: Table with active toggle + Create Discount modal.
9. **Audit Security Log**: Chronological admin action table.
10. **QA Lifecycle Audit**: Runs `qaAuditRunner.ts` (13 hardcoded mock passes + 1 random string loop).
11. **System & API Health**: 4 static hardcoded green cards (no real service health checks).

---

# PART 12 — SECURITY AUDIT SUMMARY

*(Full details and remediations in `MASTRO_TICKETS_SECURITY_AUDIT.md`.)*

- **Critical Findings (8)**:
  1. Unauthenticated 10MB Cloudinary upload proxy (`server.ts:84-166`).
  2. Hardcoded admin credentials (`AdminPanel.tsx:138`) + DevTools-bypassable `localStorage` auth flag (`mastrotickets_admin_auth`).
  3. Any Firebase customer email/password account unlocks Admin UI (`AdminPanel.tsx:145-156`).
  4. World-writable `tickets/{id}` inventory in `firestore.rules:318-323` (enables DoS/overselling).
  5. Client-fabricated payments & unauthenticated `orders/{id}` creation (`firestore.rules:371-393`).
  6. World-writable `reservations`, `emailJobs`, `inventoryLedger`, and `auditLogs` in `firestore.rules`.
  7. Root cause of observed `users/{uid}` `PERMISSION_DENIED`: unpublished `firestore.rules` on external project `mastro-tickets` AND `saveUserProfileDoc` writing `emailVerified`/`authProvider` outside customer `affectedKeys()` whitelist (`firestore.rules:418`).
  8. Unauthenticated full order PII endpoints in legacy PHP `OrderController.php`.
- **High Findings (6)**: Raw card PAN/CVC in React state (PCI-DSS); customer PII in `localStorage`; browser-only reservation expiry (stock leak on tab close); missing rate limiting & security headers in `server.ts`; hardcoded fallback JWT secret in legacy PHP `AuthMiddleware.php`; dev-mode webhook signature bypass in legacy `StripeService.php`.

---

# PART 13 — DEPLOYMENT, DEVOPS & LEGACY PHP INSPECTION

*(Full step-by-step instructions in `MASTRO_TICKETS_DEPLOYMENT_GUIDE.md`.)*

- **Build**: `npm run build` (`vite build` -> `/dist`).
- **Start**: `npm start` executes `node server.ts` — requires Node.js `>= 22.6` native TS type-stripping (or changing to `tsx server.ts` / `esbuild` bundle).
- **Missing DevOps Artifacts**: No `Dockerfile`, no CI/CD workflows, no `firebase.json` / `.firebaserc` / `firestore.indexes.json`, no `/api/health` endpoint on `server.ts`, no graceful shutdown handler, no server-side reservation expiry job.
- **Legacy `/backend/` Verdict**: Completely dormant in active Node runtime, contains 8 SQL-vs-PHP column mismatches, and should either be repaired for Hostinger VPS deployment or decommissioned in favor of migrating Stripe + Resend into `server.ts` / Cloud Functions.

---

# PART 14 — ENVIRONMENT VARIABLES

*(Complete reference table in `MASTRO_TICKETS_ENVIRONMENT_VARIABLES.md`.)*

- **Server (`server.ts`, `vite.config.ts`)**: `PORT`, `NODE_ENV`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`, `DISABLE_HMR`.
- **Frontend (`src/`)**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_DATABASE_ID`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_API_BASE_URL`.
- **Legacy PHP (`/backend/`)**: `APP_ENV`, `APP_DEBUG`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `DB_*`, `JWT_SECRET`, `ADMIN_API_KEY`, `GOOGLE_CLIENT_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME` *(mismatched with `.env.example`'s `EMAIL_FROM_*`)*.

---

# PART 15 — DEPENDENCY ANALYSIS

| Package | Version (`bun.lock`) | Placement | Audit Finding |
|---|---|---|---|
| `react` / `react-dom` | `19.3.1` | `dependencies` | Active |
| `firebase` | `13.4.0` | `dependencies` | Active (Auth, Firestore, Analytics) |
| `express` / `multer` / `dotenv` | `4.22.3` / `2.5.0` / `17.4.2` | `dependencies` | Active (`server.ts`) |
| `lucide-react` | `0.546.0` | `dependencies` | Active |
| `vite` / `@vitejs/plugin-react` / `@tailwindcss/vite` | `8.3.8` / `6.3.0` / `4.3.5` | `dependencies` | Active (Vite dynamically imported in `server.ts` dev mode) |
| `@google/genai` | `2.32.0` | `dependencies` | **UNUSED** — 0 imports anywhere in repo (declared in `metadata.json` only) |
| `eslint`, `@firebase/eslint-plugin-security-rules`, `@types/multer` | `10.15.0` / `0.0.2` / `2.3.0` | `dependencies` | Misplaced in `dependencies` instead of `devDependencies` |
| `motion` | `12.43.0` | `dependencies` | Installed; minimal/no active import usage |
| `autoprefixer` | `10.7.0` | `devDependencies` | Redundant under Tailwind CSS v4 |
| `vitest`, `@firebase/rules-unit-testing` | **MISSING** | Not installed | Required by `/firestore.rules.test.ts` (currently unrunnable) |
| `stripe`, `resend`, `firebase-admin`, `helmet`, `express-rate-limit` | **MISSING** | Not installed | Required for production server-side payments, email, auth & hardening |

---

# PART 16 — SYSTEM & WORKFLOW DIAGRAMS (13 MERMAID DIAGRAMS)

All 13 architecture, sequence, state, ERD, and deployment diagrams are included in full in `MASTRO_TICKETS_ARCHITECTURE.md` (Sections 3.1 through 3.13):
1. System Architecture Diagram
2. Frontend Architecture & State Flow Diagram
3. Backend Architecture Diagram (`server.ts`)
4. Authentication & Guest Order Claiming Sequence
5. Ticket Reservation Lifecycle & Concurrency Diagram
6. Checkout & Payment Processing Flow (Active vs Legacy PHP)
7. Reservation Expiry Lifecycle State Machine
8. Order Fulfillment & Email Dispatch Flow
9. Cloudinary Image Upload Architecture
10. Admin Panel Workflow Diagram
11. Firestore Data Model (ERD)
12. Ticket Verification Flow
13. Deployment Architecture Diagram

---

# PART 17 — FEATURE STATUS MATRIX

*(Complete 28-row matrix with evidence and blockers in `MASTRO_TICKETS_FEATURE_STATUS.md`.)*

- **Fully Implemented (9)**: Budapest/Hungaroring storefront, USD-only formatting, Race Detail + SVG circuit map, Ticket Quantity modal, Firebase Google Auth, Firebase Email/Password Auth, Customer Account Portal, Order Confirmation + QR, Admin Catalog CRUD & Pass Void/Reissue.
- **Partially Implemented (7)**: Atomic Firestore reservation (silent `localStorage` fallback), 10-min countdown (browser-only timer), promo codes (client-only validation), guest order claiming, Cloudinary upload (unauthenticated route), public ticket verification (local-only orders), printable ticket (static fake barcode/QR).
- **Simulated / Mocked (6)**: Active Stripe payment checkout, active Resend email delivery, Admin refunds, Help Page contact form, QA Lifecycle Audit Runner, System Health Dashboard.
- **Broken / Insecure / Unused (6)**: Admin login gate (hardcoded password + bypass + role escalation), `firestore.rules.test.ts` (missing deps), unused components (`ConcertsSection`, `PremiumSection`, `RaceDaySelector`), unused services (`adminService`, `ordersService`), unused `@google/genai`, dormant `/backend/` PHP API (with 8 SQL mismatches).

---

# PART 18 — TESTING, QA & PRODUCTION READINESS ANALYSIS

### 18.1 Existing Test & Lint Assets
- **`npm run lint`** (`tsc --noEmit`): TypeScript compiler check only.
- **`eslint.config.js`**: Configured solely for `firestore.rules` (`@firebase/eslint-plugin-security-rules`), not wired into `package.json` scripts and does not lint `.ts`/`.tsx`.
- **`/firestore.rules.test.ts`** (137 lines): Defines 6 security rule tests (unauthenticated read of events/tickets, denial of unauthenticated event creation, authenticated customer profile creation, denial of role escalation to admin, unauthenticated order creation with valid schema, denial of unauthenticated `auditLogs` read). **Cannot currently execute** because `vitest` and `@firebase/rules-unit-testing` are not installed in `package.json`.
- **`/src/services/qaAuditRunner.ts`** (285 lines): Admin UI "QA Runner" tab — **not a real integration test suite**. 13 of 14 tests return hardcoded `status: 'passed'` objects with static strings; only Test 4 loops 1,000 times generating random `MST-HUN26-*` strings.

### 18.2 Recommended Automated Testing Roadmap
1. **Firestore Rules Unit Tests**: Install `vitest` + `@firebase/rules-unit-testing` and run `firestore.rules.test.ts` against Firebase Local Emulator Suite in CI; add negative tests verifying clients cannot overwrite `tickets.availableQuantity`, forge `orders`, or write `auditLogs`.
2. **Backend API Tests**: Add Supertest + Vitest tests for `/server.ts` verifying auth rejection (`401`/`403`) on `/api/uploads/cloudinary`, MIME/size rejection (`400`), Stripe webhook HMAC verification, and idempotent order fulfillment.
3. **End-to-End Tests (Playwright)**: Cover full buyer journey (Budapest race -> quantity modal -> 10-min hold -> Stripe test checkout -> order confirmation -> ticket verification -> account guest-order claiming) and concurrent 2-browser race condition on last remaining ticket.
4. **Security & Static Analysis**: Wire ESLint (TypeScript + React + Firestore rules) and dependency vulnerability scanning (`npm audit`) into CI before every deployment.
