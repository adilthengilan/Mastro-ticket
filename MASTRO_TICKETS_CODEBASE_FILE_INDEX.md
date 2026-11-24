# Mastro Tickets — Complete Codebase File Index

> **Scope**: Complete recursive inspection of the Mastro Tickets repository as currently implemented in Google AI Studio.
> **Verification Status**: 100% of source, configuration, rule, and legacy backend files were directly inspected. No application source files were modified.

---

## 1. Complete Repository Directory Tree

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
├── public/
│   └── assets/
│       └── aistudio/
│           ├── c40989f7f37e133e5c8f5f03ae7efcc5_a085ea05.webp
│           ├── d0e7fa41e5234eb4511326c4bada0ff7_5cf4ba31.jpg
│           ├── d0e7fa41e5234eb4511326c4bada0ff7_d9e81e7f.jpg
│           ├── mastro-logo_504ab54e.png
│           ├── mastrotickets-design-system_d65400ac.md
│           ├── Paste_October_27__2026_-_6_04PM_7aa0a541
│           └── Screenshot_2026-10-27_182941_7da799b4.png
├── src/
│   ├── App.tsx
│   ├── firebase.ts
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   │   ├── ConcertsSection.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Footer.tsx
│   │   ├── GrandPrixCard.tsx
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── LivePurchaseToast.tsx
│   │   ├── PremiumSection.tsx
│   │   ├── RaceDaySelector.tsx
│   │   ├── ScrollingTrustBanner.tsx
│   │   ├── TicketQuantityModal.tsx
│   │   └── YasConciergeWidget.tsx
│   ├── pages/
│   │   ├── AccountPage.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── AuthPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── HelpPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── OrderConfirmationPage.tsx
│   │   ├── PrintableTicketPage.tsx
│   │   ├── RaceDetailPage.tsx
│   │   ├── RacesPage.tsx
│   │   └── TicketVerificationPage.tsx
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── checkoutService.ts
│   │   ├── cloudinaryService.ts
│   │   ├── eventsService.ts
│   │   ├── firestoreRepository.ts
│   │   ├── orderConfirmationTemplate.ts
│   │   ├── ordersService.ts
│   │   ├── purchaseFeedService.ts
│   │   ├── qaAuditRunner.ts
│   │   ├── store.tsx
│   │   └── ticketsService.ts
│   └── types/
│       ├── api.ts
│       └── index.ts
└── backend/  (LEGACY / INACTIVE PHP REST API FOR HOSTINGER VPS)
    ├── .env.example
    ├── README.md
    ├── composer.json
    ├── firestore.rules
    ├── apache/
    │   └── mastrotickets-api.conf
    ├── database/
    │   └── schema.sql
    ├── public/
    │   ├── .htaccess
    │   └── index.php
    └── src/
        ├── autoload.php
        ├── Config/
        │   ├── Database.php
        │   └── Env.php
        ├── Controllers/
        │   ├── AdminController.php
        │   ├── AuthController.php
        │   ├── CheckoutController.php
        │   ├── EventController.php
        │   ├── HealthController.php
        │   ├── OrderController.php
        │   ├── PurchaseFeedController.php
        │   ├── TicketController.php
        │   └── WebhookController.php
        ├── Http/
        │   ├── Request.php
        │   └── Response.php
        ├── Middleware/
        │   ├── AuthMiddleware.php
        │   └── CorsMiddleware.php
        └── Services/
            ├── EmailService.php
            ├── ReservationService.php
            ├── StripeService.php
            └── TicketNumberGenerator.php
```

---

## 2. File Counts & Line Statistics

| Area | Files | Total Lines | Status |
|---|---:|---:|---|
| Root Config, Rules & Express Server | 12 | ~950+ | Active (Node/Vite/Firestore) |
| Frontend Core (`src/*.{ts,tsx,css}`) | 4 | 460 | Active |
| Frontend Types (`src/types/*`) | 2 | 503 | Active |
| Frontend Services (`src/services/*`) | 13 | 4,265 | Mixed (Active / Optional / Unused) |
| Frontend Components (`src/components/*`) | 12 | 2,035 | Mixed (9 Active, 3 Unused) |
| Frontend Pages (`src/pages/*`) | 12 | 7,780 | Active |
| Public Static Assets (`public/assets/aistudio/*`) | 7 | N/A | Static media & design notes |
| Legacy PHP Backend (`backend/**/*`) | 28 | 3,795 | Legacy / Inactive unless externally hosted |

---

## 3. Root Configuration, Server & Firebase Files

| File Path | Lines | Purpose & Responsibilities | Key Exports / Contents | Dependencies | Used By | Status |
|---|---:|---|---|---|---|---|
| `/server.ts` | 205 | Active Express + Vite dev/prod server on port `3000`. Exposes 2 Cloudinary endpoints and serves SPA fallback from `dist/` in production or Vite middleware in development. | Express server bootstrap (`startServer`), `GET /api/uploads/cloudinary/status`, `POST /api/uploads/cloudinary` | `express`, `multer`, `crypto`, `path`, `fs`, `dotenv/config`, `vite` (dev dynamic import) | `package.json` scripts (`dev`, `start`) | **Active** |
| `/package.json` | 43 | Node/Bun project manifest, scripts (`dev`, `start`, `build`, `preview`, `clean`, `lint`), runtime and dev dependencies. | Scripts & dependency declarations | npm registry | Runtime / Build toolchain | **Active** |
| `/bun.lock` | Lockfile | Resolved dependency graph lockfile (Bun format). | Exact resolved versions for all packages | Bun package manager | Dependency installation | **Active** |
| `/vite.config.ts` | 24 | Vite bundler configuration enabling `@vitejs/plugin-react` and `@tailwindcss/vite`, `@` path alias, HMR disable toggle via `DISABLE_HMR`. | Default Vite config | `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `path` | `server.ts`, `vite build` | **Active** |
| `/tsconfig.json` | 29 | TypeScript compiler configuration (`ES2022`, `react-jsx`, `noEmit: true`, `@/*` alias). | TSConfig | TypeScript `7.0.2` | `npm run lint` (`tsc --noEmit`) | **Active** |
| `/index.html` | 48 | SPA HTML entry point, Google Fonts (`Barlow Condensed`, `Inter`, `JetBrains Mono`), metadata, and an inline `<script>` monkey-patching `window.fetch` property descriptor. | HTML document, `#root` mount | `/src/main.tsx` | Vite dev server & build | **Active** |
| `/metadata.json` | 7 | AI Studio application metadata declaring app name, description, and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. | JSON metadata | None | AI Studio runtime | **Active (Metadata)** |
| `/.env.example` | 23 | Sanitized environment variable template for Cloudinary, Firebase `VITE_*`, and optional `VITE_API_BASE_URL`. | Env var documentation | None | Developers / Deployment | **Active (Template)** |
| `/eslint.config.js` | 15 | ESLint flat config solely targeting `firestore.rules` using `@firebase/eslint-plugin-security-rules`. Does **not** lint `.ts`/`.tsx` files. | Default ESLint flat config | `@firebase/eslint-plugin-security-rules` | ESLint CLI (not wired in `package.json`) | **Partially Used** |
| `/firestore.rules` | 449 | Cloud Firestore security rules for 13 collections + `test/connection` with helper functions and schema validators. Must be manually published to Firebase project `mastro-tickets`. | Firestore rules v2 | Firebase Rules Engine | Firebase `mastro-tickets` (requires deployment) | **Active (Source)** |
| `/firestore.rules.test.ts` | 137 | Unit test suite for `firestore.rules` using `@firebase/rules-unit-testing` and `vitest` — **neither package is installed in `package.json`**. | 6 `it(...)` security rule tests | `@firebase/rules-unit-testing` (missing), `vitest` (missing), `firebase/firestore` | Not executable without adding devDeps | **Broken / Unrunnable** |
| `/firebase-blueprint.json` | 307 | Declarative JSON schema blueprint documenting 12 Firestore entities and collections. Contains minor schema drifts vs `firestore.rules` and `src/types/index.ts`. | Entity & collection definitions | None | Documentation / Reference | **Reference** |
| `/security_spec.md` | 53 | Architecture & security policy notes documenting intended roles, admin allowlist, and collection access matrix. | Security policy prose | None | Documentation / Reference | **Reference** |

---

## 4. Frontend Core & Types (`src/`)

| File Path | Lines | Purpose & Responsibilities | Key Exports | Dependencies | Used By | Status |
|---|---:|---|---|---|---|---|
| `/src/main.tsx` | 6 | React 19 entry point mounting `<App />` into `#root`. | None | `react`, `react-dom/client`, `./App`, `./index.css` | `index.html` | **Active** |
| `/src/index.css` | 106 | Tailwind v4 `@import "tailwindcss";`, `@theme` tokens (`--font-sans`, `--font-sports`, `--font-mono`), brand color CSS variables, marquee animation, print CSS. | Global CSS rules | `tailwindcss` | `src/main.tsx` | **Active** |
| `/src/App.tsx` | 215 | Root layout, `StoreProvider` + `ErrorBoundary` wrapping, History API SPA router (`window.history.pushState`, `popstate`), route matching for all 12 pages, chrome visibility control. | `App` (default export) | All 12 pages, `Header`, `Footer`, `YasConciergeWidget`, `LivePurchaseToast`, `ErrorBoundary`, `StoreProvider` | `src/main.tsx` | **Active** |
| `/src/firebase.ts` | 136 | Initializes Firebase Web App (`mastro-tickets`), Cloud Firestore (`experimentalAutoDetectLongPolling: true`), Firebase Auth (`getAuth`, `GoogleAuthProvider`), Analytics (guarded by `isSupported()`), and exports `handleFirestoreError` & `testFirestoreConnection`. | `app`, `db`, `auth`, `googleProvider`, `firebaseAnalyticsPromise`, `OperationType`, `FirestoreErrorInfo`, `handleFirestoreError`, `testFirestoreConnection`, `firebaseConfig` | `firebase/app`, `firebase/firestore`, `firebase/auth`, `firebase/analytics` | `firestoreRepository.ts`, `store.tsx` | **Active** |
| `/src/types/index.ts` | 309 | Core domain TypeScript interfaces and union types for events, tickets, categories, concerts, premium packages, cart, reservations, orders, issued tickets, users, discounts, email jobs, audit logs, inventory ledger. | `CurrencyCode`, `TicketCategory`, `RaceDayOption`, `GrandPrixEvent`, `TicketType`, `EventCategory`, `Concert`, `PremiumPackage`, `CartItem`, `ActiveReservationHold`, `Order`, `IssuedTicket`, `UserProfile`, `DiscountCode`, `EmailJob`, `AuditLog`, `InventoryMutation`, `TicketVerificationResult`, etc. | None | All pages, components, services | **Active** |
| `/src/types/api.ts` | 196 | DTO interfaces for legacy PHP REST API requests and responses (auth, checkout, reservations, orders, ticket verification, admin dashboard, purchase feed). | `ApiEnvelope`, `AuthResponseData`, `CreateReservationPayload`, `CreateReservationResponse`, `CreateCheckoutSessionPayload`, `CreateCheckoutSessionResponse`, `PublicTicketVerificationData`, `AdminDashboardMetrics`, `PublicRecentPurchaseItem`, etc. | None | `apiClient.ts`, `authService.ts`, `checkoutService.ts`, `eventsService.ts`, `ticketsService.ts`, `ordersService.ts`, `adminService.ts`, `purchaseFeedService.ts` | **Partially Active** |

---

## 5. Frontend Services (`src/services/`)

| File Path | Lines | Purpose & Responsibilities | Key Exports | Dependencies | Used By | Status |
|---|---:|---|---|---|---|---|
| `/src/services/store.tsx` | 2,596 | Monolithic React Context (`StoreProvider` / `useStore`) managing all domain state, Firebase Auth observer, Firestore real-time subscriptions, localStorage persistence, initial seed catalog, cart, atomic reservations, countdown timer, simulated checkout, guest order claiming, and all Admin CRUD actions. | `StoreProvider`, `useStore` | `firebase/auth`, `firebase.ts`, `firestoreRepository.ts`, `orderConfirmationTemplate.ts`, `authService.ts`, `checkoutService.ts`, `eventsService.ts`, `ticketsService.ts`, `types/index.ts` | `App.tsx`, all pages (except `HelpPage`), most components | **Active (Core)** |
| `/src/services/firestoreRepository.ts` | 607 | Cloud Firestore data-access layer: real-time collection listeners (`subscribeCollection`), document CRUD (`saveEventDoc`, `deleteEventDoc`, `saveTicketDoc`, `deleteTicketDoc`, `saveCategoryDoc`, `saveOrderDoc`, `saveReservationDoc`, `saveUserProfileDoc`, `getUserProfileDoc`, `saveDiscountDoc`, `saveEmailJobDoc`, `saveInventoryMutationDoc`, `saveAuditLogDoc`), seeding (`seedInitialCatalogIfEmpty`), guest order claiming (`claimGuestOrdersInFirestore`), and 3 Firestore transactions (`reserveTicketsTransaction`, `releaseReservationTransaction`, `completeOrderTransaction`). | `COLLECTIONS`, `subscribeCollection`, `fetchCollectionOnce`, `seedInitialCatalogIfEmpty`, `save*Doc`, `delete*Doc`, `getUserProfileDoc`, `claimGuestOrdersInFirestore`, `reserveTicketsTransaction`, `releaseReservationTransaction`, `completeOrderTransaction` | `firebase/firestore`, `firebase.ts`, `types/index.ts` | `store.tsx` | **Active (Core)** |
| `/src/services/cloudinaryService.ts` | 150 | Client-side media upload helper. Validates MIME & 10MB limit, uploads via Express `POST /api/uploads/cloudinary` with optional unsigned preset fallback (`VITE_CLOUDINARY_*`), and queries `GET /api/uploads/cloudinary/status`. | `CloudinaryFolder`, `CloudinaryUploadResult`, `checkCloudinaryStatus`, `uploadImageToCloudinary` | `fetch` | `AdminPanel.tsx` | **Active** |
| `/src/services/orderConfirmationTemplate.ts` | 127 | Builds the HTML & plain-text order confirmation email payload (Mobile Ticket Transfer instructions, event summary, billing details). | `OrderConfirmationEmailPayload`, `buildOrderConfirmationEmail` | `types/index.ts` | `store.tsx` | **Active (Template Only)** |
| `/src/services/apiClient.ts` | 212 | Generic HTTP client targeting optional legacy PHP backend (`VITE_API_BASE_URL` or `https://api.<host>` on `mastrotickets.co`/`.ae`). Manages Bearer tokens (`mt_auth_token`, `mt_admin_token`), timeout (10s), and offline detection. | `ApiClientError`, `apiClient` | `fetch`, `localStorage`, `types/api.ts` | `authService.ts`, `checkoutService.ts`, `eventsService.ts`, `ticketsService.ts`, `ordersService.ts`, `adminService.ts`, `purchaseFeedService.ts` | **Optional / Dormant in Dev** |
| `/src/services/checkoutService.ts` | 42 | Wraps legacy PHP API checkout & reservation endpoints (`/api/v1/reservations`, `/release`, `/checkout/session`, `/discounts/validate`). | `checkoutService` | `apiClient.ts`, `types/api.ts` | `store.tsx`, `CheckoutPage.tsx` (only when `apiClient.isRemoteApiConfigured()` is true) | **Optional / Fallback** |
| `/src/services/eventsService.ts` | 16 | Wraps legacy PHP API `/api/v1/events` endpoints. | `eventsService` | `apiClient.ts`, `types/index.ts` | `store.tsx` (when remote API configured) | **Optional / Fallback** |
| `/src/services/ticketsService.ts` | 21 | Wraps legacy PHP API `/api/v1/tickets` and `/verify` endpoints. | `ticketsService` | `apiClient.ts`, `types/index.ts`, `types/api.ts` | `store.tsx` (when remote API configured) | **Optional / Fallback** |
| `/src/services/authService.ts` | 90 | Wraps legacy PHP API customer auth (`/api/v1/auth/*`), `myOrders`, and local token storage (`mt_auth_token`). Only `authService.logout()` is actively called in `store.tsx`. | `authService` | `apiClient.ts`, `types/api.ts`, `types/index.ts` | `store.tsx` (logout cleanup only) | **Mostly Unused / Legacy** |
| `/src/services/purchaseFeedService.ts` | 88 | Fetches `/api/v1/public/recent-purchases` if remote API configured; otherwise derives anonymized recent purchases from local `orders` array or hardcoded Budapest demo purchase items. | `anonymizeBuyerName`, `formatRelativePurchaseTime`, `purchaseFeedService` | `apiClient.ts`, `types/api.ts`, `types/index.ts` | `LivePurchaseToast.tsx` | **Active** |
| `/src/services/qaAuditRunner.ts` | 285 | Admin QA tab runner returning 14 audit test entries. **13 of 14 tests are hardcoded static `passed` stubs**; only Test 4 runs a 1,000-iteration random token uniqueness loop. | `AuditTestResult`, `AuditSuiteResult`, `FullAuditReport`, `runCompleteFunctionalAudit` | None | `AdminPanel.tsx` | **Active (Simulated Stub)** |
| `/src/services/adminService.ts` | 19 | Wraps legacy PHP `/api/v1/admin/*` endpoints. | `adminService` | `apiClient.ts`, `types/api.ts` | **None** | **Unused** |
| `/src/services/ordersService.ts` | 15 | Wraps legacy PHP `/api/v1/orders/*` endpoints. | `ordersService` | `apiClient.ts`, `types/index.ts` | **None** | **Unused** |

---

## 6. Frontend Components (`src/components/`)

| File Path | Lines | Purpose & Responsibilities | Key Exports | Dependencies | Used By | Status |
|---|---:|---|---|---|---|---|
| `/src/components/Header.tsx` | 370 | Sticky top navigation bar with brand logo, nav links, cart badge + active reservation countdown indicator, user auth menu, mobile drawer. | `Header` | `useStore`, `lucide-react` | `App.tsx` | **Active** |
| `/src/components/Footer.tsx` | 201 | Site footer with Budapest Hungaroring branding, quick links, trust badges, support contact details, copyright. | `Footer` | `lucide-react` | `App.tsx` | **Active** |
| `/src/components/Hero.tsx` | 280 | Full-width homepage hero banner highlighting Hungarian Grand Prix 2026 in Budapest with live event countdown timer and search/CTA controls. | `Hero` | `useStore`, `lucide-react` | `HomePage.tsx` | **Active** |
| `/src/components/GrandPrixCard.tsx` | 90 | Reusable race event card showing banner, round/dates, circuit/location, starting price (USD), and navigation CTA. | `GrandPrixCard` | `useStore`, `types/index.ts`, `lucide-react` | `HomePage.tsx`, `RacesPage.tsx` | **Active** |
| `/src/components/TicketQuantityModal.tsx` | 299 | Modal dialog prompting users to select desired ticket quantity (1–8) before entering category selection on `RaceDetailPage`. | `TicketQuantityModal` | `lucide-react` | `RaceDetailPage.tsx` | **Active** |
| `/src/components/ScrollingTrustBanner.tsx` | 229 | Animated horizontal marquee displaying trust badges, Trustpilot/Google rating claims, and Hungaroring buyer-protection highlights. | `ScrollingTrustBanner` | `lucide-react` | `HomePage.tsx` | **Active** |
| `/src/components/LivePurchaseToast.tsx` | 157 | Periodic bottom-left floating toast displaying anonymized recent purchases (or labeled demo activity when no orders exist). | `LivePurchaseToast` | `useStore`, `purchaseFeedService.ts`, `lucide-react` | `App.tsx` | **Active** |
| `/src/components/YasConciergeWidget.tsx` | 162 | Floating bottom-right interactive FAQ/concierge chat drawer with static rule-based Q&A responses (no AI/LLM call). Filename retains legacy `Yas` prefix while UI text is localized to Budapest. | `YasConciergeWidget` | `lucide-react` | `App.tsx` | **Active** |
| `/src/components/ErrorBoundary.tsx` | 105 | React Class ErrorBoundary catching uncaught runtime render errors, parsing Firestore JSON error payloads, and rendering a recovery UI. | `ErrorBoundary` | `react`, `lucide-react` | `App.tsx` | **Active** |
| `/src/components/ConcertsSection.tsx` | 126 | Displays after-race concert lineup from `store.concerts`. | `ConcertsSection` | `useStore`, `lucide-react` | **None** | **Unused** |
| `/src/components/PremiumSection.tsx` | 117 | Displays VIP hospitality packages from `store.premiumPackages`. | `PremiumSection` | `useStore`, `lucide-react` | **None** | **Unused** |
| `/src/components/RaceDaySelector.tsx` | 91 | Race-day filter pill selector (`All`, `3-Day Package`, `Weekend Pass`, `Sunday`, `Saturday`, `Friday`, `Thursday`). | `RaceDaySelector` | `types/index.ts` | **None** | **Unused** |

---

## 7. Frontend Pages (`src/pages/`)

| File Path | Lines | Purpose & Responsibilities | Key Exports | Dependencies | Routes | Status |
|---|---:|---|---|---|---|---|
| `/src/pages/HomePage.tsx` | 357 | Landing page with Hero, ScrollingTrustBanner, featured races, curated Hungaroring Budapest grandstand/hospitality showcase, and trust/FAQ highlights. | `HomePage` | `useStore`, `Hero`, `GrandPrixCard`, `ScrollingTrustBanner` | `/`, fallback | **Active** |
| `/src/pages/RacesPage.tsx` | 225 | Full Formula 1 calendar listing with search, region/status filters, and GrandPrixCard grid. | `RacesPage` | `useStore`, `GrandPrixCard` | `/races` | **Active** |
| `/src/pages/RaceDetailPage.tsx` | 1,097 | Interactive event detail & booking hub: Hungaroring circuit specs, schedule, SVG track map, ticket quantity modal, race-day/category filters, live inventory badges, confirmation modal, and atomic 10-minute reservation trigger. | `RaceDetailPage` | `useStore`, `TicketQuantityModal` | `/races/:slug` | **Active** |
| `/src/pages/CartPage.tsx` | 439 | Shopping cart with active 10-minute reservation countdown, line-item quantity controls, promo code validation, price breakdown (subtotal, fee, 10% tax, discount, total USD), and checkout transition. | `CartPage` | `useStore` | `/cart` | **Active** |
| `/src/pages/CheckoutPage.tsx` | 684 | Guest or authenticated checkout: 10-minute reservation countdown, customer contact & billing form, promo code input, optional remote Stripe redirect OR local simulated card form (plain React state), order confirmation dispatch. | `CheckoutPage` | `useStore`, `checkoutService` | `/checkout` | **Active** |
| `/src/pages/OrderConfirmationPage.tsx` | 435 | Post-purchase receipt & issued e-ticket display with external QR code (`api.qrserver.com`), resend confirmation trigger, print/download links, and optional guest-to-account linking CTA. | `OrderConfirmationPage` | `useStore` | `/order-confirmed`, `/order-confirmed/:orderId`, `/booking-confirmation/:orderId`, `/orders/:orderId/tickets` | **Active** |
| `/src/pages/PrintableTicketPage.tsx` | 233 | Print-optimized e-ticket voucher (`window.print()`) showing ticket metadata, attendee name, row/seat, static visual barcode bars, and static QR icon. | `PrintableTicketPage` | `useStore` | `/tickets/print/:ticketNumber` | **Active** |
| `/src/pages/TicketVerificationPage.tsx` | 295 | Public ticket authenticity enquiry page looking up ticket numbers with masked attendee names (`J*** D***`) and void status check. | `TicketVerificationPage` | `useStore` | `/ticket-enquiry`, `/verify-ticket`, `/verify-ticket/:ticketNumber` | **Active** |
| `/src/pages/AuthPage.tsx` | 470 | Customer authentication page supporting Firebase Google Sign-In, Email/Password Sign-In, Account Registration, and Password Reset. | `AuthPage` | `useStore` | `/login`, `/register`, `/auth` | **Active** |
| `/src/pages/AccountPage.tsx` | 688 | Customer portal: Guest view (local device guest orders + Sign In CTA) and Authenticated view (`My Orders`, `My Tickets`, `Receipts & Invoices`, `My Profile`, email verification & guest-order claiming). | `AccountPage` | `useStore` | `/account` | **Active** |
| `/src/pages/HelpPage.tsx` | 179 | Budapest/Hungaroring FAQ accordion and UI-only concierge contact form (does not persist or transmit messages). | `HelpPage` | `lucide-react` | `/help` | **Active** |
| `/src/pages/AdminPanel.tsx` | 3,284 | Full 11-tab administrative operations portal: Login gate (hardcoded fallback + Firebase Email/Google), Executive Dashboard, Events CRUD (with Cloudinary upload), Tickets & Issued Passes Registry (Void/Reissue + Cloudinary upload), Inventory Ledger, Categories CRUD, Orders & Refunds, Email Queue/Composer, Discounts CRUD, Audit Logs, QA Runner, System Health. | `AdminPanel` | `useStore`, `cloudinaryService`, `qaAuditRunner` | `/admin`, `/admin/*`, `/admin-panel/*` | **Active** |

---

## 8. Legacy / Inactive PHP Backend (`backend/`)

> **Runtime Status**: None of the files in `/backend/` are executed by `server.ts`, `package.json`, or Vite. They constitute an earlier/alternative Hostinger VPS PHP 8.2 + MySQL REST API implementation that is only called by the frontend if `VITE_API_BASE_URL` is configured or the frontend is hosted on `mastrotickets.co` / `mastrotickets.ae`. Several PHP files contain SQL schema column mismatches against `/backend/database/schema.sql`.

| File Path | Lines | Purpose & Status |
|---|---:|---|
| `/backend/README.md` | 139 | Hostinger VPS Apache/MySQL deployment guide (Legacy) |
| `/backend/composer.json` | 21 | PHP 8.2 dependencies (`stripe/stripe-php`, `google/cloud-firestore`, `kreait/firebase-php`, `resend/resend-php`, `cloudinary/cloudinary_php`, `vlucas/phpdotenv`). Note: PHP controllers use raw `curl` and custom `.env` parser rather than these Composer libraries! (Legacy) |
| `/backend/.env.example` | 52 | PHP backend env template (Legacy) |
| `/backend/firestore.rules` | 75 | Superseded older Firestore rules referencing `events/{eventId}/ticketTypes` subcollections and `adminAuditLogs` (Legacy / Superseded by `/firestore.rules`) |
| `/backend/apache/mastrotickets-api.conf` | 50 | Apache 2.4 VirtualHost config for `api.mastrotickets.co` with SSL/HSTS (Legacy) |
| `/backend/public/.htaccess` | 28 | Apache rewrite rules and security headers (Legacy) |
| `/backend/public/index.php` | 140 | PHP front controller & regex router exposing 20 `/api/v1/*` endpoints (Legacy) |
| `/backend/database/schema.sql` | 346 | MySQL/MariaDB 14-table relational schema + seed data (Legacy; column drift vs PHP controllers) |
| `/backend/src/autoload.php` | 30 | PSR-4 autoloader for `Mastrotickets\` namespace (Legacy) |
| `/backend/src/Config/Database.php` | 64 | PDO MySQL singleton connection manager (Legacy) |
| `/backend/src/Config/Env.php` | 85 | Custom `.env` file loader (Legacy) |
| `/backend/src/Http/Request.php` | 104 | HTTP request wrapper (method, URI, headers, Bearer token, JSON body) (Legacy) |
| `/backend/src/Http/Response.php` | 75 | Standardized JSON envelope responder (Legacy) |
| `/backend/src/Middleware/AuthMiddleware.php` | 141 | Custom HS256 JWT + `ADMIN_API_KEY` authentication middleware (Legacy; contains insecure fallback JWT secret) |
| `/backend/src/Middleware/CorsMiddleware.php` | 44 | CORS origin allowlist & security headers (Legacy) |
| `/backend/src/Controllers/HealthController.php` | 41 | `GET /api/v1/health` DB connectivity check (Legacy) |
| `/backend/src/Controllers/EventController.php` | 128 | `GET /api/v1/events`, `GET /api/v1/events/{id}` (Legacy) |
| `/backend/src/Controllers/TicketController.php` | 131 | `GET /api/v1/tickets`, `GET /api/v1/tickets/verify/{ticketNumber}` with PII masking (Legacy) |
| `/backend/src/Controllers/CheckoutController.php` | 246 | Reservations, release, Stripe session creation, discount validation (Legacy) |
| `/backend/src/Controllers/WebhookController.php` | 58 | `POST /api/v1/webhooks/stripe` signature verification & fulfillment trigger (Legacy) |
| `/backend/src/Controllers/OrderController.php` | 102 | `GET /api/v1/orders/{id}`, `GET /api/v1/orders/session/{sessionId}` (Legacy; unauthenticated PII exposure) |
| `/backend/src/Controllers/AuthController.php` | 341 | Customer register/login, Google `tokeninfo` verification, guest order claiming, `myOrders` (Legacy) |
| `/backend/src/Controllers/AdminController.php` | 207 | Admin login, dashboard metrics, paginated orders, ticket voiding (Legacy) |
| `/backend/src/Controllers/PurchaseFeedController.php` | 70 | `GET /api/v1/public/recent-purchases` anonymized feed (Legacy) |
| `/backend/src/Services/ReservationService.php` | 427 | MySQL `SELECT ... FOR UPDATE` 10-minute atomic ticket holds & expiration cleanup (Legacy) |
| `/backend/src/Services/StripeService.php` | 289 | Direct cURL Stripe Checkout Session API, HMAC webhook verification, order/ticket creation (Legacy) |
| `/backend/src/Services/EmailService.php` | 292 | Direct cURL Resend API dispatch & HTML email rendering (Legacy) |
| `/backend/src/Services/TicketNumberGenerator.php` | 56 | Collision-checked `MST-<CODE>-<8CHARS>` & `ORD-YYYY-NNNNNN` generator (Legacy) |

---

## 9. Static Assets & Auxiliary Files (`public/assets/aistudio/`)

| File Path | Type | Usage in Codebase |
|---|---|---|
| `/public/assets/aistudio/mastro-logo_504ab54e.png` | PNG Logo | Actively referenced in `Header.tsx`, `Footer.tsx`, `AuthPage.tsx`, `AdminPanel.tsx`, `PrintableTicketPage.tsx` |
| `/public/assets/aistudio/c40989f7f37e133e5c8f5f03ae7efcc5_a085ea05.webp` | WebP Image | Referenced in UI hero/banners (or static asset archive) |
| `/public/assets/aistudio/d0e7fa41e5234eb4511326c4bada0ff7_5cf4ba31.jpg` | JPEG Image | Referenced as circuit/event visual asset |
| `/public/assets/aistudio/d0e7fa41e5234eb4511326c4bada0ff7_d9e81e7f.jpg` | JPEG Image | Duplicate/variant visual asset |
| `/public/assets/aistudio/Screenshot_2026-10-27_182941_7da799b4.png` | PNG Screenshot | Design reference artifact (unused at runtime) |
| `/public/assets/aistudio/mastrotickets-design-system_d65400ac.md` | Markdown | Design system notes (unused at runtime) |
| `/public/assets/aistudio/Paste_October_27__2026_-_6_04PM_7aa0a541` | Text Artifact | Pasted notes artifact (unused at runtime) |
