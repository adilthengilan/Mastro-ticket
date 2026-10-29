import { apiClient } from './apiClient';
import { AdminLoginRequest, AdminLoginResponse } from '../types/api';

const USER_KEY = 'mastro_user_profile';

export const authService = {
  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    const res = await apiClient.post<AdminLoginResponse>('/admin/login', credentials);
    if (res.data?.token) {
      apiClient.setToken(res.data.token);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      } catch {
        // storage unavailable
      }
    }
    return res.data;
  },

  logout(): void {
    apiClient.clearToken();
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // storage unavailable
    }
  },

  getCurrentUser(): { id: string; email: string; name: string; role: string } | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
