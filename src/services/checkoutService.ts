import { apiClient } from './apiClient';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  ValidateDiscountRequest,
  ValidateDiscountResponse,
} from '../types/api';

export const checkoutService = {
  async createSession(data: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const res = await apiClient.post<CreateCheckoutSessionResponse>('/checkout/session', data);
    return res.data;
  },

  async validateDiscount(code: string, subtotal: number): Promise<ValidateDiscountResponse> {
    const res = await apiClient.post<ValidateDiscountResponse>('/discounts/validate', {
      code,
      subtotal,
    } as ValidateDiscountRequest);
    return res.data;
  },
};
