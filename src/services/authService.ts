import { apiClient } from './apiClient';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  ClaimGuestOrdersResponse,
  CustomerAuthResponse,
  CustomerLoginRequest,
  CustomerRegisterRequest,
} from '../types/api';
import { Order } from '../types';

const USER_KEY = 'mastro_user_profile_session';

export const authService = {
  // Admin authentication
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const res = await apiClient.post<AdminLoginResponse>('/admin/login', credentials);
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
      try {
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      } catch {
        // storage unavailable
      }
    }
    return res.data;
  },

  // Customer email + password registration
  async registerCustomer(payload: CustomerRegisterRequest): Promise<CustomerAuthResponse> {
    const res = await apiClient.post<CustomerAuthResponse>('/auth/register', payload);
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  // Customer email + password login
  async loginCustomer(payload: CustomerLoginRequest): Promise<CustomerAuthResponse> {
    const res = await apiClient.post<CustomerAuthResponse>('/auth/login', payload);
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  // Customer Google ID-token sign-in
  async loginWithGoogleToken(idToken: string): Promise<CustomerAuthResponse> {
    const res = await apiClient.post<CustomerAuthResponse>('/auth/google', { idToken });
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }
    return res.data;
  },

  // Server-verified guest order claiming
  async claimGuestOrders(): Promise<ClaimGuestOrdersResponse> {
    const res = await apiClient.post<ClaimGuestOrdersResponse>('/auth/claim-guest-orders');
    return res.data;
  },

  // Fetch authenticated customer orders
  async fetchMyOrders(): Promise<Order[]> {
    const res = await apiClient.get<Order[]>('/orders/mine');
    return res.data;
  },

  logout(): void {
    apiClient.clearToken();
    try {
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // storage unavailable
    }
  },

  getCurrentUser(): { id: string; email: string; name: string; role: string } | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
