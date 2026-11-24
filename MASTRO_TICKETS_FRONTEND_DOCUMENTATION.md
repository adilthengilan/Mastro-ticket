# Mastro Tickets — Frontend Architecture Documentation

> **Framework**: React `19.3.1` (`^19.0.1`), TypeScript `7.0.2`, Vite `8.3.8`, Tailwind CSS `4.3.5`, `lucide-react` `0.546.0`.
> **Localization & Currency**: Budapest, Hungary (Hungaroring) primary event focus; **USD (`$`) only** (`currency: 'USD'`, `formatPrice` formats USD exclusively).

---

## 1. Routing Architecture (`/src/App.tsx`)

Mastro Tickets does **not** use `react-router-dom`. Instead, `/src/App.tsx` implements a custom History API router using `window.location.pathname`, `window.location.search`, `window.history.pushState`, and a `popstate` listener, passing a `navigate(path: string)` prop down to every page and layout component.

### Registered Route Table
| Path Pattern | Rendered Page | Parameters / Query | Access Level | Layout Chrome (`Header`/`Footer`/`Toast`/`Concierge`) |
|---|---|---|---|---|
| `/` | `HomePage` | None | Public / Guest | Shown |
| `/races` | `RacesPage` | None | Public / Guest | Shown |
| `/races/:slug` | `RaceDetailPage` | `slug` (matched against `event.slug` or `event.id`) | Public / Guest | Shown |
| `/cart` | `CartPage` | None | Public / Guest | Shown |
| `/checkout` | `CheckoutPage` | Optional `?status=cancelled&reservation_id=...` | Public / Guest | Shown |
| `/order-confirmed` | `OrderConfirmationPage` | Optional `?session_id=...` | Public / Guest | Shown |
| `/order-confirmed/:orderId` | `OrderConfirmationPage` | `orderId` | Public / Guest | Shown |
| `/booking-confirmation/:orderId` | `OrderConfirmationPage` | `orderId` | Public / Guest | Shown |
| `/orders/:orderId/tickets` | `OrderConfirmationPage` | `orderId` | Public / Guest | Shown |
| `/tickets/print/:ticketNumber` | `PrintableTicketPage` | `ticketNumber` | Public / Guest | **Hidden** (Print-only view) |
| `/ticket-enquiry` | `TicketVerificationPage` | None | Public / Guest | Shown |
| `/verify-ticket` | `TicketVerificationPage` | None | Public / Guest | Shown |
| `/verify-ticket/:ticketNumber` | `TicketVerificationPage` | `ticketNumber` | Public / Guest | Shown |
| `/login` | `AuthPage` | `initialMode="login"`, `?email=...&next=...` | Public / Guest | Shown |
| `/register` | `AuthPage` | `initialMode="register"`, `?email=...&next=...` | Public / Guest | Shown |
| `/auth` | `AuthPage` | `initialMode="login"`, `?email=...&next=...` | Public / Guest | Shown |
| `/account` | `AccountPage` | None | Guest Portal + Authenticated Dashboard | Shown |
| `/help` | `HelpPage` | None | Public / Guest | Shown |
| `/admin`, `/admin/*`, `/admin-panel/*` | `AdminPanel` | Maps subpaths (`/orders`, `/bookings`, `/tickets`, `/orders/:id`) to `initialTab` & `initialOrderId` | Client-side Admin Login Gate | **Hidden** |
| `*` (Fallback) | `HomePage` | None | Public | Shown |

**SPA Fallback**: Handled by Vite middleware in development and `app.get('*', ...)` serving `dist/index.html` in `/server.ts` production mode.

---

## 2. Centralized State Management (`/src/services/store.tsx`)

`StoreProvider` wraps the entire app inside `ErrorBoundary` in `/src/App.tsx`. It exposes ~65 state fields and action methods via `useStore()`.

### State Domains
1. **Catalog State**: `events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts` (seeded with default Budapest/Hungaroring 2026 + global F1 calendar data if Firestore `events` is empty).
2. **Commerce & Reservation State**:
   - `cart: CartItem[]`
   - `activeReservation: ActiveReservationHold | null`
   - `reservationSecondsLeft: number` (computed every 1s via `setInterval`)
   - `reservations: ReservationRecord[]`
   - `appliedDiscount: DiscountCode | null`
   - `orders: Order[]`, `lastOrder: Order | null`, `guestOrderIds: string[]`
3. **Authentication & Profile State**:
   - `currentUser: UserProfile` (defaults to Guest Customer when signed out)
   - `isAuthenticated: boolean`
   - `isFirebaseAdmin: boolean` (derived from Firebase Auth email allowlist + `users/{uid}.role === 'admin'`)
   - `firebaseAuthEmail: string | null`
   - `lastClaimedNotice: string | null`
4. **Operational & Admin Logs**:
   - `emailJobs: EmailJob[]`
   - `inventoryLedger: InventoryMutation[]`
   - `auditLogs: AuditLog[]`
   - `firestoreConnected: boolean`, `firestoreError: string | null`

### Persistence & LocalStorage Keys
`store.tsx` synchronizes state to browser `localStorage` under `mastrotickets_*` keys (including `events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts`, `cart`, `orders`, `reservations`, `activeReservation`, `guestOrderIds`, `emailJobs`, `inventoryLedger`, `auditLogs`, `user`, `currency`) plus `mastrotickets_admin_auth` in `AdminPanel.tsx` and `mt_auth_token` / `mt_admin_token` in `apiClient.ts`.
> **Privacy Note**: Persisting `orders`, `emailJobs`, and `auditLogs` into `localStorage` stores customer PII (names, emails, phones, billing addresses) in unencrypted browser storage.

### Pricing & Currency Rules
- Currency is locked to **`USD` (`$`)**.
- `calculateCartTotals()` computes:
  - `subtotal = sum(ticket.price * quantity)`
  - `serviceFee = sum(ticket.fee * quantity)`
  - `discountAmount` (from active `appliedDiscount` percent or fixed amount, if `subtotal >= minSpend`)
  - `tax = Math.round((subtotal + serviceFee - discountAmount) * 0.10 * 100) / 100` (10% VAT/tax)
  - `total = subtotal + serviceFee - discountAmount + tax`

---

## 3. Page-by-Page Breakdown (All 12 Pages)

### 3.1 `HomePage.tsx` (`/`)
- **Audience**: Public visitors & F1 fans.
- **Functionality**: Renders `Hero`, `ScrollingTrustBanner`, featured Hungarian Grand Prix 2026 showcase with direct links to popular Budapest grandstands/VIP categories, upcoming race grid (`GrandPrixCard`), and buyer-protection overview.
- **Components Used**: `Hero`, `ScrollingTrustBanner`, `GrandPrixCard`.
- **Services**: `useStore()` (`events`, `tickets`, `formatPrice`).

### 3.2 `RacesPage.tsx` (`/races`)
- **Audience**: Public visitors.
- **Functionality**: Searchable and filterable Formula 1 2026 race calendar grid displaying all `published` events with Budapest/Hungary featured first.
- **Components Used**: `GrandPrixCard`.
- **Services**: `useStore()` (`events`).

### 3.3 `RaceDetailPage.tsx` (`/races/:slug`)
- **Audience**: Prospective buyers.
- **Functionality**:
  - Displays event banner, circuit technical specs (lap distance, laps, race distance, lap record), weekend session schedule, and interactive SVG circuit map.
  - Prompts buyer for desired ticket quantity (`TicketQuantityModal`, 1–8 seats) before displaying available categories meeting that quantity.
  - Category & race-day filter tabs, live remaining stock indicators, inclusions list, and a confirmation modal showing subtotal + service fee breakdown.
  - Clicking **"Reserve & Continue to Checkout"** calls `reserveSelectionForCheckout()` (atomic 10-minute Firestore reservation) and navigates to `/checkout`.
- **Components Used**: `TicketQuantityModal`.
- **Services**: `useStore()`.

### 3.4 `CartPage.tsx` (`/cart`)
- **Audience**: Buyers reviewing selected passes.
- **Functionality**: Displays active 10-minute reservation countdown banner, cart line items with quantity adjustment/removal, promo code input (`applyDiscountCode` — supports codes like `BUDAPEST2026`, `HUNGARORING15`, `VIP400`), itemized USD total breakdown, and navigation to `/checkout`.
- **Services**: `useStore()`.

### 3.5 `CheckoutPage.tsx` (`/checkout`)
- **Audience**: Guest and authenticated buyers.
- **Functionality**:
  - Enforces active cart/reservation presence and renders live 10-minute countdown banner (auto-releases on expiry).
  - Handles Stripe cancel return URL (`?status=cancelled&reservation_id=...`) by releasing reservation.
  - Collects customer name, email, phone, country, billing address, optional tax ID, and promo code.
  - **Dual Payment Path**:
    - If `apiClient.isRemoteApiConfigured()` is true -> invokes `checkoutService.createSession()` to redirect to Stripe Checkout.
    - Otherwise (**active default path**) -> displays a credit card form (`cardNumber`, `expiry`, `cvc`, `cardName` in React state) and calls `store.createOrder()` which **simulates payment processing** (600ms delay, fabricated `pi_verified_*` ID) and executes `completeOrderTransaction()` in Firestore.
- **Services**: `useStore()`, `checkoutService`.

### 3.6 `OrderConfirmationPage.tsx` (`/order-confirmed/:orderId`, `/booking-confirmation/:orderId`, `/orders/:orderId/tickets`)
- **Audience**: Buyers post-checkout.
- **Functionality**: Displays confirmed order summary, payment reference, itemized cost breakdown, issued e-tickets with external QR code (`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=...`), **"Resend Email"** button (logs simulated email job), print/voucher buttons, and a **"Create Account to Save Orders"** prompt for guest buyers.
- **Residual Localization Issue**: Line 301 displays `"Gate Open: 08:00 GST"` (legacy Gulf Standard Time string instead of Budapest CET/CEST).

### 3.7 `PrintableTicketPage.tsx` (`/tickets/print/:ticketNumber`)
- **Audience**: Ticket holders printing passes.
- **Functionality**: Dedicated print layout (hides site header/footer) with `window.print()` trigger, ticket metadata, attendee name, row/seat, and verification URL.
- **Implementation Caveats**:
  - Renders a **hardcoded static CSS bar array** as the barcode (visually identical for every ticket!).
  - Renders a **static Lucide `<QrCode />` icon** instead of an actual scannable QR code.
  - Line 212 displays legacy domain `mastrotickets.ae/verify-ticket/...`.

### 3.8 `TicketVerificationPage.tsx` (`/ticket-enquiry`, `/verify-ticket/:ticketNumber`)
- **Audience**: Public ticket verifiers / gate staff.
- **Functionality**: Input form + deep-link lookup via `verifyTicketByNumber(code)`. Masks attendee names (`J*** D***`) and displays validity status (`VALID`, `VOIDED`, or `NOT FOUND`).
- **Architectural Limitation**: Queries `orders` loaded in local/context state. Because `firestore.rules` restricts reading `orders` to the order owner or an admin, an unauthenticated third party checking someone else's ticket on another device will get "Not Found" in the Firestore-only architecture!

### 3.9 `AuthPage.tsx` (`/login`, `/register`, `/auth`)
- **Audience**: Unauthenticated customers.
- **Functionality**: Segmented mode switcher (`Sign In`, `Create Account`, `Reset Password`), Firebase Google Sign-In button, and Email/Password form with confirmation validation. Redirects to `?next=...` (default `/account`) on success.

### 3.10 `AccountPage.tsx` (`/account`)
- **Audience**: Guest buyers & authenticated customers.
- **Functionality**:
  - **Guest View**: Prompts Sign In / Create Account and lists recent guest orders placed on the current browser (`guestOrderIds`).
  - **Authenticated View**: 4 tabs — `My Orders` (order list, download tickets, resend email), `My Tickets` (issued passes grid with print links), `Receipts & Invoices` (`INV-*` list with `window.print()`), `My Profile` (update `displayName`, `phone`, `country`). Includes email verification banner and manual **"Check for Guest Orders"** claiming trigger.

### 3.11 `HelpPage.tsx` (`/help`)
- **Audience**: Public visitors.
- **Functionality**: 6-item Hungaroring/Budapest FAQ accordion, Budapest concierge desk info (`concierge@mastrotickets.co`, `+36 1 550 7400`), and a contact inquiry form.
- **Implementation Caveat**: `handleContactSubmit` is **UI-only** — it displays a green confirmation banner and clears the textarea without saving to Firestore or sending any HTTP request or email.

### 3.12 `AdminPanel.tsx` (`/admin`, `/admin/*`, `/admin-panel/*`)
- **Audience**: Operations administrators.
- **Functionality**: 11 sidebar modules (Dashboard Overview, Grand Prix Events CRUD with Cloudinary upload, Tickets Catalog + Issued Passes Registry with Void/Reissue + Cloudinary upload, Inventory Ledger, Categories CRUD, Bookings & Orders with Refund/Resend/Details modal, Email Writing & Queue, Promo & Discounts CRUD, Audit Security Log, QA Lifecycle Audit Runner, System & API Health).
- **Critical Findings**: Hardcoded client-side credentials fallback, `localStorage` auth bypass, non-admin Firebase email login accepted into admin UI, static fake health cards, and stubbed QA runner (all detailed in `MASTRO_TICKETS_SECURITY_AUDIT.md`).

---

## 4. Reusable Components Reference (`src/components/`)

| Component | Props | Internal State | External/Store Dependencies | Status |
|---|---|---|---|---|
| `Header.tsx` | `{ currentPath, navigate }` | `mobileMenuOpen`, `accountMenuOpen` | `useStore` (cart count, countdown, auth, logout) | **Active** |
| `Footer.tsx` | `{ navigate }` | None | `lucide-react` | **Active** |
| `Hero.tsx` | `{ navigate }` | `timeLeft` (1s countdown to Hungarian GP 2026), `searchQuery` | `useStore` (`events`) | **Active** |
| `GrandPrixCard.tsx` | `{ event, navigate }` | None | `useStore` (`formatPrice`) | **Active** |
| `TicketQuantityModal.tsx` | `{ isOpen, eventName, initialQuantity, maxQuantity, onConfirm, onClose }` | `selectedQty` | `lucide-react` | **Active** |
| `ScrollingTrustBanner.tsx` | None | None | `lucide-react` | **Active** |
| `LivePurchaseToast.tsx` | `{ currentPath }` | `items`, `currentIndex`, `visible`, `dismissed` | `useStore` (`orders`), `purchaseFeedService` | **Active** |
| `YasConciergeWidget.tsx` | `{ navigate }` | `isOpen`, `messages`, `input` | Static keyword FAQ matcher (no LLM) | **Active** |
| `ErrorBoundary.tsx` | `{ children }` | `hasError`, `error` | React Class Component | **Active** |
| `ConcertsSection.tsx` | `{ navigate }` | None | `useStore` (`concerts`, `formatPrice`) | **Unused** |
| `PremiumSection.tsx` | `{ navigate }` | None | `useStore` (`premiumPackages`, `formatPrice`) | **Unused** |
| `RaceDaySelector.tsx` | `{ selectedDay, onSelectDay }` | None | `types/index.ts` | **Unused** |
