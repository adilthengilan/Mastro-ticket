import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowRight, ShieldCheck, ExternalLink, Search } from 'lucide-react';
import { useStore } from '../services/store';

interface HeroProps {
  navigate: (path: string) => void;
  onSearch: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ navigate, onSearch }) => {
  const { events, tickets } = useStore();

  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);

  useEffect(() => {
    if (events.length > 0 && activeEventIndex >= events.length) {
      setActiveEventIndex(0);
    }
  }, [events.length, activeEventIndex]);

  const activeEvent = events[activeEventIndex];

  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEventSlug) {
      navigate(`/races/${selectedEventSlug}`);
      return;
    }
    if (searchKeyword.trim()) {
      onSearch(searchKeyword.trim());
      return;
    }
    navigate('/races');
  };

  return (
    <div className="relative min-h-[540px] sm:min-h-[600px] lg:min-h-[640px] bg-[#071629] text-white flex flex-col justify-between overflow-hidden">
      {/* Background Media Layer */}
      <div className="absolute inset-0 z-0">
        {activeEvent?.banner ? (
          <img
            src={activeEvent.banner}
            alt={activeEvent.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#071629] via-[#0B1F3A] to-[#123B67]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071629] via-[#071629]/55 to-[#071629]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071629]/85 via-transparent to-[#071629]/65" />
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 flex-1 flex flex-col justify-between">
        {/* Upper Floating Search Bar */}
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          <form
            onSubmit={handleBookingSearch}
            className="w-full bg-white text-[#0B1F3A] rounded-2xl md:rounded-full shadow-2xl p-2 px-4 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/60"
          >
            {/* Column 1: Select Event */}
            <div className="flex-1 px-3 py-1.5 md:border-r border-gray-200">
              <label className="block text-[10px] font-sports font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                SELECT EVENT
              </label>
              <div className="relative mt-0.5">
                <select
                  value={selectedEventSlug}
                  onChange={(e) => setSelectedEventSlug(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer appearance-none pr-5 truncate"
                >
                  <option value="">
                    {events.length > 0 ? 'All Published Grand Prix Events' : 'No published events yet'}
                  </option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.slug}>
                      {ev.name} ({ev.dates})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Column 2: Search Keywords */}
            <div className="flex-1 px-3 py-1.5">
              <label className="block text-[10px] font-sports font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                SEARCH TICKETS OR GRANDSTANDS
              </label>
              <div className="relative mt-0.5 flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={
                    tickets.length > 0
                      ? 'Search grandstands, circuits, or passes...'
                      : 'Search Formula 1 races & concerts...'
                  }
                  className="w-full bg-transparent text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Search Action Button */}
            <button
              type="submit"
              className="bg-[#123B67] hover:bg-[#1D5288] text-white font-sports font-black text-sm uppercase tracking-wider px-8 sm:px-10 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>SEARCH</span>
            </button>
          </form>
        </div>

        {/* Center Hero Headline & CTA */}
        <div className="my-10 sm:my-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-sports font-black text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] uppercase drop-shadow-md">
              {activeEvent ? activeEvent.name : 'FORMULA 1 RACE & CONCERT TICKETS'}
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-2 font-sans drop-shadow">
              {activeEvent
                ? `${activeEvent.circuit}, ${activeEvent.location} · ${activeEvent.dates}`
                : 'Trusted ticket seller platform for official Formula 1 grandstands, VIP hospitality, and post-race concerts with encrypted USD checkout.'}
            </p>
          </div>

          <button
            onClick={() => navigate(activeEvent ? `/races/${activeEvent.slug}` : '/races')}
            className="bg-[#123B67] hover:bg-[#1D5288] text-white font-sports font-black text-base uppercase tracking-wider px-9 py-3.5 rounded-full shadow-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
          >
            <span>{activeEvent ? 'BOOK NOW' : 'BROWSE EVENTS'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Hero Section Trust Indicators */}
        <div className="mb-5 bg-[#071629]/80 backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:divide-x lg:divide-white/15">
            {/* 1. Trusted Ticket Reseller */}
            <div className="flex items-center gap-3 lg:pr-4">
              <div className="w-9 h-9 rounded-lg bg-[#123B67]/80 border border-white/15 flex items-center justify-center shrink-0 text-sky-300">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white leading-tight truncate">
                  Trusted Ticket Reseller
                </p>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
                  Verified F1 & Concert Passes
                </p>
              </div>
            </div>

            {/* 2. Five-Star Customer Experience */}
            <div className="flex items-center gap-3 lg:px-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5 mb-0.5" aria-label="Five-star customer experience">
                  {[0, 1, 2, 3, 4].map((starIdx) => (
                    <svg key={starIdx} className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs font-semibold text-white leading-tight truncate">
                  Five-Star Customer Experience
                </p>
              </div>
            </div>

            {/* 3. Trustpilot Reviews (Linked to Official Source) */}
            <a
              href="https://www.trustpilot.com/review/mastrotickets.co"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 lg:px-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              aria-label="Read MastroTickets reviews on Trustpilot"
            >
              <div className="w-9 h-9 rounded-lg bg-[#00B67A]/15 border border-[#00B67A]/35 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2.25l2.92 6.08 6.7.92-4.88 4.68 1.2 6.66L12 17.4l-5.94 3.19 1.2-6.66-4.88-4.68 6.7-.92L12 2.25z"
                    fill="#00B67A"
                  />
                  <path
                    d="M16.17 16.32l-.44-2.4L12 17.4l4.17-1.08z"
                    fill="#005128"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white group-hover:text-[#00B67A] transition-colors leading-tight flex items-center gap-1">
                  <span className="truncate">Trustpilot Reviews</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#00B67A] shrink-0" aria-hidden="true" />
                </p>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
                  Read verified customer feedback
                </p>
              </div>
            </a>

            {/* 4. Google Reviews (Linked to Official Source) */}
            <a
              href="https://www.google.com/search?q=MastroTickets+Reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 lg:pl-4 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              aria-label="Read MastroTickets reviews on Google"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors leading-tight flex items-center gap-1">
                  <span className="truncate">Google Reviews</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-300 shrink-0" aria-hidden="true" />
                </p>
                <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
                  View on Google Search
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Dynamic Event Selector Strip (only rendered when multiple real events exist) */}
        {events.length > 1 && (
          <div className="w-full pt-4 border-t border-white/20">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none text-xs">
              {events.map((ev, idx) => {
                const isActive = activeEventIndex === idx;
                return (
                  <button
                    key={ev.id}
                    onClick={() => setActiveEventIndex(idx)}
                    className={`relative pb-3 px-3 text-center whitespace-nowrap font-sports font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center shrink-0 ${
                      isActive ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span>{ev.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
