# Mastro Tickets — Database Schema & Firestore Architecture

> **Active Database**: Cloud Firestore in Firebase project `mastro-tickets` (initialized in `/src/firebase.ts`).
> **Legacy Database**: MySQL 8.0 / MariaDB 10.6 schema defined in `/backend/database/schema.sql` (inactive in current Node.js runtime).

---

## 1. Firebase Initialization & Configuration (`/src/firebase.ts`)

- **Project ID**: `mastro-tickets` (`import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mastro-tickets'`).
- **Database Instance**: Default Firestore database unless `VITE_FIREBASE_DATABASE_ID` is set (`initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, databaseId)`).
- **Web API Key**: Hardcoded fallback in `/src/firebase.ts` line 16 (`[REDACTED_FIREBASE_API_KEY]`), overridable via `VITE_FIREBASE_API_KEY`.
- **Auth Providers Configured**: `getAuth(app)` + `GoogleAuthProvider` (`prompt: 'select_account'`).
- **Analytics**: Lazily initialized via `isSupported().then(ok => ok ? getAnalytics(app) : null)`.
- **Startup Probe**: `testFirestoreConnection()` reads `doc(db, 'test', 'connection')` from server (`getDocFromServer`) in `store.tsx` on mount.

---

## 2. Active Firestore Collections Inventory (13 Domain Collections + 1 Probe)

Collection constants are declared in `/src/services/firestoreRepository.ts` lines 42–56 (`COLLECTIONS`):

| # | Collection Path | Document ID Strategy | Real-Time Subscription (`store.tsx`) | Read Access (`firestore.rules`) | Write Access (`firestore.rules`) |
|---|---|---|---|---|---|
| 1 | `events/{eventId}` | Deterministic slug-like string (e.g., `hungarian-gp-2026`) or `gp-${Date.now()}` | Yes (`subscribeCollection`) | Public (`true`) | Admin only (`isAdmin()`) |
| 2 | `tickets/{ticketId}` | Deterministic string (e.g., `t-hun-supergold-wknd`) or `tkt-${Date.now()}` | Yes (`subscribeCollection`) | Public (`true`) | Create/Delete: Admin only; **Update**: Admin OR **ANY unauthenticated user** if changing only `availableQuantity`, `status`, `updatedAt` (**CRITICAL RISK**) |
| 3 | `categories/{categoryId}` | Deterministic string (`cat-grandstand`) or `cat-${Date.now()}` | Yes (`subscribeCollection`) | Public (`true`) | Admin only |
| 4 | `concerts/{concertId}` | Deterministic string (`conc-hun-fri`, etc.) | Yes (`subscribeCollection`) | Public (`true`) | Admin only |
| 5 | `premiumPackages/{packageId}` | Deterministic string (`pkg-paddock-club`, etc.) | Yes (`subscribeCollection`) | Public (`true`) | Admin only |
| 6 | `discounts/{discountId}` | Deterministic string (`disc-budapest-10`) or `disc-${Date.now()}` | Yes (`subscribeCollection`) | Public (`true`) | Create/Delete: Admin only; Update: Admin OR anyone incrementing `usedCount` by `+1` |
| 7 | `reservations/{reservationId}` | `res-${Date.now()}-${rand}` | Yes (`subscribeCollection`) | Public (`true`) | **ANY unauthenticated user** can `create` or `update` (status/updatedAt/expiresAt); Admin can `delete` |
| 8 | `orders/{orderId}` | `ord-${Date.now()}-${rand}` | Conditional (`isFirebaseAdmin` -> all orders; authenticated user -> `where('customerId', '==', uid)`) | Admin OR owner (`customerId == uid`) OR verified email match for guest orders | **ANY unauthenticated user** can `create` valid order; Update: Admin OR verified user claiming guest order; Delete: Admin only |
| 9 | `users/{userId}` | Firebase Auth `uid` | Fetched on auth state change (`getUserProfileDoc`) | Owner (`uid == userId`) OR Admin | Create: Owner (`role == 'customer'`) OR Admin; Update: Admin OR Owner (limited to `displayName`, `phone`, `country`, `avatarUrl`, `updatedAt`); Delete: Admin only |
| 10 | `admins/{adminId}` | Lowercase email OR Firebase `uid` | Read via `firestore.rules` `exists()` check | Owner (`uid` or lowercase `email`) OR Admin | Admin only |
| 11 | `emailJobs/{jobId}` | `em-${Date.now()}-${rand}` | Only when `isFirebaseAdmin` | Admin only | **ANY unauthenticated user** can `create`; Update/Delete: Admin only |
| 12 | `inventoryLedger/{mutationId}` | `led-${Date.now()}-${rand}` | Only when `isFirebaseAdmin` | Admin only | **ANY unauthenticated user** can `create`; Update/Delete: `false` (immutable) |
| 13 | `auditLogs/{logId}` | `aud-${Date.now()}-${rand}` | Only when `isFirebaseAdmin` | Admin only | **ANY unauthenticated user** can `create`; Update/Delete: `false` (immutable) |
| — | `test/connection` | Fixed `connection` | One-time `getDocFromServer` | Public (`true`) | Denied (`false`) |

---

## 3. Detailed Collection Schemas (Confirmed from TypeScript Interfaces, Repository & Rules)

### 3.1 `events/{eventId}`
- **Confirmed Fields** (`GrandPrixEvent` in `src/types/index.ts`, validated in `firestore.rules:isValidEvent`):
  - `id: string` (required), `slug: string` (required), `name: string` (required), `officialTitle: string` (required)
  - `circuit: string` (required), `location: string` (required), `country: string` (required), `countryCode: string` (required), `flag: string` (required)
  - `dates: string` (required), `startDate: string` (required), `endDate: string` (required)
  - `round: number` (required), `season: number` (required), `timezone: string` (required)
  - `banner: string` (required, URL), `description: string` (required)
  - `status: 'draft' | 'published' | 'archived'` (required)
  - `startingPrice: number` (required, `>= 0`), `featured: boolean` (required)
  - `lapDistance: string`, `numberOfLaps: number`, `raceDistance: string`
  - `lapRecord: { time: string, driver: string, year: number }`
  - `schedule: Array<{ day: string, date: string, sessions: Array<{ name: string, time: string, type: 'practice'|'qualifying'|'sprint'|'race' }> }>`
  - `circuitMapSvg?: string`
- **Schema Drift Warning**: `firebase-blueprint.json` lists `createdAt`/`updatedAt`, but `firestore.rules:isValidEvent` (`hasOnly([...])`) does **not** include `createdAt` or `updatedAt` — writing those fields would fail rules validation!

### 3.2 `tickets/{ticketId}`
- **Confirmed Fields** (`TicketType` in `src/types/index.ts`, validated in `firestore.rules:isValidTicket`):
  - `id: string`, `eventId: string` (FK -> `events`), `category: TicketCategory`, `raceDay: RaceDayOption`
  - `name: string`, `section: string`, `description: string`
  - `price: number`, `originalPrice?: number`, `fee: number`
  - `capacity: number`, `availableQuantity: number`
  - `features: string[]`, `isAssignedSeating: boolean`
  - `deliveryType: 'instant_eticket' | 'official_transfer' | 'mobile_pass'` (note: `firebase-blueprint.json` instead lists `'courier'`)
  - `status: 'available' | 'low_inventory' | 'sold_out'`
  - `maxPerOrder: number`, `imageUrl?: string`, `updatedAt?: string`

### 3.3 `categories/{categoryId}`
- **Confirmed Fields** (`EventCategory`): `id: string`, `name: string`, `slug: string`, `description: string`, `badgeColor?: string`.

### 3.4 `concerts/{concertId}`
- **Confirmed Fields** (`Concert`): `id: string`, `artist: string`, `day: string`, `date: string`, `venue: string`, `genre: string`, `image: string`, `includedWith: string`, `goldenCirclePrice: number`, `description: string`, `time: string`.

### 3.5 `premiumPackages/{packageId}`
- **Confirmed Fields** (`PremiumPackage`): `id: string`, `name: string`, `subtitle: string`, `tier: 'paddock_club' | 'yas_suite' | 'yacht_hospitality' | 'champions_club'`, `price: number`, `duration: string`, `inclusions: string[]`, `image: string`, `availability: 'available' | 'limited' | 'enquire_only'`, `description: string`.

### 3.6 `discounts/{discountId}`
- **Confirmed Fields** (`DiscountCode`): `id: string`, `code: string`, `discountPercent?: number`, `discountAmount?: number`, `minSpend: number`, `maxUsage: number`, `usedCount: number`, `validUntil: string`, `active: boolean`.

### 3.7 `reservations/{reservationId}`
- **Confirmed Fields** (`ReservationRecord` in `firestoreRepository.ts`, validated in `firestore.rules:isValidReservation`):
  - `id: string`, `reservationReference: string` (`RES-XXXXXX`), `eventId: string`, `eventName?: string`, `customerEmail?: string`
  - `items: Array<{ ticketTypeId, ticketName, quantity, unitPrice, fee }>`
  - `subtotal: number`, `serviceFee: number`, `tax: number`, `discount: number`, `total: number`, `currency: 'USD'`
  - `status: 'active' | 'confirmed' | 'expired' | 'released'`
  - `createdAt: string`, `expiresAt: string` (`+10 minutes`), `updatedAt?: string`, `releasedReason?: string`

### 3.8 `orders/{orderId}`
- **Confirmed Fields** (`Order` in `src/types/index.ts`, validated in `firestore.rules:isValidOrder`):
  - `id: string`, `orderNumber: string` (`MST-2026-NNNNNN`), `reservationId?: string`
  - `customerId: string` (`uid` or `'guest'`), `isGuest?: boolean`, `claimedAt?: string`
  - `customerName: string`, `customerEmail: string`, `customerPhone: string`, `customerCountry: string`
  - `billingAddress: { street, city, postalCode, country, taxId? }`
  - `items: OrderItem[]`, `tickets: IssuedTicket[]` (embedded array — not a separate collection!)
  - `subtotal: number`, `serviceFee: number`, `tax: number`, `discount: number`, `discountCode?: string`, `total: number`, `currency: 'USD'`
  - `status: OrderStatus`, `paymentId?: string`, `stripeSessionId?: string`, `paymentMethod: string`, `cardLast4?: string`
  - `createdAt: string`, `confirmedAt?: string`

### 3.9 `users/{userId}`
- **Confirmed Fields** (`UserProfile` in `src/types/index.ts`):
  - `uid: string`, `email: string`, `displayName: string`, `phone?: string`, `country?: string`, `avatarUrl?: string`
  - `role: 'customer' | 'admin' | 'support'`, `emailVerified?: boolean`, `authProvider?: 'password' | 'google' | 'guest'`
  - `createdAt?: string`, `updatedAt?: string` (written by `saveUserProfileDoc`)
- **Rule Conflict Caught**: When an existing non-admin customer signs in or verifies email, `saveUserProfileDoc` uses `setDoc(..., { merge: true })` including `emailVerified` and `authProvider`. If `emailVerified` transitions `false -> true`, `firestore.rules` line 418 (`affectedKeys().hasOnly(['displayName', 'phone', 'country', 'avatarUrl', 'updatedAt'])`) will **reject the write**!

### 3.10 `admins/{adminId}`
- **Confirmed Fields** (`firestore.rules` lines 422–429): `email: string`, `uid?: string`, `role: 'admin'`, `createdAt?: string`.

### 3.11 `emailJobs/{jobId}`
- **Confirmed Fields** (`EmailJob`): `id`, `orderId?`, `recipientEmail`, `recipientName`, `template`, `subject`, `bodyText?`, `status ('delivered'|'pending'|'failed')`, `sentAt`, `errorReason?`, `retryCount`.

### 3.12 `inventoryLedger/{mutationId}`
- **Confirmed Fields** (`InventoryMutation`): `id`, `timestamp`, `type`, `ticketTypeId`, `ticketName`, `quantityDelta`, `previousStock`, `newStock`, `referenceId`, `notes`.

### 3.13 `auditLogs/{logId}`
- **Confirmed Fields** (`AuditLog`): `id`, `actorId`, `actorEmail`, `actorRole`, `action`, `targetRecord`, `timestamp`, `changeSummary`.

---

## 4. Complete Firestore Operations Inventory

| Operation Type | Function / File | Collection(s) | Purpose |
|---|---|---|---|
| `getDocFromServer` | `testFirestoreConnection` (`src/firebase.ts:116`) | `test/connection` | Connectivity probe on mount |
| `getDoc` | `getUserProfileDoc` (`firestoreRepository.ts:288`) | `users` | Load signed-in user profile |
| `getDocs` | `fetchCollectionOnce`, `seedInitialCatalogIfEmpty`, `claimGuestOrdersInFirestore` (`firestoreRepository.ts`) | `events`, `orders`, any collection | One-off reads, empty-DB check, guest order claiming query (`where('customerEmail', '==', email)`) |
| `onSnapshot` | `subscribeCollection` (`firestoreRepository.ts:81`) called in `store.tsx` | `events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts`, `reservations`, `orders`, `emailJobs`, `inventoryLedger`, `auditLogs` | Real-time UI synchronization |
| `setDoc` | `save*Doc` helpers (`firestoreRepository.ts:154-367`) | All 13 collections | Upsert documents (with `stripUndefined` helper) |
| `updateDoc` | `claimGuestOrdersInFirestore` via `writeBatch` | `orders` | Update `customerId`, `isGuest: false`, `claimedAt` |
| `deleteDoc` | `deleteEventDoc`, `deleteTicketDoc`, `deleteCategoryDoc` (`firestoreRepository.ts`) | `events`, `tickets`, `categories` | Admin deletions |
| `writeBatch` | `seedInitialCatalogIfEmpty` (`firestoreRepository.ts:111`), `claimGuestOrdersInFirestore` (`firestoreRepository.ts:310`) | Catalog collections; `orders` | Atomic catalog seeding & batch guest order claiming |
| `runTransaction` | `reserveTicketsTransaction`, `releaseReservationTransaction`, `completeOrderTransaction` (`firestoreRepository.ts:386-606`) | `tickets`, `reservations`, `orders`, `inventoryLedger` | Atomic stock locking, restoration, and order completion |

**Composite Indexes**: No `firestore.indexes.json` file exists in the repository. Current Firestore queries use single-field `where()` filters (`customerId == uid`, `customerEmail == email`), which are satisfied by Firestore's automatic single-field indexes.

---

## 5. Atomic Inventory Transactions (Step-by-Step Analysis)

Implemented in `/src/services/firestoreRepository.ts` lines 386–606. Note: the confirmation transaction is named **`completeOrderTransaction`** (not `confirmOrderTransaction`).

### 5.1 `reserveTicketsTransaction(reservation, items)`
1. Runs `runTransaction(db, async (tx) => { ... })`.
2. **Read Phase**: Reads every `tickets/{ticketTypeId}` document inside the transaction (enforcing Firestore's read-before-write rule).
3. **Validation Phase**: Checks each ticket exists, `status !== 'sold_out'`, and `availableQuantity >= item.quantity`. Throws error if insufficient stock.
4. **Write Phase**:
   - Updates `tickets/{ticketTypeId}`: `availableQuantity = currentStock - qty`, recomputes `status` (`<=0 ? 'sold_out' : <=10 ? 'low_inventory' : 'available'`), sets `updatedAt`.
   - Creates `reservations/{reservation.id}` with `status: 'active'`, `expiresAt` (+10 min).
   - Creates `inventoryLedger/{ledId}` (`type: 'RESERVATION_CREATED'`, `quantityDelta: -qty`).
5. **Consistency & Caveats**:
   - **Genuine Optimistic Concurrency** when Firestore succeeds (concurrent buyers racing for the last seat retry/fail cleanly inside Firestore's transaction isolation).
   - **CRITICAL CAVEAT**: In `store.tsx` lines 1207–1242, if Firestore throws `PERMISSION_DENIED`, `reserveSelectionForCheckout` catches it and falls back to browser-local `createReservation()`, which provides **zero cross-user atomicity**.
   - **Idempotency**: Not enforced at the Firestore transaction level (`reservation.id` is randomly generated per call).

### 5.2 `releaseReservationTransaction(reservationId, reason)`
1. Reads `reservations/{reservationId}`. If missing or `status !== 'active'`, returns `{ released: false }` (**idempotent** against double-release!).
2. Reads all referenced `tickets/{ticketTypeId}` docs.
3. Restores `availableQuantity = Math.min(capacity, currentStock + qty)` and recomputes `status`.
4. Updates `reservations/{reservationId}` -> `status = (reason === 'expired' ? 'expired' : 'released')`.
5. Appends `inventoryLedger` entry (`type: 'RESERVATION_EXPIRED_RELEASED'`, `quantityDelta: +qty`).
6. **CRITICAL CAVEAT**: Triggered **only by client-side `setInterval`** or user navigation. If a user closes their browser tab during the 10-minute window, **no server-side cron or Cloud Function expires the reservation**, leaving stock permanently deducted until manually adjusted!

### 5.3 `completeOrderTransaction(order, reservationId?)`
1. Reads `reservations/{reservationId}` (if provided) and checks whether `status === 'active'`.
2. If reservation was **already active**, does **not** decrement ticket stock again (prevents double deduction!).
3. If **no active reservation** exists, reads all `tickets/{ticketTypeId}`, validates `availableQuantity >= qty`, and decrements stock inside the transaction.
4. Writes `orders/{order.id}` (full order + embedded `tickets: IssuedTicket[]`).
5. Updates `reservations/{reservationId}` -> `status: 'confirmed'`.
6. Appends `inventoryLedger` entry (`type: 'PAYMENT_CONFIRMED_DEDUCTED'`).
7. **CRITICAL CAVEAT**: Runs entirely from the client browser without server-verified payment authorization.

---

## 6. Legacy MySQL Schema (`/backend/database/schema.sql`)

Inactive in current runtime. Defines 14 InnoDB (`utf8mb4_unicode_ci`) tables: `events`, `categories`, `ticket_types`, `discounts`, `reservations`, `reservation_items`, `orders`, `order_items`, `issued_tickets`, `inventory_ledger`, `email_jobs`, `audit_logs`, `admin_users`, `customers`. Several PHP controllers query columns absent from `schema.sql` (detailed in `MASTRO_TICKETS_BACKEND_DOCUMENTATION.md`).
