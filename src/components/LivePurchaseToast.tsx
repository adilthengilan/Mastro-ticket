import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Ticket, X } from 'lucide-react';
import { useStore } from '../services/store';
import { LivePurchaseFeedItem } from '../types';
import {
  buildFeedFromCompletedOrders,
  formatRelativePurchaseTime,
  purchaseFeedService,
} from '../services/purchaseFeedService';

export const LivePurchaseToast: React.FC = () => {
  const { orders } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const [apiFeed, setApiFeed] = useState<LivePurchaseFeedItem[]>([]);
  const [activeItem, setActiveItem] = useState<LivePurchaseFeedItem | null>(null);
  const [dismissedSession, setDismissedSession] = useState(false);

  const lastCustomerRef = useRef<string | null>(null);
  const lastIndexRef = useRef<number>(-1);

  // Fetch privacy-safe backend purchase feed (only completed/confirmed orders)
  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      const remote = await purchaseFeedService.fetchPublicRecentPurchases();
      if (mounted && remote.length > 0) {
        setApiFeed(remote);
      }
    };
    loadFeed();
    const refreshTimer = setInterval(loadFeed, 120000);
    return () => {
      mounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  // Active pool strictly uses verified completed purchases from backend API or real store orders
  const localVerified = buildFeedFromCompletedOrders(orders);
  const pool: LivePurchaseFeedItem[] = apiFeed.length > 0 ? apiFeed : localVerified;

  useEffect(() => {
    if (dismissedSession || pool.length === 0) {
      setActiveItem(null);
      return;
    }

    let showTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const pickNextItem = (): LivePurchaseFeedItem => {
      if (pool.length === 1) return pool[0];
      // Avoid showing the same customer consecutively
      const candidates = pool.filter(
        (item, idx) =>
          item.anonymizedName !== lastCustomerRef.current && idx !== lastIndexRef.current
      );
      const source = candidates.length > 0 ? candidates : pool;
      const chosen = source[Math.floor(Math.random() * source.length)];
      lastCustomerRef.current = chosen.anonymizedName;
      lastIndexRef.current = pool.indexOf(chosen);
      return chosen;
    };

    const scheduleNext = (initialDelayMs?: number) => {
      if (cancelled) return;
      // Randomized 15–30 second interval between notifications
      const waitMs =
        initialDelayMs !== undefined
          ? initialDelayMs
          : Math.floor(15000 + Math.random() * 15000);

      showTimeoutId = setTimeout(() => {
        if (cancelled) return;
        const item = pickNextItem();
        setActiveItem(item);

        // Remain visible for 6 seconds (within 5–7s window)
        const visibleDurationMs = 6000;
        hideTimeoutId = setTimeout(() => {
          if (cancelled) return;
          setActiveItem(null);
          scheduleNext();
        }, visibleDurationMs);
      }, waitMs);
    };

    // Wait 12s before first toast so entry is never intrusive
    scheduleNext(12000);

    return () => {
      cancelled = true;
      if (showTimeoutId) clearTimeout(showTimeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
    // Depend on pool length and first item ID to react immediately when a new real order completes
  }, [dismissedSession, pool.length, pool[0]?.id]);

  if (dismissedSession) return null;

  return (
    <div
      className="fixed bottom-4 left-3 right-20 sm:bottom-5 sm:left-5 sm:right-auto z-40 pointer-events-none max-w-[340px] no-print"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {activeItem && (
          <motion.div
            key={activeItem.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto bg-[#071629]/92 backdrop-blur-md text-white border border-white/15 rounded-xl shadow-2xl px-3.5 py-3 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#163A63] border border-white/15 flex items-center justify-center shrink-0 text-sky-300 mt-0.5">
              <Ticket className="w-4 h-4" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1 pr-1">
              <p className="text-xs text-white/95 leading-snug font-sans">
                <strong className="font-semibold text-white">{activeItem.anonymizedName}</strong>{' '}
                purchased{' '}
                <span className="text-sky-200 font-medium">{activeItem.itemLabel}</span>
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300 font-sans">
                <span>{formatRelativePurchaseTime(activeItem.purchasedAt)}</span>
                {!activeItem.isDemo && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-300/90 font-medium">Verified purchase</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveItem(null)}
              onDoubleClick={() => setDismissedSession(true)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              aria-label="Dismiss purchase notification"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
