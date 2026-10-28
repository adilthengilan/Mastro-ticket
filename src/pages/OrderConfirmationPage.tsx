import React, { useState } from 'react';
import { useStore } from '../services/store';
import {
  CheckCircle2,
  Printer,
  Mail,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface OrderConfirmationPageProps {
  orderId: string;
  navigate: (path: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderId, navigate }) => {
  const { orders, formatPrice, resendConfirmationEmail } = useStore();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const order = orders.find((o) => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <div className="bg-[#FFFFFF] min-h-[60vh] flex items-center justify-center text-[#111827] font-sans">
        <p className="text-sm text-[#64748B]">Order not found. <button onClick={() => navigate('/')} className="text-[#123B67] underline ml-1 cursor-pointer">Return to Home</button></p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleResend = () => {
    const res = resendConfirmationEmail(order.id);
    setResendStatus(res.message);
    setTimeout(() => setResendStatus(null), 4000);
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-[#111827]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center mb-8 no-print shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#15803D] rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PAYMENT VERIFIED & CONFIRMED</span>
          </div>

          <h1 className="font-sports font-black text-3xl sm:text-4xl text-[#0B1F3A] uppercase tracking-tight">
            You're Going to the Grand Prix!
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl mx-auto font-sans">
            Booking Reference: <strong className="text-[#111827] font-mono">{order.orderNumber}</strong>. Official confirmation and vouchers dispatched to <strong className="text-[#111827]">{order.customerEmail}</strong>.
          </p>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <button
              onClick={() => navigate(`/orders/${order.id}/tickets`)}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#163A63] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print All Vouchers</span>
            </button>

            <button
              onClick={handleResend}
              className="px-4 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#111827] text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Mail className="w-4 h-4 text-[#15803D]" />
              <span>Resend Email</span>
            </button>

            <button
              onClick={() => navigate('/account')}
              className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>View in Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {resendStatus && (
            <p className="mt-3 text-xs text-[#15803D] font-medium">
              {resendStatus}
            </p>
          )}
        </div>

        {/* Official E-Tickets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h2 className="font-sports font-black text-xl sm:text-2xl text-[#0B1F3A] uppercase tracking-wide flex items-center gap-2">
              <span>Your Official E-Tickets</span>
              <span className="text-xs font-mono font-normal text-[#64748B]">
                ({order.tickets.length} pass{order.tickets.length > 1 ? 'es' : ''})
              </span>
            </h2>
            <span className="text-xs text-[#64748B] hidden sm:inline">
              Present digital barcode or printed pass at turnstiles
            </span>
          </div>

          {/* Render High-Fidelity F1 Pass Vouchers */}
          {order.tickets.map((tkt) => (
            <div
              key={tkt.id}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs print:border-black print:bg-white print:text-black"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] print:divide-black">
                
                {/* Left Ticket Stub / Circuit info (8 cols) */}
                <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img
                          src="/assets/aistudio/mastro-logo_504ab54e.png"
                          alt="Mastro Tickets"
                          className="h-7 sm:h-8 w-auto object-contain"
                        />
                        <span className="text-[10px] text-[#64748B] font-mono hidden sm:inline">OFFICIAL PASS</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#15803D] uppercase tracking-wider border border-emerald-200 print:border-black">
                        OFFICIAL ADMISSION
                      </span>
                    </div>

                    <h3 className="font-sports font-black text-2xl text-[#0B1F3A] print:text-black uppercase tracking-wide">
                      {tkt.eventName}
                    </h3>
                    
                    <p className="text-xs text-[#123B67] font-semibold uppercase tracking-wider mt-0.5">
                      {tkt.raceDay} · {tkt.category}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#475569] print:text-black">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#123B67]" />
                        <span>{tkt.circuit}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Gate Open: 08:00 GST</span>
                      </div>
                    </div>
                  </div>

                  {/* Seating Coordinate Box */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] print:border-black grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Attendee</span>
                      <strong className="text-[#111827] print:text-black text-xs truncate block">{tkt.attendeeName}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Grandstand / Area</span>
                      <strong className="text-[#111827] print:text-black text-xs truncate block">{tkt.section}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Row</span>
                      <strong className="text-[#123B67] text-xs font-mono block">{tkt.row || 'Free Entry'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Seat</span>
                      <strong className="text-[#123B67] text-xs font-mono block">{tkt.seat || 'Open'}</strong>
                    </div>
                  </div>

                  {/* Security Hash & Order reference */}
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex justify-between font-mono">
                    <span>VOUCHER ID: {tkt.ticketNumber}</span>
                    <span>ORDER: {order.orderNumber}</span>
                  </div>
                </div>

                {/* Right Barcode & QR Code Section (4 cols) */}
                <div className="md:col-span-4 p-5 sm:p-6 bg-[#F5F7FA] print:bg-white flex flex-col items-center justify-between text-center gap-3">
                  <div className="w-full">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Scan at Turnstile Gate
                    </span>

                    {/* QR Code Graphic Box */}
                    <div className="p-2 bg-white rounded-lg inline-block mx-auto border border-[#E2E8F0] shadow-2xs">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                          tkt.qrCodeValue
                        )}`}
                        alt="Ticket Gate QR Code"
                        className="w-24 h-24"
                      />
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="w-full">
                    <div className="h-7 bg-white p-1 rounded border border-[#E2E8F0] flex items-center justify-around overflow-hidden">
                      {Array.from({ length: 44 }).map((_, bIdx) => (
                        <span
                          key={bIdx}
                          className="bg-black inline-block h-full"
                          style={{
                            width: `${(bIdx % 3 === 0 ? 3 : bIdx % 2 === 0 ? 1 : 2)}px`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-1 block">
                      {tkt.barcode}
                    </span>
                  </div>

                  <div className="text-[10px] text-[#64748B]">
                    Authorized Electronic Entry · Non-Transferable
                  </div>

                  {/* Individual Ticket Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] w-full no-print">
                    <button
                      onClick={() => navigate(`/tickets/print/${tkt.ticketNumber}`)}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-[#F5F7FA] border border-[#E2E8F0] text-[#0B1F3A] text-[11px] font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Printer className="w-3 h-3 text-[#123B67]" />
                      <span>Print Voucher</span>
                    </button>
                    <button
                      onClick={() => navigate(`/verify-ticket/${tkt.ticketNumber}`)}
                      className="flex-1 py-1.5 px-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-[11px] font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      <span>Verify Pass</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Order Details & Invoicing Summary */}
        <div className="mt-6 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs no-print">
          <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide mb-3">
            Payment & Invoice Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-[#475569]">
            <div>
              <span className="text-[#64748B] block">Customer:</span>
              <strong className="text-[#111827]">{order.customerName}</strong>
              <p className="text-[11px] text-[#64748B]">{order.customerEmail}</p>
            </div>

            <div>
              <span className="text-[#64748B] block">Billing Address:</span>
              <p className="text-[#111827]">{order.billingAddress.street}</p>
              <p>{order.billingAddress.city}, {order.billingAddress.postalCode}</p>
              <p>{order.billingAddress.country}</p>
            </div>

            <div>
              <span className="text-[#64748B] block">Payment Reference:</span>
              <p className="text-[#111827] font-mono">{order.paymentMethod}</p>
              <p className="text-[11px] text-[#64748B]">Card ending in **** {order.cardLast4}</p>
              <p className="text-[11px] text-[#15803D]">Status: {order.status.toUpperCase()}</p>
            </div>

            <div>
              <span className="text-[#64748B] block">Amount Paid (inc. VAT):</span>
              <strong className="text-base font-bold text-[#0B1F3A] font-mono">{formatPrice(order.total)}</strong>
              <p className="text-[11px] text-[#64748B]">Invoice #INV-{order.orderNumber.replace('MST-', '')}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
