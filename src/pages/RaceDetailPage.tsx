import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../services/store';
import { TicketType } from '../types';
import { TicketQuantityModal } from '../components/TicketQuantityModal';
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  Music,
  ArrowRight,
  Ticket,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface RaceDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

const getQuantityStorageKey = (eventSlug: string) => `mastro_booking_qty_${eventSlug}`;

const readSavedQuantity = (eventSlug: string): number | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlQty = parseInt(urlParams.get('qty') || '', 10);
    if (!Number.isNaN(urlQty) && urlQty >= 1) {
      return urlQty;
    }
    const stored = sessionStorage.getItem(getQuantityStorageKey(eventSlug));
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        return parsed;
      }
    }
  } catch {
    // storage unavailable
  }
  return null;
};

const persistQuantity = (eventSlug: string, qty: number) => {
  try {
    sessionStorage.setItem(getQuantityStorageKey(eventSlug), String(qty));
    const url = new URL(window.location.href);
    url.searchParams.set('qty', String(qty));
    window.history.replaceState({}, '', url.pathname + url.search);
  } catch {
    // ignore history/storage errors
  }
};

export const RaceDetailPage: React.FC<RaceDetailPageProps> = ({ slug, navigate }) => {
  const {
    events,
    tickets,
    concerts,
    formatPrice,
    addAddonToCart,
    refreshLiveInventory,
    reserveAndSelectTicket,
    isInventoryLoading,
  } = useStore();

  const event = events.find((e) => e.slug === slug) || events[0];

  // Filter tabs
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Smart Quantity Selection state
  const [requestedQuantity, setRequestedQuantity] = useState<number>(() => {
    const saved = readSavedQuantity(slug);
    return saved ?? 1;
  });
  const [hasConfirmedQuantity, setHasConfirmedQuantity] = useState<boolean>(() => {
    return readSavedQuantity(slug) !== null;
  });
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState<boolean>(() => {
    return readSavedQuantity(slug) === null;
  });

  // Category confirmation step & live stock notifications
  const [confirmingTicket, setConfirmingTicket] = useState<TicketType | null>(null);
  const [isValidatingSelection, setIsValidatingSelection] = useState<boolean>(false);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [stockAlert, setStockAlert] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');

  // Reset booking context cleanly when switching to a different event
  useEffect(() => {
    const saved = readSavedQuantity(slug);
    setSelectedDayTab('all');
    setSelectedCategoryTab('all');
    setConfirmingTicket(null);
    setStockAlert(null);

    if (saved !== null) {
      setRequestedQuantity(saved);
      setHasConfirmedQuantity(true);
      setIsQuantityModalOpen(false);
    } else {
      setRequestedQuantity(1);
      setHasConfirmedQuantity(false);
      setIsQuantityModalOpen(true);
    }
  }, [slug]);

  const syncEventInventory = useCallback(async () => {
    if (!event) return [];
    const fresh = await refreshLiveInventory({ eventId: event.id });
    setLastSyncedAt(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    return fresh;
  }, [event?.id]);

  // Fetch live inventory on event load and whenever session filter changes
  useEffect(() => {
    if (!event) return;
    void syncEventInventory();
  }, [event?.id, selectedDayTab]);

  // Periodic background stock refresh (every 30s) to catch concurrent purchases by other customers
  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      void syncEventInventory();
    }, 30000);
    return () => clearInterval(interval);
  }, [event?.id, syncEventInventory]);

  const eventTickets = useMemo(
    () => (event ? tickets.filter((t) => t.eventId === event.id) : []),
    [tickets, event?.id]
  );
  const eventConcerts = useMemo(
    () => (event ? concerts.filter((c) => c.eventId === event.id) : []),
    [concerts, event?.id]
  );

  // Dynamically derive available sessions from event tickets (works for any event & session structure)
  const sessionTabs = useMemo(() => {
    const knownOrder = ['Weekend Pass', '3-Day Package', 'Sunday', 'Saturday', 'Friday', 'Thursday'];
    const present = Array.from(new Set(eventTickets.map((t) => t.raceDay)));
    present.sort((a, b) => {
      const ia = knownOrder.indexOf(a);
      const ib = knownOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return ['all', ...present];
  }, [eventTickets]);

  // Dynamically derive ticket categories present for this event
  const categoryTabs = useMemo(() => {
    const labels: Record<string, string> = {
      grandstand: 'Grandstand',
      general_admission: 'General Admission',
      vip_hospitality: 'VIP & Hospitality',
      weekend_bundle: 'Weekend Bundle',
      concert: 'Concert Pass',
    };
    const present = Array.from(new Set(eventTickets.map((t) => t.category)));
    return [
      { id: 'all', label: 'All Categories' },
      ...present.map((cat) => ({
        id: cat,
        label: labels[cat] || cat.replace(/_/g, ' '),
      })),
    ];
  }, [eventTickets]);

  // Tickets matching session + category (before quantity filter) — used to compute accurate max limits & edge-case messaging
  const sessionFilteredTickets = useMemo(
    () =>
      eventTickets.filter((t) => {
        if (selectedDayTab !== 'all' && t.raceDay !== selectedDayTab) return false;
        if (selectedCategoryTab !== 'all' && t.category !== selectedCategoryTab) return false;
        return true;
      }),
    [eventTickets, selectedDayTab, selectedCategoryTab]
  );

  // Max selectable quantity across actual live event inventory respecting maxPerOrder business rules
  const maxSelectableForEvent = useMemo(() => {
    if (eventTickets.length === 0) return 0;
    return eventTickets.reduce((max, t) => {
      if (t.status === 'sold_out' || t.availableQuantity <= 0) return max;
      const cap = Math.min(t.availableQuantity, Math.max(1, t.maxPerOrder || 8));
      return Math.max(max, cap);
    }, 0);
  }, [eventTickets]);

  const maxAvailableInCurrentFilter = useMemo(() => {
    return sessionFilteredTickets.reduce((max, t) => {
      if (t.status === 'sold_out' || t.availableQuantity <= 0) return max;
      const cap = Math.min(t.availableQuantity, Math.max(1, t.maxPerOrder || 8));
      return Math.max(max, cap);
    }, 0);
  }, [sessionFilteredTickets]);

  // STRICT REAL-TIME INVENTORY FILTERING: availableQuantity >= requestedQuantity
  const eligibleTickets = useMemo(() => {
    return sessionFilteredTickets.filter(
      (t) =>
        t.status !== 'sold_out' &&
        t.availableQuantity >= requestedQuantity &&
        requestedQuantity <= Math.max(1, t.maxPerOrder || 8)
    );
  }, [sessionFilteredTickets, requestedQuantity]);

  // Keep confirmingTicket synced with live inventory changes while modal/panel is open
  useEffect(() => {
    if (!confirmingTicket) return;
    const liveMatch = eventTickets.find((t) => t.id === confirmingTicket.id);
    if (
      !liveMatch ||
      liveMatch.status === 'sold_out' ||
      liveMatch.availableQuantity < requestedQuantity
    ) {
      const avail = liveMatch ? liveMatch.availableQuantity : 0;
      setConfirmingTicket(null);
      setStockAlert(
        `Inventory changed while you were reviewing "${confirmingTicket.name}". Only ${avail} ticket(s) remain, which is fewer than your requested ${requestedQuantity}. Available options have been refreshed.`
      );
    } else if (liveMatch.availableQuantity !== confirmingTicket.availableQuantity) {
      setConfirmingTicket(liveMatch);
    }
  }, [eventTickets, confirmingTicket, requestedQuantity]);

  if (!event) {
    return (
      <div className="bg-[#FFFFFF] min-h-[70vh] flex flex-col items-center justify-center px-4 text-center text-[#111827]">
        <Calendar className="w-10 h-10 text-[#123B67] mb-3" />
        <h1 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
          No Event Found
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md font-sans">
          This event is not currently published. Browse available Grand Prix listings or add events from the Admin Operations Portal.
        </p>
        <button
          onClick={() => navigate('/races')}
          className="mt-5 px-5 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
        >
          Back to Race Directory
        </button>
      </div>
    );
  }

  // Handler: Quantity Dialog Confirmed
  const handleConfirmQuantity = async (qty: number) => {
    setStockAlert(null);
    setRequestedQuantity(qty);
    setHasConfirmedQuantity(true);
    setIsQuantityModalOpen(false);
    persistQuantity(event.slug, qty);

    // Fetch live inventory immediately after confirming quantity
    const freshList = await syncEventInventory();

    // If user previously had a category open for confirmation and increased quantity beyond its stock, clear it with clear message
    if (confirmingTicket) {
      const freshMatch =
        freshList.find((t) => t.id === confirmingTicket.id) ||
        tickets.find((t) => t.id === confirmingTicket.id);
      if (
        !freshMatch ||
        freshMatch.status === 'sold_out' ||
        freshMatch.availableQuantity < qty
      ) {
        setConfirmingTicket(null);
        setStockAlert(
          `"${confirmingTicket.name}" does not have ${qty} tickets available (${freshMatch?.availableQuantity ?? 0} remaining). Please pick from the updated available options below.`
        );
      } else {
        setConfirmingTicket(freshMatch);
      }
    }
  };

  // Handler: Select Ticket Category -> Re-verify Live Inventory -> Open Confirm Ticket Details
  const handleSelectCategory = async (ticket: TicketType) => {
    setStockAlert(null);
    setIsValidatingSelection(true);

    try {
      const freshTickets = await syncEventInventory();
      const liveTicket =
        freshTickets.find((t) => t.id === ticket.id) ||
        tickets.find((t) => t.id === ticket.id) ||
        ticket;

      if (
        liveTicket.status === 'sold_out' ||
        liveTicket.availableQuantity < requestedQuantity
      ) {
        setStockAlert(
          `Sorry, "${liveTicket.name}" now has only ${liveTicket.availableQuantity} ticket(s) available, which is not enough for your request of ${requestedQuantity}. Available categories have been updated.`
        );
        return;
      }

      if (requestedQuantity > Math.max(1, liveTicket.maxPerOrder || 8)) {
        setStockAlert(
          `Maximum ${liveTicket.maxPerOrder || 8} tickets per order are allowed for "${liveTicket.name}". Please reduce your ticket quantity.`
        );
        return;
      }

      setConfirmingTicket(liveTicket);
    } finally {
      setIsValidatingSelection(false);
    }
  };

  // Handler: Confirm Ticket Details -> Atomic Reservation -> Checkout
  const handleReserveAndCheckout = async () => {
    if (!confirmingTicket || isReserving) return;
    setIsReserving(true);
    setStockAlert(null);

    try {
      const idempotencyKey = `sel-${event.id}-${confirmingTicket.id}-${requestedQuantity}-${Date.now()}`;
      const res = await reserveAndSelectTicket(
        confirmingTicket,
        event,
        requestedQuantity,
        idempotencyKey
      );

      if (!res.success) {
        await syncEventInventory();
        setConfirmingTicket(null);
        setStockAlert(
          res.error ||
            'Another customer purchased the remaining inventory. Live options have been refreshed.'
        );
        return;
      }

      setConfirmingTicket(null);
      navigate('/checkout');
    } finally {
      setIsReserving(false);
    }
  };

  const handleSessionChange = (day: string) => {
    setSelectedDayTab(day);
    setConfirmingTicket(null);
    setStockAlert(null);
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20 text-[#111827]">
      {/* Quantity Selection Modal Dialog */}
      <TicketQuantityModal
        isOpen={isQuantityModalOpen}
        eventName={event.name}
        initialQuantity={requestedQuantity}
        maxSelectable={maxSelectableForEvent}
        hasAnyStock={maxSelectableForEvent > 0}
        isLoadingInventory={isInventoryLoading}
        canClose={hasConfirmedQuantity || maxSelectableForEvent === 0}
        onConfirm={handleConfirmQuantity}
        onClose={() => setIsQuantityModalOpen(false)}
        onRefreshInventory={() => void syncEventInventory()}
      />

      {/* 1. Cinematic Event Hero Banner */}
      <div className="relative aspect-[21/9] min-h-[280px] max-h-[390px] w-full overflow-hidden bg-slate-900 border-b border-[#E2E8F0]">
        <img
          src={event.banner}
          alt={event.name}
          className="w-full h-full object-cover object-center opacity-85"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/95 rounded text-[10px] font-bold text-[#0B1F3A] mb-2 shadow-xs">
                <span>{event.flag}</span>
                <span>ROUND {event.round}</span>
                <span className="text-slate-300">·</span>
                <span className="text-[#123B67] font-bold">OFFICIAL FORMULA 1 CALENDAR</span>
              </div>
              <h1 className="font-sports font-black text-3xl sm:text-5xl text-white tracking-tight uppercase drop-shadow-xs">
                {event.name}
              </h1>
              <p className="text-xs text-slate-200 mt-0.5 font-mono tracking-wider">
                {event.officialTitle}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span>{event.dates}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                  <span>
                    {event.circuit}, {event.location}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  <span>Timezone: {event.timezone}</span>
                </div>
              </div>
            </div>

            {/* Circuit Quick Stats Strip */}
            <div className="bg-white/95 border border-[#E2E8F0] rounded-lg p-3.5 text-xs space-y-1 shrink-0 shadow-sm text-[#111827]">
              <div className="flex justify-between gap-6 text-[#64748B]">
                <span>Lap Distance:</span>
                <strong className="text-[#111827] font-mono">{event.lapDistance}</strong>
              </div>
              <div className="flex justify-between gap-6 text-[#64748B]">
                <span>Race Distance:</span>
                <strong className="text-[#111827] font-mono">
                  {event.numberOfLaps} laps ({event.raceDistance})
                </strong>
              </div>
              <div className="flex justify-between gap-6 text-[#64748B]">
                <span>Lap Record:</span>
                <strong className="text-[#111827] font-mono">
                  {event.lapRecord.time} ({event.lapRecord.driver})
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area (Smart Filtered Tickets) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Active Quantity Filter Control Bar */}
            <div className="bg-[#0B1F3A] text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-[#123B67] border border-white/15 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300 block">
                    Live Availability Filter Active
                  </span>
                  <div className="font-sports font-bold text-lg sm:text-xl uppercase tracking-wide">
                    Showing Options for{' '}
                    <span className="font-mono text-white tabular-nums">{requestedQuantity}</span>{' '}
                    {requestedQuantity === 1 ? 'Ticket' : 'Tickets'}
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Categories with fewer than {requestedQuantity}{' '}
                    {requestedQuantity === 1 ? 'ticket' : 'tickets'} remaining are automatically hidden.
                    {lastSyncedAt && (
                      <span className="ml-1.5 text-slate-400 font-mono">
                        · Updated {lastSyncedAt}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void syncEventInventory()}
                  disabled={isInventoryLoading}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Refresh live ticket inventory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInventoryLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuantityModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Change Quantity</span>
                </button>
              </div>
            </div>

            {/* Live Stock Alert Banner (Insufficient Stock / Concurrent Update) */}
            {stockAlert && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-3 text-xs text-red-800">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#991B1B] uppercase tracking-wide text-[11px]">
                      Live Inventory Updated
                    </p>
                    <p className="mt-0.5 font-sans leading-relaxed">{stockAlert}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStockAlert(null)}
                  className="text-red-700 hover:text-red-900 p-1 cursor-pointer shrink-0"
                  aria-label="Dismiss stock alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Session & Category Filter Toolbar */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-xs">
              {/* Day / Session Selector Tabs */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Filter by Race Session:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sessionTabs.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSessionChange(day)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        selectedDayTab === day
                          ? 'bg-[#0B1F3A] text-white shadow-xs'
                          : 'bg-[#F5F7FA] border border-[#E2E8F0] text-[#111827] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      {day === 'all' ? 'All Sessions' : day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector Tabs */}
              {categoryTabs.length > 2 && (
                <div className="pt-2.5 border-t border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Ticket Category:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryTabs.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat.id)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer capitalize ${
                          selectedCategoryTab === cat.id
                            ? 'bg-[#123B67] text-white shadow-xs'
                            : 'bg-[#F5F7FA] border border-[#E2E8F0] text-[#111827] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Eligible Ticket Categories List */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                <span>
                  Available Ticket Categories ({eligibleTickets.length}) for{' '}
                  <strong className="text-[#0B1F3A] font-mono tabular-nums">
                    {requestedQuantity}
                  </strong>{' '}
                  {requestedQuantity === 1 ? 'ticket' : 'tickets'}
                </span>
                <span className="text-[11px]">
                  Verified real-time stock · Prices shown in USD ($)
                </span>
              </div>

              {eligibleTickets.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center shadow-xs space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-[#B45309] flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">
                      No Categories Have {requestedQuantity}{' '}
                      {requestedQuantity === 1 ? 'Ticket' : 'Tickets'} Available
                    </h3>
                    <p className="text-xs text-[#64748B] font-sans leading-relaxed">
                      {maxAvailableInCurrentFilter > 0 ? (
                        <>
                          The maximum available in a single category for this filter is{' '}
                          <strong className="text-[#0B1F3A] font-mono">
                            {maxAvailableInCurrentFilter}
                          </strong>{' '}
                          {maxAvailableInCurrentFilter === 1 ? 'ticket' : 'tickets'}. Lower your
                          quantity to see eligible categories.
                        </>
                      ) : maxSelectableForEvent > 0 ? (
                        <>
                          No tickets match your current session/category filter, but up to{' '}
                          <strong className="text-[#0B1F3A] font-mono">
                            {maxSelectableForEvent}
                          </strong>{' '}
                          ticket(s) are available in other sessions for this event.
                        </>
                      ) : (
                        <>
                          All ticket categories for this event are currently sold out or held in
                          active checkouts. Refresh live stock to check for released holds.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    {maxSelectableForEvent > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsQuantityModalOpen(true)}
                        className="px-4 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Adjust Ticket Quantity
                      </button>
                    )}
                    {(selectedDayTab !== 'all' || selectedCategoryTab !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayTab('all');
                          setSelectedCategoryTab('all');
                        }}
                        className="px-4 py-2.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0B1F3A] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        View All Sessions & Categories
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void syncEventInventory()}
                      className="px-4 py-2.5 bg-white hover:bg-[#F5F7FA] border border-[#E2E8F0] text-[#475569] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isInventoryLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh Availability</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {eligibleTickets.map((ticket) => {
                    const totalForRequested = ticket.price * requestedQuantity;
                    const imageSrc = ticket.imageUrl || event.banner;
                    const isLowStock = ticket.availableQuantity <= 10;

                    return (
                      <div
                        key={ticket.id}
                        className="bg-white border border-[#E2E8F0] hover:border-[#123B67]/50 rounded-xl overflow-hidden shadow-xs transition-all flex flex-col md:flex-row"
                      >
                        {/* Ticket Category Image */}
                        <div className="md:w-52 lg:w-56 shrink-0 bg-[#0B1F3A] relative overflow-hidden aspect-[16/10] md:aspect-auto">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={ticket.name}
                              className="w-full h-full object-cover object-center"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[150px] flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#123B67] text-white p-4 text-center">
                              <Ticket className="w-7 h-7 text-sky-300 mb-1.5" />
                              <span className="font-sports text-sm uppercase tracking-wider font-bold">
                                {ticket.raceDay}
                              </span>
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#0B1F3A]/90 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                            {ticket.raceDay}
                          </div>
                        </div>

                        {/* Middle: Ticket Category Info & Available Inventory */}
                        <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-[#123B67] uppercase tracking-wider">
                                {ticket.category.replace(/_/g, ' ')}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span
                                className={`text-xs font-mono font-bold tabular-nums ${
                                  isLowStock ? 'text-[#B45309]' : 'text-[#15803D]'
                                }`}
                              >
                                {ticket.availableQuantity}{' '}
                                {ticket.availableQuantity === 1
                                  ? 'ticket available'
                                  : 'tickets available'}
                              </span>
                            </div>

                            <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide leading-snug">
                              {ticket.name}
                            </h3>

                            <p className="text-xs text-[#64748B] flex items-start gap-1.5 font-sans">
                              <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-[#111827] font-medium">
                                  {ticket.section}
                                </strong>
                                {ticket.description ? ` — ${ticket.description}` : ''}
                              </span>
                            </p>

                            {ticket.features && ticket.features.length > 0 && (
                              <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {ticket.features.slice(0, 4).map((f, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1 text-[11px] text-[#64748B]"
                                  >
                                    <Check className="w-3 h-3 text-[#15803D] shrink-0" />
                                    <span>{f}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Unit Price, Quantity Selected, Calculated Total & Select CTA */}
                        <div className="p-5 md:w-64 shrink-0 bg-[#F8FAFC] border-t md:border-t-0 md:border-l border-[#E2E8F0] flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between md:block md:text-right">
                              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold block">
                                Price per ticket
                              </span>
                              <span className="font-mono font-bold text-base text-[#111827] tabular-nums">
                                {formatPrice(ticket.price)}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-xs md:text-right">
                              <div className="flex items-center justify-between md:justify-end md:gap-2 text-[#475569]">
                                <span>Quantity selected:</span>
                                <strong className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                                  {requestedQuantity}
                                </strong>
                              </div>
                              <div className="flex items-baseline justify-between md:justify-end md:gap-2 pt-0.5">
                                <span className="font-semibold text-[#0B1F3A] uppercase text-[11px] tracking-wider">
                                  Total:
                                </span>
                                <span className="font-mono font-black text-xl text-[#0B1F3A] tabular-nums">
                                  {formatPrice(totalForRequested)}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#64748B] font-mono">
                                {requestedQuantity} × {formatPrice(ticket.price)}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isValidatingSelection}
                            onClick={() => void handleSelectCategory(ticket)}
                            className="w-full py-2.5 px-4 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <span>
                              {isValidatingSelection ? 'Verifying Stock...' : 'Select Category'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Concerts & Upgrades Add-on Bar */}
            {eventConcerts.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#163A63] uppercase mb-1">
                  <Music className="w-3.5 h-3.5" />
                  <span>After-Race Trackside Concerts</span>
                </div>
                <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide mb-3">
                  Enhance Your Weekend with After-Race Concert Passes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {eventConcerts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#111827] uppercase">{c.name}</h4>
                        <p className="text-[11px] text-[#64748B]">{c.date}</p>
                        <p className="text-xs font-mono font-bold text-[#111827] mt-0.5">
                          {formatPrice(c.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addAddonToCart(c, event);
                          navigate('/cart');
                        }}
                        className="px-3 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase rounded transition-colors cursor-pointer shadow-xs"
                      >
                        Add to Order
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Weekend Schedule & Concierge */}
          <div className="lg:col-span-4 space-y-4">
            {/* Booking Steps Guide */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Protected Live Booking</span>
              </h3>
              <ol className="space-y-2.5 text-xs text-[#475569] font-sans">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong className="text-[#111827]">Quantity Selected ({requestedQuantity})</strong> — Only categories with live stock are displayed.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#123B67] text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong className="text-[#111827]">Confirm Details & Hold</strong> — Stock is atomically locked for 10 minutes upon confirmation.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#E2E8F0] text-[#0B1F3A] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong className="text-[#111827]">Verified Checkout</strong> — Instant confirmation & Mobile Ticket Transfer email.
                  </span>
                </li>
              </ol>
            </div>

            {/* Event Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
                <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#123B67]" />
                  <span>Race Weekend Schedule</span>
                </h3>

                <div className="space-y-3">
                  {event.schedule.map((daySchedule, idx) => (
                    <div
                      key={idx}
                      className="border-b border-[#E2E8F0] pb-2.5 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#111827] mb-1">
                        <span className="text-[#123B67] uppercase tracking-wide">
                          {daySchedule.day}
                        </span>
                        <span className="text-[#64748B] font-mono text-[11px]">
                          {daySchedule.date}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-[#475569]">
                        {daySchedule.sessions.map((sess, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between">
                            <span className="truncate pr-2">{sess.name}</span>
                            <span className="font-mono text-[#64748B] shrink-0 text-[10px]">
                              {sess.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Need Help? Box */}
            <div className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-5 text-center shadow-xs">
              <h4 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide mb-1">
                Need Help with Grandstands?
              </h4>
              <p className="text-xs text-[#64748B] mb-3.5 font-sans">
                Our Budapest concierge desk is on hand to assist with group bookings, VIP hospitality suites, and paddock access.
              </p>
              <button
                type="button"
                onClick={() => navigate('/help')}
                className="w-full py-2 bg-[#123B67] hover:bg-[#1D5288] text-white font-semibold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs"
              >
                Contact Concierge Desk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Ticket Details Modal Step (before Checkout) */}
      {confirmingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071629]/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-ticket-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReserving) {
              setConfirmingTicket(null);
            }
          }}
        >
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden text-[#111827]">
            <div className="bg-[#0B1F3A] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300 block">
                  Step 2 · Confirm Ticket Details
                </span>
                <h2
                  id="confirm-ticket-title"
                  className="font-sports font-black text-2xl uppercase tracking-tight"
                >
                  Confirm Your Selection
                </h2>
              </div>
              <button
                type="button"
                disabled={isReserving}
                onClick={() => setConfirmingTicket(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Close confirmation dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Ticket visual summary */}
              <div className="flex gap-4 items-start bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-[#0B1F3A] shrink-0">
                  <img
                    src={confirmingTicket.imageUrl || event.banner}
                    alt={confirmingTicket.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#123B67]">
                    {event.name} · {confirmingTicket.raceDay}
                  </div>
                  <h3 className="font-sports font-bold text-lg text-[#0B1F3A] uppercase leading-tight mt-0.5">
                    {confirmingTicket.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                    {confirmingTicket.section}
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-[#15803D] mt-1">
                    Live Stock Verified: {confirmingTicket.availableQuantity} tickets available
                  </p>
                </div>
              </div>

              {/* Price & Quantity Breakdown */}
              <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] text-xs">
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[#64748B]">Ticket Price</span>
                  <span className="font-mono font-semibold text-[#111827] tabular-nums">
                    {formatPrice(confirmingTicket.price)} each
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[#64748B]">Quantity Selected</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                      {requestedQuantity} {requestedQuantity === 1 ? 'ticket' : 'tickets'}
                    </span>
                    <button
                      type="button"
                      disabled={isReserving}
                      onClick={() => {
                        setIsQuantityModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-[#123B67] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[#64748B]">
                    Tickets Subtotal ({requestedQuantity} × {formatPrice(confirmingTicket.price)})
                  </span>
                  <span className="font-mono font-bold text-[#111827] tabular-nums">
                    {formatPrice(confirmingTicket.price * requestedQuantity)}
                  </span>
                </div>
                {confirmingTicket.fee > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[#64748B]">
                      Service & Handling Fee ({requestedQuantity} ×{' '}
                      {formatPrice(confirmingTicket.fee)})
                    </span>
                    <span className="font-mono font-semibold text-[#111827] tabular-nums">
                      {formatPrice(confirmingTicket.fee * requestedQuantity)}
                    </span>
                  </div>
                )}
                <div className="px-4 py-3.5 bg-[#F5F7FA] flex items-baseline justify-between">
                  <span className="font-sports font-bold text-sm text-[#0B1F3A] uppercase tracking-wide">
                    Estimated Total (excl. VAT)
                  </span>
                  <span className="font-mono font-black text-xl text-[#0B1F3A] tabular-nums">
                    {formatPrice(
                      (confirmingTicket.price + confirmingTicket.fee) * requestedQuantity
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-[#475569] bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
                <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                <span>
                  Continuing will atomically reserve{' '}
                  <strong>
                    {requestedQuantity} {requestedQuantity === 1 ? 'ticket' : 'tickets'}
                  </strong>{' '}
                  exclusively for you for 10 minutes while you complete checkout.
                </span>
              </div>

              {/* Confirm Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isReserving}
                  onClick={() => setConfirmingTicket(null)}
                  className="px-4 py-3 border border-[#CBD5E1] bg-white hover:bg-[#F5F7FA] text-[#475569] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isReserving}
                  onClick={() => void handleReserveAndCheckout()}
                  className="flex-1 py-3 px-5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isReserving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reserving Live Inventory...</span>
                    </>
                  ) : (
                    <>
                      <span>Reserve & Continue to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
