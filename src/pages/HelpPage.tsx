import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, MapPin, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface HelpPageProps {
  navigate: (path: string) => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({ navigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How and when will I receive my Abu Dhabi Grand Prix tickets?',
      a: 'All tickets issued by Mastrotickets are official, promoter-authorized electronic passes with secure 2D barcodes. Immediately upon payment verification, your e-tickets and tax invoice are delivered to your email and accessible in your customer account. You can present the digital barcode on your mobile smartphone at the Yas Marina Circuit turnstiles or print the PDF voucher.'
    },
    {
      q: 'Are Yasalam After-Race Concerts included with my race ticket?',
      a: 'Yes! All 3-Day Abu Dhabi Grand Prix tickets include complimentary access to all 4 nights of Yasalam After-Race Concerts at Etihad Park (Thursday, Friday, Saturday, and Sunday). Single-day ticket holders receive complimentary admission to that respective evening’s concert. Golden Circle front-of-stage fast-track upgrades can also be added.'
    },
    {
      q: 'Is theme park access (Ferrari World, Warner Bros, SeaWorld) really included?',
      a: 'Yes, 100%! All valid 3-day Abu Dhabi Grand Prix tickets purchased through Mastrotickets include complimentary access to Yas Island’s theme parks: Ferrari World Abu Dhabi (home of Formula Rossa), Warner Bros. World, SeaWorld Yas Island, and Yas Waterworld during the race weekend.'
    },
    {
      q: 'Are seats booked together guaranteed to be side-by-side?',
      a: 'Yes. When booking multiple grandstand seats in the same transaction, our automated reservation engine allocates contiguous, side-by-side seats in the same row. You can also pick your preferred seats on our interactive Grandstand Map.'
    },
    {
      q: 'What is the refund and cancellation policy?',
      a: 'In accordance with Formula 1 promoter regulations and European consumer standards, confirmed tickets are non-cancellable except if the event is officially cancelled by the FIA/promoter. In the event of promoter cancellation, full refunds are automatically returned to your original payment method via Stripe.'
    },
    {
      q: 'Can I pay in UAE Dirhams (AED) or USD / EUR?',
      a: 'Yes. You can complete your order in AED, USD, or EUR using any major credit/debit card, Apple Pay, or Google Pay with zero foreign currency conversion surcharges.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactMessage.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setContactMessage('');
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen py-10 sm:py-16 text-[#111827]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white border border-[#E2E8F0] rounded-full text-xs font-bold text-[#123B67] uppercase mb-3 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
            <span>ABU DHABI GRAND PRIX SUPPORT & FAQ</span>
          </div>
          <h1 className="font-sports font-black text-3xl sm:text-5xl text-[#0B1F3A] uppercase tracking-tight">
            How Can We <span className="text-[#123B67]">Assist You?</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-lg mx-auto">
            Find answers regarding Yas Marina Circuit grandstands, Yasalam concerts, theme park perks, and ticket delivery.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-2.5 mb-14">
          <h2 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide mb-4">
            Frequently Asked Questions
          </h2>

          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-sports font-bold text-base text-[#0B1F3A] hover:text-[#123B67] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#123B67] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#64748B] leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Concierge Desk Contact Form & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs">
          <div>
            <h3 className="font-sports font-black text-xl text-[#0B1F3A] uppercase tracking-wide mb-2">
              Abu Dhabi & Yas Island Concierge Desk
            </h3>
            <p className="text-xs text-[#64748B] mb-6 leading-relaxed">
              Our dedicated UAE customer concierge is on hand to assist with grandstand block allocations, Paddock Club™ suites, private yachts, and circuit transfers.
            </p>

            <div className="space-y-3 text-xs text-[#475569]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#123B67] shrink-0 mt-0.5" />
                <span>Yas Marina Circuit · Yas Island, Abu Dhabi, UAE</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#123B67] shrink-0" />
                <span>concierge@mastrotickets.ae</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#123B67] shrink-0" />
                <span>+971 (2) 659-9800 (Mon–Sun 09:00–20:00 GST)</span>
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleContactSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] mb-1 font-medium">Inquiry Topic</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#123B67] focus:outline-none cursor-pointer"
                >
                  <option value="General Inquiry">General Abu Dhabi GP Inquiry</option>
                  <option value="Seating & Grandstands">Yas Marina Grandstand Seating</option>
                  <option value="VIP Paddock Club">Formula 1 Paddock Club™</option>
                  <option value="Yacht Hospitality">Yas Marina Superyacht Hospitality</option>
                  <option value="Concerts & Parks">Yasalam Concerts & Theme Parks</option>
                </select>
              </div>

              <div>
                <label className="block text-[#64748B] mb-1 font-medium">Your Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can our Abu Dhabi race concierge help you today?..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#123B67] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-xs shadow-xs"
              >
                Send Message to Concierge
              </button>

              {submitted && (
                <div className="p-2.5 bg-[#15803D]/10 border border-[#15803D]/20 rounded-lg text-xs text-[#15803D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Message sent! Our Yas concierge will reply within 30 minutes.</span>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
