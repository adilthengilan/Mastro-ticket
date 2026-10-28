import React from 'react';
import { useStore } from '../services/store';
import { IssuedTicket, Order } from '../types';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
  QrCode
} from 'lucide-react';

interface PrintableTicketPageProps {
  ticketNumber?: string;
  orderId?: string;
  navigate: (path: string) => void;
}

export const PrintableTicketPage: React.FC<PrintableTicketPageProps> = ({
  ticketNumber,
  orderId,
  navigate
}) => {
  const { orders } = useStore();

  // Find matching ticket or all tickets in order
  let targetTickets: { ticket: IssuedTicket; order: Order }[] = [];

  if (ticketNumber) {
    const cleanNum = ticketNumber.trim().toUpperCase();
    for (const ord of orders) {
      const match = ord.tickets.find((t) => t.ticketNumber.trim().toUpperCase() === cleanNum);
      if (match) {
        targetTickets = [{ ticket: match, order: ord }];
        break;
      }
    }
  } else if (orderId) {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      targetTickets = ord.tickets.map((t) => ({ ticket: t, order: ord }));
    }
  }

  // Fallback if none found: show first ticket of first order
  if (targetTickets.length === 0 && orders.length > 0 && orders[0].tickets.length > 0) {
    targetTickets = [{ ticket: orders[0].tickets[0], order: orders[0] }];
  }

  const handlePrint = () => {
    window.print();
  };

  if (targetTickets.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[#B91C1C] mb-3" />
        <h2 className="text-xl font-bold text-[#0B1F3A]">Ticket Voucher Not Found</h2>
        <p className="text-sm text-[#64748B] mt-1 max-w-md">
          We could not locate this ticket record. Please check the ticket number or view your account orders.
        </p>
        <button
          onClick={() => navigate('/account')}
          className="mt-4 px-4 py-2 bg-[#123B67] text-white text-xs font-bold uppercase tracking-wider rounded-lg"
        >
          Return to My Account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] print:bg-white min-h-screen py-8 text-[#111827]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* On-Screen Action Toolbar (Hidden during print) */}
        <div className="print:hidden bg-white border border-[#E2E8F0] rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#123B67] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">
              Ready to print {targetTickets.length} official pass{targetTickets.length > 1 ? 'es' : ''}
            </span>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Passes</span>
            </button>
          </div>
        </div>

        {/* Printable Pass Cards */}
        <div className="space-y-8 print:space-y-12">
          {targetTickets.map(({ ticket, order }) => (
            <div
              key={ticket.id}
              className="bg-white border-2 border-[#0B1F3A] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-2 print:border-black print:rounded-xl print:break-after-page"
            >
              {/* Header Bar */}
              <div className="bg-[#0B1F3A] print:bg-black text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white px-2.5 py-1 rounded inline-flex items-center shadow-xs">
                    <img
                      src="/assets/aistudio/mastro-logo_504ab54e.png"
                      alt="Mastro Tickets"
                      className="h-7 w-auto object-contain"
                    />
                  </div>
                  <span className="px-2 py-0.5 bg-white/20 print:bg-white print:text-black rounded text-[10px] font-bold uppercase tracking-wider">
                    OFFICIAL ADMISSION PASS
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/70 uppercase block tracking-wider">Pass Reference</span>
                  <span className="font-mono font-bold text-sm tracking-wider text-white">
                    {ticket.ticketNumber}
                  </span>
                </div>
              </div>

              {/* Ticket Body Grid */}
              <div className="p-6 sm:p-8">
                {/* Event Name & Day */}
                <div className="pb-6 border-b border-[#E2E8F0] print:border-black">
                  <h1 className="font-sports font-black text-2xl sm:text-3xl text-[#0B1F3A] print:text-black uppercase tracking-tight">
                    {ticket.eventName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#123B67] print:text-black uppercase tracking-wider">
                    <span className="px-2.5 py-1 bg-[#F5F7FA] print:bg-gray-100 rounded">
                      {ticket.raceDay}
                    </span>
                    <span>·</span>
                    <span>{ticket.category}</span>
                  </div>
                </div>

                {/* Circuit and Seat Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-[#E2E8F0] print:border-black text-xs">
                  <div>
                    <span className="text-[#64748B] print:text-gray-600 uppercase font-semibold text-[10px] tracking-wider block">Circuit</span>
                    <strong className="text-sm text-[#0B1F3A] print:text-black mt-0.5 block">
                      {ticket.circuit}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[#64748B] print:text-gray-600 uppercase font-semibold text-[10px] tracking-wider block">Grandstand / Section</span>
                    <strong className="text-sm text-[#0B1F3A] print:text-black mt-0.5 block">
                      {ticket.section}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[#64748B] print:text-gray-600 uppercase font-semibold text-[10px] tracking-wider block">Row & Seat</span>
                    <strong className="text-sm text-[#0B1F3A] print:text-black mt-0.5 block">
                      Row {ticket.row || 'Free Seating'} · Seat {ticket.seat || 'Open'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[#64748B] print:text-gray-600 uppercase font-semibold text-[10px] tracking-wider block">Attendee Name</span>
                    <strong className="text-sm text-[#0B1F3A] print:text-black mt-0.5 block">
                      {ticket.attendeeName}
                    </strong>
                  </div>
                </div>

                {/* Barcode & Turnstile Entry Zone */}
                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Visual Barcode (8 cols) */}
                  <div className="md:col-span-8 flex flex-col items-center sm:items-start justify-center">
                    <div className="w-full max-w-md py-3 px-4 bg-[#F5F7FA] print:bg-white border border-[#E2E8F0] print:border-black rounded-lg text-center">
                      {/* CSS-based Barcode pattern */}
                      <div className="flex justify-between items-center h-16 w-full px-2 gap-[2px]">
                        {[
                          4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 4, 2, 1, 3,
                          2, 1, 4, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3
                        ].map((w, idx) => (
                          <div
                            key={idx}
                            className="bg-black h-full"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs tracking-[0.25em] text-[#111827] print:text-black mt-2 block font-bold">
                        {ticket.barcode || '9710420018391'}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#64748B] print:text-gray-600 mt-2">
                      Present barcode under circuit laser turnstiles. Valid for one entry per session day.
                    </p>
                  </div>

                  {/* QR Code and Verification Seal (4 cols) */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center p-3 border border-[#E2E8F0] print:border-black rounded-lg text-center bg-[#F5F7FA] print:bg-white">
                    <div className="w-24 h-24 bg-white border border-[#E2E8F0] print:border-black p-1.5 flex items-center justify-center rounded">
                      <QrCode className="w-full h-full text-[#0B1F3A] print:text-black" />
                    </div>
                    <span className="text-[9px] font-mono text-[#64748B] print:text-black mt-2 block uppercase">
                      Scan to Verify
                    </span>
                    <span className="text-[9px] text-[#123B67] print:text-black font-semibold">
                      mastrotickets.ae/verify-ticket/{ticket.ticketNumber}
                    </span>
                  </div>

                </div>

                {/* Footer Disclaimers */}
                <div className="mt-6 pt-4 border-t border-[#E2E8F0] print:border-black flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#64748B] print:text-gray-600">
                  <span>Order Reference: #{order.orderNumber}</span>
                  <span>Issued: {new Date(ticket.issuedAt || order.createdAt).toLocaleDateString()}</span>
                  <span>Status: <strong className="text-emerald-700 uppercase">Confirmed & Valid</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
