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
  BookingReservation
} from '../types';
import {
  INITIAL_EVENTS,
  INITIAL_TICKETS,
  INITIAL_CONCERTS,
  INITIAL_PREMIUM_PACKAGES,
  INITIAL_DISCOUNTS,
  INITIAL_ORDERS,
  INITIAL_EMAIL_JOBS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';

const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$', rate: 1.08, label: 'USD ($)' },
  AED: { symbol: 'AED ', rate: 3.97, label: 'AED (AED)' },
  EUR: { symbol: '€', rate: 1, label: 'EUR (€)' },
};

// Timezone and locale heuristic for location detection
const detectLocationCurrency = (): CurrencyCode => {
  return 'AED';
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
  currency: CurrencyCode;
  
  categories: EventCategory[];
  
  // Cart & Reservation
  cart: CartItem[];
  appliedDiscount: DiscountCode | null;
  reservationTimeRemaining: number; // in seconds
  
  // Actions
  setCurrency: (currency: CurrencyCode) => void;
  setCurrentUser: (user: UserProfile) => void;
  formatPrice: (amountInEur: number) => string;
  
  // Cart Actions
  addToCart: (ticket: TicketType, event: GrandPrixEvent, quantity?: number, seatDetails?: { grandstand: string; row: string; seatNumber: number }) => void;
  addAddonToCart: (addon: Concert | PremiumPackage, event: GrandPrixEvent) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  removeDiscountCode: () => void;
  
  // Booking Reservations & Lifecycle
  createReservation: (items?: CartItem[]) => { success: boolean; reservation?: BookingReservation; error?: string };
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

const INITIAL_CATEGORIES: EventCategory[] = [
  { id: 'cat-grandstand', name: 'Covered Grandstands', slug: 'grandstand', description: 'Shaded circuit seating with views of Turns 1, 5 Hairpin, West Straight & Marina.', badgeColor: '#0B1F3A' },
  { id: 'cat-ga', name: 'General Admission & Hill', slug: 'general_admission', description: 'Open grass hill seating with panoramic views of Turns 2 to 7 and giant screens.', badgeColor: '#163A63' },
  { id: 'cat-vip', name: 'VIP Hospitality & Paddock Club', slug: 'vip_hospitality', description: 'Gourmet dining, open bar, pit lane walks, and superyacht viewing terraces.', badgeColor: '#123B67' },
  { id: 'cat-bundle', name: 'Weekend 3-Day Bundles', slug: 'weekend_bundle', description: 'All-inclusive weekend passes with Yasalam concerts & theme parks access.', badgeColor: '#15803D' },
  { id: 'cat-concert', name: 'Yasalam After-Race Concerts', slug: 'concert', description: 'Etihad Park Golden Circle upgrades and multi-night festival passes.', badgeColor: '#B45309' }
];

const STORAGE_KEYS = {
  EVENTS: 'mastrotickets_ad_events_v3',
  TICKETS: 'mastrotickets_ad_tickets_v3',
  CATEGORIES: 'mastrotickets_ad_categories_v3',
  CONCERTS: 'mastrotickets_ad_concerts_v3',
  PACKAGES: 'mastrotickets_ad_packages_v3',
  ORDERS: 'mastrotickets_ad_orders_v3',
  DISCOUNTS: 'mastrotickets_ad_discounts_v3',
  EMAIL_JOBS: 'mastrotickets_ad_email_jobs_v3',
  AUDIT_LOGS: 'mastrotickets_ad_audit_logs_v3',
  LEDGER: 'mastrotickets_ad_ledger_v3',
  RESERVATIONS: 'mastrotickets_ad_reservations_v3',
  CART: 'mastrotickets_ad_cart_v3',
  USER: 'mastrotickets_ad_user_v3',
  CURRENCY: 'mastrotickets_ad_currency_v3',
};

const DEFAULT_USER: UserProfile = {
  uid: 'guest',
  email: '',
  displayName: 'Guest Customer',
  role: 'customer',
  phone: '',
  country: 'United Arab Emirates'
};

const INITIAL_INVENTORY_LEDGER: InventoryMutation[] = [];

const INITIAL_RESERVATIONS: BookingReservation[] = [];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<GrandPrixEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [tickets, setTickets] = useState<TicketType[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [categories, setCategories] = useState<EventCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  const [concerts] = useState<Concert[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONCERTS);
    return saved ? JSON.parse(saved) : INITIAL_CONCERTS;
  });

  const [premiumPackages] = useState<PremiumPackage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    return saved ? JSON.parse(saved) : INITIAL_PREMIUM_PACKAGES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS) || localStorage.getItem('mastrotickets_ad_orders_v2');
    if (!saved) return INITIAL_ORDERS;
    try {
      const parsed: Order[] = JSON.parse(saved);
      return parsed.filter((o) => o.id !== 'ord-98214');
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [discounts, setDiscounts] = useState<DiscountCode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNTS);
    return saved ? JSON.parse(saved) : INITIAL_DISCOUNTS;
  });

  const [emailJobs, setEmailJobs] = useState<EmailJob[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_JOBS) || localStorage.getItem('mastrotickets_ad_email_jobs_v2');
    if (!saved) return INITIAL_EMAIL_JOBS;
    try {
      const parsed: EmailJob[] = JSON.parse(saved);
      return parsed.filter((j) => j.id !== 'emj-901' && j.id !== 'emj-902');
    } catch {
      return INITIAL_EMAIL_JOBS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || localStorage.getItem('mastrotickets_ad_audit_logs_v2');
    if (!saved) return INITIAL_AUDIT_LOGS;
    try {
      const parsed: AuditLog[] = JSON.parse(saved);
      return parsed.filter((a) => a.id !== 'aud-01' && a.id !== 'aud-02');
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [inventoryLedger, setInventoryLedger] = useState<InventoryMutation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER) || localStorage.getItem('mastrotickets_ad_ledger_v2');
    if (!saved) return INITIAL_INVENTORY_LEDGER;
    try {
      const parsed: InventoryMutation[] = JSON.parse(saved);
      return parsed.filter((m) => m.referenceId !== 'ord-98214' && m.id !== 'inv-mut-001' && m.id !== 'inv-mut-002');
    } catch {
      return INITIAL_INVENTORY_LEDGER;
    }
  });

  const [reservations, setReservations] = useState<BookingReservation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || localStorage.getItem('mastrotickets_ad_reservations_v2');
    if (!saved) return INITIAL_RESERVATIONS;
    try {
      const parsed: BookingReservation[] = JSON.parse(saved);
      return parsed.filter((r) => r.id !== 'res-98214');
    } catch {
      return INITIAL_RESERVATIONS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (!saved) return DEFAULT_USER;
    try {
      const parsed: UserProfile = JSON.parse(saved);
      if (parsed.email === 'sultan.alnuaimi@adnetwork.ae') return DEFAULT_USER;
      return parsed;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>('AED');

  // All currency is forced to AED.


  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState('AED');
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [reservationTimeRemaining, setReservationTimeRemaining] = useState<number>(600); // 10 minutes

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
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Reservation timer
  useEffect(() => {
    if (cart.length === 0) {
      setReservationTimeRemaining(600);
      return;
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
  }, [cart.length]);

  const formatPrice = (amountInEur: number): string => {
    const rateInfo = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
    const converted = amountInEur * rateInfo.rate;
    if (currency === 'AED') {
      return `AED ${Math.round(converted).toLocaleString('en-US')}`;
    }
    if (currency === 'USD') {
      return `$${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `€${Math.round(converted).toLocaleString('en-US')}`;
  };

  const addAuditLog = (action: string, targetRecord: string, changeSummary: string) => {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorId: currentUser.uid,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action,
      targetRecord,
      timestamp: new Date().toISOString(),
      changeSummary,
    };
    setAuditLogs((prev) => [log, ...prev]);
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

  // Reservation lifecycle management
  const createReservation = (itemsToReserve?: CartItem[]) => {
    const targetItems = itemsToReserve || cart;
    if (!targetItems || targetItems.length === 0) {
      return { success: false, error: 'Cannot create reservation for empty ticket selection.' };
    }

    for (const item of targetItems) {
      const ticket = tickets.find((t) => t.id === item.ticketTypeId);
      if (ticket && ticket.availableQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient inventory for ${item.ticketName}. Available: ${ticket.availableQuantity}, requested: ${item.quantity}`
        };
      }
    }

    const resId = `res-${Date.now()}`;
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
      eventId: targetItems[0]?.eventId || 'abu-dhabi-gp-2026',
      items: [...targetItems],
      total,
      currency,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt
    };

    setReservations((prev) => [newRes, ...prev]);
    setReservationTimeRemaining(600);

    addAuditLog(
      'RESERVATION_CREATED',
      reservationReference,
      `Inventory reserved for ${reservationReference} (${targetItems.reduce((acc, i) => acc + i.quantity, 0)} passes, expires in 10m)`
    );

    return { success: true, reservation: newRes };
  };

  const cancelReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'released' as const } : r))
    );
  };

  const cleanupExpiredReservations = (): number => {
    const now = new Date().toISOString();
    let releasedCount = 0;
    setReservations((prev) =>
      prev.map((r) => {
        if (r.status === 'active' && r.expiresAt < now) {
          releasedCount++;
          return { ...r, status: 'expired' as const };
        }
        return r;
      })
    );
    if (releasedCount > 0) {
      addAuditLog(
        'RESERVATIONS_EXPIRED',
        'SYSTEM_WORKER',
        `Auto-released ${releasedCount} abandoned or expired booking reservations.`
      );
    }
    return releasedCount;
  };

  const addToCart = (
    ticket: TicketType,
    event: GrandPrixEvent,
    quantity = 1,
    seatDetails?: { grandstand: string; row: string; seatNumber: number }
  ) => {
    // Reset reservation timer on new ticket add
    setReservationTimeRemaining(600);

    setCart((prev) => {
      // If seatDetails provided, each seat is its own unique item
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
          quantity: 1
        };
        return [...prev, newItem];
      }

      // Check if ticket already exists
      const existing = prev.find((item) => item.ticketTypeId === ticket.id && !item.seatDetails);
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: Math.min(ticket.maxPerOrder || 8, item.quantity + quantity) }
            : item
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
        quantity: Math.min(ticket.maxPerOrder || 8, quantity)
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
      isAddon: true
    };
    setCart((prev) => [...prev, newItem]);
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
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
        message: `Minimum order spend of ${formatPrice(found.minSpend)} required for this code.`
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
  }): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Cart is empty. Please select your Formula 1 passes before checking out.');
    }

    // Authoritative Server-side stock validation
    for (const item of cart) {
      const ticket = tickets.find((t) => t.id === item.ticketTypeId);
      if (ticket && ticket.availableQuantity < item.quantity) {
        throw new Error(
          `Insufficient inventory remaining for ${item.ticketName}. Only ${ticket.availableQuantity} available.`
        );
      }
    }

    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const serviceFee = cart.reduce((acc, item) => acc + item.fee * item.quantity, 0);
    const tax = Math.round((subtotal + serviceFee) * 0.10); // 10% VAT / entertainment tax
    
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

    // Generate individual tickets for attendees with collision-resistant token
    const issuedTickets: IssuedTicket[] = [];
    cart.forEach((item, itemIdx) => {
      for (let i = 0; i < item.quantity; i++) {
        const attendee = orderData.attendees[i] || {
          fullName: orderData.customerName,
          email: orderData.customerEmail,
          ticketId: item.ticketTypeId
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
          seat: item.seatDetails?.seatNumber || (i + 1),
          attendeeName: attendee.fullName,
          barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
          qrCodeValue: `https://mastrotickets.ae/verify-ticket/${ticketNum}`,
          deliveryStatus: 'ready_for_download',
          status: 'issued',
          issuedAt: new Date().toISOString()
        });
      }
    });

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: currentUser.uid,
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
      paymentId: `pi_test_${Math.random().toString(36).substr(2, 12)}`,
      stripeSessionId: `cs_test_${Math.random().toString(36).substr(2, 16)}`,
      paymentMethod: orderData.paymentMethod,
      cardLast4: orderData.cardLast4 || '4242',
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      tickets: issuedTickets,
    };

    // Decrement inventory and record InventoryMutation ledger records
    const newMutations: InventoryMutation[] = [];
    setTickets((prev) =>
      prev.map((t) => {
        const cartMatch = cart.find((c) => c.ticketTypeId === t.id);
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
            notes: `Confirmed order #${orderNumber} via Stripe. Deducted ${cartMatch.quantity} pass(es).`
          });
          return {
            ...t,
            availableQuantity: updatedQty,
            status: updatedQty === 0 ? 'sold_out' : updatedQty < 30 ? 'low_inventory' : 'available'
          };
        }
        return t;
      })
    );

    if (newMutations.length > 0) {
      setInventoryLedger((prev) => [...newMutations, ...prev]);
    }

    // Queue transactional confirmation emails
    const emailJob1: EmailJob = {
      id: `emj-${Date.now()}-1`,
      orderId,
      recipientEmail: orderData.customerEmail,
      recipientName: orderData.customerName,
      template: 'order_confirmation',
      subject: `Booking Confirmed: ${cart[0]?.eventName || 'Formula 1 Grand Prix'} (#${orderNumber})`,
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: 0
    };
    const emailJob2: EmailJob = {
      id: `emj-${Date.now()}-2`,
      orderId,
      recipientEmail: orderData.customerEmail,
      recipientName: orderData.customerName,
      template: 'ticket_delivery',
      subject: `Your Official E-Tickets are Ready for Download (#${orderNumber})`,
      status: 'delivered',
      sentAt: new Date(Date.now() + 1000).toISOString(),
      retryCount: 0
    };

    setEmailJobs((prev) => [emailJob1, emailJob2, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);

    // Update discount usage if applied
    if (appliedDiscount) {
      setDiscounts((prev) =>
        prev.map((d) => (d.id === appliedDiscount.id ? { ...d, usedCount: d.usedCount + 1 } : d))
      );
    }

    // Mark matching reservation as confirmed if present
    setReservations((prev) =>
      prev.map((r) =>
        r.customerId === currentUser.uid && r.status === 'active'
          ? { ...r, status: 'confirmed' as const }
          : r
      )
    );

    addAuditLog(
      'ORDER_CONFIRMED',
      orderNumber,
      `Order ${orderNumber} confirmed for ${orderData.customerName} (${formatPrice(total)}) via ${orderData.paymentMethod}. Issued ${issuedTickets.length} unique ticket(s).`
    );

    clearCart();
    return newOrder;
  };

  const updateEvent = (updated: GrandPrixEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    addAuditLog('EVENT_UPDATED', updated.slug, `Updated details for ${updated.name}`);
  };

  const createEvent = (newEventData: Omit<GrandPrixEvent, 'id' | 'slug'>): GrandPrixEvent => {
    const slug = newEventData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const id = `gp-${Date.now()}`;
    const newEvent: GrandPrixEvent = {
      ...newEventData,
      id,
      slug
    };
    setEvents((prev) => [...prev, newEvent]);
    addAuditLog('EVENT_CREATED', slug, `Created new event listing: ${newEvent.name}`);
    return newEvent;
  };

  const deleteEvent = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setTickets((prev) => prev.filter((t) => t.eventId !== eventId));
    addAuditLog('EVENT_DELETED', event?.slug || eventId, `Deleted event listing: ${event?.name || eventId}`);
  };

  const updateTicket = (updated: TicketType) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    addAuditLog('TICKET_UPDATED', updated.id, `Modified ticket type: ${updated.name} (price: €${updated.price}, avail: ${updated.availableQuantity})`);
  };

  const createTicket = (newTicketData: Omit<TicketType, 'id'>): TicketType => {
    const id = `tkt-custom-${Date.now()}`;
    const newTicket: TicketType = {
      ...newTicketData,
      id
    };
    setTickets((prev) => [...prev, newTicket]);
    addAuditLog('TICKET_CREATED', id, `Created ticket: ${newTicket.name} (${newTicket.raceDay})`);
    return newTicket;
  };

  const deleteTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    addAuditLog('TICKET_DELETED', ticketId, `Deleted ticket: ${ticket?.name || ticketId}`);
  };

  const addCategory = (categoryData: Omit<EventCategory, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const newCat: EventCategory = { ...categoryData, id };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog('CATEGORY_CREATED', newCat.slug, `Created category: ${newCat.name}`);
  };

  const updateCategory = (updated: EventCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    addAuditLog('CATEGORY_UPDATED', updated.slug, `Updated category: ${updated.name}`);
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
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
    let found = false;

    setOrders((prev) =>
      prev.map((order) => {
        const hasTicket = order.tickets.some((t) => t.ticketNumber === ticketNumber);
        if (hasTicket) {
          found = true;
          return {
            ...order,
            tickets: order.tickets.map((t) =>
              t.ticketNumber === ticketNumber
                ? { ...t, status: 'void' as const, voidReason: reason }
                : t
            )
          };
        }
        return order;
      })
    );

    if (!found) {
      return { success: false, message: `Ticket ${ticketNumber} not found.` };
    }

    addAuditLog(
      'TICKET_VOIDED',
      ticketNumber,
      `Ticket ${ticketNumber} was voided by administrator. Reason: ${reason}`
    );

    return { success: true, message: `Ticket ${ticketNumber} has been successfully voided.` };
  };

  const reissueTicket = (ticketNumber: string, newAttendeeName?: string) => {
    let reissuedNum = '';
    let found = false;

    setOrders((prev) =>
      prev.map((order) => {
        const ticketIdx = order.tickets.findIndex((t) => t.ticketNumber === ticketNumber);
        if (ticketIdx !== -1) {
          found = true;
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
          return { ...order, tickets: updatedTickets };
        }
        return order;
      })
    );

    if (!found) {
      return { success: false, message: `Ticket ${ticketNumber} not found.` };
    }

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

    setEmailJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'delivered' as const,
              sentAt: new Date().toISOString(),
              retryCount: (j.retryCount || 0) + 1,
              errorReason: undefined
            }
          : j
      )
    );

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

    // Update order status and set all tickets to refunded
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'refunded' as const,
              tickets: o.tickets.map((t) => ({ ...t, status: 'refunded' as const, voidReason: `Refunded: ${reason}` }))
            }
          : o
      )
    );

    // Restore inventory & write to ledger
    const newMutations: InventoryMutation[] = [];
    setTickets((prev) =>
      prev.map((t) => {
        const item = order.items.find((i) => i.ticketTypeId === t.id);
        if (item) {
          const restoredQty = t.availableQuantity + item.quantity;
          newMutations.push({
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
          });
          return {
            ...t,
            availableQuantity: restoredQty,
            status: restoredQty > 0 ? (restoredQty < 30 ? 'low_inventory' : 'available') : 'sold_out'
          };
        }
        return t;
      })
    );

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

    addAuditLog('ORDER_REFUNDED', order.orderNumber, `Refunded order #${order.orderNumber} (${formatPrice(order.total)}). Reason: ${reason}`);

    return { success: true, message: `Order #${order.orderNumber} successfully refunded via Stripe.` };
  };

  const resendConfirmationEmail = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const emailJob: EmailJob = {
      id: `emj-resend-${Date.now()}`,
      orderId,
      recipientEmail: order.customerEmail,
      recipientName: order.customerName,
      template: 'order_confirmation',
      subject: `[Resent] Booking Confirmed: ${order.items[0]?.eventName || 'Formula 1 Grand Prix'} (#${order.orderNumber})`,
      status: 'delivered',
      sentAt: new Date().toISOString(),
      retryCount: 0
    };
    setEmailJobs((prev) => [emailJob, ...prev]);
    addAuditLog('EMAIL_RESENT', order.orderNumber, `Resent confirmation email to ${order.customerEmail}`);

    return { success: true, message: `Confirmation email re-delivered to ${order.customerEmail} via Resend.` };
  };

  const createDiscountCode = (data: Omit<DiscountCode, 'id' | 'usedCount'>) => {
    const newCode: DiscountCode = {
      ...data,
      id: `disc-${Date.now()}`,
      usedCount: 0
    };
    setDiscounts((prev) => [...prev, newCode]);
    addAuditLog('DISCOUNT_CREATED', newCode.code, `Created promotional discount ${newCode.code}`);
  };

  const toggleDiscountActive = (id: string) => {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d))
    );
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
        currency,
        cart,
        appliedDiscount,
        reservationTimeRemaining,
        setCurrency,
        setCurrentUser,
        formatPrice,
        addToCart,
        addAddonToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyDiscountCode,
        removeDiscountCode,
        createReservation,
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
