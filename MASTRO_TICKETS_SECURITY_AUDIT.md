# Mastro Tickets — Comprehensive Security Audit

> **Audit Methodology**: Static code analysis of `/server.ts`, `/firestore.rules`, `/src/firebase.ts`, `/src/services/store.tsx`, `/src/services/firestoreRepository.ts`, `/src/pages/AdminPanel.tsx`, `/src/pages/CheckoutPage.tsx`, `/index.html`, and legacy `/backend/`.
> **Secret Redaction Notice**: All actual credential strings, API keys, passwords, and hashes found in source files are **redacted** in this report.

---

## 1. Executive Risk Summary

| Severity | Count | Key Themes |
|---|---:|---|
| **CRITICAL** | 8 | Unauthenticated Cloudinary upload proxy; client-side fake payments & order creation; hardcoded admin password + `localStorage` auth bypass + non-admin Firebase login escalation; world-writable Firestore ticket inventory & logs; unauthenticated legacy order PII endpoint |
| **HIGH** | 6 | Raw card PAN/CVC collection in browser React state (PCI-DSS risk); PII persisted unencrypted in `localStorage`; orphaned reservations without server-side TTL expiry; `users/{uid}` update rule conflict on `emailVerified`; missing rate limiting & security headers in `server.ts`; legacy JWT hardcoded fallback secret |
| **MEDIUM** | 5 | Public ticket verification broken in Firestore-only mode; silent client-local fallback on Firestore `PERMISSION_DENIED`; inline `window.fetch` monkey-patch in `index.html`; `window.prompt`/`window.confirm` in `AdminPanel.tsx`; unverified `firestore.rules.test.ts` (missing test deps) |
| **LOW** | 3 | Unused `@google/genai` dependency; residual Abu Dhabi/`GST`/`mastrotickets.ae` strings; static fake health/QA dashboards creating false operational assurance |

---

## 2. Critical Vulnerabilities (Active Codebase)

### CRIT-01: Unauthenticated & Unlimited Cloudinary Image Upload Proxy
- **Location**: `/server.ts` lines 84–166 (`POST /api/uploads/cloudinary`)
- **Finding**: Any unauthenticated internet user can send multipart `POST /api/uploads/cloudinary` requests up to 10 MB per call. The server signs the request with `CLOUDINARY_API_SECRET` and uploads directly into the production Cloudinary account. There is **no Firebase ID token verification**, **no admin role check**, and **no rate limiting**.
- **Impact**: Storage quota exhaustion, bandwidth billing abuse, hosting malicious/inappropriate images under Mastro Tickets' Cloudinary account.
- **Remediation**: Verify a Firebase ID token via `firebase-admin` in Express middleware, enforce admin claim/allowlist, and apply `express-rate-limit`.

### CRIT-02: Hardcoded Client-Side Admin Password & `localStorage` Authentication Bypass
- **Location**: `/src/pages/AdminPanel.tsx` lines 92–94, 138–143; `/src/services/qaAuditRunner.ts` line 213
- **Finding**:
  1. `AdminPanel.tsx` line 138 checks `identifier === 'mastrotickets' && loginPassword === '[REDACTED_HARDCODED_PASSWORD]'` directly in shipped browser JavaScript.
  2. Lines 92–94 initialize `isAdminAuthenticated` from `localStorage.getItem('mastrotickets_admin_auth') === 'true'`. Any user can execute `localStorage.setItem('mastrotickets_admin_auth', 'true')` in DevTools and bypass the Admin Login screen completely.
- **Impact**: Full exposure of the Admin UI and all locally cached orders/logs/analytics. (Note: Firestore writes to admin-only collections remain blocked by `firestore.rules` if deployed, unless the user also compromises an admin Firebase account.)
- **Remediation**: Remove all hardcoded passwords and `localStorage` auth flags; gate AdminPanel strictly on Firebase Auth + custom claims (`request.auth.token.admin == true`) or verified `admins/{uid}` Firestore lookup.

### CRIT-03: Privilege Escalation — Any Customer Firebase Email Account Unlocks Admin Panel UI
- **Location**: `/src/pages/AdminPanel.tsx` lines 145–156
- **Finding**: When a user enters any email address containing `@` into the Admin login form, `handleAdminLogin` calls `loginWithEmail(identifier, loginPassword)` and immediately sets `setIsAdminAuthenticated(true)` and `localStorage.setItem('mastrotickets_admin_auth', 'true')` solely on `res.success` — **never checking `isFirebaseAdmin` or user role**.
- **Impact**: Any self-registered customer can sign into `/admin` using their own customer account.
- **Remediation**: Require verified admin claim/role check before setting admin state.

### CRIT-04: World-Writable Firestore Ticket Stock (`tickets/{ticketId}`)
- **Location**: `/firestore.rules` lines 318–323
- **Finding**: `match /tickets/{ticketId}` allows **any unauthenticated client** to `update` `availableQuantity`, `status`, and `updatedAt` to any integer between `0` and `capacity`.
- **Impact**:
  - **Denial of Service**: A single anonymous script can set `availableQuantity = 0` and `status = 'sold_out'` across every ticket tier in seconds, halting all sales.
  - **Overselling Attack**: An attacker can reset `availableQuantity = capacity`, bypassing inventory limits.
- **Remediation**: Remove public client write access to `tickets`. Perform stock deductions exclusively via a trusted server/Cloud Function using Firebase Admin SDK.

### CRIT-05: Client-Fabricated Payments & Unauthenticated Order Creation (`orders/{orderId}`)
- **Location**: `/src/services/store.tsx` (`createOrder`), `/firestore.rules` lines 371–393
- **Finding**:
  1. In the active Node+Firestore runtime, `store.createOrder()` simulates card payment with a 600ms timeout and fabricates fake `pi_verified_*` / `cs_verified_*` IDs on the client.
  2. `firestore.rules` allows **any unauthenticated client** to `create` an `orders/{orderId}` document with `status: 'confirmed'` and arbitrary `total`, `tickets`, and `paymentId` fields without any Stripe verification.
- **Impact**: Free fraudulent confirmed tickets can be forged directly against Firestore with zero payment.
- **Remediation**: Move order creation and ticket issuance strictly server-side behind verified Stripe Checkout webhooks (`checkout.session.completed`) using Firebase Admin SDK; set `allow create: if false;` on `orders` in `firestore.rules`.

### CRIT-06: World-Writable Reservations, Email Jobs, Inventory Ledger & Audit Logs
- **Location**: `/firestore.rules` lines 362–368, 431–444
- **Finding**: Unauthenticated users can `create` (and for `reservations`, `update`) arbitrary documents in `reservations`, `emailJobs`, `inventoryLedger`, and `auditLogs`.
- **Impact**: Database storage flooding (Firestore billing attack), fake audit trail injection, spoofed inventory ledger entries, and if a worker later consumes `emailJobs`, unauthorized spam relay abuse.
- **Remediation**: Restrict writes to `emailJobs`, `inventoryLedger`, and `auditLogs` to server-side Admin SDK (`allow write: if false;` in client rules).

### CRIT-07: Root Cause of Observed `PERMISSION_DENIED` on `users/{uid}`
- **Location**: `/firestore.rules` lines 407–420; `/src/services/firestoreRepository.ts` lines 259–285 (`saveUserProfileDoc`); `/src/services/store.tsx`
- **Finding**: Two distinct triggers cause `Missing or insufficient permissions` on `users/{uid}`:
  1. **Rules Not Deployed to `mastro-tickets`**: Because Firebase was manually configured using the user's own `mastro-tickets` project config rather than provisioned/deployed through AI Studio's `deploy_firebase`, if `firestore.rules` in this workspace have not been published via Firebase Console or `firebase deploy --only firestore:rules`, the remote project's default/locked rules reject client writes.
  2. **Rule Schema Conflict on Existing User Update**: Even with `/firestore.rules` deployed, line 418 restricts customer `update` to `affectedKeys().hasOnly(['displayName', 'phone', 'country', 'avatarUrl', 'updatedAt'])`. However, `saveUserProfileDoc` writes `{ uid, email, displayName, phone, country, role, emailVerified, authProvider, updatedAt }` via `setDoc(..., { merge: true })`. Whenever `emailVerified` changes (`false -> true`) or `authProvider` changes on an existing non-admin user doc, `affectedKeys()` includes `emailVerified`/`authProvider` and Firestore **rejects the write**.

### CRIT-08: Unauthenticated Full Order PII Exposure in Legacy PHP API
- **Location**: `/backend/src/Controllers/OrderController.php` lines 16–100
- **Finding**: `GET /api/v1/orders/{id}` and `GET /api/v1/orders/session/{sessionId}` have **no authentication or ownership check**, returning customer name, email, phone, billing address, and ticket barcodes to any caller guessing/knowing an order ID or `ORD-YYYY-NNNNNN`.

---

## 3. High & Medium Security Findings

| ID | Severity | Location | Finding |
|---|---|---|---|
| HIGH-01 | **HIGH** | `/src/pages/CheckoutPage.tsx` | Collects raw credit card number, expiry, and CVC in plain React component state (`useState`). If ever used with real cards, this triggers **PCI-DSS SAQ D** compliance scope. Must use Stripe Elements / Stripe Hosted Checkout exclusively. |
| HIGH-02 | **HIGH** | `/src/services/store.tsx` | Persists full `orders` (customer names, emails, phones, billing addresses, barcodes), `emailJobs`, `auditLogs`, and `reservations` to unencrypted browser `localStorage`. On shared/public devices, customer PII remains exposed indefinitely. |
| HIGH-03 | **HIGH** | `/src/services/store.tsx:664-697` | Reservation expiry relies exclusively on a browser-side `setInterval`. Closing the tab abandons `status: 'active'` reservations in Firestore indefinitely, causing permanent stock leakage (inventory DoS). |
| HIGH-04 | **HIGH** | `/server.ts` | Missing `helmet` security headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`) and missing rate limiting across `/api/*`. |
| HIGH-05 | **HIGH** | `/backend/src/Middleware/AuthMiddleware.php:85,103` | Legacy PHP JWT middleware falls back to a hardcoded default secret (`[REDACTED_DEFAULT_JWT_SECRET]`) if `JWT_SECRET` is unset, enabling arbitrary admin JWT forgery. |
| HIGH-06 | **HIGH** | `/backend/src/Services/StripeService.php:97` | Legacy PHP webhook verifier returns `true` unconditionally if `STRIPE_WEBHOOK_SECRET` is empty and `APP_ENV === 'development'`. |
| MED-01 | **MEDIUM** | `/src/services/store.tsx:1207` | On Firestore `PERMISSION_DENIED`, `reserveSelectionForCheckout` silently falls back to browser-local `localStorage` reservation, masking database failures and eliminating multi-user concurrency protection. |
| MED-02 | **MEDIUM** | `/index.html` lines 17–39 | Inline `<script>` monkey-patches `window.fetch` via `Object.defineProperty` to intercept setter calls — non-standard runtime mutation that can interfere with security tooling or polyfills. |
| MED-03 | **MEDIUM** | `/src/pages/AdminPanel.tsx` lines 398, 455, 487, 543, 1312, 1325 | Uses browser-blocking `window.confirm()` and `window.prompt()` dialogs, which are discouraged in iframe/modern SPA environments. |
| MED-04 | **MEDIUM** | `/firestore.rules` line 40 | Admin email allowlist (`[REDACTED_ADMIN_EMAIL]` + `admin@mastrotickets.co`) is duplicated in client code (`store.tsx`) and `firestore.rules`. Should use Firebase Auth Custom Claims (`admin: true`) instead of hardcoded personal emails. |
| MED-05 | **MEDIUM** | `/firestore.rules.test.ts` | Security rules test suite cannot execute because `@firebase/rules-unit-testing` and `vitest` are missing from `package.json`. |

---

## 4. Production Hardening Checklist (Recommended Remediation Order)

1. **Block Direct Client Writes to Financial/Inventory Collections**: Move `tickets` deduction, `reservations` creation/expiry, `orders` creation, `emailJobs`, `inventoryLedger`, and `auditLogs` to a trusted backend (Express with `firebase-admin` or Cloud Functions for Firebase).
2. **Replace Simulated Checkout with Server-Side Stripe Checkout**: Create Stripe Checkout Sessions on `/server.ts` (or Cloud Functions), remove raw card inputs from `CheckoutPage.tsx`, and fulfill orders exclusively via verified Stripe webhooks (`stripe.webhooks.constructEvent`).
3. **Authenticate `/api/uploads/cloudinary`**: Require Firebase ID Token verification (`admin.auth().verifyIdToken`) + admin custom claim + `express-rate-limit`.
4. **Remove Hardcoded Admin Credentials & `localStorage` Admin Bypass**: Delete `AdminPanel.tsx:138` and `mastrotickets_admin_auth`, enforce verified Firebase Admin claims, and check admin status on email login.
5. **Implement Server-Side Reservation Expiry**: Add a scheduled Cloud Function (every 1 minute) or server cron job to expire `reservations` where `status == 'active' && expiresAt < now` and restore `tickets.availableQuantity`.
6. **Deploy Audited `firestore.rules` & Fix `users/{uid}` Update Rule**: Deploy `/firestore.rules` to Firebase project `mastro-tickets` after aligning `saveUserProfileDoc` fields with customer update rules.
7. **Remove Customer PII from `localStorage`**: Keep only cart/UI preferences in `localStorage`; fetch orders/profile strictly from authenticated Firestore sessions.
8. **Connect Real Transactional Email Provider**: Dispatch emails via Resend/SendGrid/Postmark from the backend server or Cloud Function on confirmed webhook fulfillment.
