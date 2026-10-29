import { apiClient } from './apiClient';
import { AdminDashboardStats, ApiResponse } from '../types/api';
import { Order } from '../types';

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
    return res.data;
  },

  async getOrders(page = 1, limit = 20, search = ''): Promise<ApiResponse<Order[]>> {
    return apiClient.get<Order[]>('/admin/orders', { page, limit, search });
  },

  async voidTicket(ticketNumber: string, reason: string): Promise<void> {
    await apiClient.post('/admin/tickets/void', { ticketNumber, reason });
  },
};
