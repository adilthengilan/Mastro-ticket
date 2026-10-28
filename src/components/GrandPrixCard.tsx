import React from 'react';
import { GrandPrixEvent } from '../types';
import { useStore } from '../services/store';
import { MapPin } from 'lucide-react';

interface GrandPrixCardProps {
  event: GrandPrixEvent;
  onSelect: (slug: string) => void;
}

export const GrandPrixCard: React.FC<GrandPrixCardProps> = ({ event, onSelect }) => {
  const { formatPrice } = useStore();

  return (
    <div
      onClick={() => onSelect(event.slug)}
      className="group bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-all shadow-xs hover:shadow-sm cursor-pointer flex flex-col justify-between"
    >
      {/* Top Image Section with overlay & badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={event.banner}
          alt={event.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="bg-[#0B1F3A]/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            {event.dates.split(',')[0]}
          </span>

          <span className="bg-[#15803D]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
            ROUND {event.round}
          </span>
        </div>

        {/* Text over image bottom */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="font-sports font-bold text-xl text-white tracking-wide uppercase line-clamp-1 drop-shadow-xs">
            {event.name}
          </h3>
          <p className="text-[11px] text-slate-200 mt-0.5 font-sans flex items-center justify-between">
            <span>Official Promoter Allocation</span>
            <span className="text-[#A7F3D0] font-medium text-[10px]">Tickets Available</span>
          </p>
        </div>
      </div>

      {/* Card Lower White Area */}
      <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
        {/* Venue Row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-[#F5F7FA] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#123B67]">
            <MapPin className="w-3 h-3 text-[#123B67]" />
          </div>
          <span className="text-xs font-medium text-[#475569] truncate">
            {event.circuit}, {event.location}
          </span>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] block font-medium">
              From
            </span>
            <span className="text-base font-bold text-[#111827] font-mono tabular-nums leading-none">
              {formatPrice(event.startingPrice)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event.slug);
            }}
            className="px-4 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs"
          >
            VIEW TICKETS
          </button>
        </div>
      </div>
    </div>
  );
};
