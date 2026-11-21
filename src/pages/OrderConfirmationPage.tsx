import React, { useState } from 'react';
import { useStore } from '../services/store';
import { extractOrderConfirmationDetails } from '../services/orderConfirmationTemplate';
import {
  CheckCircle2,
  Printer,
  Mail,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Clock
} from 'lucide-react';

interface OrderConfirmationPageProps {
  orderId: string;
  navigate: (path: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderId, navigate }) => {
  const { getAccessibleCustomerOrders, formatPrice, resendConfirmationEmail, isAuthenticated } = useStore();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const accessibleOrders = getAccessibleCustomerOrders();
  const order = orderId
    ? accessibleOrders.find((o) => o.id === orderId || o.orderNumber === orderId)
    : accessibleOrders[0];

  if (!order) {
    return (
      <div className="bg-[#FFFFFF] min-h-[60vh] flex items-center justify-center text-[#111827] font-sans">
        <p className="text-sm text-[#64748B]">
          Order not found.{' '}
          <button onClick={() => navigate('/')} className="text-[#123B67] underline ml-1 cursor-pointer">
            Return to Home
          </button>
        </p>
      </div>
    );
  }

  const details = extractOrderConfirmationDetails(order, formatPrice);

  const handleResend = () => {
    const res = resendConfirmationEmail(order.id);
    setResendStatus(res.message);
    setTimeout(() => setResendStatus(null), 4000);
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-[#111827]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center mb-6 no-print shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Your order with order ID {details.orderId} is confirmed</span>
          </div>

          <h1 className="font-sports font-black text-3xl sm:text-4xl text-[#0B1F3A] uppercase tracking-tight">
            Congratulations! You&rsquo;re on your way to {details.eventName}!
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-2xl mx-auto font-sans">
            Thank you for buying tickets for <strong className="text-[#111827]">{details.eventName}</strong> at{' '}
            <strong className="text-[#111827]">{details.venue}</strong> using{' '}
            <strong className="text-[#0B1F3A]">MastroTickets</strong>. A full confirmation email has been sent to{' '}
            <strong className="text-[#111827]">{details.customerEmail}</strong>.
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
              <span>Resend Confirmation Email</span>
            </button>

            <button
              onClick={() => navigate('/account')}
              className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Track Your Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {resendStatus && (
            <p className="mt-3 text-xs text-[#15803D] font-medium">{resendStatus}</p>
          )}
        </div>

        {/* Concise Mobile Ticket Transfer + Event & Order Information Summary */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
          {/* Mobile Ticket Transfer Instructions */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4.5 h-4.5 text-sky-300" />
                </div>
                <div>
                  <h2 className="font-sports font-bold text-lg text-[#0B1F3A] uppercase tracking-wide leading-tight">
                    Mobile Ticket Transfer Instructions
                  </h2>
                  <p className="text-[11px] text-[#64748B] font-sans">
                    Convenient &amp; secure digital ticketing system
                  </p>
                </div>
              </div>

              <div className="mb-3.5 px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-xs text-[#111827] font-sans">
                <span className="text-[#64748B]">Your tickets will be transferred to: </span>
                <strong className="text-[#0B1F3A]">{details.customerEmail}</strong>
              </div>

              <ol className="space-y-2 text-xs text-[#475569] font-sans list-decimal pl-4">
                <li>
                  Watch for an email from Ticketmaster or the team/venue when your tickets are ready (check spam for{' '}
                  <strong className="text-[#111827]">&ldquo;Your Ticket Transfer&rdquo;</strong>).
                </li>
                <li>
                  Create or log in to your Ticketmaster / venue account using the{' '}
                  <strong className="text-[#111827]">same email address</strong> used on MastroTickets (in the country of the event).
                </li>
                <li>
                  Follow the transfer link, download the official mobile app, and present your mobile ticket at entry.
                </li>
              </ol>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#475569] font-sans">
              <Clock className="w-4 h-4 text-[#123B67] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B1F3A] block">When will I receive my tickets?</strong>
                <span className="text-[#64748B]">
                  We are already in touch with the seller to deliver as early as possible. Live event tickets are often released up to 24 hours before the event. All sales are final —{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/help')}
                    className="text-[#123B67] font-semibold hover:underline cursor-pointer"
                  >
                    visit our FAQ &amp; Help Centre
                  </button>
                  .
                </span>
              </div>
            </div>
          </div>

          {/* Event Information & Order Information Card */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide pb-2 border-b border-[#E2E8F0] mb-3">
                Event Information
              </h3>
              <dl className="space-y-2 text-xs font-sans">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Order ID:</dt>
                  <dd className="font-mono font-bold text-[#0B1F3A] text-right">{details.orderId}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Event:</dt>
                  <dd className="font-semibold text-[#111827] text-right">{details.eventName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Ticket(s):</dt>
                  <dd className="text-[#111827] text-right">
                    Section {details.section}, Row {details.row} ({details.ticketCount} Ticket{details.ticketCount > 1 ? 's' : ''})
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Venue:</dt>
                  <dd className="text-[#111827] text-right">{details.venue}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Date:</dt>
                  <dd className="text-[#111827] text-right">{details.eventDate}</dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide pb-2 border-b border-[#E2E8F0] mb-3">
                Order Information
              </h3>
              <dl className="space-y-2 text-xs font-sans">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Customer Name:</dt>
                  <dd className="font-semibold text-[#111827] text-right">{details.customerName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Payment Method:</dt>
                  <dd className="font-mono text-[#111827] text-right">{details.paymentMethodLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#64748B] shrink-0">Number of Tickets:</dt>
                  <dd className="font-mono text-[#111827] text-right">{details.ticketCount}</dd>
                </div>
                <div className="flex justify-between gap-3 pt-1">
                  <dt className="text-[#0B1F3A] font-semibold shrink-0">Total Charge:</dt>
                  <dd className="font-mono font-bold text-base text-[#0B1F3A] text-right">{details.totalFormatted}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Optional Guest Order Account Linking Prompt */}
        {!isAuthenticated && (
          <div className="mb-8 bg-[#071629] text-white border border-[#163A63] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print shadow-xs">
            <div>
              <p className="text-sm font-semibold text-white">
                Checked out as a guest? Save this booking to a free account.
              </p>
              <p className="text-xs text-slate-300 mt-1 font-sans">
                Create an account with <strong className="text-white">{order.customerEmail}</strong> (via Google or Email/Password) to securely link order{' '}
                <span className="font-mono text-sky-300">{order.orderNumber}</span> and track your tickets on any device.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate(`/register?email=${encodeURIComponent(order.customerEmail)}&next=/account`)
              }
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Create Account &amp; Link Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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

          {order.tickets.map((tkt) => (
            <div
              key={tkt.id}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs print:border-black print:bg-white print:text-black"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] print:divide-black">
                {/* Left Ticket Stub / Circuit info (8 cols) */}
                <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between">
                  <div>
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
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Holder</span>
                      <strong className="text-[#111827] print:text-black text-xs truncate block">{tkt.attendeeName}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Section / Area</span>
                      <strong className="text-[#111827] print:text-black text-xs truncate block">{tkt.section}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase block font-medium">Row</span>
                      <strong className="text-[#123B67] text-xs font-mono block">{tkt.row || 'Open'}</strong>
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
                            width: `${bIdx % 3 === 0 ? 3 : bIdx % 2 === 0 ? 1 : 2}px`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B] mt-1 block">{tkt.barcode}</span>
                  </div>

                  <div className="text-[10px] text-[#64748B]">
                    Authorized Electronic Entry · MastroTickets
                  </div>

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

        {/* Billing & Invoice Summary */}
        <div className="mt-6 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs no-print">
          <h3 className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide mb-3">
            Billing &amp; Invoice Details
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
              <p>
                {order.billingAddress.city}, {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.country}</p>
            </div>

            <div>
              <span className="text-[#64748B] block">Payment Reference:</span>
              <p className="text-[#111827] font-mono">{details.paymentMethodLabel}</p>
              <p className="text-[11px] text-[#15803D]">Status: {order.status.toUpperCase()}</p>
            </div>

            <div>
              <span className="text-[#64748B] block">Amount Paid (inc. VAT):</span>
              <strong className="text-base font-bold text-[#0B1F3A] font-mono">{details.totalFormatted}</strong>
              <p className="text-[11px] text-[#64748B]">Invoice #INV-{order.orderNumber.replace('MST-', '')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
