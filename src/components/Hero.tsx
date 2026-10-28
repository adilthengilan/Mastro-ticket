import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { useStore } from '../services/store';

interface HeroProps {
  navigate: (path: string) => void;
  onSearch: (query: string) => void;
}

interface HeroOffer {
  id: string;
  tabLabel: string;
  headline: string;
  subheadline: string;
  bgImage: string;
  packageType: string;
  targetPath: string;
}

export const Hero: React.FC<HeroProps> = ({ navigate, onSearch }) => {
  const { formatPrice } = useStore();

  // Booking Engine State
  const [activeCategoryTab, setActiveCategoryTab] = useState<'vacation' | 'experiences' | 'premium'>('vacation');
  const [selectedPackage, setSelectedPackage] = useState('Main Grandstand - 3 Day Pass');
  const [selectedDates, setSelectedDates] = useState('Dec 04 - Dec 06, 2026');
  
  // Bottom Offer Carousel / Slide State (matching the screenshot)
  const offers: HeroOffer[] = [
    {
      id: 'fadel-chaker',
      tabLabel: 'FADEL CHAKER PACKAGE',
      headline: 'ARABIC MUSIC FESTIVAL & GP FINALE',
      subheadline: 'Exclusive Etihad Park concert access paired with Yas Marina Grandstand weekend admission.',
      bgImage: 'https://alpinef1-assets.dropt.app/Abu_Dhabi_GP_2025_Race_5f98d7412c.png',
      packageType: 'concert',
      targetPath: '/#concerts'
    },
    {
      id: 'kids-free',
      tabLabel: 'KIDS GO FREE OFFER',
      headline: 'KIDS GO FREE ON YAS ISLAND!',
      subheadline: 'Children under 12 receive complimentary theme park admission and Yas Marina Circuit access with accompanying adults.',
      bgImage: 'https://www.timeoutabudhabi.com/cloud/timeoutabudhabi/2024/06/25/Abu-Dhabi-GP.jpg',
      packageType: 'family',
      targetPath: '/races/abu-dhabi-grand-prix-2026'
    },
    {
      id: 'yas-annual',
      tabLabel: 'YAS ANNUAL PASS',
      headline: 'UNLIMITED THEME PARKS & RACE PASS',
      subheadline: '365 days of thrills across Ferrari World, Warner Bros. World, SeaWorld, and Yas Waterworld with Grand Prix priority access.',
      bgImage: 'https://i0.wp.com/rumemagazine.com/wp-content/uploads/2025/05/Etihad-Park.webp',
      packageType: 'annual',
      targetPath: '/races/abu-dhabi-grand-prix-2026'
    },
    {
      id: 'american-freestyle',
      tabLabel: 'REAL AMERICAN FREESTYLE',
      headline: 'ADRENALINE FREESTYLE MOTOCROSS & GP',
      subheadline: 'High-octane stunt shows and Monster Jam exhibitions live on Yas Island during the Grand Prix week.',
      bgImage: 'https://www.digitalstudiome.com/cloud/2021/08/11/sVVDjrSN-Jamiroquai-crowd.jpg',
      packageType: 'adrenaline',
      targetPath: '/races/abu-dhabi-grand-prix-2026'
    },
    {
      id: 'formula-1',
      tabLabel: 'FORMULA 1® PACKAGE',
      headline: 'ABU DHABI GRAND PRIX 2026',
      subheadline: 'The Formula 1 season finale under 4,700 floodlights at Yas Marina Circuit. Covered grandstands and pit lane walks.',
      bgImage: 'https://alpinef1-assets.dropt.app/Abu_Dhabi_GP_2025_Race_5f98d7412c.png',
      packageType: 'f1',
      targetPath: '/races/abu-dhabi-grand-prix-2026'
    },
    {
      id: 'hans-zimmer',
      tabLabel: 'HANS ZIMMER PACKAGE',
      headline: 'LIVE SYMPHONIC CONCERT AT ETIHAD ARENA',
      subheadline: 'Academy Award winner Hans Zimmer performs legendary Formula 1 & Hollywood soundtracks on Yas Island.',
      bgImage: 'https://www.timeoutabudhabi.com/cloud/timeoutabudhabi/2024/06/25/Abu-Dhabi-GP.jpg',
      packageType: 'concert',
      targetPath: '/#concerts'
    },
    {
      id: 'flexible',
      tabLabel: 'FLEXIBLE CANCELLATION',
      headline: '100% PEACE OF MIND BOOKING',
      subheadline: 'Book now with refundable deposit options and zero-fee date amendments on official Yas Island ticket packages.',
      bgImage: 'https://i0.wp.com/rumemagazine.com/wp-content/uploads/2025/05/Etihad-Park.webp',
      packageType: 'policy',
      targetPath: '/help'
    }
  ];

  const [activeOfferIndex, setActiveOfferIndex] = useState(1); // Default to 'KIDS GO FREE OFFER' (index 1) as in screenshot
  const currentOffer = offers[activeOfferIndex];

  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCategoryTab === 'premium') {
      const el = document.getElementById('premium');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate('/races/abu-dhabi-grand-prix-2026');
      return;
    }
    onSearch(selectedPackage);
    navigate(`/races/abu-dhabi-grand-prix-2026`);
  };

  return (
    <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] bg-[#071629] text-white flex flex-col justify-between overflow-hidden">
      
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentOffer.bgImage}
          alt={currentOffer.headline}
          className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out scale-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=2000&q=85';
          }}
        />
        {/* Deep navy vignette on top and bottom, clear center to match yasisland.com */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071629] via-[#071629]/40 to-[#071629]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071629]/80 via-transparent to-[#071629]/60" />
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 flex-1 flex flex-col justify-between">
        
        {/* Upper Floating Booking Engine (as seen on yasisland.com screenshot) */}
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          
          {/* 3-Pill Category Tab Switcher */}
          <div className="inline-flex items-center bg-white/95 backdrop-blur-md rounded-full p-1 shadow-2xl mb-3 border border-white/40">
            <button
              onClick={() => setActiveCategoryTab('vacation')}
              className={`px-6 sm:px-8 py-2 rounded-full text-xs font-sports font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeCategoryTab === 'vacation'
                  ? 'bg-[#123B67] text-white shadow-md'
                  : 'text-[#0B1F3A] hover:text-black font-bold'
              }`}
            >
              VACATION
            </button>
            <button
              onClick={() => setActiveCategoryTab('experiences')}
              className={`px-6 sm:px-8 py-2 rounded-full text-xs font-sports font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeCategoryTab === 'experiences'
                  ? 'bg-[#123B67] text-white shadow-md'
                  : 'text-[#0B1F3A] hover:text-black font-bold'
              }`}
            >
              EXPERIENCES
            </button>
            <button
              onClick={() => setActiveCategoryTab('premium')}
              className={`px-6 sm:px-8 py-2 rounded-full text-xs font-sports font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeCategoryTab === 'premium'
                  ? 'bg-[#123B67] text-white shadow-md'
                  : 'text-[#0B1F3A] hover:text-black font-bold'
              }`}
            >
              PREMIUM VACATION
            </button>
          </div>

          {/* Floating White Pill Search Bar Container */}
          <form
            onSubmit={handleBookingSearch}
            className="w-full bg-white text-[#0B1F3A] rounded-2xl md:rounded-full shadow-2xl p-2 px-4 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-white/60"
          >
            {/* Column 1: Choose Holiday / Grandstand */}
            <div className="flex-1 px-3 py-1.5 md:border-r border-gray-200">
              <label className="block text-[10px] font-sports font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                CHOOSE YOUR HOLIDAY
              </label>
              <div className="relative mt-0.5">
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full bg-transparent text-xs font-helvetica font-medium text-gray-800 focus:outline-none cursor-pointer appearance-none pr-5 truncate"
                >
                  <option value="Main Grandstand - 3 Day Pass">Main Grandstand - 3 Day Pass</option>
                  <option value="Turn 5 North Grandstand (Hairpin)">North Grandstand (Turn 5 Hairpin)</option>
                  <option value="West Grandstand (1.2km Straight)">West Grandstand (1.2km Straight)</option>
                  <option value="Marina Grandstand (Superyachts)">Marina Grandstand (Superyachts)</option>
                  <option value="South Grandstand (W Hotel)">South Grandstand (W Hotel View)</option>
                  <option value="Abu Dhabi Hill (General Admission)">Abu Dhabi Hill (General Admission)</option>
                  <option value="Formula 1 Paddock Club VIP">Formula 1 Paddock Club™ VIP</option>
                  <option value="Ferrari World & Grand Prix Combo">Ferrari World & GP 3-Day Combo</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Column 2: Choose Dates */}
            <div className="flex-1 px-3 py-1.5">
              <label className="block text-[10px] font-sports font-extrabold text-[#0B1F3A] uppercase tracking-wider">
                CHOOSE YOUR DATES
              </label>
              <div className="relative mt-0.5">
                <select
                  value={selectedDates}
                  onChange={(e) => setSelectedDates(e.target.value)}
                  className="w-full bg-transparent text-xs font-helvetica font-medium text-gray-800 focus:outline-none cursor-pointer appearance-none pr-5"
                >
                  <option value="Dec 04 - Dec 06, 2026">Check-in - Check-out · Dec 04–06</option>
                  <option value="Dec 06, 2026">Sunday Race Day · Dec 06</option>
                  <option value="Dec 05, 2026">Saturday Qualifying · Dec 05</option>
                  <option value="Dec 04, 2026">Friday Practice · Dec 04</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Action Search Button */}
            <button
              type="submit"
              className="bg-[#123B67] hover:bg-[#1D5288] text-white font-sports font-black text-sm uppercase tracking-wider px-8 sm:px-10 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>SEARCH</span>
            </button>
          </form>

        </div>

        {/* Center / Lower Hero Headline & "BOOK NOW" Button */}
        <div className="my-12 sm:my-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-sports font-black text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] uppercase drop-shadow-md">
              {currentOffer.headline}
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-2 font-helvetica drop-shadow">
              {currentOffer.subheadline}
            </p>
          </div>

          <button
            onClick={() => {
              if (currentOffer.targetPath.startsWith('/#')) {
                const el = document.getElementById(currentOffer.targetPath.replace('/#', ''));
                el?.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate(currentOffer.targetPath);
              }
            }}
            className="bg-[#123B67] hover:bg-[#1D5288] text-white font-sports font-black text-base uppercase tracking-wider px-9 py-3.5 rounded-full shadow-2xl transition-all cursor-pointer flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95"
          >
            <span>BOOK NOW</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Bottom Offer Carousel Strip */}
        <div className="w-full pt-4 border-t border-white/20">
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none text-xs">
            {offers.map((offer, idx) => {
              const isActive = activeOfferIndex === idx;
              return (
                <button
                  key={offer.id}
                  onClick={() => setActiveOfferIndex(idx)}
                  className={`relative pb-3 px-3 text-center whitespace-nowrap font-sports font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center shrink-0 ${
                    isActive ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{offer.tabLabel}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
