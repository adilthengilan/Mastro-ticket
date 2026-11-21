import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  formatFirestoreError,
  handleFirestoreError,
  isPermissionDeniedError,
} from '../firebase';
import {
  GrandPrixEvent,
  TicketType,
  EventCategory,
  Concert,
  PremiumPackage,
  DiscountCode,
  BookingReservation,
  Order,
  EmailJob,
  InventoryMutation,
  AuditLog,
  UserProfile,
  CartItem,
} from '../types';

export const COLLECTIONS = {
  EVENTS: 'events',
  TICKETS: 'tickets',
  CATEGORIES: 'categories',
  CONCERTS: 'concerts',
  PREMIUM_PACKAGES: 'premiumPackages',
  DISCOUNTS: 'discounts',
  RESERVATIONS: 'reservations',
  ORDERS: 'orders',
  EMAIL_JOBS: 'emailJobs',
  INVENTORY_LEDGER: 'inventoryLedger',
  AUDIT_LOGS: 'auditLogs',
  USERS: 'users',
  ADMINS: 'admins',
} as const;

/**
 * Deeply removes `undefined` keys before writing to Firestore.
 */
export function sanitizeForFirestore<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return input;
}

function logNonFatalSnapshotError(
  error: unknown,
  path: string,
  onError?: (info: string) => void
) {
  const errInfo = formatFirestoreError(error, OperationType.LIST, path);
  console.warn('Firestore snapshot notice:', JSON.stringify(errInfo));
  if (onError) {
    onError(errInfo.error);
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (message: string) => void,
  constraints?: { field: string; value: string }
): Unsubscribe {
  const colRef = collection(db, collectionName);
  const q = constraints
    ? query(colRef, where(constraints.field, '==', constraints.value))
    : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({
        ...(d.data() as Record<string, unknown>),
        id: ((d.data() as Record<string, unknown>).id as string) || d.id,
      })) as T[];
      onData(rows);
    },
    (error) => {
      logNonFatalSnapshotError(error, collectionName, onError);
    }
  );
}

export async function fetchCollectionOnce<T>(collectionName: string): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => ({
      ...(d.data() as Record<string, unknown>),
      id: ((d.data() as Record<string, unknown>).id as string) || d.id,
    })) as T[];
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
    throw error;
  }
}

export async function fetchUserProfileDoc(uid: string): Promise<UserProfile | null> {
  if (!uid || uid === 'guest') return null;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.warn('Unable to fetch user profile doc:', error);
    return null;
  }
}

export async function checkIsAdminDoc(uid: string): Promise<boolean> {
  if (!uid || uid === 'guest') return false;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  const path = `${collectionName}/${item.id}`;
  try {
    await setDoc(doc(db, collectionName, item.id), sanitizeForFirestore(item), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserProfileDoc(profile: UserProfile): Promise<void> {
  if (!profile.uid || profile.uid === 'guest') return;
  const path = `${COLLECTIONS.USERS}/${profile.uid}`;
  try {
    await setDoc(
      doc(db, COLLECTIONS.USERS, profile.uid),
      sanitizeForFirestore({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        phone: profile.phone || '',
        country: profile.country || 'Hungary',
        role: profile.role === 'admin' ? 'admin' : 'customer',
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        emailVerified: Boolean(profile.emailVerified),
        authProvider: profile.authProvider || 'google',
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeDocument(collectionName: string, docId: string): Promise<void> {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Atomic Firestore transaction to verify live stock and reserve tickets for 10 minutes.
 * Prevents two simultaneous buyers from overselling the same ticket category.
 */
export async function reserveTicketsTransaction(params: {
  reservation: BookingReservation;
  previousReservationId?: string;
}): Promise<{
  success: boolean;
  code?: string;
  message?: string;
  updatedTickets?: TicketType[];
  ledgerEntries?: InventoryMutation[];
}> {
  const nowIso = new Date().toISOString();
  const reservationPath = `${COLLECTIONS.RESERVATIONS}/${params.reservation.id}`;

  try {
    const result = await runTransaction(db, async (tx) => {
      // Aggregate requested quantities per ticketTypeId
      const reqByTicket = new Map<string, number>();
      for (const item of params.reservation.items) {
        if (item.isAddon) continue;
        reqByTicket.set(item.ticketTypeId, (reqByTicket.get(item.ticketTypeId) || 0) + item.quantity);
      }

      // 1. Read previous active reservation if replacing
      const prevRestoredByTicket = new Map<string, number>();
      let prevResRef: ReturnType<typeof doc> | null = null;
      if (params.previousReservationId && params.previousReservationId !== params.reservation.id) {
        const candidateRef = doc(db, COLLECTIONS.RESERVATIONS, params.previousReservationId);
        const prevSnap = await tx.get(candidateRef);
        if (prevSnap.exists()) {
          const prevData = prevSnap.data() as BookingReservation;
          if (prevData.status === 'active') {
            prevResRef = candidateRef;
            for (const prevItem of prevData.items || []) {
              if (prevItem.isAddon) continue;
              prevRestoredByTicket.set(
                prevItem.ticketTypeId,
                (prevRestoredByTicket.get(prevItem.ticketTypeId) || 0) + prevItem.quantity
              );
            }
          }
        }
      }

      // 2. Read all affected ticket docs before any writes
      const allTicketIds = new Set<string>([...reqByTicket.keys(), ...prevRestoredByTicket.keys()]);
      const ticketMap = new Map<string, { ref: ReturnType<typeof doc>; ticket: TicketType }>();

      for (const ticketId of allTicketIds) {
        const tRef = doc(db, COLLECTIONS.TICKETS, ticketId);
        const tSnap = await tx.get(tRef);
        if (!tSnap.exists()) {
          if (reqByTicket.has(ticketId)) {
            throw new Error('Selected ticket category is no longer available.');
          }
          continue;
        }
        const ticket = { ...(tSnap.data() as TicketType), id: tSnap.id };
        ticketMap.set(ticketId, { ref: tRef, ticket });
      }

      // 3. Validate live availability for every requested ticket
      for (const [ticketId, requestedQty] of reqByTicket.entries()) {
        const entry = ticketMap.get(ticketId);
        if (!entry) {
          throw new Error('Selected ticket category is no longer available.');
        }
        const { ticket } = entry;
        const restoredFromPrev = prevRestoredByTicket.get(ticketId) || 0;
        const effectiveAvail = Math.min(ticket.capacity, ticket.availableQuantity + restoredFromPrev);
        const maxPerOrder = Math.max(1, ticket.maxPerOrder || 8);

        if (requestedQty < 1) {
          throw new Error('Ticket quantity must be at least 1.');
        }
        if (requestedQty > maxPerOrder) {
          throw new Error(`Maximum ${maxPerOrder} tickets allowed per order for ${ticket.name}.`);
        }
        if (requestedQty > effectiveAvail) {
          throw new Error(
            `Only ${effectiveAvail} ticket(s) currently remain for ${ticket.name}. Live availability has been refreshed.`
          );
        }
      }

      // 4. Execute atomic writes
      const updatedTickets: TicketType[] = [];
      const ledgerEntries: InventoryMutation[] = [];

      if (prevResRef) {
        tx.update(prevResRef, { status: 'released' });
      }

      for (const [ticketId, { ref, ticket }] of ticketMap.entries()) {
        const restoredQty = prevRestoredByTicket.get(ticketId) || 0;
        const heldQty = reqByTicket.get(ticketId) || 0;
        const netDelta = restoredQty - heldQty;
        if (netDelta === 0) continue;

        const prevStock = ticket.availableQuantity;
        const nextStock = Math.max(0, Math.min(ticket.capacity, prevStock + netDelta));
        const nextStatus: TicketType['status'] =
          nextStock <= 0 ? 'sold_out' : nextStock < 30 ? 'low_inventory' : 'available';

        tx.update(ref, {
          availableQuantity: nextStock,
          status: nextStatus,
        });

        updatedTickets.push({
          ...ticket,
          availableQuantity: nextStock,
          status: nextStatus,
        });

        if (heldQty > 0) {
          const ledgerEntry: InventoryMutation = {
            id: `inv-hold-${Date.now()}-${ticketId}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: nowIso,
            type: 'RESERVATION_CREATED',
            ticketTypeId: ticket.id,
            ticketName: ticket.name,
            quantityDelta: -heldQty,
            previousStock: prevStock,
            newStock: nextStock,
            referenceId: params.reservation.reservationReference,
            notes: `10-minute Firestore hold for ${params.reservation.reservationReference} (${heldQty} pass(es)).`,
          };
          tx.set(doc(db, COLLECTIONS.INVENTORY_LEDGER, ledgerEntry.id), sanitizeForFirestore(ledgerEntry));
          ledgerEntries.push(ledgerEntry);
        }
      }

      tx.set(
        doc(db, COLLECTIONS.RESERVATIONS, params.reservation.id),
        sanitizeForFirestore(params.reservation)
      );

      return { updatedTickets, ledgerEntries };
    });

    return { success: true, ...result };
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      console.error('Firestore Error:', JSON.stringify(formatFirestoreError(error, OperationType.WRITE, reservationPath)));
      return {
        success: false,
        code: 'PERMISSION_DENIED',
        message: 'Permission denied while reserving inventory in Firestore.',
      };
    }
    const message = error instanceof Error ? error.message : 'Unable to reserve tickets right now.';
    return {
      success: false,
      code: message.toLowerCase().includes('only') || message.toLowerCase().includes('insufficient')
        ? 'INSUFFICIENT_INVENTORY'
        : 'RESERVATION_ERROR',
      message,
    };
  }
}

/**
 * Idempotently releases an active Firestore reservation and returns stock to the ticket categories.
 */
export async function releaseReservationTransaction(
  reservationId: string,
  reason: 'expired' | 'released'
): Promise<boolean> {
  if (!reservationId) return false;
  const nowIso = new Date().toISOString();

  try {
    return await runTransaction(db, async (tx) => {
      const resRef = doc(db, COLLECTIONS.RESERVATIONS, reservationId);
      const resSnap = await tx.get(resRef);
      if (!resSnap.exists()) return false;

      const resData = resSnap.data() as BookingReservation;
      if (resData.status !== 'active') return false; // Idempotent guard

      const qtyByTicket = new Map<string, number>();
      for (const item of resData.items || []) {
        if (item.isAddon) continue;
        qtyByTicket.set(item.ticketTypeId, (qtyByTicket.get(item.ticketTypeId) || 0) + item.quantity);
      }

      const ticketDocs: Array<{ ref: ReturnType<typeof doc>; ticket: TicketType; qty: number }> = [];
      for (const [ticketId, qty] of qtyByTicket.entries()) {
        const tRef = doc(db, COLLECTIONS.TICKETS, ticketId);
        const tSnap = await tx.get(tRef);
        if (tSnap.exists()) {
          ticketDocs.push({
            ref: tRef,
            ticket: { ...(tSnap.data() as TicketType), id: tSnap.id },
            qty,
          });
        }
      }

      for (const { ref, ticket, qty } of ticketDocs) {
        const prevStock = ticket.availableQuantity;
        const newStock = Math.min(ticket.capacity, prevStock + qty);
        const nextStatus: TicketType['status'] =
          newStock <= 0 ? 'sold_out' : newStock < 30 ? 'low_inventory' : 'available';

        tx.update(ref, {
          availableQuantity: newStock,
          status: nextStatus,
        });

        const ledgerEntry: InventoryMutation = {
          id: `inv-rel-${Date.now()}-${ticket.id}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: nowIso,
          type: 'RESERVATION_EXPIRED_RELEASED',
          ticketTypeId: ticket.id,
          ticketName: ticket.name,
          quantityDelta: qty,
          previousStock: prevStock,
          newStock,
          referenceId: resData.reservationReference,
          notes: `Firestore reservation ${reason}: restored +${qty} pass(es).`,
        };
        tx.set(doc(db, COLLECTIONS.INVENTORY_LEDGER, ledgerEntry.id), sanitizeForFirestore(ledgerEntry));
      }

      tx.update(resRef, { status: reason });
      return true;
    });
  } catch (error) {
    console.error('Failed to release Firestore reservation:', error);
    return false;
  }
}

/**
 * Atomically persists a confirmed order, finalizes any active reservation (without double-deducting stock),
 * or deducts stock directly if no hold was active, increments promo usage, and logs email + audit trail.
 */
export async function completeOrderTransaction(params: {
  order: Order;
  cartItems: CartItem[];
  activeReservationId?: string;
  appliedDiscountId?: string;
  emailJob: EmailJob;
  auditLog: AuditLog;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const orderPath = `${COLLECTIONS.ORDERS}/${params.order.id}`;

  try {
    await runTransaction(db, async (tx) => {
      // 1. Check active reservation if provided
      const heldByTicket = new Map<string, number>();
      let activeResRef: ReturnType<typeof doc> | null = null;
      let activeResRefCode = '';

      if (params.activeReservationId) {
        const candidateRef = doc(db, COLLECTIONS.RESERVATIONS, params.activeReservationId);
        const resSnap = await tx.get(candidateRef);
        if (resSnap.exists()) {
          const resData = resSnap.data() as BookingReservation;
          if (resData.status === 'active') {
            activeResRef = candidateRef;
            activeResRefCode = resData.reservationReference;
            for (const item of resData.items || []) {
              if (item.isAddon) continue;
              heldByTicket.set(
                item.ticketTypeId,
                (heldByTicket.get(item.ticketTypeId) || 0) + item.quantity
              );
            }
          }
        }
      }

      // 2. Verify & prepare any non-held ticket deductions
      const reqByTicket = new Map<string, number>();
      for (const item of params.cartItems) {
        if (item.isAddon) continue;
        reqByTicket.set(item.ticketTypeId, (reqByTicket.get(item.ticketTypeId) || 0) + item.quantity);
      }

      const deductions: Array<{
        ref: ReturnType<typeof doc>;
        ticket: TicketType;
        deductQty: number;
        totalQty: number;
      }> = [];

      for (const [ticketId, totalQty] of reqByTicket.entries()) {
        const alreadyHeld = heldByTicket.get(ticketId) || 0;
        const remainingToDeduct = Math.max(0, totalQty - alreadyHeld);
        const tRef = doc(db, COLLECTIONS.TICKETS, ticketId);
        const tSnap = await tx.get(tRef);
        if (tSnap.exists()) {
          const ticket = { ...(tSnap.data() as TicketType), id: tSnap.id };
          if (remainingToDeduct > 0 && ticket.availableQuantity < remainingToDeduct) {
            throw new Error(
              `Insufficient live inventory remaining for ${ticket.name}. Only ${ticket.availableQuantity} available.`
            );
          }
          deductions.push({ ref: tRef, ticket, deductQty: remainingToDeduct, totalQty });
        }
      }

      // 3. Check applied discount
      let discountRef: ReturnType<typeof doc> | null = null;
      let nextDiscountUsedCount = 0;
      if (params.appliedDiscountId) {
        const dRef = doc(db, COLLECTIONS.DISCOUNTS, params.appliedDiscountId);
        const dSnap = await tx.get(dRef);
        if (dSnap.exists()) {
          const dData = dSnap.data() as DiscountCode;
          if (dData.active && dData.usedCount < dData.maxUsage) {
            discountRef = dRef;
            nextDiscountUsedCount = dData.usedCount + 1;
          }
        }
      }

      // 4. Write all mutations atomically
      for (const { ref, ticket, deductQty, totalQty } of deductions) {
        const prevStock = ticket.availableQuantity;
        const nextStock = deductQty > 0 ? Math.max(0, prevStock - deductQty) : prevStock;
        if (deductQty > 0) {
          const nextStatus: TicketType['status'] =
            nextStock <= 0 ? 'sold_out' : nextStock < 30 ? 'low_inventory' : 'available';
          tx.update(ref, {
            availableQuantity: nextStock,
            status: nextStatus,
          });
        }

        const ledgerEntry: InventoryMutation = {
          id: `inv-conf-${Date.now()}-${ticket.id}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: nowIso,
          type: 'PAYMENT_CONFIRMED_DEDUCTED',
          ticketTypeId: ticket.id,
          ticketName: ticket.name,
          quantityDelta: -deductQty,
          previousStock: prevStock,
          newStock: nextStock,
          referenceId: params.order.id,
          notes:
            deductQty === 0
              ? `Confirmed order #${params.order.orderNumber} from active hold ${activeResRefCode} (${totalQty} pass(es), already held).`
              : `Confirmed order #${params.order.orderNumber}. Deducted ${deductQty} pass(es).`,
        };
        tx.set(doc(db, COLLECTIONS.INVENTORY_LEDGER, ledgerEntry.id), sanitizeForFirestore(ledgerEntry));
      }

      if (activeResRef) {
        tx.update(activeResRef, { status: 'confirmed' });
      }

      if (discountRef) {
        tx.update(discountRef, { usedCount: nextDiscountUsedCount });
      }

      tx.set(doc(db, COLLECTIONS.ORDERS, params.order.id), sanitizeForFirestore(params.order));
      tx.set(doc(db, COLLECTIONS.EMAIL_JOBS, params.emailJob.id), sanitizeForFirestore(params.emailJob));
      tx.set(doc(db, COLLECTIONS.AUDIT_LOGS, params.auditLog.id), sanitizeForFirestore(params.auditLog));
    });
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.CREATE, orderPath);
    }
    throw error;
  }
}

export async function saveEventDoc(event: GrandPrixEvent): Promise<void> {
  return saveDocument(COLLECTIONS.EVENTS, event);
}

export async function saveTicketDoc(ticket: TicketType): Promise<void> {
  return saveDocument(COLLECTIONS.TICKETS, ticket);
}

export async function saveCategoryDoc(category: EventCategory): Promise<void> {
  return saveDocument(COLLECTIONS.CATEGORIES, category);
}

export async function saveConcertDoc(concert: Concert): Promise<void> {
  return saveDocument(COLLECTIONS.CONCERTS, concert);
}

export async function savePremiumPackageDoc(pkg: PremiumPackage): Promise<void> {
  return saveDocument(COLLECTIONS.PREMIUM_PACKAGES, pkg);
}

export async function saveDiscountDoc(discount: DiscountCode): Promise<void> {
  return saveDocument(COLLECTIONS.DISCOUNTS, discount);
}

export async function saveOrderDoc(order: Order): Promise<void> {
  return saveDocument(COLLECTIONS.ORDERS, order);
}

export async function saveEmailJobDoc(job: EmailJob): Promise<void> {
  return saveDocument(COLLECTIONS.EMAIL_JOBS, job);
}

export async function saveLedgerEntryDoc(entry: InventoryMutation): Promise<void> {
  return saveDocument(COLLECTIONS.INVENTORY_LEDGER, entry);
}

export async function saveAuditLogDoc(log: AuditLog): Promise<void> {
  return saveDocument(COLLECTIONS.AUDIT_LOGS, log);
}
