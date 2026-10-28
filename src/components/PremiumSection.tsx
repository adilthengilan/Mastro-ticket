import React from 'react';
import { useStore } from '../services/store';
import { PremiumPackage } from '../types';
import { Award, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface PremiumSectionProps {
  navigate: (path: string) => void;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ navigate }) => {
  const { premiumPackages, events, formatPrice, addAddonToCart } = useStore();

  const handleBookPackage = (pkg: PremiumPackage) => {
    const event = events.find((e) => e.id === pkg.eventId) || events[0];
    addAddonToCart(pkg, event);
    navigate('/cart');
  };

  return (
    <section id="premium" className="py-12 border-b border-[#E2E8F0] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#163A63] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP MOTORSPORT HOSPITALITY</span>
          </div>
          <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
            VIP & Paddock Hospitality
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed font-sans">
            Authorized Formula 1 Paddock Club™, air-conditioned trackside suites, gourmet dining, open bars, and private yacht berths overlooking Yas Marina.
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {premiumPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-full object-cover object-center opacity-90"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                
                <div className="absolute top-3.5 left-3.5 bg-[#0B1F3A]/90 text-white px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-slate-200" />
                  <span>{pkg.tier}</span>
                </div>

                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    {pkg.daysIncluded}
                  </span>
                  <h3 className="font-sports font-black text-2xl text-white uppercase tracking-wide">
                    {pkg.name}
                  </h3>
                </div>
              </div>

              {/* Inclusions */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <p className="text-xs text-[#475569] mb-4 leading-relaxed font-sans">
                    {pkg.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider">
                      Package Inclusions:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
                      {pkg.inclusions.map((inc, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-[#64748B]">
                          <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer and CTA */}
                <div className="pt-3.5 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase tracking-wider block font-medium">All-inclusive VIP access</span>
                    <div className="text-xl font-bold text-[#111827] font-mono tabular-nums">
                      {formatPrice(pkg.price)} <span className="text-xs font-normal text-[#64748B]">/ person</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookPackage(pkg)}
                    className="w-full sm:w-auto px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Reserve VIP Package</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
