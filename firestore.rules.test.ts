/**
 * Phase 0 Security Rules Specification Test Suite (Dirty Dozen Payloads)
 * Designed for execution against the Firebase Firestore Emulator (`@firebase/rules-unit-testing`).
 */

export interface AdversarialCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list' | 'delete';
  actor: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on User Profile',
    collection: 'users',
    docId: 'uid_victim',
    operation: 'create',
    actor: { uid: 'uid_attacker', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'uid_victim', email: 'attacker@example.com', displayName: 'Spoof', role: 'customer', phone: '', country: 'Hungary', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Role on User Profile',
    collection: 'users',
    docId: 'uid_attacker',
    operation: 'create',
    actor: { uid: 'uid_attacker', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'uid_attacker', email: 'attacker@example.com', displayName: 'Hacker', role: 'admin', phone: '', country: 'Hungary', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Admin Collection Injection',
    collection: 'admins',
    docId: 'uid_attacker',
    operation: 'create',
    actor: { uid: 'uid_attacker', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'uid_attacker', email: 'attacker@example.com' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified Admin Email Spoofing',
    collection: 'events',
    docId: 'evt-spoof',
    operation: 'create',
    actor: { uid: 'uid_spoof', email: 'adilthengilan123@gmail.com', email_verified: false },
    payload: { id: 'evt-spoof', slug: 'spoof', name: 'Spoof GP', circuit: 'Hungaroring', location: 'Budapest', country: 'Hungary', status: 'published', startingPrice: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Ticket Price Tampering by Customer',
    collection: 'tickets',
    docId: 'tkt-1',
    operation: 'update',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { price: 1, availableQuantity: 9, status: 'available' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Negative Inventory Injection',
    collection: 'tickets',
    docId: 'tkt-1',
    operation: 'update',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { availableQuantity: -5, status: 'sold_out' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Inventory Capacity Overflow',
    collection: 'tickets',
    docId: 'tkt-1',
    operation: 'update',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { availableQuantity: 999999, status: 'available' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Shadow Field Injection on Profile Update',
    collection: 'users',
    docId: 'uid_buyer',
    operation: 'update',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { displayName: 'Buyer', isVerifiedAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unscoped Orders List Scraping',
    collection: 'orders',
    docId: '*',
    operation: 'list',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-User Order PII Read',
    collection: 'orders',
    docId: 'ord_victim_1',
    operation: 'get',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal Reservation State Resurrection',
    collection: 'reservations',
    docId: 'res_expired_1',
    operation: 'update',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { status: 'active' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Oversized Document ID Poisoning',
    collection: 'reservations',
    docId: 'a'.repeat(200),
    operation: 'create',
    actor: { uid: 'uid_buyer', email: 'buyer@example.com', email_verified: true },
    payload: { id: 'a'.repeat(200), eventId: 'evt-1', ticketTypeId: 'tkt-1', quantity: 1, status: 'active' },
    expected: 'PERMISSION_DENIED',
  },
];
