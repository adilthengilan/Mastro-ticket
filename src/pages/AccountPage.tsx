import React, { useState } from 'react';
import { useStore } from '../services/store';
import { IssuedTicket } from '../types';
import {
  User,
  Ticket,
  FileText,
  Mail,
  Printer,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface AccountPageProps {
  navigate: (path: string) => void;
  initialTab?: 'orders' | 'tickets' | 'invoices' | 'profile';
}

export const AccountPage: React.FC<AccountPageProps> = ({ navigate, initialTab = 'orders' }) => {
  const { orders, currentUser, setCurrentUser, formatPrice, resendConfirmationEmail } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'invoices' | 'profile'>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Profile Form state
  const [displayName, setDisplayName] = useState(currentUser.displayName && currentUser.displayName !== 'Guest Customer' ? currentUser.displayName : '');
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [country, setCountry] = useState(currentUser.country || 'United Arab Emirates');
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  // Collect all tickets across customer orders
  const allCustomerTickets: { ticket: IssuedTicket; orderNumber: string; orderDate: string }[] = [];
  orders.forEach((o) => {
    o.tickets.forEach((t) => {
      allCustomerTickets.push({
        ticket: t,
        orderNumber: o.orderNumber,
        orderDate: o.createdAt
      });
    });
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      displayName,
      email,
      phone,
      country
    });
    setSavedProfileSuccess(true);
    setTimeout(() => setSavedProfileSuccess(false), 3000);
  };

  const handleResend = (orderId: string) => {
    const res = resendConfirmationEmail(orderId);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Profile Summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center text-xl font-bold font-sports shadow-xs">
              {currentUser.displayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sports font-black text-2xl text-[#0B1F3A] uppercase tracking-wide">
                  {currentUser.displayName}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F7FA] text-[#123B67] border border-[#E2E8F0] uppercase tracking-wider">
                  Verified Guest
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">{currentUser.email} · {currentUser.country || 'United Arab Emirates'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2E8F0] w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block font-bold tracking-wider">Total Bookings</span>
              <span className="text-xl font-bold text-[#111827] font-mono">{orders.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block font-bold tracking-wider">Active Passes</span>
              <span className="text-xl font-bold text-[#123B67] font-mono">{allCustomerTickets.length}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] mb-6 gap-2 overflow-x-auto">
          {[
            { id: 'orders', label: 'My Bookings', icon: FileText, count: orders.length },
            { id: 'tickets', label: 'My E-Tickets & Passes', icon: Ticket, count: allCustomerTickets.length },
            { id: 'invoices', label: 'Invoices & Tax Receipts', icon: Printer, count: orders.length },
            { id: 'profile', label: 'Guest Profile', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0B1F3A] text-[#0B1F3A]'
                    : 'border-transparent text-[#64748B] hover:text-[#111827]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0B1F3A]' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#F5F7FA] text-[#64748B] font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-[#15803D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3.5">
            {orders.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B] shadow-xs">
                No bookings placed yet.
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sports font-bold text-lg text-[#0B1F3A] font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'confirmed'
                            ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                            : ord.status === 'refunded'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Booked on {new Date(ord.createdAt).toLocaleDateString()} · {ord.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] uppercase block font-medium">Total</span>
                        <span className="font-bold text-base text-[#111827] font-mono">{formatPrice(ord.total)}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/order-confirmed/${ord.id}`)}
                        className="px-4 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>View Vouchers</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="pt-3 space-y-1.5">
                    {ord.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-[#475569]">
                        <div>
                          <strong className="text-[#111827] font-medium">{item.ticketName}</strong>
                          <span className="text-[#64748B] ml-2">({item.eventName} · {item.raceDay})</span>
                          {item.seatDetails && (
                            <span className="text-[#123B67] text-[11px] block mt-0.5">
                              Row {item.seatDetails.row}, Seat {item.seatDetails.seatNumber}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[#111827] font-medium text-right">
                          Qty {item.quantity} · {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[#64748B] text-[10px] font-mono">
                      Stripe: {ord.paymentId || 'Verified'}
                    </span>
                    <button
                      onClick={() => handleResend(ord.id)}
                      className="text-[#123B67] hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Resend Email Confirmation</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-3.5">
            {allCustomerTickets.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B] shadow-xs">
                No active tickets in your account.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allCustomerTickets.map(({ ticket }, i) => (
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                        <span className="text-[#123B67] uppercase font-mono tracking-wider">{ticket.raceDay}</span>
                        <span className="text-[#15803D] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[9px]">GATE READY</span>
                      </div>
                      <h4 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">{ticket.eventName}</h4>
                      <p className="text-xs text-[#475569] mt-0.5">{ticket.category} · {ticket.section}</p>
                      
                      <div className="mt-3 p-3 bg-[#F5F7FA] rounded border border-[#E2E8F0] grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-medium">Guest</span>
                          <strong className="text-[#111827] truncate block text-xs">{ticket.attendeeName}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-medium">Row</span>
                          <strong className="text-[#111827] font-mono block text-xs">{ticket.row || 'General'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-medium">Seat</span>
                          <strong className="text-[#123B67] font-mono block text-xs">{ticket.seat || 'Open'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#64748B]">{ticket.ticketNumber}</span>
                      <button
                        onClick={() => navigate(`/order-confirmed/${ticket.orderId}`)}
                        className="px-3 py-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#111827] border border-[#E2E8F0] text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#123B67]" />
                        <span>Print Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Invoices */}
        {activeTab === 'invoices' && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] font-sports font-bold text-[#0B1F3A] text-base uppercase tracking-wide bg-[#F5F7FA]">
              Official Tax Receipts & Invoices
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No tax receipts or VAT invoices issued yet. Completed bookings will appear here.
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-[#111827] font-mono block text-sm">
                        INV-{ord.orderNumber.replace('MST-', '')}
                      </strong>
                      <span className="text-[#64748B]">
                        Issued: {new Date(ord.createdAt).toLocaleDateString()} · Mastrotickets
                      </span>
                      <p className="text-[#475569] mt-0.5">
                        Billed to: {ord.customerName} ({ord.billingAddress.city}, {ord.billingAddress.country})
                      </p>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] block font-medium">Total Paid</span>
                        <strong className="text-[#111827] font-mono text-sm">{formatPrice(ord.total)}</strong>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#123B67]" />
                        <span>Download Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="font-sports font-bold text-lg text-[#0B1F3A] uppercase tracking-wide mb-3">
              Personal & Contact Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#475569] mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer text-xs shadow-xs"
              >
                Save Changes
              </button>

              {savedProfileSuccess && (
                <p className="text-xs text-[#15803D] font-medium">Profile changes updated successfully!</p>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
