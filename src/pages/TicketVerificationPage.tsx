import React, { useState, useEffect } from 'react';
import { useStore, PublicTicketVerification } from '../services/store';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Calendar,
  MapPin,
  Ticket,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';

interface TicketVerificationPageProps {
  initialTicketNumber?: string;
  navigate: (path: string) => void;
}

export const TicketVerificationPage: React.FC<TicketVerificationPageProps> = ({
  initialTicketNumber = '',
  navigate
}) => {
  const { verifyTicketPublicly, orders } = useStore();
  const [searchInput, setSearchInput] = useState<string>(initialTicketNumber);
  const [verificationResult, setVerificationResult] = useState<PublicTicketVerification | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-verify if ticket number passed in URL props
  useEffect(() => {
    if (initialTicketNumber) {
      setSearchInput(initialTicketNumber);
      const res = verifyTicketPublicly(initialTicketNumber);
      setVerificationResult(res);
      setHasSearched(true);
    }
  }, [initialTicketNumber]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    const res = verifyTicketPublicly(searchInput.trim());
    setVerificationResult(res);
    setHasSearched(true);
  };

  // Collect any genuine active tickets currently in orders
  const activeTickets = orders.flatMap((o) => o.tickets).filter((t) => t.status === 'issued');

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-10 sm:py-16 text-[#111827]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb & Tag */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/assets/aistudio/mastro-logo_504ab54e.png"
              alt="Mastro Tickets"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F7FA] border border-[#E2E8F0] rounded-full text-xs font-semibold text-[#123B67] uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
            <span>Official Mastrotickets Verification Engine</span>
          </div>
          
          <h1 className="font-sports font-black text-3xl sm:text-4xl text-[#0B1F3A] uppercase tracking-tight">
            Formula 1 Ticket Authenticity Check
          </h1>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto mt-2 font-sans">
            Verify the validity, status, and seat allocation of official Mastrotickets e-tickets. 
            All attendee private PII is cryptographically redacted to safeguard purchaser security.
          </p>
        </div>

        {/* Verification Input Box */}
        <div className="bg-white border-2 border-[#123B67]/20 rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter 16-character ticket reference (e.g. MST-ABU26-XXXXXXXX)"
                className="w-full pl-12 pr-4 py-3.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-sm font-mono font-medium text-[#111827] focus:outline-none focus:border-[#123B67] focus:ring-2 focus:ring-[#123B67]/20 transition-all uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-[#123B67] hover:bg-[#1D5288] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <span>Verify Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Verification Guidance / Genuine Passes */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#123B67]" />
              <span>Standard Format: <code className="font-mono text-[#0B1F3A] bg-[#F5F7FA] px-1.5 py-0.5 rounded border border-[#E2E8F0]">MST-[CODE]26-[TOKEN]</code></span>
            </div>
            {activeTickets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#0B1F3A]">Your Issued Passes:</span>
                {activeTickets.slice(0, 2).map((t) => (
                  <button
                    key={t.ticketNumber}
                    type="button"
                    onClick={() => {
                      setSearchInput(t.ticketNumber);
                      const res = verifyTicketPublicly(t.ticketNumber);
                      setVerificationResult(res);
                      setHasSearched(true);
                    }}
                    className="px-2 py-0.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded text-[11px] font-mono text-[#123B67] cursor-pointer"
                  >
                    {t.ticketNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verification Result Display */}
        {hasSearched && verificationResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {verificationResult.valid && verificationResult.ticket ? (
              /* Valid Ticket Card */
              <div className="bg-white border-2 border-emerald-500/40 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Status Bar */}
                <div className="bg-emerald-600 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Official E-Ticket Verified & Valid
                    </span>
                  </div>
                  <span className="text-[11px] font-mono opacity-90">
                    Checked {new Date(verificationResult.ticket.verificationTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="p-6 sm:p-8">
                  {/* Event & Ticket Details */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src="/assets/aistudio/mastro-logo_504ab54e.png"
                          alt="Mastro Tickets"
                          className="h-6 w-auto object-contain"
                        />
                        <span className="px-2 py-0.5 bg-[#F5F7FA] text-[#123B67] rounded text-[10px] font-bold uppercase tracking-wider">
                          OFFICIAL ADMISSION PASS
                        </span>
                      </div>
                      <h2 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] uppercase tracking-wide">
                        {verificationResult.ticket.eventName}
                      </h2>
                      <p className="text-sm font-semibold text-[#123B67] mt-1 uppercase tracking-wider">
                        {verificationResult.ticket.raceDay} · {verificationResult.ticket.category}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[11px] font-medium text-[#64748B] block">Pass Reference</span>
                      <span className="text-lg font-mono font-bold text-[#0B1F3A]">
                        {verificationResult.ticket.ticketNumber}
                      </span>
                    </div>
                  </div>

                  {/* Allocation Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-[#E2E8F0] text-sm">
                    <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Circuit</span>
                      <span className="font-semibold text-[#0B1F3A] mt-0.5 block truncate">
                        {verificationResult.ticket.circuit}
                      </span>
                    </div>

                    <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Grandstand / Area</span>
                      <span className="font-semibold text-[#0B1F3A] mt-0.5 block truncate">
                        {verificationResult.ticket.section}
                      </span>
                    </div>

                    <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Seat Allocation</span>
                      <span className="font-semibold text-[#0B1F3A] mt-0.5 block">
                        Row {verificationResult.ticket.row || 'GA'}, Seat {verificationResult.ticket.seat || 'Open'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0]">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">Attendee</span>
                      <span className="font-semibold text-[#0B1F3A] mt-0.5 block flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{verificationResult.ticket.maskedAttendee}</span>
                      </span>
                    </div>
                  </div>

                  {/* Security Guarantee & Actions */}
                  <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5 max-w-lg">
                      <Lock className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {verificationResult.ticket.verificationNotice} Customer private contact details and payment records are protected under secure Mastrotickets tokenization.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/tickets/print/${verificationResult.ticket?.ticketNumber}`)}
                        className="px-4 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Invalid or Voided Ticket Notice */
              <div className="bg-white border-2 border-[#B91C1C]/40 rounded-2xl overflow-hidden shadow-sm p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-50 text-[#B91C1C] rounded-full flex items-center justify-center shrink-0 border border-red-200">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-sports font-black text-xl sm:text-2xl text-[#0B1F3A] uppercase tracking-wide">
                      Verification Failed: Reference Not Valid
                    </h2>
                    <p className="text-sm text-[#B91C1C] font-medium mt-1">
                      {verificationResult.error || 'The supplied ticket identifier is invalid, cancelled, or does not exist in our booking registry.'}
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 max-w-xl">
                      Please confirm that you have entered the full alphanumeric Mastrotickets voucher reference printed on your confirmation (format: <code className="bg-[#F5F7FA] px-1.5 py-0.5 rounded text-[#111827] font-mono">MST-[CIRCUIT]26-[TOKEN]</code>).
                    </p>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => navigate('/help')}
                        className="px-4 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider text-[#111827] rounded-lg transition-colors cursor-pointer"
                      >
                        Contact Ticketing Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security & FAQ Accordion Section */}
        <div className="mt-12 bg-[#F5F7FA] border border-[#E2E8F0] rounded-2xl p-6 sm:p-8">
          <h3 className="font-sports font-black text-lg text-[#0B1F3A] uppercase tracking-wide mb-3">
            Why Verify Through Mastrotickets?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#475569] leading-relaxed">
            <div>
              <strong className="text-[#0B1F3A] block mb-1 font-sans font-bold">Guaranteed Genuine Passes</strong>
              Every ticket issued contains an encrypted collision-resistant serial tied directly to Formula 1 promoter allocations.
            </div>
            <div>
              <strong className="text-[#0B1F3A] block mb-1 font-sans font-bold">Strict PII Redaction</strong>
              Public queries never expose personal emails, phones, or payment data, fully compliant with international privacy standards.
            </div>
            <div>
              <strong className="text-[#0B1F3A] block mb-1 font-sans font-bold">Instant Gate Turnstile Access</strong>
              Confirmed passes present a live high-contrast barcode compatible with circuit optical laser scanners.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
