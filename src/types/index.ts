export type CurrencyCode = 'USD' | 'AED' | 'EUR';

export interface GrandPrixEvent {
  id: string;
  slug: string;
  name: string;
  officialTitle: string;
  circuit: string;
  location: string;
  country: string;
  countryCode: string;
  flag: string;
  dates: string;
  startDate: string;
  endDate: string;
  round: number;
  season: number;
  timezone: string;
  banner: string;
  circuitMapSvg?: string;
  description: string;
  status: 'published' | 'draft' | 'archived';
  startingPrice: number;
  featured: boolean;
  lapDistance: string;
  numberOfLaps: number;
  raceDistance: string;
  lapRecord: {
    time: string;
    driver: string;
    year: number;
  };
  schedule: {
    day: string;
    date: string;
    sessions: {
      name: string;
      time: string;
      type: 'practice' | 'qualifying' | 'sprint' | 'race';
    }[];
  }[];
}

export type TicketCategory = 'general_admission' | 'grandstand' | 'weekend_bundle' | 'vip_hospitality' | 'concert';

export type RaceDayOption = 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Weekend Pass' | '3-Day Package';

export interface TicketType {
  id: string;
  eventId: string;
  category: TicketCategory;
  raceDay: RaceDayOption;
  name: string;
  section: string;
  description: string;
  price: number;
  originalPrice?: number;
  fee: number;
  capacity: number;
  availableQuantity: number;
  features: string[];
  isAssignedSeating: boolean;
  deliveryType: 'instant_eticket' | 'official_transfer' | 'mobile_pass';
  status: 'available' | 'low_inventory' | 'sold_out';
  maxPerOrder: number;
  imageUrl?: string;
}

export interface Seat {
  id: string;
  sectionId: string;
  grandstandName: string;
  row: string;
  seatNumber: number;
  price: number;
  status: 'available' | 'held' | 'sold';
  isAccessible?: boolean;
}

export interface Concert {
  id: string;
  eventId: string;
  name: string;
  artist: string;
  venue: string;
  date: string;
  time: string;
  price: number;
  description: string;
  image: string;
  entryConditions: string;
  requiresRaceTicket: boolean;
  availableTickets: number;
}

export interface PremiumPackage {
  id: string;
  eventId: string;
  name: string;
  tier: 'Champions Club' | 'Paddock Club™' | 'Turn 1 Lounge' | 'Pit Lane Walk' | 'Superyacht VIP' | 'Shams VIP Suite';
  price: number;
  description: string;
  image: string;
  inclusions: string[];
  daysIncluded: string;
  availableQuantity: number;
}

export interface CartItem {
  id: string;
  eventId: string;
  eventName: string;
  circuit: string;
  dates: string;
  ticketTypeId: string;
  ticketName: string;
  category: TicketCategory;
  raceDay: RaceDayOption;
  section: string;
  seatDetails?: {
    grandstand: string;
    row: string;
    seatNumber: number;
  };
  unitPrice: number;
  fee: number;
  quantity: number;
  isAddon?: boolean;
  parentTicketId?: string;
}

export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'partially_refunded'
  | 'refunded'
  | 'cancelled'
  | 'payment_failed'
  | 'expired';

export interface IssuedTicket {
  id: string;
  ticketNumber: string; // Format: MST-[CIRCUIT/CODE]-[8_CHAR_ALPHANUMERIC]
  orderId: string;
  orderNumber?: string;
  eventName: string;
  circuit: string;
  raceDay: string;
  category: string;
  section: string;
  row?: string;
  seat?: number;
  attendeeName: string;
  barcode: string;
  qrCodeValue: string;
  deliveryStatus: 'issued' | 'delivered' | 'ready_for_download';
  status: 'issued' | 'cancelled' | 'refunded' | 'void';
  issuedAt?: string;
  voidReason?: string;
  downloadUrl?: string;
}

export interface InventoryMutation {
  id: string;
  timestamp: string;
  type: 'RESERVATION_CREATED' | 'PAYMENT_CONFIRMED_DEDUCTED' | 'RESERVATION_EXPIRED_RELEASED' | 'REFUND_RESTOCKED' | 'ADMIN_VOIDED' | 'ADMIN_ADJUSTED';
  ticketTypeId: string;
  ticketName: string;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  referenceId: string;
  notes: string;
}

export interface BookingReservation {
  id: string;
  reservationReference: string;
  customerId: string;
  customerEmail?: string;
  eventId: string;
  items: CartItem[];
  total: number;
  currency: CurrencyCode;
  status: 'active' | 'confirmed' | 'expired' | 'released';
  createdAt: string;
  expiresAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
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
  attendees: {
    fullName: string;
    email: string;
    ticketId: string;
  }[];
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  discountCode?: string;
  total: number;
  currency: CurrencyCode;
  status: OrderStatus;
  paymentId?: string;
  stripeSessionId?: string;
  paymentMethod?: string;
  cardLast4?: string;
  createdAt: string;
  confirmedAt?: string;
  tickets: IssuedTicket[];
}

export interface DiscountCode {
  id: string;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minSpend: number;
  maxUsage: number;
  usedCount: number;
  validUntil: string;
  active: boolean;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  badgeColor?: string;
  ticketCount?: number;
}

export interface EmailJob {
  id: string;
  orderId?: string;
  recipientEmail: string;
  recipientName: string;
  template: 'order_confirmation' | 'ticket_delivery' | 'payment_receipt' | 'refund_notification' | 'custom_announcement' | 'customer_support' | 'race_schedule_update';
  subject: string;
  bodyText?: string;
  status: 'delivered' | 'pending' | 'failed';
  sentAt: string;
  errorReason?: string;
  retryCount?: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetRecord: string;
  timestamp: string;
  changeSummary: string;
}

export type UserRole = 'customer' | 'support_agent' | 'inventory_manager' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  country?: string;
  avatarUrl?: string;
}

