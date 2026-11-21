import { apiClient } from './apiClient';
import { LivePurchaseFeedItem, Order } from '../types';
import { PublicRecentPurchase } from '../types/api';

/**
 * Strictly anonymizes full customer names into "FirstName L." format.
 * Never returns email, phone number, full last name, or order IDs.
 */
export function anonymizeCustomerName(fullName: string): string {
  const clean = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean || clean.toLowerCase() === 'guest customer') {
    return 'F1 Fan';
  }
  const parts = clean.split(' ');
  const first = parts[0].slice(0, 18);
  if (parts.length > 1) {
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  }
  return first;
}

/**
 * Formats an ISO timestamp into a human-friendly relative time string.
 */
export function formatRelativePurchaseTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'recently';
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs === 1) return '1 hour ago';
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

/**
 * Builds anonymized feed items strictly from verified paid/confirmed orders.
 * Pending, failed, cancelled, or draft orders are strictly excluded.
 */
export function buildFeedFromCompletedOrders(orders: Order[]): LivePurchaseFeedItem[] {
  return orders
    .filter((o) => o.status === 'paid' || o.status === 'confirmed')
    .slice(0, 20)
    .map((o, idx) => {
      const firstItem = o.items[0];
      const itemLabel = firstItem
        ? `${firstItem.ticketName}`
        : 'F1 Grand Prix tickets';
      return {
        id: `verified-${idx}-${new Date(o.confirmedAt || o.createdAt).getTime()}`,
        anonymizedName: anonymizeCustomerName(o.customerName),
        itemLabel,
        purchasedAt: o.confirmedAt || o.createdAt,
        isDemo: false,
      };
    });
}

export const purchaseFeedService = {
  async fetchPublicRecentPurchases(): Promise<LivePurchaseFeedItem[]> {
    if (!apiClient.isRemoteConfigured()) {
      return [];
    }
    try {
      const res = await apiClient.get<PublicRecentPurchase[]>('/public/recent-purchases');
      if (Array.isArray(res.data)) {
        return res.data.map((item) => ({
          id: item.id,
          anonymizedName: item.anonymizedName,
          itemLabel: item.itemLabel,
          purchasedAt: item.purchasedAt,
          isDemo: false,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },
};
