import React from 'react';
import { useStore } from '../services/store';
import { Concert } from '../types';
import { Calendar, MapPin, ArrowRight, Music } from 'lucide-react';

interface ConcertsSectionProps {
  navigate: (path: string) => void;
  onSelectEvent?: (slug: string) => void;
}

export const ConcertsSection: React.FC<ConcertsSectionProps> = ({ navigate }) => {
  const { concerts, events, formatPrice, addAddonToCart } = useStore();

  const handleAddConcert = (concert: Concert) => {
    const event = events.find((e) => e.id === concert.eventId) || events[0];
    addAddonToCart(concert, event);
    navigate('/cart');
  };

  return (
    <section id="concerts" className="py-12 border-b border-[#E2E8F0] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-1">
              <Music className="w-3.5 h-3.5" />
              <span>ETIHAD PARK · YASALAM AFTER-RACE CONCERTS</span>
            </div>
            <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
              After-Race Concert Passes
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl font-sans">
              World-class headliners live at Etihad Park after track action concludes. General entry is included with all 3-day tickets; Golden Circle front-stage upgrades and standalone concert passes can be added here.
            </p>
          </div>
        </div>

        {/* Concert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {concerts.map((concert) => {
            const relatedEvent = events.find((e) => e.id === concert.eventId);
            return (
              <div
                key={concert.id}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all"
              >
                {/* Concert Artwork */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={concert.image}
                    alt={concert.artist}
                    className="w-full h-full object-cover object-center opacity-90"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-[#0B1F3A]/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                    <span>{relatedEvent?.country || 'Abu Dhabi'}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-[11px] text-slate-200 uppercase font-bold tracking-wider">
                      {concert.artist}
                    </p>
                    <h3 className="font-sports font-bold text-xl uppercase tracking-wide line-clamp-1">
                      {concert.name}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#111827] font-medium font-sans">
                      <Calendar className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                      <span>{concert.date} · {concert.time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-sans">
                      <MapPin className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                      <span className="truncate">{concert.venue}</span>
                    </div>

                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed font-sans">
                      {concert.description}
                    </p>

                    <div className="p-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-[11px] text-[#475569] font-sans">
                      <span className="text-[#15803D] font-bold">Entry: </span>
                      {concert.entryConditions}
                    </div>
                  </div>

                  {/* Actions & Pricing */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-medium">
                        Standalone Pass
                      </div>
                      <div className="text-lg font-bold text-[#111827] font-mono tabular-nums">
                        {formatPrice(concert.price)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddConcert(concert)}
                      className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Add to Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
