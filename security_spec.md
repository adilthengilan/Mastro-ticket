# MastroTickets Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Admin Authority**: Only verified admins (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or verified bootstrapped admin email `adilthengilan123@gmail.com` with `email_verified == true`) can create, edit, or delete catalog documents (`events`, `tickets`, `categories`, `concerts`, `premiumPackages`, `discounts`) or read operational logs (`emailJobs`, `inventoryLedger`, `auditLogs`).
2. **No Self-Assigned Roles**: Customers creating or updating `/users/{userId}` can NEVER set `role: "admin"` or create documents in `/admins/{userId}`.
3. **PII Isolation**: `/users/{userId}` and `/orders/{orderId}` contain customer PII (email, phone, billing address). Blanket `allow read: if isSignedIn();` is strictly forbidden; reads/lists are scoped to `resource.data.customerId == request.auth.uid` (or `userId == request.auth.uid`) or `isAdmin()`.
4. **Anti-Overselling Inventory Integrity**: Non-admin updates to `/tickets/{ticketId}` are restricted strictly to `affectedKeys().hasOnly(['availableQuantity', 'status', 'updatedAt'])` with `availableQuantity >= 0 && availableQuantity <= resource.data.capacity` — price, fee, capacity, name, and eventId cannot be tampered with by customers.
5. **Terminal State Locking**: Once a reservation reaches `confirmed`, `expired`, `cancelled`, or `released`, non-admins cannot re-activate or modify it. Once an order reaches `refunded` or `cancelled`, non-admins cannot alter its status or financial totals.
6. **Strict Schema & Size Guards**: Every document ID validates `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars), every string enforces `.size()`, and every array is bounded.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (User Profile)**: Authenticated user `uid_A` attempts `setDoc(/users/uid_B, { uid: 'uid_B', role: 'customer', ... })` -> `PERMISSION_DENIED`.
2. **Privilege Escalation (Self-Admin)**: Authenticated user `uid_A` creates `/users/uid_A` with `{ role: 'admin' }` -> `PERMISSION_DENIED`.
3. **Admin Registry Injection**: Authenticated user `uid_A` creates `/admins/uid_A` -> `PERMISSION_DENIED`.
4. **Email Spoofing (Unverified Admin Email)**: Token with `email == 'adilthengilan123@gmail.com'` and `email_verified == false` attempts admin write on `/events/evt-1` -> `PERMISSION_DENIED`.
5. **Catalog Price Tampering**: Customer updates `/tickets/tkt-1` attempting to modify `price: 1` along with `availableQuantity` -> `PERMISSION_DENIED`.
6. **Negative Inventory Injection**: Customer updates `/tickets/tkt-1` with `availableQuantity: -5` -> `PERMISSION_DENIED`.
7. **Capacity Overflow Injection**: Customer updates `/tickets/tkt-1` with `availableQuantity: 999999` exceeding `capacity` -> `PERMISSION_DENIED`.
8. **Shadow Field Injection on User Profile**: User updates `/users/uid_A` with `{ displayName: 'Alice', isVerifiedAdmin: true }` -> `PERMISSION_DENIED`.
9. **Cross-User Order Scraping (`list`)**: Authenticated user `uid_A` queries `collection(db, 'orders')` without `where('customerId', '==', 'uid_A')` -> `PERMISSION_DENIED`.
10. **PII Read Leak (`get`)**: Authenticated user `uid_A` attempts `getDoc(/orders/ord_belonging_to_uid_B)` -> `PERMISSION_DENIED`.
11. **Terminal Reservation Resurrection**: Customer updates `/reservations/res_1` from `status: 'expired'` back to `status: 'active'` -> `PERMISSION_DENIED`.
12. **Resource Poisoning (Oversized ID / String)**: Attacker attempts write with 200-char ID or 10KB `customerName` string -> `PERMISSION_DENIED`.
