import { apiClient } from './apiClient';
import { GrandPrixEvent } from '../types';
import { ApiResponse } from '../types/api';

export const eventsService = {
  async getEvents(status: string = 'published'): Promise<GrandPrixEvent[]> {
    const res = await apiClient.get<GrandPrixEvent[]>('/events', { status });
    return res.data;
  },

  async getEventById(id: string): Promise<GrandPrixEvent> {
    const res = await apiClient.get<GrandPrixEvent>(`/events/${id}`);
    return res.data;
  },
};
