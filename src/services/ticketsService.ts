import { apiClient } from './apiClient';
import { TicketType } from '../types';
import { TicketVerificationResponse } from '../types/api';

export const ticketsService = {
  async getTickets(params?: { eventId?: string; category?: string; raceDay?: string }): Promise<TicketType[]> {
    const res = await apiClient.get<TicketType[]>('/tickets', params);
    return res.data;
  },

  async verifyTicket(ticketNumber: string): Promise<TicketVerificationResponse> {
    const res = await apiClient.get<TicketVerificationResponse>(`/tickets/verify/${encodeURIComponent(ticketNumber)}`);
    return res.data;
  },
};
