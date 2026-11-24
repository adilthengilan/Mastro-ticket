import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GrandPrixEvent,
  TicketType,
  Concert,
  PremiumPackage,
  CartItem,
  Order,
  DiscountCode,
  EmailJob,
  AuditLog,
  UserProfile,
  CurrencyCode,
  IssuedTicket,
  EventCategory,
  InventoryMutation,
  BookingReservation,
  GuestOrderRef
} from '../types';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  testFirestoreConnection,
} from '../firebase';
import {
  COLLECTIONS,
  subscribeToCollection,
  fetchCollectionOnce,
  fetchUserProfileStatus,
  checkIsAdminDoc,
  saveEventDoc,
  saveTicketDoc,
  saveCategoryDoc,
  saveDiscountDoc,
  saveOrderDoc,
  saveEmailJobDoc,
  saveLedgerEntryDoc,
  saveAuditLogDoc,
  saveUserProfileDoc,
  removeDocument,
  reserveTicketsTransaction,
  releaseReservationTransaction,
  completeOrderTransaction,
} from './firestoreRepository';
import {
  buildOrderConfirmationEmailBody,
  buildOrderConfirmationSubject,
  extractOrderConfirmationDetails,
} from './orderConfirmationTemplate';

const ADMIN_EMAIL = 'adilthengilan123@gmail.com';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$', rate: 1, label: 'USD ($)' },
};

export interface PublicTicketVerification {
  valid: boolean;
  ticket?: {
    ticketNumber: string;
    eventName: string;
    circuit: string;
    raceDay: string;
    category: string;
    section: string;
    row?: string;
    seat?: number;
    maskedAttendee: string;
    status: 'issued' | 'cancelled' | 'refunded' | 'void';
    deliveryStatus: string;
    issuedAt?: string;
    verificationTimestamp: string;
    isOfficialPass: boolean;
    verificationNotice: string;
  };
  error?: string;
}

export interface ActiveReservationState {
  reservationId: string;
  reservationReference: string;
  eventId: string;
  expiresAt: string;
  items: CartItem[];
  source: 'firestore' | 'local';
  stockDeductedLocally: boolean;
}

interface StoreContextType {
  // Data
  events: GrandPrixEvent[];
  tickets: TicketType[];
  concerts: Concert[];
  premiumPackages: PremiumPackage[];
  orders: Order[];
  discounts: DiscountCode[];
  emailJobs: EmailJob[];
  auditLogs: AuditLog[];
  inventoryLedger: InventoryMutation[];
  reservations: BookingReservation[];
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isFirebaseAdmin: boolean;
  firebaseAuthEmail: string | null;
  firestoreSyncError: string | null;
  signInAdminWithGoogle: () => Promise<{ success: boolean; message: string }>;
  guestOrderRefs: GuestOrderRef[];
  lastClaimedNotice: string | null;
  clearLastClaimedNotice: () => void;
  getAccessibleCustomerOrders: () => Order[];
  currency: CurrencyCode;
  
  categories: EventCategory[];
  
  // Cart & Reservation
  cart: CartItem[];
  appliedDiscount: DiscountCode | null;
  reservationTimeRemaining: number; // in seconds
  activeReservation: ActiveReservationState | null;
  reservationExpiredNotice: string | null;
  clearReservationExpiredNotice: () => void;
  isInventoryLoading: boolean;
  
  // Actions
  setCurrency: (currency: CurrencyCode) => void;
  setCurrentUser: (user: UserProfile) => void;
  updateUserProfile: (updates: {
    displayName: string;
    phone?: string;
    country?: string;
  }) => Promise<{ success: boolean; message: string }>;
  formatPrice: (amountInUsd: number) => string;
  refreshLiveInventory: (params?: {
    eventId?: string;
    raceDay?: string;
    minQuantity?: number;
  }) => Promise<TicketType[]>;

  // Customer Firebase Auth (Google + Email/Password) & Guest Order Linking
  registerWithEmail: (data: {
    displayName: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
  }) => Promise<{ success: boolean; message: string; claimedCount?: number }>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; claimedCount?: number }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string; claimedCount?: number }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyAccountEmail: () => Promise<{ success: boolean; message: string; claimedCount: number }>;
  claimGuestOrdersForCurrentUser: () => Promise<{ success: boolean; message: string; claimedCount: number }>;
  logoutUser: () => void;
  
  // Cart Actions
  addToCart: (ticket: TicketType, event: GrandPrixEvent, quantity?: number, seatDetails?: { grandstand: string; row: string; seatNumber: number }) => void;
  addAddonToCart: (addon: Concert | PremiumPackage, event: GrandPrixEvent) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => { success: boolean; error?: string };
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  
  // Booking Reservations & Lifecycle
  createReservation: (items?: CartItem[]) => { success: boolean; reservation?: BookingReservation; error?: string };
  reserveAndSelectTicket: (
    ticket: TicketType,
    event: GrandPrixEvent,
    quantity: number,
    idempotencyKey?: string
  ) => Promise<{ success: boolean; reservation?: ActiveReservationState; error?: string; code?: string }>;
  reserveItemsForCart: (
    itemsToReserve?: CartItem[],
    eventIdOverride?: string,
    idempotencyKey?: string
  ) => Promise<{ success: boolean; reservation?: ActiveReservationState; error?: string; code?: string }>;
  releaseActiveReservation: (reason?: string) => Promise<void>;
  cancelReservation: (reservationId: string) => void;
  cleanupExpiredReservations: () => number;

  // Checkout & Orders
  createOrder: (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCountry: string;
    billingAddress: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
      taxId?: string;
    };
    attendees: { fullName: string; email: string; ticketId: string }[];
    paymentMethod: string;
    cardLast4?: string;
    idempotencyKey?: string;
  }) => Promise<Order>;
  
  // Public Verification (Strictly PII redacted)
  verifyTicketPublicly: (ticketNumber: string) => PublicTicketVerification;

  // Admin & Support Actions
  updateEvent: (updated: GrandPrixEvent) => void;
  createEvent: (newEvent: Omit<GrandPrixEvent, 'id' | 'slug'>) => GrandPrixEvent;
  deleteEvent: (eventId: string) => void;
  updateTicket: (updated: TicketType) => void;
  createTicket: (newTicket: Omit<TicketType, 'id'>) => TicketType;
  deleteTicket: (ticketId: string) => void;
  voidTicket: (ticketNumber: string, reason: string) => { success: boolean; message: string };
  reissueTicket: (ticketNumber: string, newAttendeeName?: string) => { success: boolean; message: string; newTicketNumber?: string };
  addCategory: (category: Omit<EventCategory, 'id'>) => void;
  updateCategory: (category: EventCategory) => void;
  deleteCategory: (categoryId: string) => void;
  sendCustomEmail: (data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    bodyText: string;
    template?: EmailJob['template'];
  }) => { success: boolean; message: string };
  retryEmailJob: (jobId: string) => { success: boolean; message: string };
  refundOrder: (orderId: string, reason: string) => { success: boolean; message: string };
  resendConfirmationEmail: (orderId: string) => { success: boolean; message: string };
  createDiscountCode: (discount: Omit<DiscountCode, 'id' | 'usedCount'>) => void;
  toggleDiscountActive: (id: string) => void;
  addAuditLog: (action: string, targetRecord: string, changeSummary: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  EVENTS: 'mastrotickets_ad_events_v4',
  TICKETS: 'mastrotickets_ad_tickets_v4',
  CATEGORIES: 'mastrotickets_ad_categories_v4',
  CONCERTS: 'mastrotickets_ad_concerts_v4',
  PACKAGES: 'mastrotickets_ad_packages_v4',
  ORDERS: 'mastrotickets_ad_orders_v4',
  DISCOUNTS: 'mastrotickets_ad_discounts_v4',
  EMAIL_JOBS: 'mastrotickets_ad_email_jobs_v4',
  AUDIT_LOGS: 'mastrotickets_ad_audit_logs_v4',
  LEDGER: 'mastrotickets_ad_ledger_v4',
  RESERVATIONS: 'mastrotickets_ad_reservations_v4',
  CART: 'mastrotickets_ad_cart_v4',
  USER: 'mastrotickets_ad_user_v4',
  CURRENCY: 'mastrotickets_ad_currency_v4',
  GUEST_ORDER_REFS: 'mastro_guest_order_refs_v1',
  ACTIVE_RESERVATION: 'mastro_active_reservation_v1',
};

function formatFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet in Firebase Console (mastro-tickets → Authentication → Sign-in method).';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console (mastro-tickets → Authentication → Settings → Authorized domains).';
    case 'auth/network-request-failed':
      return 'Network error while connecting to Firebase Authentication. Please check your connection.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

const DEFAULT_USER: UserProfile = {
  uid: 'guest',
  email: '',
  displayName: 'Guest Customer',
  role: 'customer',
  phone: '',
  country: 'Hungary',
  isAuthenticated: false,
  emailVerified: false,
  authProvider: 'guest',
};

const readStoredList = <T,>(key: string): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<GrandPrixEvent[]>(() => readStoredList<GrandPrixEvent>(STORAGE_KEYS.EVENTS));
  const [tickets, setTickets] = useState<TicketType[]>(() => readStoredList<TicketType>(STORAGE_KEYS.TICKETS));
  const [categories, setCategories] = useState<EventCategory[]>(() => readStoredList<EventCategory>(STORAGE_KEYS.CATEGORIES));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  const [concerts, setConcerts] = useState<Concert[]>(() => readStoredList<Concert>(STORAGE_KEYS.CONCERTS));
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>(() => readStoredList<PremiumPackage>(STORAGE_KEYS.PACKAGES));
  const [orders, setOrders] = useState<Order[]>(() => readStoredList<Order>(STORAGE_KEYS.ORDERS));
  const [discounts, setDiscounts] = useState<DiscountCode[]>(() => readStoredList<DiscountCode>(STORAGE_KEYS.DISCOUNTS));
  const [emailJobs, setEmailJobs] = useState<EmailJob[]>(() => readStoredList<EmailJob>(STORAGE_KEYS.EMAIL_JOBS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readStoredList<AuditLog>(STORAGE_KEYS.AUDIT_LOGS));
  const [inventoryLedger, setInventoryLedger] = useState<InventoryMutation[]>(() => readStoredList<InventoryMutation>(STORAGE_KEYS.LEDGER));
  const [reservations, setReservations] = useState<BookingReservation[]>(() => readStoredList<BookingReservation>(STORAGE_KEYS.RESERVATIONS));

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [firebaseAuthEmail, setFirebaseAuthEmail] = useState<string | null>(null);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState<boolean>(false);
  const [firestoreSyncError, setFirestoreSyncError] = useState<string | null>(null);

  const syncedUserProfileUidRef = React.useRef<string | null>(null);

  const persistFireAndForget = (promise: Promise<unknown>, label: string) => {
    promise.catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Missing or insufficient permissions') || msg.includes('permission-denied')) {
        console.warn(`Firestore rules notice (${label}): Publish firestore.rules to project mastro-tickets to enable cloud writes.`);
        setFirestoreSyncError(
          `Firestore write blocked (${label}): Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.`
        );
      } else {
        console.warn(`Firestore sync notice (${label}):`, msg);
        setFirestoreSyncError(`Sync warning (${label}): Check Firebase configuration or network connection.`);
      }
    });
  };

  // Verify Firestore connectivity on mount
  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  // Sync Firebase Auth state (Google + Email/Password)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        syncedUserProfileUidRef.current = null;
        setFirebaseUid(null);
        setFirebaseAuthEmail(null);
        setIsFirebaseAdmin(false);
        setCurrentUser((prev) => (prev.isAuthenticated ? DEFAULT_USER : prev));
        return;
      }

      const email = (fbUser.email || '').toLowerCase();
      setFirebaseUid(fbUser.uid);
      setFirebaseAuthEmail(email || null);

      const hasAdminRole =
        (fbUser.emailVerified && email === ADMIN_EMAIL) ||
        (await checkIsAdminDoc(fbUser.uid));
      setIsFirebaseAdmin(hasAdminRole);

      const provider: 'google' | 'password' = fbUser.providerData.some(
        (p) => p.providerId === 'google.com'
      )
        ? 'google'
        : 'password';

      const { profile: existingDoc, permissionDenied } = await fetchUserProfileStatus(fbUser.uid);
      const syncedProfile: UserProfile = {
        uid: fbUser.uid,
        email: existingDoc?.email || fbUser.email || '',
        displayName: existingDoc?.displayName || fbUser.displayName || email.split('@')[0] || 'Mastro Member',
        phone: existingDoc?.phone || '',
        country: existingDoc?.country || 'Hungary',
        role: hasAdminRole ? 'admin' : 'customer',
        avatarUrl: fbUser.photoURL || existingDoc?.avatarUrl,
        isAuthenticated: true,
        emailVerified: fbUser.emailVerified,
        authProvider: provider,
      };
      setCurrentUser(syncedProfile);

      if (permissionDenied) {
        setFirestoreSyncError(
          'Firestore profile sync blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
        );
      } else if (!existingDoc && fbUser.email && syncedUserProfileUidRef.current !== fbUser.uid) {
        syncedUserProfileUidRef.current = fbUser.uid;
        persistFireAndForget(
          saveUserProfileDoc(syncedProfile).then((res) => {
            if (res.permissionDenied) {
              setFirestoreSyncError(
                'Firestore profile write blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
              );
            }
          }),
          'createUserProfile'
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscriptions for public storefront catalog
  useEffect(() => {
    const unsubs = [
      subscribeToCollection<GrandPrixEvent>(
        COLLECTIONS.EVENTS,
        (items) => {
          setEvents(items);
          setFirestoreSyncError(null);
        },
        (msg) => setFirestoreSyncError(msg)
      ),
      subscribeToCollection<TicketType>(
        COLLECTIONS.TICKETS,
        (items) => setTickets(items),
        (msg) => setFirestoreSyncError(msg)
      ),
      subscribeToCollection<EventCategory>(
        COLLECTIONS.CATEGORIES,
        (items) => setCategories(items)
      ),
      subscribeToCollection<Concert>(
        COLLECTIONS.CONCERTS,
        (items) => setConcerts(items)
      ),
      subscribeToCollection<PremiumPackage>(
        COLLECTIONS.PREMIUM_PACKAGES,
        (items) => setPremiumPackages(items)
      ),
      subscribeToCollection<DiscountCode>(
        COLLECTIONS.DISCOUNTS,
        (items) => setDiscounts(items)
      ),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Real-time Firestore subscriptions for auth-scoped / admin collections
  useEffect(() => {
    if (!firebaseUid) return;

    const unsubs: Array<() => void> = [];

    if (isFirebaseAdmin) {
      unsubs.push(
        subscribeToCollection<Order>(COLLECTIONS.ORDERS, (items) => {
          setOrders(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        }),
        subscribeToCollection<BookingReservation>(COLLECTIONS.RESERVATIONS, (items) => {
          setReservations(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        }),
        subscribeToCollection<EmailJob>(COLLECTIONS.EMAIL_JOBS, (items) => {
          setEmailJobs(items.sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || '')));
        }),
        subscribeToCollection<InventoryMutation>(COLLECTIONS.INVENTORY_LEDGER, (items) => {
          setInventoryLedger(items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
        }),
        subscribeToCollection<AuditLog>(COLLECTIONS.AUDIT_LOGS, (items) => {
          setAuditLogs(items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
        })
      );
    } else {
      unsubs.push(
        subscribeToCollection<Order>(
          COLLECTIONS.ORDERS,
          (items) => {
            setOrders((prev) => {
              const guestLocal = prev.filter((o) => o.customerId === 'guest' && !items.some((r) => r.id === o.id));
              return [...items, ...guestLocal].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            });
          },
          undefined,
          { field: 'customerId', value: firebaseUid }
        ),
        subscribeToCollection<BookingReservation>(
          COLLECTIONS.RESERVATIONS,
          (items) => {
            setReservations(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
          },
          undefined,
          { field: 'customerId', value: firebaseUid }
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUid, isFirebaseAdmin]);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!saved) return DEFAULT_USER;
    try {
      return JSON.parse(saved) as UserProfile;
    } catch {
      return DEFAULT_USER;
    }
  });

  const isAuthenticated = Boolean(currentUser.isAuthenticated && currentUser.uid !== 'guest');

  const [guestOrderRefs, setGuestOrderRefs] = useState<GuestOrderRef[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GUEST_ORDER_REFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastClaimedNotice, setLastClaimedNotice] = useState<string | null>(null);
  const clearLastClaimedNotice = () => setLastClaimedNotice(null);

  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');

  // All pricing and checkout is in USD ($).
  const setCurrency = (_newCurrency: CurrencyCode) => {
    setCurrencyState('USD');
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [activeReservation, setActiveReservation] = useState<ActiveReservationState | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_RESERVATION);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as ActiveReservationState;
      if (parsed && parsed.expiresAt && new Date(parsed.expiresAt).getTime() > Date.now()) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [reservationExpiredNotice, setReservationExpiredNotice] = useState<string | null>(null);
  const clearReservationExpiredNotice = () => setReservationExpiredNotice(null);
  const [isInventoryLoading, setIsInventoryLoading] = useState<boolean>(false);
  const processedOrderKeysRef = React.useRef<Map<string, Order>>(new Map());

  const computeRemainingSeconds = (expiresAt?: string): number => {
    if (!expiresAt) return 600;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [reservationTimeRemaining, setReservationTimeRemaining] = useState<number>(() =>
    activeReservation ? computeRemainingSeconds(activeReservation.expiresAt) : 600
  );

  // Persist items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(discounts));
  }, [discounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMAIL_JOBS, JSON.stringify(emailJobs));
  }, [emailJobs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(inventoryLedger));
  }, [inventoryLedger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // storage unavailable
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GUEST_ORDER_REFS, JSON.stringify(guestOrderRefs));
    } catch {
      // storage unavailable
    }
  }, [guestOrderRefs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    try {
      if (activeReservation) {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_RESERVATION, JSON.stringify(activeReservation));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_RESERVATION);
      }
    } catch {
      // storage unavailable
    }
  }, [activeReservation]);

  // Synchronized reservation hold countdown timer (auto-releases held inventory on expiry)
  useEffect(() => {
    if (!activeReservation && cart.length === 0) {
      setReservationTimeRemaining(600);
      return;
    }

    if (activeReservation) {
      const updateTick = () => {
        const remaining = computeRemainingSeconds(activeReservation.expiresAt);
        setReservationTimeRemaining(remaining);
        if (remaining <= 0) {
          releaseActiveReservation('expired');
          setReservationExpiredNotice(
            'Your 10-minute ticket reservation has expired and the held inventory has been released. Live availability has been refreshed.'
          );
        }
      };

      updateTick();
      const timer = setInterval(updateTick, 1000);
      return () => clearInterval(timer);
    }

    const timer = setInterval(() => {
      setReservationTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeReservation, cart.length]);

  const formatPrice = (amountInUsd: number): string => {
    const rateInfo = CURRENCY_CONFIG.USD;
    const converted = amountInUsd * rateInfo.rate;
    return `${rateInfo.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  };

  const addAuditLog = (action: string, targetRecord: string, changeSummary: string) => {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorId: currentUser.uid || 'guest',
      actorEmail: currentUser.email || '',
      actorRole: currentUser.role || 'customer',
      action,
      targetRecord,
      timestamp: new Date().toISOString(),
      changeSummary,
    };
    setAuditLogs((prev) => [log, ...prev]);
    persistFireAndForget(saveAuditLogDoc(log), `auditLog:${action}`);
  };

  // Helper for generating collision-resistant Mastrotickets ticket format
  const generateCollisionResistantTicketNumber = (circuit: string): string => {
    const cleanCircuit = circuit.replace(/[^A-Za-z]/g, '').toUpperCase();
    const code = cleanCircuit.length >= 3 ? cleanCircuit.substring(0, 3) : 'F1X';
    const prefix = `MST-${code}26-`;

    const existing = new Set<string>();
    orders.forEach((o) => o.tickets.forEach((t) => existing.add(t.ticketNumber)));

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let ticketNum = '';
    let attempts = 0;
    do {
      let token = '';
      for (let i = 0; i < 8; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      ticketNum = `${prefix}${token}`;
      attempts++;
    } while (existing.has(ticketNum) && attempts < 100);

    return ticketNum;
  };

  // Helper: compare cart item lists by ticketTypeId -> total quantity
  const itemsMatchQuantities = (a: CartItem[], b: CartItem[]): boolean => {
    const mapA = new Map<string, number>();
    const mapB = new Map<string, number>();
    a.forEach((item) => {
      if (!item.isAddon) {
        mapA.set(item.ticketTypeId, (mapA.get(item.ticketTypeId) || 0) + item.quantity);
      }
    });
    b.forEach((item) => {
      if (!item.isAddon) {
        mapB.set(item.ticketTypeId, (mapB.get(item.ticketTypeId) || 0) + item.quantity);
      }
    });
    if (mapA.size !== mapB.size) return false;
    for (const [key, qty] of mapA.entries()) {
      if (mapB.get(key) !== qty) return false;
    }
    return true;
  };

  // Restore locally held stock for a list of items (used idempotently on expiry/release)
  const restoreLocalStockForItems = (
    itemsToRestore: CartItem[],
    referenceId: string,
    reason: string
  ) => {
    const mutations: InventoryMutation[] = [];
    setTickets((prev) =>
      prev.map((t) => {
        const qtyToRestore = itemsToRestore
          .filter((i) => !i.isAddon && i.ticketTypeId === t.id)
          .reduce((sum, i) => sum + i.quantity, 0);
        if (qtyToRestore <= 0) return t;

        const restoredQty = t.availableQuantity + qtyToRestore;
        mutations.push({
          id: `inv-rel-${Date.now()}-${t.id}-${Math.random().toString(36).slice(2, 5)}`,
          timestamp: new Date().toISOString(),
          type: 'RESERVATION_EXPIRED_RELEASED',
          ticketTypeId: t.id,
          ticketName: t.name,
          quantityDelta: qtyToRestore,
          previousStock: t.availableQuantity,
          newStock: restoredQty,
          referenceId,
          notes: `Inventory restored (${reason}): +${qtyToRestore} ticket(s).`,
        });
        return {
          ...t,
          availableQuantity: restoredQty,
          status: restoredQty <= 0 ? 'sold_out' : restoredQty < 30 ? 'low_inventory' : 'available',
        };
      })
    );
    if (mutations.length > 0) {
      setInventoryLedger((prev) => [...mutations, ...prev]);
    }
  };

  // Release any expired local reservations and return held stock
  const cleanupExpiredReservations = (): number => {
    const nowIso = new Date().toISOString();
    const expiredActive = reservations.filter(
      (r) => r.status === 'active' && r.expiresAt < nowIso
    );
    if (expiredActive.length === 0) return 0;

    const expiredIds = new Set(expiredActive.map((r) => r.id));
    setReservations((prev) =>
      prev.map((r) => (expiredIds.has(r.id) ? { ...r, status: 'expired' as const } : r))
    );

    expiredActive.forEach((res) => {
      restoreLocalStockForItems(res.items, res.reservationReference, 'expired_hold');
    });

    if (activeReservation && expiredIds.has(activeReservation.reservationId)) {
      setActiveReservation(null);
    }

    addAuditLog(
      'RESERVATIONS_EXPIRED',
      'SYSTEM_WORKER',
      `Auto-released ${expiredActive.length} expired booking reservation(s) and restored inventory.`
    );

    return expiredActive.length;
  };

  // Refresh live ticket inventory from Firestore
  const refreshLiveInventory = async (params?: {
    eventId?: string;
    raceDay?: string;
    minQuantity?: number;
  }): Promise<TicketType[]> => {
    cleanupExpiredReservations();
    setIsInventoryLoading(true);
    try {
      const freshTickets = await fetchCollectionOnce<TicketType>(COLLECTIONS.TICKETS);
      setTickets(freshTickets);
      return freshTickets.filter((t) => {
        if (params?.eventId && t.eventId !== params.eventId) return false;
        if (params?.raceDay && t.raceDay !== params.raceDay) return false;
        if (params?.minQuantity && (t.status === 'sold_out' || t.availableQuantity < params.minQuantity)) {
          return false;
        }
        return true;
      });
    } catch {
      return tickets.filter((t) => {
        if (params?.eventId && t.eventId !== params.eventId) return false;
        if (params?.raceDay && t.raceDay !== params.raceDay) return false;
        if (params?.minQuantity && (t.status === 'sold_out' || t.availableQuantity < params.minQuantity)) {
          return false;
        }
        return true;
      });
    } finally {
      setIsInventoryLoading(false);
    }
  };

  // Atomically & idempotently release the current active reservation
  const releaseActiveReservation = async (reason = 'released'): Promise<void> => {
    const currentHold = activeReservation;
    if (!currentHold) return;

    // Clear immediately so concurrent calls cannot restore stock twice
    setActiveReservation(null);
    setReservationTimeRemaining(600);

    if (currentHold.source === 'firestore') {
      const statusReason = reason === 'expired' ? 'expired' : 'released';
      await releaseReservationTransaction(currentHold.reservationId, statusReason);
      await refreshLiveInventory({ eventId: currentHold.eventId });
      return;
    }

    if (currentHold.stockDeductedLocally) {
      let wasStillActive = false;
      const finalStatus = reason === 'expired' ? ('expired' as const) : ('released' as const);
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id === currentHold.reservationId && r.status === 'active') {
            wasStillActive = true;
            return { ...r, status: finalStatus };
          }
          return r;
        })
      );
      if (wasStillActive) {
        restoreLocalStockForItems(currentHold.items, currentHold.reservationReference, reason);
        addAuditLog(
          'RESERVATION_RELEASED',
          currentHold.reservationReference,
          `Released held inventory for ${currentHold.reservationReference} (${reason}).`
        );
      }
    }
  };

  // Synchronous local reservation helper (kept for admin/legacy compatibility)
  const createReservation = (itemsToReserve?: CartItem[]) => {
    cleanupExpiredReservations();
    const targetItems = itemsToReserve || cart;
    if (!targetItems || targetItems.length === 0) {
      return { success: false, error: 'Cannot create reservation for empty ticket selection.' };
    }

    for (const item of targetItems) {
      if (item.isAddon) continue;
      const ticket = tickets.find((t) => t.id === item.ticketTypeId);
      if (!ticket) {
        return { success: false, error: `Selected ticket category "${item.ticketName}" is no longer available.` };
      }
      const maxAllowed = Math.max(1, ticket.maxPerOrder || 8);
      if (item.quantity > maxAllowed) {
        return {
          success: false,
          error: `Maximum ${maxAllowed} tickets allowed per order for ${item.ticketName}.`,
        };
      }
      if (ticket.status === 'sold_out' || ticket.availableQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient inventory for ${item.ticketName}. Available: ${ticket.availableQuantity}, requested: ${item.quantity}.`,
        };
      }
    }

    const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const code = targetItems[0]?.circuit ? targetItems[0].circuit.substring(0, 3).toUpperCase() : 'F1';
    const reservationReference = `RES-${code}26-${Math.floor(10000 + Math.random() * 90000)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const subtotal = targetItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const serviceFee = targetItems.reduce((acc, i) => acc + i.fee * i.quantity, 0);
    const total = subtotal + serviceFee;

    const newRes: BookingReservation = {
      id: resId,
      reservationReference,
      customerId: currentUser.uid,
      customerEmail: currentUser.email,
      eventId: targetItems[0]?.eventId || '',
      items: [...targetItems],
      total,
      currency,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    // Atomically deduct local stock ONCE upon reservation creation
    const holdMutations: InventoryMutation[] = [];
    setTickets((prev) =>
      prev.map((t) => {
        const heldQty = targetItems
          .filter((i) => !i.isAddon && i.ticketTypeId === t.id)
          .reduce((sum, i) => sum + i.quantity, 0);
        if (heldQty <= 0) return t;

        const nextStock = Math.max(0, t.availableQuantity - heldQty);
        holdMutations.push({
          id: `inv-hold-${Date.now()}-${t.id}`,
          timestamp: new Date().toISOString(),
          type: 'RESERVATION_CREATED',
          ticketTypeId: t.id,
          ticketName: t.name,
          quantityDelta: -heldQty,
          previousStock: t.availableQuantity,
          newStock: nextStock,
          referenceId: reservationReference,
          notes: `10-minute inventory hold for ${reservationReference} (${heldQty} tickets).`,
        });
        return {
          ...t,
          availableQuantity: nextStock,
          status: nextStock === 0 ? 'sold_out' : nextStock < 30 ? 'low_inventory' : 'available',
        };
      })
    );

    if (holdMutations.length > 0) {
      setInventoryLedger((prev) => [...holdMutations, ...prev]);
    }

    setReservations((prev) => [newRes, ...prev]);
    setActiveReservation({
      reservationId: resId,
      reservationReference,
      eventId: newRes.eventId,
      expiresAt,
      items: [...targetItems],
      source: 'local',
      stockDeductedLocally: true,
    });
    setReservationExpiredNotice(null);
    setReservationTimeRemaining(600);

    addAuditLog(
      'RESERVATION_CREATED',
      reservationReference,
      `Inventory reserved for ${reservationReference} (${targetItems.reduce((acc, i) => acc + i.quantity, 0)} passes, expires in 10m)`
    );

    return { success: true, reservation: newRes };
  };

  // Authoritative reservation flow (tries backend atomic transaction first, falls back to local atomic hold if backend offline)
  const reserveItemsForCart = async (
    itemsToReserve?: CartItem[],
    eventIdOverride?: string,
    idempotencyKey?: string
  ): Promise<{ success: boolean; reservation?: ActiveReservationState; error?: string; code?: string }> => {
    cleanupExpiredReservations();
    const targetItems = itemsToReserve || cart;
    if (!targetItems || targetItems.length === 0) {
      return { success: false, error: 'Please select tickets before reserving.' };
    }

    const eventId = eventIdOverride || targetItems[0]?.eventId || '';

    // Reuse existing active unexpired hold if items & quantities match identically (prevents double-deduction)
    if (
      activeReservation &&
      new Date(activeReservation.expiresAt).getTime() > Date.now() &&
      itemsMatchQuantities(activeReservation.items, targetItems)
    ) {
      return { success: true, reservation: activeReservation };
    }

    // Release any previous mismatched hold before acquiring a new one
    const previousReservationId = activeReservation?.reservationId;
    const previousSource = activeReservation?.source;
    if (activeReservation && activeReservation.source === 'local') {
      await releaseActiveReservation('replaced_by_new_selection');
    }

    const ticketItems = targetItems.filter((i) => !i.isAddon);

    // Atomic Firestore inventory reservation transaction (prevents simultaneous overselling)
    if (ticketItems.length > 0) {
      const resId = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const code = targetItems[0]?.circuit ? targetItems[0].circuit.substring(0, 3).toUpperCase() : 'HUN';
      const reservationReference = `RES-${code}26-${Math.floor(10000 + Math.random() * 90000)}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const subtotal = targetItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const serviceFee = targetItems.reduce((acc, i) => acc + i.fee * i.quantity, 0);

      const newResDoc: BookingReservation = {
        id: resId,
        reservationReference,
        customerId: firebaseUid || 'guest',
        customerEmail: currentUser.email || '',
        eventId,
        items: [...targetItems],
        total: subtotal + serviceFee,
        currency,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt,
      };

      const fsRes = await reserveTicketsTransaction({
        reservation: newResDoc,
        previousReservationId: previousSource === 'firestore' ? previousReservationId : undefined,
      });

      if (fsRes.success) {
        const nextHold: ActiveReservationState = {
          reservationId: resId,
          reservationReference,
          eventId,
          expiresAt,
          items: [...targetItems],
          source: 'firestore',
          stockDeductedLocally: false,
        };
        setActiveReservation(nextHold);
        setReservations((prev) => [newResDoc, ...prev.filter((r) => r.id !== resId)]);
        if (fsRes.updatedTickets && fsRes.updatedTickets.length > 0) {
          const updatedMap = new Map(fsRes.updatedTickets.map((t) => [t.id, t]));
          setTickets((prev) => prev.map((t) => updatedMap.get(t.id) || t));
        }
        if (fsRes.ledgerEntries && fsRes.ledgerEntries.length > 0) {
          setInventoryLedger((prev) => [...fsRes.ledgerEntries!, ...prev]);
        }
        setReservationExpiredNotice(null);
        setReservationTimeRemaining(600);
        return { success: true, reservation: nextHold };
      }

      // If Firestore transaction explicitly rejected due to insufficient stock or validation, never bypass!
      if (fsRes.code === 'INSUFFICIENT_INVENTORY' || fsRes.code === 'RESERVATION_ERROR') {
        await refreshLiveInventory({ eventId });
        return {
          success: false,
          code: fsRes.code,
          error: fsRes.message || 'Selected quantity is no longer available.',
        };
      }
      // If PERMISSION_DENIED (rules not yet deployed), allow local fallback with console diagnostic
    }

    const localRes = createReservation(targetItems);
    if (!localRes.success || !localRes.reservation) {
      return {
        success: false,
        code: 'INSUFFICIENT_INVENTORY',
        error: localRes.error || 'Selected quantity is no longer available.',
      };
    }

    const localHold: ActiveReservationState = {
      reservationId: localRes.reservation.id,
      reservationReference: localRes.reservation.reservationReference,
      eventId: localRes.reservation.eventId,
      expiresAt: localRes.reservation.expiresAt,
      items: [...targetItems],
      source: 'local',
      stockDeductedLocally: true,
    };
    return { success: true, reservation: localHold };
  };

  // End-to-end Smart Booking Selection: validate live stock -> atomic hold -> set cart with exact requested quantity
  const reserveAndSelectTicket = async (
    ticket: TicketType,
    event: GrandPrixEvent,
    quantity: number,
    idempotencyKey?: string
  ): Promise<{ success: boolean; reservation?: ActiveReservationState; error?: string; code?: string }> => {
    const cleanQty = Math.max(1, Math.floor(quantity));
    const maxAllowed = Math.max(1, ticket.maxPerOrder || 8);
    if (cleanQty > maxAllowed) {
      return {
        success: false,
        code: 'VALIDATION_FAILED',
        error: `Maximum ${maxAllowed} tickets per order allowed for ${ticket.name}.`,
      };
    }

    const newItem: CartItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventId: event.id,
      eventName: event.name,
      circuit: event.circuit,
      dates: event.dates,
      ticketTypeId: ticket.id,
      ticketName: ticket.name,
      category: ticket.category,
      raceDay: ticket.raceDay,
      section: ticket.section,
      unitPrice: ticket.price,
      fee: ticket.fee,
      quantity: cleanQty,
    };

    const res = await reserveItemsForCart([newItem], event.id, idempotencyKey);
    if (!res.success) {
      return res;
    }

    setCart([newItem]);
    return res;
  };

  const cancelReservation = (reservationId: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (target && target.status === 'active') {
      restoreLocalStockForItems(target.items, target.reservationReference, 'cancelled');
    }
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'released' as const } : r))
    );
    if (activeReservation?.reservationId === reservationId) {
      setActiveReservation(null);
    }
  };

  const addToCart = (
    ticket: TicketType,
    event: GrandPrixEvent,
    quantity = 1,
    seatDetails?: { grandstand: string; row: string; seatNumber: number }
  ) => {
    const liveTicket = tickets.find((t) => t.id === ticket.id) || ticket;
    const maxAllowed = Math.min(liveTicket.maxPerOrder || 8, Math.max(0, liveTicket.availableQuantity));
    if (maxAllowed <= 0) return;

    // Reset reservation timer on new ticket add
    setReservationTimeRemaining(600);

    setCart((prev) => {
      if (seatDetails) {
        const newItem: CartItem = {
          id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          eventId: event.id,
          eventName: event.name,
          circuit: event.circuit,
          dates: event.dates,
          ticketTypeId: ticket.id,
          ticketName: ticket.name,
          category: ticket.category,
          raceDay: ticket.raceDay,
          section: `${ticket.section} - Row ${seatDetails.row}, Seat ${seatDetails.seatNumber}`,
          seatDetails,
          unitPrice: ticket.price,
          fee: ticket.fee,
          quantity: 1,
        };
        return [...prev, newItem];
      }

      const existing = prev.find((item) => item.ticketTypeId === ticket.id && !item.seatDetails);
      if (existing) {
        const nextQty = Math.min(maxAllowed, existing.quantity + quantity);
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: nextQty } : item
        );
      }

      const newItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        eventId: event.id,
        eventName: event.name,
        circuit: event.circuit,
        dates: event.dates,
        ticketTypeId: ticket.id,
        ticketName: ticket.name,
        category: ticket.category,
        raceDay: ticket.raceDay,
        section: ticket.section,
        unitPrice: ticket.price,
        fee: ticket.fee,
        quantity: Math.min(maxAllowed, Math.max(1, quantity)),
      };
      return [...prev, newItem];
    });
  };

  const addAddonToCart = (addon: Concert | PremiumPackage, event: GrandPrixEvent) => {
    setReservationTimeRemaining(600);
    const isConcert = 'artist' in addon;
    const newItem: CartItem = {
      id: `ci-addon-${Date.now()}`,
      eventId: event.id,
      eventName: event.name,
      circuit: event.circuit,
      dates: isConcert ? (addon as Concert).date : event.dates,
      ticketTypeId: addon.id,
      ticketName: addon.name,
      category: isConcert ? 'concert' : 'vip_hospitality',
      raceDay: isConcert ? 'Saturday' : 'Weekend Pass',
      section: isConcert ? (addon as Concert).venue : (addon as PremiumPackage).tier,
      unitPrice: addon.price,
      fee: 20,
      quantity: 1,
      isAddon: true,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const updateCartQuantity = (cartItemId: string, quantity: number): { success: boolean; error?: string } => {
    const targetItem = cart.find((item) => item.id === cartItemId);
    if (!targetItem) {
      return { success: false, error: 'Cart item not found.' };
    }

    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return { success: true };
    }

    if (!targetItem.isAddon) {
      const liveTicket = tickets.find((t) => t.id === targetItem.ticketTypeId);
      if (liveTicket) {
        // Include quantity already reserved by this customer's active hold when computing ceiling
        const heldByThisUser =
          activeReservation && activeReservation.items.some((i) => i.ticketTypeId === targetItem.ticketTypeId)
            ? activeReservation.items
                .filter((i) => i.ticketTypeId === targetItem.ticketTypeId)
                .reduce((sum, i) => sum + i.quantity, 0)
            : 0;
        const effectiveAvailable = liveTicket.availableQuantity + heldByThisUser;
        const maxPerOrder = Math.max(1, liveTicket.maxPerOrder || 8);

        if (quantity > maxPerOrder) {
          return {
            success: false,
            error: `Maximum ${maxPerOrder} tickets per order for ${targetItem.ticketName}.`,
          };
        }
        if (quantity > effectiveAvailable) {
          return {
            success: false,
            error: `Only ${effectiveAvailable} ticket(s) currently available for ${targetItem.ticketName}.`,
          };
        }
      }
    }

    // Release outdated hold so checkout re-reserves the exact new quantity atomically
    if (activeReservation) {
      void releaseActiveReservation('quantity_updated');
    }

    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
    return { success: true };
  };

  const removeFromCart = (cartItemId: string) => {
    if (activeReservation) {
      void releaseActiveReservation('cart_item_removed');
    }
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    if (activeReservation) {
      void releaseActiveReservation('cart_cleared');
    }
    setCart([]);
    setAppliedDiscount(null);
  };

  const applyDiscountCode = (code: string) => {
    const found = discounts.find(
      (d) => d.code.toUpperCase() === code.trim().toUpperCase() && d.active
    );
    if (!found) {
      return { success: false, message: 'Invalid or expired promotional code' };
    }
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    if (subtotal < found.minSpend) {
      return {
        success: false,
        message: `Minimum order spend of ${formatPrice(found.minSpend)} required for this code.`,
      };
    }
    setAppliedDiscount(found);
    return { success: true, message: `Discount code "${found.code}" applied successfully!` };
  };

  const removeDiscountCode = () => {
    setAppliedDiscount(null);
  };

  const createOrder = async (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCountry: string;
    billingAddress: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
      taxId?: string;
    };
    attendees: { fullName: string; email: string; ticketId: string }[];
    paymentMethod: string;
    cardLast4?: string;
    idempotencyKey?: string;
  }): Promise<Order> => {
    // Idempotency guard: prevent duplicate orders or double deduction on double-submit
    if (orderData.idempotencyKey) {
      const existingOrder = processedOrderKeysRef.current.get(orderData.idempotencyKey);
      if (existingOrder) {
        return existingOrder;
      }
    }

    cleanupExpiredReservations();

    if (cart.length === 0) {
      throw new Error('Cart is empty. Please select your Formula 1 passes before checking out.');
    }

    // Check if an active, unexpired reservation already atomically deducted stock for these exact cart items
    const hasMatchingValidHold = Boolean(
      activeReservation &&
        (activeReservation.source === 'firestore' ||
          (activeReservation.source === 'local' && activeReservation.stockDeductedLocally)) &&
        new Date(activeReservation.expiresAt).getTime() > Date.now() &&
        itemsMatchQuantities(activeReservation.items, cart)
    );

    if (!hasMatchingValidHold) {
      // Live inventory validation right before confirming purchase (prevents overselling)
      for (const item of cart) {
        if (item.isAddon) continue;
        const ticket = tickets.find((t) => t.id === item.ticketTypeId);
        if (!ticket || ticket.status === 'sold_out' || ticket.availableQuantity < item.quantity) {
          const avail = ticket ? ticket.availableQuantity : 0;
          throw new Error(
            `Insufficient inventory remaining for ${item.ticketName}. Only ${avail} available, requested ${item.quantity}.`
          );
        }
      }
    }

    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const serviceFee = cart.reduce((acc, item) => acc + item.fee * item.quantity, 0);
    const tax = Math.round((subtotal + serviceFee) * 0.10);

    let discount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.discountPercent) {
        discount = Math.round((subtotal * appliedDiscount.discountPercent) / 100);
      } else if (appliedDiscount.discountAmount) {
        discount = appliedDiscount.discountAmount;
      }
    }
    const total = subtotal + serviceFee + tax - discount;
    const orderNumber = `MST-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ord-${Date.now()}`;

    const issuedTickets: IssuedTicket[] = [];
    cart.forEach((item, itemIdx) => {
      for (let i = 0; i < item.quantity; i++) {
        const attendee = orderData.attendees[i] || {
          fullName: orderData.customerName,
          email: orderData.customerEmail,
          ticketId: item.ticketTypeId,
        };

        const ticketNum = generateCollisionResistantTicketNumber(item.circuit);

        issuedTickets.push({
          id: `tkt-${Date.now()}-${itemIdx}-${i}`,
          ticketNumber: ticketNum,
          orderId,
          orderNumber,
          eventName: item.eventName,
          circuit: item.circuit,
          raceDay: item.raceDay,
          category: item.category === 'grandstand' ? `Grandstand: ${item.ticketName}` : item.ticketName,
          section: item.section,
          row: item.seatDetails?.row || 'Free Seating',
          seat: item.seatDetails?.seatNumber || i + 1,
          attendeeName: attendee.fullName,
          barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
          qrCodeValue: `https://mastrotickets.ae/verify-ticket/${ticketNum}`,
          deliveryStatus: 'ready_for_download',
          status: 'issued',
          issuedAt: new Date().toISOString(),
        });
      }
    });

    const isGuestPurchase = !isAuthenticated;
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: isGuestPurchase ? 'guest' : (firebaseUid || currentUser.uid),
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      customerCountry: orderData.customerCountry,
      billingAddress: orderData.billingAddress,
      attendees: orderData.attendees,
      items: [...cart],
      subtotal,
      serviceFee,
      tax,
      discount,
      discountCode: appliedDiscount?.code,
      total,
      currency,
      status: 'confirmed',
      paymentId: `pi_verified_${Math.random().toString(36).substr(2, 12)}`,
      stripeSessionId: `cs_verified_${Math.random().toString(36).substr(2, 16)}`,
      paymentMethod: orderData.paymentMethod,
      cardLast4: orderData.cardLast4 || '4242',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      isGuestOrder: isGuestPurchase,
      tickets: issuedTickets,
    };

    // Build MastroTickets transactional order confirmation email
    const confirmationDetails = extractOrderConfirmationDetails(newOrder, formatPrice);
    const confirmationSubject = buildOrderConfirmationSubject(orderNumber);
    const confirmationBody = buildOrderConfirmationEmailBody(confirmationDetails);

    const emailJob1: EmailJob = {
      id: `emj-${Date.now()}-1`,
      orderId,
      recipientEmail: orderData.customerEmail,
      recipientName: orderData.customerName,
      template: 'order_confirmation',
      subject: confirmationSubject,
      bodyText: confirmationBody,
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: 0,
    };

    const orderAuditLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorId: newOrder.customerId,
      actorEmail: orderData.customerEmail,
      actorRole: currentUser.role || 'customer',
      action: 'ORDER_CONFIRMED',
      targetRecord: orderNumber,
      timestamp: new Date().toISOString(),
      changeSummary: `Order ${orderNumber} confirmed for ${orderData.customerName} (${formatPrice(total)}) via ${orderData.paymentMethod}. Issued ${issuedTickets.length} unique ticket(s).`,
    };

    // Persist atomically in Firestore (finalizes active hold or deducts live stock without double-deduction)
    let persistedInFirestore = false;
    try {
      await completeOrderTransaction({
        order: newOrder,
        cartItems: cart,
        activeReservationId: activeReservation?.source === 'firestore' ? activeReservation.reservationId : undefined,
        appliedDiscountId: appliedDiscount?.id,
        emailJob: emailJob1,
        auditLog: orderAuditLog,
      });
      persistedInFirestore = true;
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('insufficient')) {
        await refreshLiveInventory();
        throw err;
      }
      console.warn('Firestore order persistence notice:', errMsg);
      setFirestoreSyncError('Order saved locally; publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules to enable cloud sync.');
    }

    if (orderData.idempotencyKey) {
      processedOrderKeysRef.current.set(orderData.idempotencyKey, newOrder);
    }

    if (isGuestPurchase) {
      const ref: GuestOrderRef = {
        orderId,
        orderNumber,
        eventName: cart[0]?.eventName || 'Formula 1 Grand Prix',
        createdAt: newOrder.createdAt,
      };
      setGuestOrderRefs((prev) => [ref, ...prev.filter((r) => r.orderId !== orderId)].slice(0, 10));
    }

    // Update local state immediately (avoid double-deducting if Firestore or local hold already deducted)
    const newMutations: InventoryMutation[] = [];
    if (!persistedInFirestore) {
      if (hasMatchingValidHold && activeReservation) {
        cart.forEach((item) => {
          if (item.isAddon) return;
          const ticket = tickets.find((t) => t.id === item.ticketTypeId);
          if (ticket) {
            newMutations.push({
              id: `inv-conf-${Date.now()}-${ticket.id}`,
              timestamp: new Date().toISOString(),
              type: 'PAYMENT_CONFIRMED_DEDUCTED',
              ticketTypeId: ticket.id,
              ticketName: ticket.name,
              quantityDelta: 0,
              previousStock: ticket.availableQuantity,
              newStock: ticket.availableQuantity,
              referenceId: orderId,
              notes: `Confirmed order #${orderNumber} from active hold ${activeReservation.reservationReference} (${item.quantity} pass(es), already held).`,
            });
          }
        });
      } else {
        setTickets((prev) =>
          prev.map((t) => {
            const cartMatch = cart.find((c) => !c.isAddon && c.ticketTypeId === t.id);
            if (cartMatch) {
              const updatedQty = Math.max(0, t.availableQuantity - cartMatch.quantity);
              newMutations.push({
                id: `inv-mut-${Date.now()}-${t.id}`,
                timestamp: new Date().toISOString(),
                type: 'PAYMENT_CONFIRMED_DEDUCTED',
                ticketTypeId: t.id,
                ticketName: t.name,
                quantityDelta: -cartMatch.quantity,
                previousStock: t.availableQuantity,
                newStock: updatedQty,
                referenceId: orderId,
                notes: `Confirmed order #${orderNumber}. Deducted ${cartMatch.quantity} pass(es).`,
              });
              return {
                ...t,
                availableQuantity: updatedQty,
                status: updatedQty === 0 ? 'sold_out' : updatedQty < 30 ? 'low_inventory' : 'available',
              };
            }
            return t;
          })
        );
      }
      if (newMutations.length > 0) {
        setInventoryLedger((prev) => [...newMutations, ...prev]);
      }
    }

    setEmailJobs((prev) => [emailJob1, ...prev.filter((j) => j.id !== emailJob1.id)]);
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    setAuditLogs((prev) => [orderAuditLog, ...prev.filter((a) => a.id !== orderAuditLog.id)]);

    if (appliedDiscount && !persistedInFirestore) {
      setDiscounts((prev) =>
        prev.map((d) => (d.id === appliedDiscount.id ? { ...d, usedCount: d.usedCount + 1 } : d))
      );
    }

    const confirmedHoldId = activeReservation?.reservationId;
    setActiveReservation(null);
    setReservations((prev) =>
      prev.map((r) =>
        (confirmedHoldId && r.id === confirmedHoldId) ||
        (r.customerId === currentUser.uid && r.status === 'active')
          ? { ...r, status: 'confirmed' as const }
          : r
      )
    );

    // Clear cart directly without triggering reservation release
    setCart([]);
    setAppliedDiscount(null);
    return newOrder;
  };

  const updateEvent = (updated: GrandPrixEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    persistFireAndForget(saveEventDoc(updated), `updateEvent:${updated.id}`);
    addAuditLog('EVENT_UPDATED', updated.slug, `Updated details for ${updated.name}`);
  };

  const createEvent = (newEventData: Omit<GrandPrixEvent, 'id' | 'slug'>): GrandPrixEvent => {
    const slug = newEventData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `event-${Date.now()}`;
    const id = `gp-${Date.now()}`;
    const newEvent: GrandPrixEvent = {
      ...newEventData,
      id,
      slug
    };
    setEvents((prev) => [...prev, newEvent]);
    persistFireAndForget(saveEventDoc(newEvent), `createEvent:${id}`);
    addAuditLog('EVENT_CREATED', slug, `Created new event listing: ${newEvent.name}`);
    return newEvent;
  };

  const deleteEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    const linkedTickets = tickets.filter((t) => t.eventId === eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setTickets((prev) => prev.filter((t) => t.eventId !== eventId));
    persistFireAndForget(removeDocument(COLLECTIONS.EVENTS, eventId), `deleteEvent:${eventId}`);
    linkedTickets.forEach((t) => {
      persistFireAndForget(removeDocument(COLLECTIONS.TICKETS, t.id), `deleteTicket:${t.id}`);
    });
    addAuditLog('EVENT_DELETED', event?.slug || eventId, `Deleted event listing: ${event?.name || eventId}`);
  };

  const updateTicket = (updated: TicketType) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    persistFireAndForget(saveTicketDoc(updated), `updateTicket:${updated.id}`);
    addAuditLog('TICKET_UPDATED', updated.id, `Modified ticket type: ${updated.name} (price: $${updated.price}, avail: ${updated.availableQuantity})`);
  };

  const createTicket = (newTicketData: Omit<TicketType, 'id'>): TicketType => {
    const id = `tkt-custom-${Date.now()}`;
    const newTicket: TicketType = {
      ...newTicketData,
      id
    };
    setTickets((prev) => [...prev, newTicket]);
    persistFireAndForget(saveTicketDoc(newTicket), `createTicket:${id}`);
    addAuditLog('TICKET_CREATED', id, `Created ticket: ${newTicket.name} (${newTicket.raceDay})`);
    return newTicket;
  };

  const deleteTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    persistFireAndForget(removeDocument(COLLECTIONS.TICKETS, ticketId), `deleteTicket:${ticketId}`);
    addAuditLog('TICKET_DELETED', ticketId, `Deleted ticket: ${ticket?.name || ticketId}`);
  };

  const addCategory = (categoryData: Omit<EventCategory, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const newCat: EventCategory = { ...categoryData, id };
    setCategories((prev) => [...prev, newCat]);
    persistFireAndForget(saveCategoryDoc(newCat), `addCategory:${id}`);
    addAuditLog('CATEGORY_CREATED', newCat.slug, `Created category: ${newCat.name}`);
  };

  const updateCategory = (updated: EventCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    persistFireAndForget(saveCategoryDoc(updated), `updateCategory:${updated.id}`);
    addAuditLog('CATEGORY_UPDATED', updated.slug, `Updated category: ${updated.name}`);
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    persistFireAndForget(removeDocument(COLLECTIONS.CATEGORIES, categoryId), `deleteCategory:${categoryId}`);
    addAuditLog('CATEGORY_DELETED', cat?.slug || categoryId, `Deleted category: ${cat?.name || categoryId}`);
  };

  const sendCustomEmail = (data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    bodyText: string;
    template?: EmailJob['template'];
  }) => {
    const emailJob: EmailJob = {
      id: `emj-custom-${Date.now()}`,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      template: data.template || 'custom_announcement',
      subject: data.subject,
      bodyText: data.bodyText,
      status: 'delivered',
      sentAt: new Date().toISOString()
    };
    setEmailJobs((prev) => [emailJob, ...prev]);
    persistFireAndForget(saveEmailJobDoc(emailJob), `sendCustomEmail:${emailJob.id}`);
    addAuditLog('EMAIL_SENT', data.recipientEmail, `Dispatched email to ${data.recipientName} <${data.recipientEmail}>: "${data.subject}"`);
    return { success: true, message: `Email delivered to ${data.recipientEmail} via Resend API.` };
  };

  // Public Ticket Verification: strictly redacts customer PII
  const verifyTicketPublicly = (ticketNumber: string): PublicTicketVerification => {
    const cleanNumber = ticketNumber.trim().toUpperCase();
    if (!cleanNumber) {
      return { valid: false, error: 'Please provide a valid Mastrotickets reference number.' };
    }

    let foundTicket: IssuedTicket | null = null;
    let parentOrder: Order | null = null;

    for (const order of orders) {
      const match = order.tickets.find(
        (t) => t.ticketNumber.trim().toUpperCase() === cleanNumber
      );
      if (match) {
        foundTicket = match;
        parentOrder = order;
        break;
      }
    }

    if (!foundTicket || !parentOrder) {
      return {
        valid: false,
        error: `No record matching reference "${cleanNumber}" was found in the official Mastrotickets registry. Please verify the code on your e-ticket voucher.`
      };
    }

    // Mask attendee name for privacy: "Sultan Al-Nuaimi" -> "S. Al-Nuaimi"
    const rawName = foundTicket.attendeeName || 'Guest Attendee';
    const parts = rawName.split(' ');
    const masked = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : rawName;

    const isTicketActive = foundTicket.status === 'issued';
    const isOrderValid = parentOrder.status !== 'refunded' && parentOrder.status !== 'cancelled';
    const isValid = isTicketActive && isOrderValid;

    return {
      valid: isValid,
      ticket: {
        ticketNumber: foundTicket.ticketNumber,
        eventName: foundTicket.eventName,
        circuit: foundTicket.circuit,
        raceDay: foundTicket.raceDay,
        category: foundTicket.category,
        section: foundTicket.section,
        row: foundTicket.row,
        seat: foundTicket.seat,
        maskedAttendee: masked,
        status: foundTicket.status || 'issued',
        deliveryStatus: foundTicket.deliveryStatus,
        issuedAt: foundTicket.issuedAt || parentOrder.createdAt,
        verificationTimestamp: new Date().toISOString(),
        isOfficialPass: true,
        verificationNotice:
          'This ticket pass is verified through Mastrotickets Official Booking Services. Admission is subject to circuit promoter turnstile validation.'
      }
    };
  };

  const voidTicket = (ticketNumber: string, reason: string) => {
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((order) => {
        const hasTicket = order.tickets.some((t) => t.ticketNumber === ticketNumber);
        if (hasTicket) {
          updatedOrder = {
            ...order,
            tickets: order.tickets.map((t) =>
              t.ticketNumber === ticketNumber
                ? { ...t, status: 'void' as const, voidReason: reason }
                : t
            )
          };
          return updatedOrder;
        }
        return order;
      })
    );

    if (!updatedOrder) {
      return { success: false, message: `Ticket ${ticketNumber} not found.` };
    }

    persistFireAndForget(saveOrderDoc(updatedOrder), `voidTicket:${ticketNumber}`);

    addAuditLog(
      'TICKET_VOIDED',
      ticketNumber,
      `Ticket ${ticketNumber} was voided by administrator. Reason: ${reason}`
    );

    return { success: true, message: `Ticket ${ticketNumber} has been successfully voided.` };
  };

  const reissueTicket = (ticketNumber: string, newAttendeeName?: string) => {
    let reissuedNum = '';
    let updatedOrder: Order | null = null;

    setOrders((prev) =>
      prev.map((order) => {
        const ticketIdx = order.tickets.findIndex((t) => t.ticketNumber === ticketNumber);
        if (ticketIdx !== -1) {
          const oldTicket = order.tickets[ticketIdx];
          reissuedNum = generateCollisionResistantTicketNumber(oldTicket.circuit);
          const updatedOld: IssuedTicket = {
            ...oldTicket,
            status: 'void' as const,
            voidReason: `Reissued under new reference ${reissuedNum}`
          };
          const newTicket: IssuedTicket = {
            ...oldTicket,
            id: `tkt-reissue-${Date.now()}`,
            ticketNumber: reissuedNum,
            attendeeName: newAttendeeName || oldTicket.attendeeName,
            status: 'issued',
            deliveryStatus: 'ready_for_download',
            issuedAt: new Date().toISOString(),
            qrCodeValue: `https://mastrotickets.ae/verify-ticket/${reissuedNum}`
          };
          const updatedTickets = [...order.tickets];
          updatedTickets[ticketIdx] = updatedOld;
          updatedTickets.push(newTicket);
          updatedOrder = { ...order, tickets: updatedTickets };
          return updatedOrder;
        }
        return order;
      })
    );

    if (!updatedOrder) {
      return { success: false, message: `Ticket ${ticketNumber} not found.` };
    }

    persistFireAndForget(saveOrderDoc(updatedOrder), `reissueTicket:${reissuedNum}`);

    addAuditLog(
      'TICKET_REISSUED',
      reissuedNum,
      `Ticket ${ticketNumber} voided and reissued as ${reissuedNum} for ${newAttendeeName || 'attendee'}.`
    );

    return {
      success: true,
      message: `Ticket successfully reissued. New reference: ${reissuedNum}`,
      newTicketNumber: reissuedNum
    };
  };

  const retryEmailJob = (jobId: string) => {
    const job = emailJobs.find((j) => j.id === jobId);
    if (!job) return { success: false, message: 'Email dispatch record not found' };

    const updatedJob: EmailJob = {
      ...job,
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: (job.retryCount || 0) + 1,
      errorReason: undefined
    };

    setEmailJobs((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));
    persistFireAndForget(saveEmailJobDoc(updatedJob), `retryEmailJob:${jobId}`);

    addAuditLog(
      'EMAIL_RETRIED',
      job.recipientEmail,
      `Retried email delivery for job ${jobId} to ${job.recipientEmail} via Resend API.`
    );

    return { success: true, message: `Email to ${job.recipientEmail} delivered successfully via Resend.` };
  };

  const refundOrder = (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };
    if (order.status === 'refunded') return { success: false, message: 'Order already refunded' };

    const refundedOrder: Order = {
      ...order,
      status: 'refunded',
      tickets: order.tickets.map((t) => ({ ...t, status: 'refunded' as const, voidReason: `Refunded: ${reason}` }))
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? refundedOrder : o)));
    persistFireAndForget(saveOrderDoc(refundedOrder), `refundOrder:${orderId}`);

    // Restore inventory & write to ledger
    const newMutations: InventoryMutation[] = [];
    const restockedTickets: TicketType[] = [];
    setTickets((prev) =>
      prev.map((t) => {
        const item = order.items.find((i) => i.ticketTypeId === t.id);
        if (item) {
          const restoredQty = Math.min(t.capacity, t.availableQuantity + item.quantity);
          const mutation: InventoryMutation = {
            id: `inv-mut-${Date.now()}-${t.id}`,
            timestamp: new Date().toISOString(),
            type: 'REFUND_RESTOCKED',
            ticketTypeId: t.id,
            ticketName: t.name,
            quantityDelta: item.quantity,
            previousStock: t.availableQuantity,
            newStock: restoredQty,
            referenceId: orderId,
            notes: `Order #${order.orderNumber} refunded (${reason}). Restocked ${item.quantity} pass(es).`
          };
          newMutations.push(mutation);
          const updatedTicket: TicketType = {
            ...t,
            availableQuantity: restoredQty,
            status: restoredQty > 0 ? (restoredQty < 30 ? 'low_inventory' : 'available') : 'sold_out'
          };
          restockedTickets.push(updatedTicket);
          return updatedTicket;
        }
        return t;
      })
    );

    restockedTickets.forEach((t) => persistFireAndForget(saveTicketDoc(t), `refundRestock:${t.id}`));
    newMutations.forEach((m) => persistFireAndForget(saveLedgerEntryDoc(m), `refundLedger:${m.id}`));

    if (newMutations.length > 0) {
      setInventoryLedger((prev) => [...newMutations, ...prev]);
    }

    // Queue refund email
    const emailJob: EmailJob = {
      id: `emj-refund-${Date.now()}`,
      orderId,
      recipientEmail: order.customerEmail,
      recipientName: order.customerName,
      template: 'refund_notification',
      subject: `Refund Processed for Order #${order.orderNumber} - Mastrotickets`,
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: 0
    };
    setEmailJobs((prev) => [emailJob, ...prev]);
    persistFireAndForget(saveEmailJobDoc(emailJob), `refundEmail:${emailJob.id}`);

    addAuditLog('ORDER_REFUNDED', order.orderNumber, `Refunded order #${order.orderNumber} (${formatPrice(order.total)}). Reason: ${reason}`);

    return { success: true, message: `Order #${order.orderNumber} successfully refunded via Stripe.` };
  };

  const resendConfirmationEmail = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const confirmationDetails = extractOrderConfirmationDetails(order, formatPrice);
    const emailJob: EmailJob = {
      id: `emj-resend-${Date.now()}`,
      orderId,
      recipientEmail: order.customerEmail,
      recipientName: order.customerName,
      template: 'order_confirmation',
      subject: buildOrderConfirmationSubject(order.orderNumber),
      bodyText: buildOrderConfirmationEmailBody(confirmationDetails),
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: 0
    };
    setEmailJobs((prev) => [emailJob, ...prev]);
    persistFireAndForget(saveEmailJobDoc(emailJob), `resendEmail:${emailJob.id}`);
    addAuditLog('EMAIL_RESENT', order.orderNumber, `Resent confirmation email to ${order.customerEmail}`);

    return { success: true, message: `Confirmation email re-delivered to ${order.customerEmail} via MastroTickets.` };
  };

  const createDiscountCode = (data: Omit<DiscountCode, 'id' | 'usedCount'>) => {
    const newCode: DiscountCode = {
      ...data,
      id: `disc-${Date.now()}`,
      usedCount: 0
    };
    setDiscounts((prev) => [...prev, newCode]);
    persistFireAndForget(saveDiscountDoc(newCode), `createDiscount:${newCode.id}`);
    addAuditLog('DISCOUNT_CREATED', newCode.code, `Created promotional discount ${newCode.code}`);
  };

  const toggleDiscountActive = (id: string) => {
    const existing = discounts.find((d) => d.id === id);
    if (!existing) return;
    const updated = { ...existing, active: !existing.active };
    setDiscounts((prev) => prev.map((d) => (d.id === id ? updated : d)));
    persistFireAndForget(saveDiscountDoc(updated), `toggleDiscount:${id}`);
  };

  // Authoritative guest order claiming — requires authenticated UID + verified email
  const claimGuestOrdersInternal = (uid: string, verifiedEmail: string): { claimedCount: number; claimedOrderNumbers: string[] } => {
    const cleanEmail = verifiedEmail.trim().toLowerCase();
    if (!uid || uid === 'guest' || !cleanEmail) {
      return { claimedCount: 0, claimedOrderNumbers: [] };
    }

    const claimedNumbers: string[] = [];
    const claimedOrderDocs: Order[] = [];
    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        const isEligibleGuest =
          (o.customerId === 'guest' || o.isGuestOrder === true) &&
          !o.claimedByUid &&
          o.customerEmail.trim().toLowerCase() === cleanEmail &&
          ['paid', 'confirmed', 'partially_refunded', 'refunded'].includes(o.status);

        if (isEligibleGuest) {
          claimedNumbers.push(o.orderNumber);
          const updatedOrder: Order = {
            ...o,
            customerId: uid,
            isGuestOrder: false,
            claimedByUid: uid,
            claimedAt: nowIso,
          };
          claimedOrderDocs.push(updatedOrder);
          return updatedOrder;
        }
        return o;
      })
    );

    claimedOrderDocs.forEach((order) => {
      persistFireAndForget(saveOrderDoc(order), `claimGuestOrder:${order.id}`);
    });

    if (claimedNumbers.length > 0) {
      setGuestOrderRefs((prev) => prev.filter((r) => !claimedNumbers.includes(r.orderNumber)));
      addAuditLog(
        'GUEST_ORDERS_CLAIMED',
        uid,
        `Linked ${claimedNumbers.length} verified guest order(s) (${claimedNumbers.join(', ')}) to customer account ${cleanEmail}.`
      );
      setLastClaimedNotice(
        `${claimedNumbers.length} previous guest booking${claimedNumbers.length > 1 ? 's' : ''} (${claimedNumbers.join(', ')}) linked to your account.`
      );
    }

    return { claimedCount: claimedNumbers.length, claimedOrderNumbers: claimedNumbers };
  };

  const getAccessibleCustomerOrders = (): Order[] => {
    if (isAuthenticated) {
      return orders.filter((o) => o.customerId === currentUser.uid);
    }
    const allowedIds = new Set(guestOrderRefs.map((r) => r.orderId));
    return orders.filter((o) => allowedIds.has(o.id) && (o.customerId === 'guest' || o.isGuestOrder));
  };

  const updateUserProfile = async (updates: {
    displayName: string;
    phone?: string;
    country?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanName = updates.displayName.trim();
    if (!cleanName) {
      return { success: false, message: 'Display name cannot be empty.' };
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      displayName: cleanName,
      phone: updates.phone?.trim() || '',
      country: updates.country?.trim() || 'Hungary',
    };
    setCurrentUser(updatedProfile);

    if (auth.currentUser) {
      try {
        await updateFirebaseProfile(auth.currentUser, { displayName: cleanName });
      } catch {
        // Non-fatal if displayName update fails
      }
      persistFireAndForget(
        saveUserProfileDoc({ ...updatedProfile, role: isFirebaseAdmin ? 'admin' : 'customer' }).then((res) => {
          if (res.permissionDenied) {
            setFirestoreSyncError(
              'Firestore profile write blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
            );
          }
        }),
        'updateUserProfile'
      );
    }

    return { success: true, message: 'Profile saved successfully.' };
  };

  const registerWithEmail = async (data: {
    displayName: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
  }): Promise<{ success: boolean; message: string; claimedCount?: number }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.displayName.trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (data.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const fbUser = cred.user;

      await updateFirebaseProfile(fbUser, { displayName: cleanName }).catch(() => {});

      let verificationSent = false;
      try {
        await sendEmailVerification(fbUser);
        verificationSent = true;
      } catch {
        verificationSent = false;
      }

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || cleanEmail,
        displayName: cleanName,
        phone: data.phone?.trim() || '',
        country: data.country?.trim() || 'Hungary',
        role: 'customer',
        isAuthenticated: true,
        emailVerified: fbUser.emailVerified,
        authProvider: 'password',
      };
      setCurrentUser(newProfile);
      syncedUserProfileUidRef.current = fbUser.uid;
      persistFireAndForget(
        saveUserProfileDoc(newProfile).then((res) => {
          if (res.permissionDenied) {
            setFirestoreSyncError(
              'Firestore profile write blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
            );
          }
        }),
        `registerProfile:${fbUser.uid}`
      );

      return {
        success: true,
        message: verificationSent
          ? 'Account created! A verification email has been sent to your inbox.'
          : 'Account created successfully! Welcome to MastroTickets.',
        claimedCount: 0,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
      };
    }
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; claimedCount?: number }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = cred.user;
      const resolvedEmail = (fbUser.email || cleanEmail).toLowerCase();

      const hasAdminRole =
        (fbUser.emailVerified && resolvedEmail === ADMIN_EMAIL) ||
        (await checkIsAdminDoc(fbUser.uid));
      setIsFirebaseAdmin(hasAdminRole);

      const { profile: existingDoc } = await fetchUserProfileStatus(fbUser.uid);
      const syncedProfile: UserProfile = {
        uid: fbUser.uid,
        email: existingDoc?.email || fbUser.email || cleanEmail,
        displayName: existingDoc?.displayName || fbUser.displayName || resolvedEmail.split('@')[0],
        phone: existingDoc?.phone || '',
        country: existingDoc?.country || 'Hungary',
        role: hasAdminRole ? 'admin' : 'customer',
        avatarUrl: fbUser.photoURL || existingDoc?.avatarUrl,
        isAuthenticated: true,
        emailVerified: fbUser.emailVerified,
        authProvider: 'password',
      };
      setCurrentUser(syncedProfile);

      let claimedCount = 0;
      if (fbUser.emailVerified) {
        claimedCount = claimGuestOrdersInternal(fbUser.uid, resolvedEmail).claimedCount;
      }

      return {
        success: true,
        message:
          claimedCount > 0
            ? `Signed in successfully and linked ${claimedCount} previous guest order(s).`
            : 'Signed in successfully.',
        claimedCount,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
      };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset email sent to ${cleanEmail}. Please check your inbox and spam folder.`,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
      };
    }
  };

  const signInAdminWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const email = (cred.user.email || '').toLowerCase();
      const hasAdmin =
        (cred.user.emailVerified && email === ADMIN_EMAIL) ||
        (await checkIsAdminDoc(cred.user.uid));
      setIsFirebaseAdmin(hasAdmin);
      if (hasAdmin) {
        return {
          success: true,
          message: `Connected Firebase Admin (${email}) for live Firestore sync.`,
        };
      }
      return {
        success: true,
        message: `Signed in as ${email}. To grant Firestore admin write permissions, sign in as ${ADMIN_EMAIL} or add UID ${cred.user.uid} to the admins collection.`,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
      };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message: string; claimedCount?: number }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const email = (fbUser.email || '').toLowerCase();
      const displayName = fbUser.displayName || email.split('@')[0] || 'Google Account User';

      const hasAdminRole =
        (fbUser.emailVerified && email === ADMIN_EMAIL) ||
        (await checkIsAdminDoc(fbUser.uid));
      setIsFirebaseAdmin(hasAdminRole);

      const { profile: existingDoc, permissionDenied } = await fetchUserProfileStatus(fbUser.uid);
      const syncedProfile: UserProfile = {
        uid: fbUser.uid,
        email: existingDoc?.email || fbUser.email || '',
        displayName: existingDoc?.displayName || displayName,
        phone: existingDoc?.phone || '',
        country: existingDoc?.country || 'Hungary',
        role: hasAdminRole ? 'admin' : 'customer',
        avatarUrl: fbUser.photoURL || existingDoc?.avatarUrl,
        isAuthenticated: true,
        emailVerified: fbUser.emailVerified,
        authProvider: 'google',
      };
      setCurrentUser(syncedProfile);

      if (permissionDenied) {
        setFirestoreSyncError(
          'Firestore profile sync blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
        );
      } else if (!existingDoc && fbUser.email && syncedUserProfileUidRef.current !== fbUser.uid) {
        syncedUserProfileUidRef.current = fbUser.uid;
        persistFireAndForget(
          saveUserProfileDoc(syncedProfile).then((res) => {
            if (res.permissionDenied) {
              setFirestoreSyncError(
                'Firestore profile write blocked: Publish firestore.rules in Firebase Console → mastro-tickets → Firestore Database → Rules.'
              );
            }
          }),
          `googleProfile:${fbUser.uid}`
        );
      }

      const { claimedCount } = fbUser.emailVerified
        ? claimGuestOrdersInternal(fbUser.uid, email)
        : { claimedCount: 0 };

      return {
        success: true,
        message:
          claimedCount > 0
            ? `Signed in with Google (${displayName}) and linked ${claimedCount} previous guest order(s).`
            : `Signed in with Google (${displayName}) successfully.`,
        claimedCount,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
      };
    }
  };

  const verifyAccountEmail = async (): Promise<{ success: boolean; message: string; claimedCount: number }> => {
    if (!isAuthenticated || !currentUser.email || !auth.currentUser) {
      return { success: false, message: 'Please sign in first to verify your email.', claimedCount: 0 };
    }

    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setCurrentUser((prev) => ({ ...prev, emailVerified: true }));
        const { claimedCount } = claimGuestOrdersInternal(auth.currentUser.uid, currentUser.email);
        return {
          success: true,
          message:
            claimedCount > 0
              ? `Email verified! ${claimedCount} previous guest order(s) have been linked to your account.`
              : 'Email verified successfully! Your account is now fully verified.',
          claimedCount,
        };
      }

      await sendEmailVerification(auth.currentUser);
      return {
        success: true,
        message: `Verification link sent to ${currentUser.email}. Click the link in your email, then press this button again to refresh your status.`,
        claimedCount: 0,
      };
    } catch (err) {
      return {
        success: false,
        message: formatFirebaseAuthError(err),
        claimedCount: 0,
      };
    }
  };

  const claimGuestOrdersForCurrentUser = async (): Promise<{ success: boolean; message: string; claimedCount: number }> => {
    if (!isAuthenticated) {
      return { success: false, message: 'Authentication required to claim guest orders.', claimedCount: 0 };
    }
    if (!currentUser.emailVerified) {
      return { success: false, message: 'Please verify your email address before linking previous guest orders.', claimedCount: 0 };
    }

    const { claimedCount } = claimGuestOrdersInternal(currentUser.uid, currentUser.email);

    return {
      success: true,
      message:
        claimedCount > 0
          ? `Successfully linked ${claimedCount} previous guest order(s) to your account.`
          : 'No unlinked guest orders were found for your verified email address.',
      claimedCount,
    };
  };

  const logoutUser = () => {
    void signOut(auth).catch(() => {});
    setCurrentUser(DEFAULT_USER);
    setLastClaimedNotice(null);
  };

  return (
    <StoreContext.Provider
      value={{
        events,
        tickets,
        categories,
        concerts,
        premiumPackages,
        orders,
        discounts,
        emailJobs,
        auditLogs,
        inventoryLedger,
        reservations,
        currentUser,
        isAuthenticated,
        isFirebaseAdmin,
        firebaseAuthEmail,
        firestoreSyncError,
        signInAdminWithGoogle,
        guestOrderRefs,
        lastClaimedNotice,
        clearLastClaimedNotice,
        getAccessibleCustomerOrders,
        currency,
        cart,
        appliedDiscount,
        reservationTimeRemaining,
        activeReservation,
        reservationExpiredNotice,
        clearReservationExpiredNotice,
        isInventoryLoading,
        setCurrency,
        setCurrentUser,
        updateUserProfile,
        formatPrice,
        refreshLiveInventory,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        verifyAccountEmail,
        claimGuestOrdersForCurrentUser,
        logoutUser,
        addToCart,
        addAddonToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyDiscountCode,
        removeDiscountCode,
        createReservation,
        reserveAndSelectTicket,
        reserveItemsForCart,
        releaseActiveReservation,
        cancelReservation,
        cleanupExpiredReservations,
        createOrder,
        verifyTicketPublicly,
        voidTicket,
        reissueTicket,
        retryEmailJob,
        updateEvent,
        createEvent,
        deleteEvent,
        updateTicket,
        createTicket,
        deleteTicket,
        addCategory,
        updateCategory,
        deleteCategory,
        sendCustomEmail,
        refundOrder,
        resendConfirmationEmail,
        createDiscountCode,
        toggleDiscountActive,
        addAuditLog,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
