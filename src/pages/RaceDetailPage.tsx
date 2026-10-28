import React, { useState } from 'react';
import { useStore } from '../services/store';
import { TicketType } from '../types';
import { SeatMap } from '../components/SeatMap';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Music,
  ArrowRight,
  Layers
} from 'lucide-react';

interface RaceDetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

export const RaceDetailPage: React.FC<RaceDetailPageProps> = ({ slug, navigate }) => {
  const { events, tickets, concerts, formatPrice, addToCart, addAddonToCart } = useStore();

  const event = events.find((e) => e.slug === slug) || events[0];
  const eventTickets = tickets.filter((t) => t.eventId === event.id);
  const eventConcerts = concerts.filter((c) => c.eventId === event.id);

  // Filters on event page
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  
  // Interactive seat map modal state
  const [activeSeatMapTicket, setActiveSeatMapTicket] = useState<TicketType | null>(null);

  // Quantity map for non-assigned seating
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  const getQuantity = (id: string) => ticketQuantities[id] || 1;
  const setQuantity = (id: string, q: number) => {
    setTicketQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(8, q))
    }));
  };

  const handleSeatConfirmed = (selectedSeats: { grandstand: string; row: string; seatNumber: number }[]) => {
    if (!activeSeatMapTicket) return;
    selectedSeats.forEach((seat) => {
      addToCart(activeSeatMapTicket, event, 1, seat);
    });
    setActiveSeatMapTicket(null);
    navigate('/cart');
  };

  const handleAddGeneralTicket = (ticket: TicketType) => {
    const qty = getQuantity(ticket.id);
    addToCart(ticket, event, qty);
    navigate('/cart');
  };

  // Filtered tickets
  const filteredTickets = eventTickets.filter((t) => {
    if (selectedDayTab !== 'all' && t.raceDay !== selectedDayTab) return false;
    if (selectedCategoryTab !== 'all' && t.category !== selectedCategoryTab) return false;
    return true;
  });

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20 text-[#111827]">
      
      {/* 1. Cinematic Event Hero Banner */}
      <div className="relative aspect-[21/9] min-h-[300px] max-h-[400px] w-full overflow-hidden bg-slate-900 border-b border-[#E2E8F0]">
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
                  <span>{event.circuit}, {event.location}</span>
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
                <strong className="text-[#111827] font-mono">{event.numberOfLaps} laps ({event.raceDistance})</strong>
              </div>
              <div className="flex justify-between gap-6 text-[#64748B]">
                <span>Lap Record:</span>
                <strong className="text-[#111827] font-mono">{event.lapRecord.time} ({event.lapRecord.driver})</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area (Tickets & Seat Selection) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filter Tabs Toolbar */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-xs">
              {/* Day Selector Tabs */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Filter by Race Session:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'Weekend Pass', 'Sunday', 'Saturday', 'Friday', 'Thursday'].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDayTab(day)}
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
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Ticket Category:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'grandstand', label: 'Grandstand (Reserved Seats)' },
                    { id: 'general_admission', label: 'General Admission' },
                    { id: 'vip_hospitality', label: 'VIP Paddock Club™' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryTab(cat.id)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
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
            </div>

            {/* Ticket Rows List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span>Available Ticket Options ({filteredTickets.length})</span>
                <span>All tickets include full circuit gate admission & concert perks</span>
              </div>

              <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] bg-white rounded-xl overflow-hidden shadow-xs">
                {filteredTickets.map((ticket) => {
                  const qty = getQuantity(ticket.id);
                  return (
                    <div
                      key={ticket.id}
                      className="p-5 hover:bg-[#F5F7FA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B1F3A] text-white uppercase tracking-wider">
                            {ticket.raceDay}
                          </span>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs font-medium text-[#475569] capitalize">
                            {ticket.category.replace('_', ' ')}
                          </span>
                          {ticket.status === 'low_inventory' && (
                            <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-[#B45309] border border-amber-200 uppercase">
                              Low Inventory
                            </span>
                          )}
                        </div>

                        <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">
                          {ticket.name}
                        </h3>

                        <p className="text-xs text-[#64748B] flex items-center gap-1.5 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-[#123B67]" />
                          <span className="font-medium text-[#111827]">{ticket.section}</span>
                          <span className="text-slate-300">|</span>
                          <span>{ticket.description}</span>
                        </p>

                        {/* Inclusions checklist */}
                        <div className="pt-1 flex flex-wrap items-center gap-3">
                          {ticket.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-[#64748B]">
                              <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Pricing & CTA */}
                      <div className="flex flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2E8F0] shrink-0 min-w-[200px]">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">Price per ticket</span>
                          <div className="text-xl font-bold text-[#111827] font-mono tabular-nums">
                            {formatPrice(ticket.price)}
                          </div>
                          <span className="text-[10px] text-[#15803D] font-medium">
                            Includes VAT & turnstile barcodes
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-2.5 w-full flex flex-col gap-1.5">
                          {ticket.isAssignedSeating ? (
                            <button
                              onClick={() => setActiveSeatMapTicket(ticket)}
                              className="w-full px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Select Seats on Map</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              {/* Quantity Selector */}
                              <div className="flex items-center border border-[#E2E8F0] rounded bg-[#F5F7FA]">
                                <button
                                  onClick={() => setQuantity(ticket.id, qty - 1)}
                                  className="p-1.5 text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-mono font-bold text-xs text-[#111827]">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => setQuantity(ticket.id, qty + 1)}
                                  className="p-1.5 text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleAddGeneralTicket(ticket)}
                                className="flex-1 px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <span>Add to Cart</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <span className="text-[10px] text-[#64748B] text-center">
                            Official barcoded electronic entry
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Concerts & Upgrades Add-on Bar */}
            {eventConcerts.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#163A63] uppercase mb-1">
                  <Music className="w-3.5 h-3.5" />
                  <span>After-Race Trackside Concerts</span>
                </div>
                <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide mb-3">
                  Enhance Your Weekend with Yasalam Concert Passes
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

          {/* Sidebar: Weekend Schedule, Circuit Details & FAQs */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Event Schedule Accordion */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#123B67]" />
                <span>Race Weekend Schedule</span>
              </h3>

              <div className="space-y-3">
                {event.schedule.map((daySchedule, idx) => (
                  <div key={idx} className="border-b border-[#E2E8F0] pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs font-bold text-[#111827] mb-1">
                      <span className="text-[#123B67] uppercase tracking-wide">{daySchedule.day}</span>
                      <span className="text-[#64748B] font-mono text-[11px]">{daySchedule.date}</span>
                    </div>

                    <div className="space-y-1 text-xs text-[#475569]">
                      {daySchedule.sessions.map((sess, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between">
                          <span className="truncate pr-2">{sess.name}</span>
                          <span className="font-mono text-[#64748B] shrink-0 text-[10px]">{sess.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Conditions Guarantee */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2.5 text-xs text-[#475569] shadow-xs">
              <h4 className="font-bold text-sm text-[#0B1F3A] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Ticket Conditions & Delivery</span>
              </h4>

              <div className="space-y-2 text-xs text-[#64748B] leading-relaxed font-sans">
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                  <span><strong>Instant Mobile Pass / E-Ticket:</strong> Official PDF vouchers sent instantly upon payment verification.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                  <span><strong>Adjacent Seating:</strong> Multiple tickets booked in the same order are guaranteed side-by-side.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                  <span><strong>Tax Invoicing:</strong> Compliant commercial VAT receipt automatically generated.</span>
                </p>
              </div>
            </div>

            {/* Need Help? Box */}
            <div className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-5 text-center shadow-xs">
              <h4 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide mb-1">
                Need Help with Grandstands?
              </h4>
              <p className="text-xs text-[#64748B] mb-3.5 font-sans">
                Our Abu Dhabi concierge desk is on hand to assist with group bookings, VIP hospitality suites, and yacht berths.
              </p>
              <button
                onClick={() => navigate('/help')}
                className="w-full py-2 bg-[#123B67] hover:bg-[#1D5288] text-white font-semibold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs"
              >
                Contact Concierge Desk
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Interactive Seat Map Modal */}
      {activeSeatMapTicket && (
        <SeatMap
          ticket={activeSeatMapTicket}
          event={event}
          onSeatConfirmed={handleSeatConfirmed}
          onClose={() => setActiveSeatMapTicket(null)}
        />
      )}

    </div>
  );
};
