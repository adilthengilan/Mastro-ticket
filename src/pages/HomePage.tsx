import React, { useState } from 'react';
import { useStore } from '../services/store';
import { GrandPrixCard } from '../components/GrandPrixCard';
import { Hero } from '../components/Hero';
import { ScrollingTrustBanner } from '../components/ScrollingTrustBanner';
import {
  ShieldCheck,
  CreditCard,
  Calendar,
  Ticket,
  ArrowRight,
  MapPin,
  Smartphone
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { events, tickets, concerts, formatPrice } = useStore();
  const [topSellingFilter, setTopSellingFilter] = useState<'all' | 'grandstands' | 'concerts' | 'hospitality'>('all');

  const filteredTickets = tickets.filter((ticket) => {
    if (topSellingFilter === 'all') return true;
    if (topSellingFilter === 'grandstands') return ticket.category === 'grandstand';
    if (topSellingFilter === 'hospitality') return ticket.category === 'vip_hospitality';
    return false;
  });

  const showConcerts = topSellingFilter === 'all' || topSellingFilter === 'concerts';

  return (
    <div className="bg-[#FFFFFF] min-h-screen text-[#111827]">
      {/* Hero Section */}
      <Hero
        navigate={navigate}
        onSearch={(query) => navigate(`/races?q=${encodeURIComponent(query)}`)}
      />

      {/* Red Auto-Scrolling Trusted Reseller & Race Ticker Banner */}
      <ScrollingTrustBanner variant="showcase" navigate={navigate} />

      {/* Main Content Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12 sm:space-y-16">
        {/* SECTION A: UPCOMING GRAND PRIX EVENTS */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-0.5">
                OFFICIAL FORMULA 1 WORLD CHAMPIONSHIP
              </div>
              <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                Upcoming Grand Prix Events
              </h2>
            </div>

            <button
              onClick={() => navigate('/races')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B67] hover:text-[#1D5288] transition-colors cursor-pointer"
            >
              <span>View Race Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-10 text-center">
              <Calendar className="w-8 h-8 text-[#123B67] mx-auto mb-2.5" />
              <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase">
                No Published Grand Prix Events Yet
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto font-sans">
                Live events from your backend API or created in the Admin Operations Portal will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {events.slice(0, 8).map((event) => (
                <GrandPrixCard
                  key={event.id}
                  event={event}
                  onSelect={(slug) => navigate(`/races/${slug}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION B: PROMOTIONAL BANNER */}
        <section className="bg-[#0B1F3A] rounded-xl overflow-hidden shadow-sm p-6 sm:p-8 text-white relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#163A63] border border-[#1D5288] flex items-center justify-center shrink-0 text-white shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sports font-black text-2xl sm:text-3xl tracking-wide uppercase leading-tight">
                  YOUR NEXT GRAND PRIX STARTS HERE
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-sans">
                  Discover official Formula 1 race weekends, covered grandstands, post-race concerts, and VIP hospitality packages with instant barcode delivery.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => navigate('/races')}
                className="w-full md:w-auto px-6 py-2.5 bg-white hover:bg-slate-100 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs text-center"
              >
                EXPLORE TICKETS
              </button>
            </div>
          </div>
        </section>

        {/* SECTION C: AVAILABLE TICKETS & CONCERTS (STRICTLY LIVE DATA) */}
        <section id="top-selling">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-0.5">
                AVAILABLE INVENTORY
              </div>
              <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                Available Race & Concert Tickets
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'grandstands', label: 'Grandstands' },
                { id: 'concerts', label: 'Concerts' },
                { id: 'hospitality', label: 'Hospitality' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTopSellingFilter(tab.id as 'all' | 'grandstands' | 'concerts' | 'hospitality')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    topSellingFilter === tab.id
                      ? 'bg-[#0B1F3A] text-white'
                      : 'text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#F5F7FA]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 && (!showConcerts || concerts.length === 0) ? (
            <div className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-10 text-center">
              <Ticket className="w-8 h-8 text-[#123B67] mx-auto mb-2.5" />
              <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase">
                No Tickets Available in This Category
              </h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto font-sans">
                Tickets published via the MastroTickets API or Admin Operations Portal will be displayed here with live USD pricing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTickets.map((ticket) => {
                const parentEvent = events.find((e) => e.id === ticket.eventId);
                const targetPath = parentEvent ? `/races/${parentEvent.slug}` : '/races';
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(targetPath)}
                    className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
                  >
                    <div className="relative aspect-[16/10] bg-[#0B1F3A] overflow-hidden">
                      {ticket.imageUrl || parentEvent?.banner ? (
                        <img
                          src={ticket.imageUrl || parentEvent?.banner}
                          alt={ticket.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#071629] to-[#123B67] flex items-center justify-center">
                          <Ticket className="w-10 h-10 text-white/25" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                        <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {ticket.raceDay}
                        </span>
                        <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <h4 className="font-sports font-bold text-lg leading-tight uppercase line-clamp-1">
                          {ticket.name}
                        </h4>
                        <span className="text-[10px] text-slate-300 line-clamp-1">{ticket.section}</span>
                      </div>
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                      <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                        <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                        <span className="truncate">{parentEvent ? `${parentEvent.circuit}, ${parentEvent.location}` : ticket.section}</span>
                      </div>
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-medium uppercase">Price</span>
                          <span className="text-sm font-bold text-[#111827] font-mono tabular-nums">{formatPrice(ticket.price)}</span>
                        </div>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer"
                        >
                          TICKETS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {showConcerts &&
                concerts.map((concert) => {
                  const parentEvent = events.find((e) => e.id === concert.eventId);
                  const targetPath = parentEvent ? `/races/${parentEvent.slug}` : '/races';
                  return (
                    <div
                      key={concert.id}
                      id="concerts"
                      onClick={() => navigate(targetPath)}
                      className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
                    >
                      <div className="relative aspect-[16/10] bg-[#0B1F3A] overflow-hidden">
                        {concert.image ? (
                          <img
                            src={concert.image}
                            alt={concert.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#071629] to-[#123B67]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                          <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                            {concert.date}
                          </span>
                          <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                            CONCERT
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-3 right-3 text-white">
                          <h4 className="font-sports font-bold text-lg leading-tight uppercase line-clamp-1">
                            {concert.name}
                          </h4>
                          <span className="text-[10px] text-slate-300 line-clamp-1">{concert.venue}</span>
                        </div>
                      </div>

                      <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                        <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                          <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                          <span className="truncate">{concert.venue}</span>
                        </div>
                        <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#64748B] block font-medium uppercase">From</span>
                            <span className="text-sm font-bold text-[#111827] font-mono tabular-nums">{formatPrice(concert.price)}</span>
                          </div>
                          <button
                            type="button"
                            className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer"
                          >
                            VIEW
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* SECTION D: PLATFORM BENEFITS */}
        <section id="premium" className="pt-8 border-t border-[#E2E8F0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative bg-white p-5 rounded-lg border border-[#E2E8F0] overflow-hidden">
              <span className="absolute right-3 top-2 text-5xl font-black text-[#F5F7FA] font-mono select-none pointer-events-none">
                01
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#123B67] mb-3 relative z-10">
                <Ticket className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#111827] mb-1 font-sans">
                Wide Selection of Tickets
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                Grandstand passes, General Admission, VIP hospitality suites, and after-race concert passes all managed in one place.
              </p>
            </div>

            <div className="relative bg-white p-5 rounded-lg border border-[#E2E8F0] overflow-hidden">
              <span className="absolute right-3 top-2 text-5xl font-black text-[#F5F7FA] font-mono select-none pointer-events-none">
                02
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#123B67] mb-3 relative z-10">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#111827] mb-1 font-sans">
                Transparent & Secure Pricing
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                Stripe 256-bit encrypted checkout in USD ($) with zero hidden fees and official VAT tax receipts.
              </p>
            </div>

            <div className="relative bg-white p-5 rounded-lg border border-[#E2E8F0] overflow-hidden">
              <span className="absolute right-3 top-2 text-5xl font-black text-[#F5F7FA] font-mono select-none pointer-events-none">
                03
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#123B67] mb-3 relative z-10">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#111827] mb-1 font-sans">
                Flexible Race-Day Selection
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                Pick single-day practice, qualifying, race day, or full multi-day weekend passes with fast guest checkout.
              </p>
            </div>

            <div className="relative bg-white p-5 rounded-lg border border-[#E2E8F0] overflow-hidden">
              <span className="absolute right-3 top-2 text-5xl font-black text-[#F5F7FA] font-mono select-none pointer-events-none">
                04
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#123B67] mb-3 relative z-10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#111827] mb-1 font-sans">
                Verified Barcoded E-Tickets
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                Authorized electronic entry passes with scannable 2D barcodes and online pass authenticity verification.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
