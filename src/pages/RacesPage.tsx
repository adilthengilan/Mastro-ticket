import React, { useState, useMemo } from 'react';
import { useStore } from '../services/store';
import { GrandPrixCard } from '../components/GrandPrixCard';
import { Search, RotateCcw } from 'lucide-react';

interface RacesPageProps {
  navigate: (path: string) => void;
  initialSearch?: string;
}

export const RacesPage: React.FC<RacesPageProps> = ({ navigate, initialSearch = '' }) => {
  const { events, formatPrice } = useStore();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'round' | 'price_asc' | 'price_desc' | 'featured'>('round');
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);

  // Available unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(events.map((e) => e.country)));
    return list.sort();
  }, [events]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            event.name.toLowerCase().includes(q) ||
            event.circuit.toLowerCase().includes(q) ||
            event.country.toLowerCase().includes(q) ||
            event.location.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Country
        if (selectedCountry !== 'all' && event.country !== selectedCountry) {
          return false;
        }

        // Price
        if (event.startingPrice > maxPrice) {
          return false;
        }

        // Only featured
        if (onlyFeatured && !event.featured) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.startingPrice - b.startingPrice;
        if (sortBy === 'price_desc') return b.startingPrice - a.startingPrice;
        if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        return a.round - b.round;
      });
  }, [events, searchQuery, selectedCountry, maxPrice, sortBy, onlyFeatured]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setMaxPrice(1000);
    setSortBy('round');
    setOnlyFeatured(false);
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen py-10 sm:py-16 text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8">
          <div className="text-xs font-bold text-[#163A63] uppercase tracking-widest mb-1">
            YAS MARINA CIRCUIT · ABU DHABI GRAND PRIX 2026
          </div>
          <h1 className="font-sports font-black text-3xl sm:text-5xl text-[#0B1F3A] uppercase tracking-tight">
            Grand Prix <span className="text-[#123B67]">Race Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-2xl leading-relaxed">
            Official promoter-authorized tickets, covered grandstands, and VIP hospitality passes for the Formula 1 Etihad Airways Abu Dhabi Grand Prix season finale and world championship calendar.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 mb-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Search Box */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search grandstands, circuits, or dates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] placeholder-[#94A3B8] focus:border-[#123B67] focus:outline-none"
              />
            </div>

            {/* Country Selector */}
            <div className="md:col-span-3">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none cursor-pointer"
              >
                <option value="all">All Locations (Worldwide)</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] focus:border-[#123B67] focus:outline-none cursor-pointer"
              >
                <option value="round">Calendar Round</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="featured">Featured Events</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="md:col-span-2 flex items-center">
              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] border border-[#E2E8F0] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

          </div>

          {/* Secondary Filter Row: Price Slider & Featured Check */}
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <span className="shrink-0 text-[#64748B]">Max Starting Price:</span>
              <input
                type="range"
                min="100"
                max="1000"
                step="25"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full max-w-xs accent-[#123B67] cursor-pointer"
              />
              <span className="font-mono font-bold text-[#123B67] tabular-nums">
                {formatPrice(maxPrice)}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFeatured}
                onChange={(e) => setOnlyFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E8F0] bg-white text-[#123B67] accent-[#123B67]"
              />
              <span>Only show Featured Major Races</span>
            </label>
          </div>
        </div>

        {/* Result Counter */}
        <div className="flex items-center justify-between mb-6 text-xs text-[#64748B]">
          <span>
            Showing <strong className="text-[#0B1F3A] font-mono">{filteredEvents.length}</strong> Grand Prix event(s)
          </span>
          {selectedCountry !== 'all' && (
            <span>Filtered by location: <strong className="text-[#0B1F3A]">{selectedCountry}</strong></span>
          )}
        </div>

        {/* Events Grid or Empty State */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredEvents.map((event) => (
              <GrandPrixCard
                key={event.id}
                event={event}
                onSelect={(slug) => navigate(`/races/${slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#F5F7FA] flex items-center justify-center mx-auto mb-3 text-[#64748B]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">
              No Grand Prix Found
            </h3>
            <p className="text-xs text-[#64748B] mt-1 mb-5">
              No race events match your current filter settings. Try adjusting the price slider or clearing your search.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
