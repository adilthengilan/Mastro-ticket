import { GrandPrixEvent, TicketType, Order, IssuedTicket, CartItem } from './index';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: Record<string, string>;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string>;
}

export interface CreateCheckoutSessionRequest {
  eventId: string;
  items: CartItem[];
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  discountCode?: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
  reservationId: string;
  reservationReference: string;
  expiresAt: string;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
}

export interface ValidateDiscountRequest {
  code: string;
  subtotal: number;
}

export interface ValidateDiscountResponse {
  code: string;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  newTotal: number;
  currency: string;
}

export interface TicketVerificationResponse {
  isValid: boolean;
  ticketNumber: string;
  eventName: string;
  circuit: string;
  raceDay: string;
  category: string;
  section: string;
  row?: string;
  seat?: number;
  attendee: string; // Sanitized/masked PII
  status: string;
  issuedAt: string;
  voidReason?: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface AdminDashboardStats {
  totalRevenue: number;
  currency: string;
  totalOrders: number;
  ticketsSold: number;
  activeHolds: number;
  inventoryBySection: {
    section: string;
    total_available: number;
    total_capacity: number;
  }[];
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}
