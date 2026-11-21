import { apiClient } from './apiClient';
import {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreateReservationRequest,
  ReleaseReservationResponse,
  ReservationResponse,
  ValidateDiscountRequest,
  ValidateDiscountResponse,
} from '../types/api';

export const checkoutService = {
  async createReservation(data: CreateReservationRequest): Promise<ReservationResponse> {
    const res = await apiClient.post<ReservationResponse>('/reservations', data);
    return res.data;
  },

  async releaseReservation(
    reservationId: string,
    reason = 'released'
  ): Promise<ReleaseReservationResponse> {
    const res = await apiClient.post<ReleaseReservationResponse>(
      `/reservations/${encodeURIComponent(reservationId)}/release`,
      { reason }
    );
    return res.data;
  },

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
