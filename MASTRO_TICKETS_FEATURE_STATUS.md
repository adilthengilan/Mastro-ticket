# Mastro Tickets — Complete Feature Status & Production Readiness Matrix

> **Honest Engineering Assessment**: Every feature below is classified strictly according to what is actually executed in the active Node.js + React + Firebase runtime (`server.ts` + `src/`).

## Status Legend
- **FULLY IMPLEMENTED**: Real end-to-end persistence and logic working in active runtime.
- **PARTIALLY IMPLEMENTED**: Core logic exists, but missing server enforcement, edge-case handling, or has known rule/runtime caveats.
- **SIMULATED / MOCKED**: UI works and writes logs/state, but external payment/email/audit execution is faked client-side.
- **LEGACY ONLY**: Implemented only inside inactive `/backend/` PHP code, not executed in active runtime.
- **UNUSED / DEAD CODE**: Exists in source tree but never imported or mounted.
- **BROKEN / MISSING**: Present in repo but fails to run or missing required dependencies/infrastructure.

---

## 1. Master Feature Status Matrix

| Category | Feature | Status | Actual Implementation Evidence | Production Readiness / Blocker |
|---|---|---|---|---|
| **Catalog & Storefront** | Budapest / Hungaroring F1 2026 Event Showcase | **FULLY IMPLEMENTED** | `HomePage.tsx`, `Hero.tsx`, `RacesPage.tsx`, `store.tsx` seed data | Ready (minor residual `GST` / `mastrotickets.ae` copy in 2 files) |
| **Catalog & Storefront** | USD-Only Currency Formatting (`$`) | **FULLY IMPLEMENTED** | `store.tsx` (`currency: 'USD'`, `formatPrice`) | Ready |
| **Catalog & Storefront** | Race Detail Page, Circuit Specs, Schedule & SVG Map | **FULLY IMPLEMENTED** | `RaceDetailPage.tsx` (1,097 lines) | Ready |
| **Catalog & Storefront** | Ticket Quantity Pre-Selection Modal (1–8 seats) | **FULLY IMPLEMENTED** | `TicketQuantityModal.tsx`, `RaceDetailPage.tsx` | Ready |
| **Catalog & Storefront** | After-Race Concerts & VIP Premium Sections | **UNUSED / DEAD CODE** | `ConcertsSection.tsx`, `PremiumSection.tsx`, `RaceDaySelector.tsx` have 0 imports (data still seeded in Firestore) | Mount on pages or remove dead code |
| **Catalog & Storefront** | Live Purchase Toast | **PARTIALLY IMPLEMENTED** | `LivePurchaseToast.tsx`, `purchaseFeedService.ts` — falls back to hardcoded Budapest demo names when no orders exist | Ready (clearly labels demo items) |
| **Catalog & Storefront** | Concierge Chat Widget | **SIMULATED / MOCKED** | `YasConciergeWidget.tsx` — static keyword Q&A rules (no backend or AI) | Functional FAQ widget |
| **Catalog & Storefront** | Help Page Concierge Contact Form | **SIMULATED / MOCKED** | `HelpPage.tsx:41-48` — UI-only `setSubmitted(true)`, sends/saves nothing | Wire to Firestore `supportInquiries` or backend email |
| **Inventory & Cart** | Atomic 10-Minute Ticket Reservation (`runTransaction`) | **PARTIALLY IMPLEMENTED** | `firestoreRepository.ts:reserveTicketsTransaction` uses Firestore `runTransaction`; however `store.tsx:1207` falls back to `localStorage` on permission error | **Blocker**: Move to server-side transaction & lock down `tickets` rule |
| **Inventory & Cart** | 10-Minute Countdown & Auto-Release | **PARTIALLY IMPLEMENTED** | `store.tsx:664-697` browser `setInterval` + `releaseReservationTransaction` | **Blocker**: Closing browser tab orphans active holds; needs server cron/Cloud Function |
| **Inventory & Cart** | Cart & Promo Code Discounts (`BUDAPEST2026`, `HUNGARORING15`, `VIP400`) | **PARTIALLY IMPLEMENTED** | `CartPage.tsx`, `store.tsx:applyDiscountCode` — validated client-side only | Move authoritative validation server-side at payment session creation |
| **Authentication** | Firebase Google Sign-In | **FULLY IMPLEMENTED** | `store.tsx:loginWithGoogle`, `AuthPage.tsx`, `firebase.ts` | Requires `firestore.rules` deployed & domain authorized in Firebase Console |
| **Authentication** | Firebase Email & Password Sign-Up / Sign-In / Reset | **FULLY IMPLEMENTED** | `store.tsx:registerWithEmail`, `loginWithEmail`, `sendPasswordReset` | Fix `users/{uid}` update rule conflict on `emailVerified` transition |
| **Authentication** | Email Verification & Guest Order Claiming | **PARTIALLY IMPLEMENTED** | `store.tsx:verifyAccountEmail`, `claimGuestOrdersInFirestore` (`writeBatch` query) | Works when Firestore rules deployed; watch `users/{uid}` update rule |
| **Authentication** | Customer Account Portal (Orders, Tickets, Receipts, Profile) | **FULLY IMPLEMENTED** | `AccountPage.tsx` (Guest + Authenticated views) | Remove PII persistence from `localStorage` |
| **Checkout & Payments** | Guest & Authenticated Checkout Form | **FULLY IMPLEMENTED** | `CheckoutPage.tsx` | Ready (once raw card fields replaced by Stripe) |
| **Checkout & Payments** | Stripe Payment Processing & Webhooks | **SIMULATED / MOCKED** (Active) / **LEGACY ONLY** (PHP) | Active runtime runs 600ms `setTimeout` + fake `pi_verified_*` IDs; real Stripe cURL exists only in inactive `/backend/src/Services/StripeService.php` | **CRITICAL BLOCKER** for real transactions |
| **Tickets & Verification** | Order Confirmation & External QR Code | **FULLY IMPLEMENTED** | `OrderConfirmationPage.tsx` (uses `api.qrserver.com`) | Replace external QR service with local library (`qrcode`) for privacy/reliability |
| **Tickets & Verification** | Printable E-Ticket Voucher | **PARTIALLY IMPLEMENTED** | `PrintableTicketPage.tsx` — static fake CSS barcode bars & static QR icon; legacy `.ae` URL | Generate real unique Code128/QR per `ticketNumber` |
| **Tickets & Verification** | Public Ticket Verification (`/verify-ticket/:code`) | **PARTIALLY IMPLEMENTED** | `TicketVerificationPage.tsx` searches local `orders` array; public users cannot read other buyers' `orders` in Firestore | **Blocker**: Needs server endpoint or public `ticketVerifications` projection collection |
| **Email & Notifications** | Transactional Order Confirmation & Admin Email Dispatch | **SIMULATED / MOCKED** (Active) / **LEGACY ONLY** (PHP) | Active runtime writes `EmailJob` docs with `status: 'delivered'` and `"via Resend API"` text without calling any email API | **CRITICAL BLOCKER** for real customer ticket delivery |
| **Media & Storage** | Cloudinary Server-Signed Image Upload | **PARTIALLY IMPLEMENTED** | `/server.ts` (`POST /api/uploads/cloudinary`), `cloudinaryService.ts`, `AdminPanel.tsx` (Events & Tickets modals) | **CRITICAL BLOCKER**: Add Firebase Admin auth + rate limiting to upload route |
| **Admin Panel** | Admin Login & Access Control | **BROKEN / INSECURE** | Hardcoded password, `localStorage` bypass, non-admin Firebase email accepted into Admin UI | **CRITICAL BLOCKER**: Enforce Firebase Custom Claims / verified admin session |
| **Admin Panel** | Events, Tickets, Categories, Discounts CRUD | **FULLY IMPLEMENTED** | `AdminPanel.tsx` + `store.tsx` + `firestoreRepository.ts` | Requires authenticated Firebase Admin + published `firestore.rules` |
| **Admin Panel** | Issued Passes Void & Reissue | **FULLY IMPLEMENTED** | `store.tsx:voidTicket`, `reissueTicket` persisted to `orders` + `auditLogs` | Ready once admin auth hardened |
| **Admin Panel** | Order Refunds & Inventory Restocking | **SIMULATED / MOCKED** | `store.tsx:refundOrder` updates order status, restocks tickets, logs audit/email — does **not** issue a real Stripe refund | Connect to real Stripe Refunds API |
| **Admin Panel** | Inventory Ledger & Audit Security Log | **PARTIALLY IMPLEMENTED** | Displayed in `AdminPanel.tsx`, saved to Firestore + `localStorage` | Lock down Firestore write rules to server-only |
| **Admin Panel** | QA Lifecycle Audit Runner | **SIMULATED / MOCKED** | `qaAuditRunner.ts` returns 13 hardcoded `passed` stubs + 1 random string loop | Replace with real Vitest / Playwright automated tests |
| **Admin Panel** | System & API Health Dashboard | **SIMULATED / MOCKED** | `AdminPanel.tsx:1958-2006` renders 4 static green badges without probing services | Wire to real `/api/health` and Firestore/Cloudinary/Stripe probes |
| **Testing & Quality** | Firestore Security Rules Unit Tests | **BROKEN / MISSING** | `firestore.rules.test.ts` imports uninstalled `@firebase/rules-unit-testing` & `vitest` | Install devDeps & run against Firebase Emulator |
| **Testing & Quality** | TypeScript Check (`npm run lint`) | **FULLY IMPLEMENTED** | `tsc --noEmit` | Add ESLint for TypeScript + Vitest unit/E2E suite |

---

## 2. Production Launch Blockers (Must Complete Before Accepting Real Money)

1. **Integrate Real Server-Side Stripe Checkout & Webhooks** in `/server.ts` (or Firebase Cloud Functions) and remove raw card inputs from `CheckoutPage.tsx`.
2. **Integrate Real Transactional Email Dispatch (Resend / SMTP)** on server-side order confirmation and admin email compose.
3. **Secure `/api/uploads/cloudinary`** with Firebase ID token verification, admin role check, and rate limiting.
4. **Harden Admin Authentication** (remove hardcoded password, `localStorage` auth flag, and non-admin email acceptance).
5. **Lock Down & Deploy `firestore.rules`** to Firebase project `mastro-tickets` so clients cannot mutate `tickets`, forge `orders`, or spam `auditLogs`/`emailJobs`/`inventoryLedger`, and fix the `users/{uid}` update rule conflict.
6. **Add Server-Side Reservation Expiry Sweeper** so abandoned 10-minute holds automatically return tickets to inventory.
7. **Fix Public Ticket Verification & Printable Barcodes/QR Codes** so gate staff and buyers can verify any ticket globally and scan unique ticket codes.
