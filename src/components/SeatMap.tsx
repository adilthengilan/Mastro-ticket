import React, { useState } from 'react';
import { TicketType, GrandPrixEvent } from '../types';
import { useStore } from '../services/store';
import { Check, ShieldCheck, X, MapPin } from 'lucide-react';

interface SeatMapProps {
  ticket: TicketType;
  event: GrandPrixEvent;
  onSeatConfirmed: (selectedSeats: { grandstand: string; row: string; seatNumber: number }[]) => void;
  onClose: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ ticket, event, onSeatConfirmed, onClose }) => {
  const { formatPrice } = useStore();

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 14;

  const [selectedSeatKeys, setSelectedSeatKeys] = useState<string[]>([]);

  const isSeatSold = (row: string, num: number): boolean => {
    const hash = (ticket.id.charCodeAt(2) || 0) + row.charCodeAt(0) * 7 + num * 13;
    return hash % 4 === 0 || (row === 'A' && num <= 4);
  };

  const isSeatAccessible = (row: string, num: number): boolean => {
    return row === 'F' && (num === 1 || num === 2 || num === 13 || num === 14);
  };

  const toggleSeat = (row: string, seatNumber: number) => {
    const key = `${row}-${seatNumber}`;
    if (selectedSeatKeys.includes(key)) {
      setSelectedSeatKeys(selectedSeatKeys.filter((k) => k !== key));
    } else {
      if (selectedSeatKeys.length >= (ticket.maxPerOrder || 6)) {
        return;
      }
      setSelectedSeatKeys([...selectedSeatKeys, key]);
    }
  };

  const handleConfirm = () => {
    if (selectedSeatKeys.length === 0) return;
    const formatted = selectedSeatKeys.map((k) => {
      const [row, num] = k.split('-');
      return {
        grandstand: ticket.name,
        row,
        seatNumber: parseInt(num, 10),
      };
    });
    onSeatConfirmed(formatted);
  };

  const totalPrice = selectedSeatKeys.length * ticket.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden my-8 text-[#111827]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#F5F7FA] border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#163A63] font-bold uppercase tracking-wider">
              <span>Yas Marina Circuit · Abu Dhabi GP 2026</span>
              <span>·</span>
              <span className="text-[#64748B]">{ticket.raceDay}</span>
            </div>
            <h3 className="font-sports font-black text-2xl text-[#0B1F3A] uppercase tracking-wide mt-0.5">
              Select Your Seats: {ticket.name}
            </h3>
            <p className="text-xs text-[#475569] flex items-center gap-1.5 mt-0.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-[#123B67]" />
              <span>{ticket.section}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0B1F3A] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* Circuit / Track Direction Banner */}
          <div className="w-full bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg py-2 px-4 text-center mb-6 flex items-center justify-center gap-3">
            <span className="h-0.5 w-10 bg-[#123B67]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F3A]">
              ◀ YAS MARINA TRACK DIRECTION & RACING LINE ▶
            </span>
            <span className="h-0.5 w-10 bg-[#123B67]" />
          </div>

          {/* Seat Grid View */}
          <div className="bg-[#F5F7FA] p-4 sm:p-6 rounded-lg border border-[#E2E8F0] overflow-x-auto">
            <div className="min-w-[560px] flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-mono font-bold text-[#64748B] text-right">
                    {row}
                  </span>
                  
                  <div className="flex-1 flex items-center justify-between gap-1">
                    {Array.from({ length: seatsPerRow }, (_, i) => i + 1).map((seatNum) => {
                      const isSold = isSeatSold(row, seatNum);
                      const isSelected = selectedSeatKeys.includes(`${row}-${seatNum}`);
                      const isAccessible = isSeatAccessible(row, seatNum);

                      return (
                        <button
                          key={seatNum}
                          disabled={isSold}
                          onClick={() => toggleSeat(row, seatNum)}
                          title={`Row ${row}, Seat ${seatNum} - ${
                            isSold ? 'Sold' : isSelected ? 'Selected' : `Available (${formatPrice(ticket.price)})`
                          }${isAccessible ? ' (Accessible Seating)' : ''}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] font-mono font-semibold transition-colors flex items-center justify-center ${
                            isSold
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                              : isSelected
                              ? 'bg-[#123B67] text-white font-bold ring-2 ring-[#0B1F3A] cursor-pointer'
                              : isAccessible
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer'
                              : 'bg-white text-[#111827] border border-[#CBD5E1] hover:border-[#123B67] hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : seatNum}
                        </button>
                      );
                    })}
                  </div>

                  <span className="w-6 text-xs font-mono font-bold text-[#64748B]">
                    {row}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-center gap-6 text-xs text-[#475569]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white border border-[#CBD5E1]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#123B67] text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </span>
                <span className="font-semibold text-[#0B1F3A]">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-200" />
                <span className="text-[#94A3B8]">Reserved / Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300" />
                <span className="text-emerald-700 font-semibold">Accessible Seating</span>
              </div>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>
              <strong>Side-by-Side Guarantee:</strong> Seats chosen in the same transaction are guaranteed adjacent in the same grandstand block.
            </span>
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#64748B]">
                Selected Seats: <strong className="text-[#111827] font-mono">{selectedSeatKeys.length}</strong> / {ticket.maxPerOrder || 6}
              </div>
              <div className="text-2xl font-black text-[#0B1F3A] font-mono tabular-nums">
                {formatPrice(totalPrice || ticket.price)}
                {selectedSeatKeys.length === 0 && (
                  <span className="text-xs font-normal text-[#64748B] ml-1">(unit price)</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2 bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={selectedSeatKeys.length === 0}
                onClick={handleConfirm}
                className="flex-1 sm:flex-initial px-6 py-2 bg-[#123B67] hover:bg-[#1D5288] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-sports font-black uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs"
              >
                Confirm {selectedSeatKeys.length > 0 ? `(${selectedSeatKeys.length}) Seats` : 'Selection'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
