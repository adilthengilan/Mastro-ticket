import React from 'react';
import { RaceDayOption } from '../types';

interface RaceDaySelectorProps {
  selectedDay: RaceDayOption | 'all';
  onSelectDay: (day: RaceDayOption | 'all') => void;
}

export const RaceDaySelector: React.FC<RaceDaySelectorProps> = ({ selectedDay, onSelectDay }) => {
  const options: { id: RaceDayOption | 'all'; label: string; date: string; tag?: string }[] = [
    {
      id: 'all',
      label: 'All Days & Passes',
      date: 'Full Catalog'
    },
    {
      id: 'Weekend Pass',
      label: 'Full Weekend',
      date: 'Dec 4–6',
      tag: 'Most Popular'
    },
    {
      id: 'Sunday',
      label: 'Sunday Race',
      date: 'Dec 6 (Final)'
    },
    {
      id: 'Saturday',
      label: 'Saturday Qualifying',
      date: 'Dec 5'
    },
    {
      id: 'Friday',
      label: 'Friday Practice',
      date: 'Dec 4'
    },
    {
      id: 'Thursday',
      label: 'Thursday Pit Walk',
      date: 'Dec 3'
    }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-0.5">
            YAS MARINA CIRCUIT TIMETABLE
          </div>
          <h2 className="font-sports font-black text-xl sm:text-2xl text-[#0B1F3A] uppercase tracking-wide">
            Select Your Race Session
          </h2>
        </div>
      </div>

      {/* Segmented Day Bar in Navy Blue & White */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#F5F7FA] p-1.5 rounded-lg border border-[#E2E8F0]">
        {options.map((opt) => {
          const isSelected = selectedDay === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelectDay(opt.id)}
              className={`px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-[#111827] border border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono uppercase ${isSelected ? 'text-slate-300' : 'text-[#64748B]'}`}>
                  {opt.date}
                </span>
                {opt.tag && !isSelected && (
                  <span className="text-[9px] font-bold text-[#123B67] bg-[#F5F7FA] px-1.5 py-0.2 rounded uppercase">
                    {opt.tag}
                  </span>
                )}
              </div>
              <p className="font-sports font-bold text-sm tracking-wide uppercase truncate">
                {opt.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
