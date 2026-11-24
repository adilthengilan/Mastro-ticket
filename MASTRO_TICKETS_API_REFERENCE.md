# Mastro Tickets — Complete API Reference

> **Important Architectural Distinction**:
> - The **active Express server (`/server.ts`)** exposes **only 2 HTTP API endpoints** (both for Cloudinary media upload). All events, tickets, reservations, orders, users, discounts, email logs, inventory ledger, and audit logs in the active application use **direct client-side Firebase/Firestore SDK calls** (no REST API).
> - A **legacy PHP REST API (`/backend/public/index.php`)** defines 20 `/api/v1/*` endpoints, which are **inactive** unless separately deployed on an external PHP/Apache server and linked via `VITE_API_BASE_URL`.

---

## 1. Active Express Server Endpoints (`/server.ts`)

Base URL: Same origin (`http://localhost:3000` in dev, or deployed Node host).

### 1.1 `GET /api/uploads/cloudinary/status`
- **File Location**: `/server.ts` lines 74–82
- **Status**: **Active**
- **Purpose**: Reports whether server-side Cloudinary credentials are configured and advertises upload constraints to `AdminPanel.tsx`.
- **Authentication / Authorization**: **None** (public).
- **Request Parameters / Body**: None.
- **Success Response (`200 OK`)**:
```json
{
  "configured": true,
  "cloudName": "your_cloud_name",
  "allowedFolders": [
    "mastrotickets/events",
    "mastrotickets/tickets",
    "mastrotickets/concerts",
    "mastrotickets/packages"
  ],
  "maxBytes": 10485760
}
```
- **Error Responses**: None explicit.
- **External Dependencies**: Reads `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, or `CLOUDINARY_URL` from `process.env`.

---

### 1.2 `POST /api/uploads/cloudinary`
- **File Location**: `/server.ts` lines 84–166
- **Status**: **Active**
- **Purpose**: Accepts a multipart image upload, validates MIME type and size, computes a server-side SHA-1 Cloudinary signature, uploads the image to Cloudinary, and returns the CDN asset URL and metadata.
- **Authentication / Authorization**: **NONE — CRITICAL SECURITY VULNERABILITY** (no Firebase ID token check, no admin verification, no rate limiting).
- **Content-Type**: `multipart/form-data`
- **Request Body Fields**:
  - `file` (required, binary): Image file (`image/jpeg`, `image/png`, `image/webp`, `image/avif`), max `10 MB` (`10 * 1024 * 1024` bytes), max 1 file.
  - `folder` (optional, string): Defaults to `mastrotickets/events`. Must be one of `mastrotickets/events`, `mastrotickets/tickets`, `mastrotickets/concerts`, `mastrotickets/packages`.
- **Success Response (`201 Created`)**:
```json
{
  "url": "https://res.cloudinary.com/<cloud>/image/upload/v.../asset.jpg",
  "publicId": "mastrotickets/events/abc123",
  "width": 1600,
  "height": 900,
  "format": "jpg",
  "bytes": 245120,
  "folder": "mastrotickets/events"
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing file (`No image file provided.`), invalid folder (`Invalid upload folder.`), invalid MIME type, or Multer file-size error (`LIMIT_FILE_SIZE`).
  - `503 Service Unavailable`: Cloudinary env vars missing (`Cloudinary is not configured on the server...`).
  - `502 Bad Gateway`: Cloudinary upstream error or unexpected network failure.
- **External Dependencies**: `POST https://api.cloudinary.com/v1_1/${cloudName}/image/upload`.

---

## 2. Direct Firebase / Firestore Client Operations (No REST Endpoint)

In the active application, the following operations do **not** hit `/server.ts`; they execute directly from the browser via `firebase/auth` and `firebase/firestore`:

| Domain | Client Service Method | Underlying SDK Call |
|---|---|---|
| Auth (Google) | `store.loginWithGoogle()`, `store.signInAdminWithGoogle()` | `signInWithPopup(auth, googleProvider)` |
| Auth (Email) | `store.registerWithEmail()`, `store.loginWithEmail()`, `store.sendPasswordReset()` | `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `sendEmailVerification` |
| Catalog Read | `store.tsx` subscriptions | `onSnapshot(collection(db, 'events'|'tickets'|'categories'|'concerts'|'premiumPackages'|'discounts'))` |
| Atomic Reserve | `firestoreRepository.reserveTicketsTransaction()` | `runTransaction(db, ...)` on `tickets`, `reservations`, `inventoryLedger` |
| Atomic Release | `firestoreRepository.releaseReservationTransaction()` | `runTransaction(db, ...)` on `reservations`, `tickets`, `inventoryLedger` |
| Order Complete | `firestoreRepository.completeOrderTransaction()` | `runTransaction(db, ...)` on `orders`, `reservations`, `tickets`, `inventoryLedger` |
| Guest Claiming | `firestoreRepository.claimGuestOrdersInFirestore()` | `getDocs(query(orders, where('customerEmail', '==', email)))` + `writeBatch` |
| Admin CRUD | `saveEventDoc`, `deleteEventDoc`, `saveTicketDoc`, `deleteTicketDoc`, `saveCategoryDoc`, `deleteCategoryDoc`, `saveDiscountDoc`, `saveOrderDoc`, `saveEmailJobDoc`, `saveAuditLogDoc` | `setDoc` / `deleteDoc` |

---

## 3. Legacy / Inactive PHP REST API Inventory (`/backend/public/index.php`)

> **Status**: **LEGACY / INACTIVE** in the active Node.js runtime. Only reached if `VITE_API_BASE_URL` is configured or app is deployed on `mastrotickets.co` / `mastrotickets.ae` with an Apache/PHP API host. All responses use `{ success: boolean, message: string, data?: any, code?: string, errors?: object, meta?: object }`.

| Method | Endpoint | Controller::Method | Auth / Authz | Purpose | Frontend Caller |
|---|---|---|---|---|---|
| `GET` | `/api/v1/health` (or `/health`) | `HealthController::check` | Public | MySQL `SELECT 1` health check | None |
| `GET` | `/api/v1/public/recent-purchases` | `PurchaseFeedController::recent` | Public | Anonymized last 20 paid/confirmed orders | `purchaseFeedService.ts` (optional) |
| `POST` | `/api/v1/auth/register` | `AuthController::register` | Public | Register customer in MySQL `customers`, return 7-day HS256 JWT | `authService.ts` (unused) |
| `POST` | `/api/v1/auth/login` | `AuthController::login` | Public | Customer login + claim guest orders if verified | `authService.ts` (unused) |
| `POST` | `/api/v1/auth/google` | `AuthController::googleSignIn` | Public | Verify Google `idToken` via `oauth2.googleapis.com/tokeninfo`, return JWT | `authService.ts` (unused) |
| `POST` | `/api/v1/auth/claim-guest-orders` | `AuthController::claimGuestOrders` | Bearer JWT | Claim guest orders matching verified email | `authService.ts` (unused) |
| `GET` | `/api/v1/orders/mine` | `AuthController::myOrders` | Bearer JWT | Fetch customer's orders (`LIMIT 100`) | `authService.ts` (unused) |
| `GET` | `/api/v1/events` | `EventController::index` | Public | List events (`?status=published\|all`) | `eventsService.ts` (optional) |
| `GET` | `/api/v1/events/{id}` | `EventController::show` | Public | Fetch event + associated `ticket_types` | `eventsService.ts` (unused) |
| `GET` | `/api/v1/tickets` | `TicketController::index` | Public | Reclaim expired holds, list tickets (`?eventId&category&raceDay&minQuantity`) | `ticketsService.ts` (optional) |
| `GET` | `/api/v1/tickets/verify/{ticketNumber}` | `TicketController::verify` | Public | Verify ticket validity with masked attendee name | `ticketsService.ts` (unused) |
| `POST` | `/api/v1/reservations` | `CheckoutController::createReservation` | Public | Atomic 10-min MySQL `FOR UPDATE` reservation (`idempotencyKey`, `previousReservationId`) | `checkoutService.ts` (optional) |
| `POST` | `/api/v1/reservations/{id}/release` | `CheckoutController::releaseReservation` | Public | Idempotent release of active hold back to `ticket_types` | `checkoutService.ts` (optional) |
| `POST` | `/api/v1/checkout/session` | `CheckoutController::createSession` | Public | Reuse/create hold, validate discount, create Stripe Checkout Session | `checkoutService.ts` (optional) |
| `POST` | `/api/v1/discounts/validate` | `CheckoutController::validateDiscount` | Public | Validate promo code against `discounts` table | `checkoutService.ts` (unused) |
| `POST` | `/api/v1/webhooks/stripe` | `WebhookController::handleStripe` | Stripe HMAC-SHA256 | Verify `Stripe-Signature`, fulfill `checkout.session.completed`, issue tickets, queue Resend email | Stripe servers |
| `GET` | `/api/v1/orders/{id}` | `OrderController::show` | **NONE (Security Risk)** | Fetch full order + PII + issued tickets by ID/orderNumber | `ordersService.ts` (unused) |
| `GET` | `/api/v1/orders/session/{sessionId}` | `OrderController::bySession` | **NONE (Security Risk)** | Fetch order by `stripe_session_id` | `ordersService.ts` (unused) |
| `POST` | `/api/v1/admin/login` | `AdminController::login` | Public | Admin email/password login -> 7-day JWT | `adminService.ts` (unused) |
| `GET` | `/api/v1/admin/dashboard` | `AdminController::dashboard` | Admin Bearer JWT / `ADMIN_API_KEY` | Aggregated revenue (USD), orders, tickets sold, holds | `adminService.ts` (unused) |
| `GET` | `/api/v1/admin/orders` | `AdminController::orders` | Admin Bearer JWT / `ADMIN_API_KEY` | Paginated orders (`?page&limit&search`) | `adminService.ts` (unused) |
| `POST` | `/api/v1/admin/tickets/void` | `AdminController::voidTicket` | Admin Bearer JWT / `ADMIN_API_KEY` | Void ticket & log to `audit_logs` | `adminService.ts` (unused) |
