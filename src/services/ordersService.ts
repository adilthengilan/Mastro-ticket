import { apiClient } from './apiClient';
import { Order } from '../types';

export const ordersService = {
  async getOrder(id: string): Promise<Order> {
    const res = await apiClient.get<Order>(`/orders/${id}`);
    return res.data;
  },

  async getOrderBySession(sessionId: string): Promise<Order> {
    const res = await apiClient.get<Order>(`/orders/session/${sessionId}`);
    return res.data;
  },
};
