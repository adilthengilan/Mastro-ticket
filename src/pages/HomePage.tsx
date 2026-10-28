import React, { useState } from 'react';
import { useStore } from '../services/store';
import { GrandPrixCard } from '../components/GrandPrixCard';
import { Hero } from '../components/Hero';
import {
  ShieldCheck,
  CreditCard,
  Calendar,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { events, tickets, concerts, formatPrice } = useStore();
  const [topSellingFilter, setTopSellingFilter] = useState<'all' | 'grandstands' | 'concerts' | 'hospitality'>('all');
  const [driverScrollIndex, setDriverScrollIndex] = useState(0);

  // 8 Verified Formula 1 Personalities / Drivers
  const f1Drivers = [
    {
      id: 'ver',
      name: 'Max Verstappen',
      team: 'Red Bull Racing',
      role: '4x World Champion',
      image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'ham',
      name: 'Lewis Hamilton',
      team: 'Scuderia Ferrari',
      role: '7x World Champion',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'nor',
      name: 'Lando Norris',
      team: 'McLaren F1 Team',
      role: 'Championship Contender',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'lec',
      name: 'Charles Leclerc',
      team: 'Scuderia Ferrari',
      role: 'Monaco GP Winner',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'pia',
      name: 'Oscar Piastri',
      team: 'McLaren F1 Team',
      role: 'Grand Prix Winner',
      image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'alo',
      name: 'Fernando Alonso',
      team: 'Aston Martin F1',
      role: '2x World Champion',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'rus',
      name: 'George Russell',
      team: 'Mercedes-AMG',
      role: 'Grand Prix Winner',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=300&q=80'
    },
    {
      id: 'sai',
      name: 'Carlos Sainz',
      team: 'Williams Racing',
      role: 'Grand Prix Winner',
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&h=300&q=80'
    }
  ];

  const handlePrevDriver = () => {
    setDriverScrollIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextDriver = () => {
    setDriverScrollIndex((prev) => Math.min(f1Drivers.length - 4, prev + 1));
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen text-[#111827]">
      {/* Yas Island Website Style Hero Section */}
      <Hero
        navigate={navigate}
        onSearch={(query) => navigate(`/races?q=${encodeURIComponent(query)}`)}
      />

      {/* Centered White Website Canvas matching Reference Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12 sm:space-y-16">
        
        {/* ==========================================
            SECTION A: EVENT LISTINGS (4-Column Grid)
           ========================================== */}
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
              <span>View All 24 Calendar Races</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-column compact event card grid matching reference density */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {events.slice(0, 8).map((event) => (
              <GrandPrixCard
                key={event.id}
                event={event}
                onSelect={(slug) => navigate(`/races/${slug}`)}
              />
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION B: PROMOTIONAL BANNER
            Compact horizontal banner with navy background
           ========================================== */}
        <section className="bg-[#0B1F3A] rounded-xl overflow-hidden shadow-sm p-6 sm:p-8 text-white relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left: Illustration / Mobile Icon */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#163A63] border border-[#1D5288] flex items-center justify-center shrink-0 text-white shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-sports font-black text-2xl sm:text-3xl tracking-wide uppercase leading-tight">
                  YOUR NEXT GRAND PRIX STARTS HERE
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-sans">
                  Discover official Formula 1 race weekends, covered grandstands, Yasalam after-race concerts, and VIP hospitality packages with instant barcode delivery.
                </p>
              </div>
            </div>

            {/* Right: CTA button */}
            <div className="shrink-0 flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="w-full md:w-auto px-6 py-2.5 bg-white hover:bg-slate-100 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs text-center"
              >
                EXPLORE PACKAGES
              </button>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION C: FEATURED PERSONALITIES / DRIVERS
            Horizontal circular portrait row matching reference
           ========================================== */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#E2E8F0]">
            <div>
              <h2 className="font-sports font-black text-xl sm:text-2xl text-[#0B1F3A] uppercase tracking-wide">
                FEATURED DRIVERS & PERSONALITIES
              </h2>
              <span className="text-xs text-[#64748B]">Official 2026 World Championship Contenders</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="hidden sm:inline text-xs font-medium text-[#123B67] hover:underline mr-2"
              >
                Full Lineup
              </button>
              <button
                onClick={handlePrevDriver}
                className="p-1.5 rounded-full border border-[#E2E8F0] hover:bg-[#F5F7FA] text-[#64748B] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDriver}
                className="p-1.5 rounded-full border border-[#E2E8F0] hover:bg-[#F5F7FA] text-[#64748B] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Circular Portraits Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 text-center">
            {f1Drivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group flex flex-col items-center cursor-pointer"
              >
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-[#E2E8F0] group-hover:border-[#0B1F3A] transition-colors shadow-xs mb-2">
                  <img
                    src={driver.image}
                    alt={driver.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <h4 className="font-sports font-bold text-sm text-[#0B1F3A] group-hover:text-[#123B67] uppercase line-clamp-1">
                  {driver.name}
                </h4>
                <p className="text-[11px] text-[#64748B] truncate max-w-[110px] font-sans">
                  {driver.team}
                </p>
                <span className="text-[10px] text-[#15803D] font-medium font-sans">
                  {driver.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            SECTION D: TOP-SELLING TICKETS
            Varied Card-Grid matching Reference:
            Row 1: [compact][compact] + [wide featured 2-cols]
            Row 2: [wide featured 2-cols] + [compact][compact]
           ========================================== */}
        <section id="top-selling">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-0.5">
                MOST IN-DEMAND PASSES
              </div>
              <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                Top-Selling Tickets
              </h2>
            </div>

            {/* Category Filter Tabs matching Reference */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'grandstands', label: 'Grandstands' },
                { id: 'concerts', label: 'Concerts' },
                { id: 'hospitality', label: 'Hospitality' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTopSellingFilter(tab.id as any)}
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

          {/* Varied Grid System */}
          <div className="space-y-4">
            
            {/* ROW 1: [Compact 1] + [Compact 2] + [Wide Featured Card (2 cols)] */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Compact Card 1: Main Grandstand */}
              <div
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80"
                    alt="Main Grandstand"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      DEC 4-6
                    </span>
                    <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      COVERED
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h4 className="font-sports font-bold text-lg leading-tight uppercase">
                      Main Grandstand (Start/Finish)
                    </h4>
                    <span className="text-[10px] text-slate-300">Overlooking Team Pits</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                    <span className="truncate">Yas Marina Circuit, Abu Dhabi</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">From</span>
                      <span className="text-sm font-bold text-[#111827] font-mono">{formatPrice(580)}</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      TICKETS
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Card 2: North Grandstand */}
              <div
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80"
                    alt="North Grandstand"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      DEC 4-6
                    </span>
                    <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      HAIRPIN
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h4 className="font-sports font-bold text-lg leading-tight uppercase">
                      North Grandstand (Turn 5)
                    </h4>
                    <span className="text-[10px] text-slate-300">Heavy Braking Overtake Zone</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                    <span className="truncate">Yas Marina Circuit, Abu Dhabi</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">From</span>
                      <span className="text-sm font-bold text-[#111827] font-mono">{formatPrice(490)}</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      TICKETS
                    </button>
                  </div>
                </div>
              </div>

              {/* Wide Featured Card (2 Columns Wide!) */}
              <div
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group md:col-span-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/8] sm:aspect-[16/7] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80"
                    alt="Etihad Airways Abu Dhabi GP Pass"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded">
                      DEC 04 – 06, 2026
                    </span>
                    <span className="bg-[#B45309]/90 text-white text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-sports font-black text-2xl sm:text-3xl leading-tight uppercase drop-shadow-xs">
                      ETIHAD AIRWAYS ABU DHABI GP 3-DAY PASS
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 font-sans">
                      Includes Pit Lane Walk, all 4 Yasalam concerts at Etihad Park & Yas Island Theme Parks access.
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2 text-xs text-[#475569]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3 text-[#123B67]" />
                    </div>
                    <span className="font-medium">Yas Marina Circuit · Covered Grandstand Seating</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">Weekend From</span>
                      <span className="text-lg font-black text-[#111827] font-mono">{formatPrice(510)}</span>
                    </div>
                    <button className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      VIEW PASSES
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ROW 2: [Wide Featured Card (2 cols)] + [Compact 3] + [Compact 4] */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Wide Featured Concerts Card (2 Columns Wide!) */}
              <div
                onClick={() => navigate('/#concerts')}
                className="group md:col-span-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/8] sm:aspect-[16/7] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80"
                    alt="Yasalam After-Race Concerts"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2.5 py-0.5 rounded">
                      DEC 3 – 6, 2026
                    </span>
                    <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                      4 NIGHTS
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-sports font-black text-2xl sm:text-3xl leading-tight uppercase drop-shadow-xs">
                      YASALAM AFTER-RACE CONCERTS · ETIHAD PARK
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 font-sans">
                      Maroon 5, Foo Fighters, plus international megastars. Golden Circle fast-track available.
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2 text-xs text-[#475569]">
                    <div className="w-5 h-5 rounded-full bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3 text-[#123B67]" />
                    </div>
                    <span className="font-medium">Etihad Park Open-Air Arena, Yas Island</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">Included with Race / From</span>
                      <span className="text-lg font-black text-[#111827] font-mono">{formatPrice(95)}</span>
                    </div>
                    <button className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      VIEW CONCERTS
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Card 3: Marina Grandstand */}
              <div
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80"
                    alt="Marina Grandstand"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      DEC 4-6
                    </span>
                    <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      YACHTS
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h4 className="font-sports font-bold text-lg leading-tight uppercase">
                      Marina Grandstand (Turns 9-10)
                    </h4>
                    <span className="text-[10px] text-slate-300">Overlooking Superyachts Basin</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                    <span className="truncate">Yas Marina Circuit, Abu Dhabi</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">From</span>
                      <span className="text-sm font-bold text-[#111827] font-mono">{formatPrice(530)}</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      TICKETS
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Card 4: Abu Dhabi Hill */}
              <div
                onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')}
                className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between cursor-pointer"
              >
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80"
                    alt="Abu Dhabi Hill General Admission"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between">
                    <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      DEC 4-6
                    </span>
                    <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      GENERAL ADM
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h4 className="font-sports font-bold text-lg leading-tight uppercase">
                      Abu Dhabi Hill (3-Day Pass)
                    </h4>
                    <span className="text-[10px] text-slate-300">Open Grass Banking & Screens</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                    <span className="truncate">Turns 2 to 5 Panoramic Banking</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-medium uppercase">From</span>
                      <span className="text-sm font-bold text-[#111827] font-mono">{formatPrice(260)}</span>
                    </div>
                    <button className="px-3.5 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold rounded uppercase cursor-pointer">
                      TICKETS
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ==========================================
            SECTION E: BENEFITS (4 Evenly Spaced Columns)
            Simple line icons, watermark numbers, clean typography
           ========================================== */}
        <section className="pt-8 border-t border-[#E2E8F0]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Benefit 1 */}
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
                Direct official promoter allocation covering Main, North, West, Marina, and South Grandstands, plus Paddock Club™ and general admission hill.
              </p>
            </div>

            {/* Benefit 2 */}
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
                Stripe 256-bit encrypted checkout with zero hidden fees. Multi-currency payments in AED, USD, and EUR with official VAT tax receipts.
              </p>
            </div>

            {/* Benefit 3 */}
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
                Pick single-day Friday practice, Saturday night qualifying, Sunday championship race finale, or full 3-day weekend packages.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="relative bg-white p-5 rounded-lg border border-[#E2E8F0] overflow-hidden">
              <span className="absolute right-3 top-2 text-5xl font-black text-[#F5F7FA] font-mono select-none pointer-events-none">
                04
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center text-[#123B67] mb-3 relative z-10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-[#111827] mb-1 font-sans">
                Instant Barcoded E-Delivery
              </h4>
              <p className="text-xs text-[#64748B] leading-relaxed font-sans">
                Authorized electronic entry passes generated instantly with scannable 2D barcodes, emailed immediately and ready for Yas Marina turnstiles.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
