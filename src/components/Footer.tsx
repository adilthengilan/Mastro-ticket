import React from 'react';
import { Shield, Mail, Phone, MapPin, ArrowUp } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#071629] text-[#CBD5E1] text-xs font-sans relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-3.5">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-left cursor-pointer focus:outline-none"
              title="Mastrotickets - Home"
            >
              <div className="bg-white px-3.5 py-1.5 rounded-lg inline-flex items-center shadow-xs hover:opacity-95 transition-opacity">
                <img
                  src="/assets/aistudio/mastro-logo_504ab54e.png"
                  alt="Mastro Tickets"
                  className="h-8 sm:h-9 w-auto max-w-[200px] object-contain"
                />
              </div>
            </button>
            
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm">
              Official ticketing and motorsport hospitality specialist for Formula 1 championships, covered grandstands, Yasalam after-race concerts at Etihad Park, and Yas Island theme park access.
            </p>

            <div className="pt-1 text-xs text-[#94A3B8] space-y-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>Yas Marina Circuit · Yas Island, Abu Dhabi, UAE</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span>concierge@mastrotickets.ae</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span>+971 (2) 659-9800 (Mon–Sun 09:00–20:00 GST)</span>
              </p>
            </div>
          </div>

          {/* Explore Grand Prix Events */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Explore Grand Prix
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/races/abu-dhabi-grand-prix-2026')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Abu Dhabi Grand Prix (Finale)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/races')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Bahrain Grand Prix (Sakhir)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/races')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Saudi Arabian Grand Prix (Jeddah)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/races')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Monaco Grand Prix (Monte Carlo)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/races')} className="hover:text-white transition-colors cursor-pointer text-left">
                  British Grand Prix (Silverstone)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/races')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Full 24-Race Calendar
                </button>
              </li>
            </ul>
          </div>

          {/* Concerts & Hospitality */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Concerts & Hospitality
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/#concerts')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Yasalam After-Race Concerts
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/#concerts')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Golden Circle VIP Upgrades
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/#premium')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Formula 1 Paddock Club™
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/#premium')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Yas Marina Superyacht VIP
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Theme Park Access Passes
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support & Policies */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3.5">
              Support & Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Customer Support & FAQ
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/ticket-enquiry')} className="text-white hover:text-[#38BDF8] font-medium transition-colors cursor-pointer text-left flex items-center gap-1.5">
                  <span>Verify Pass Authenticity</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/account')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Guest Invoices & Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admin')}
                  className="text-[#94A3B8] hover:text-white font-medium flex items-center gap-1.5 cursor-pointer text-left pt-1"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin Operations</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar & Trademark Notice */}
        <div className="pt-8 border-t border-[#163A63] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>
            © {new Date().getFullYear()} Mastrotickets · Official Motorsport & Concert Ticketing. All rights reserved.
          </p>

          <p className="text-[11px] max-w-xl text-center md:text-right leading-relaxed">
            Legal notice: F1, FORMULA 1, GRAND PRIX, and related marks are trademarks of Formula One Licensing B.V. Mastrotickets issues authorized promoter passes for Yas Marina Circuit and official events.
          </p>
        </div>

      </div>

      {/* Circular Back-to-Top Button matching Reference */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white text-[#0B1F3A] hover:bg-slate-100 shadow-lg border border-[#E2E8F0] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 z-40"
        title="Scroll to Top"
      >
        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
      </button>
    </footer>
  );
};
