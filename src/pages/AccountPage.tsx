import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { IssuedTicket } from '../types';
import {
  User,
  Ticket,
  FileText,
  Mail,
  Printer,
  CheckCircle2,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Link2,
  AlertCircle,
  Download
} from 'lucide-react';

interface AccountPageProps {
  navigate: (path: string) => void;
  initialTab?: 'orders' | 'tickets' | 'invoices' | 'profile';
}

export const AccountPage: React.FC<AccountPageProps> = ({ navigate, initialTab = 'orders' }) => {
  const {
    currentUser,
    isAuthenticated,
    updateUserProfile,
    formatPrice,
    resendConfirmationEmail,
    getAccessibleCustomerOrders,
    verifyAccountEmail,
    claimGuestOrdersForCurrentUser,
    logoutUser,
    lastClaimedNotice,
    clearLastClaimedNotice,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'invoices' | 'profile'>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  // Scoped customer orders: authenticated user's orders (including linked guest orders)
  // OR lightweight device guest orders when browsing as guest.
  const customerOrders = getAccessibleCustomerOrders();

  // Profile Form state synced with currentUser
  const [displayName, setDisplayName] = useState(
    currentUser.displayName && currentUser.displayName !== 'Guest Customer' ? currentUser.displayName : ''
  );
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [country, setCountry] = useState(currentUser.country || 'Hungary');
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  useEffect(() => {
    setDisplayName(
      currentUser.displayName && currentUser.displayName !== 'Guest Customer' ? currentUser.displayName : ''
    );
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setCountry(currentUser.country || 'Hungary');
  }, [currentUser]);

  // Collect all tickets across accessible customer orders
  const allCustomerTickets: { ticket: IssuedTicket; orderNumber: string; orderDate: string; paymentStatus: string }[] = [];
  customerOrders.forEach((o) => {
    o.tickets.forEach((t) => {
      allCustomerTickets.push({
        ticket: t,
        orderNumber: o.orderNumber,
        orderDate: o.createdAt,
        paymentStatus: o.status,
      });
    });
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateUserProfile({
      displayName,
      phone,
      country,
    });
    if (res.success) {
      setSavedProfileSuccess(true);
      setTimeout(() => setSavedProfileSuccess(false), 3000);
    } else {
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleResend = (orderId: string) => {
    const res = resendConfirmationEmail(orderId);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleVerifyEmail = async () => {
    setClaimLoading(true);
    const res = await verifyAccountEmail();
    setClaimLoading(false);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleManualClaimCheck = async () => {
    setClaimLoading(true);
    const res = await claimGuestOrdersForCurrentUser();
    setClaimLoading(false);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Unauthenticated Guest Portal View
  if (!isAuthenticated) {
    return (
      <div className="bg-[#FFFFFF] min-h-screen py-10 sm:py-14 text-[#111827]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Sign In / Create Account Card */}
          <div className="bg-[#071629] text-white border border-[#163A63] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1">
                Optional Customer Account
              </p>
              <h1 className="font-sports font-black text-3xl sm:text-4xl uppercase tracking-tight">
                Sign In to Access All Your Orders & E-Tickets
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-sans leading-relaxed">
                Purchased tickets as a guest? Create an account or sign in with Google using the same verified email address to securely link all previous guest orders into your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => navigate('/login?next=/account')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#0B1F3A] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/register?next=/account')}
                className="px-5 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white border border-white/20 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Lightweight Guest Orders on This Device */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">
                  Recent Guest Orders on This Browser
                </h2>
                <p className="text-xs text-[#64748B] font-sans mt-0.5">
                  Showing guest bookings placed from this device. Create an account to access bookings across all devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/ticket-enquiry')}
                className="text-xs font-semibold text-[#123B67] hover:underline cursor-pointer self-start sm:self-auto"
              >
                Verify a Ticket Code
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-[#64748B]">
                  No recent guest bookings stored on this browser yet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/races')}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Explore Grand Prix Tickets
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0] mt-2">
                {customerOrders.map((ord) => (
                  <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-sports font-bold text-lg text-[#0B1F3A] font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[#64748B]">·</span>
                        <span className="font-semibold text-[#15803D] uppercase">{ord.status}</span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {ord.items[0]?.eventName || 'Formula 1 Grand Prix'} · {ord.tickets.length} pass{ord.tickets.length !== 1 ? 'es' : ''} · {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-[#111827] tabular-nums">
                        {formatPrice(ord.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/order-confirmed/${ord.id}`)}
                        className="px-3.5 py-2 bg-[#0B1F3A] hover:bg-[#163A63] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>View Tickets</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/register?email=${encodeURIComponent(ord.customerEmail)}&next=/account`)
                        }
                        className="px-3 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] border border-[#E2E8F0] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        Link to Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Customer Dashboard
  return (
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Profile Summary */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center text-xl font-bold font-sports shadow-xs shrink-0">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sports font-black text-2xl text-[#0B1F3A] uppercase tracking-wide">
                  {currentUser.displayName}
                </h1>
                <span className="text-xs text-[#64748B]">·</span>
                <span className={`text-xs font-semibold ${currentUser.emailVerified ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                  {currentUser.emailVerified ? 'Verified Account' : 'Email Unverified'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {currentUser.email} · {currentUser.country || 'Hungary'}
                {currentUser.authProvider === 'google' ? ' · Signed in with Google' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E2E8F0] w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">My Orders</span>
                <span className="text-xl font-bold text-[#111827] font-mono tabular-nums">{customerOrders.length}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748B] block font-medium">My Tickets</span>
                <span className="text-xl font-bold text-[#123B67] font-mono tabular-nums">{allCustomerTickets.length}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 bg-[#F5F7FA] hover:bg-red-50 hover:text-[#B91C1C] hover:border-red-200 border border-[#E2E8F0] text-[#475569] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Email Verification / Guest Order Linking Banner */}
        {!currentUser.emailVerified ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Verify your email to claim previous guest orders</strong>
                <span className="text-amber-800">
                  For your security, guest purchases made with <strong>{currentUser.email}</strong> are linked only after email ownership is verified.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerifyEmail}
              disabled={claimLoading}
              className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#163A63] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {claimLoading ? 'Verifying...' : 'Verify Email & Link Orders'}
            </button>
          </div>
        ) : (
          <div className="mb-6 p-3.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#475569]">
              <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
              <span>
                Email <strong className="text-[#111827]">{currentUser.email}</strong> is verified. Previous guest bookings matching this email are automatically linked.
              </span>
            </div>
            <button
              type="button"
              onClick={handleManualClaimCheck}
              disabled={claimLoading}
              className="text-[#123B67] hover:underline font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{claimLoading ? 'Checking...' : 'Check for Guest Orders'}</span>
            </button>
          </div>
        )}

        {/* Linked Guest Order Notice */}
        {lastClaimedNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#15803D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{lastClaimedNotice}</span>
            </div>
            <button
              type="button"
              onClick={clearLastClaimedNotice}
              className="text-[#15803D] hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] mb-6 gap-2 overflow-x-auto">
          {[
            { id: 'orders', label: 'My Orders', icon: FileText, count: customerOrders.length },
            { id: 'tickets', label: 'My Tickets', icon: Ticket, count: allCustomerTickets.length },
            { id: 'invoices', label: 'Receipts & Invoices', icon: Printer, count: customerOrders.length },
            { id: 'profile', label: 'My Profile', icon: User }
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
                  <span className="text-[11px] text-[#64748B] font-mono tabular-nums">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-[#15803D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: My Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {customerOrders.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3 shadow-xs">
                <p className="text-sm text-[#475569] font-medium">No bookings linked to this account yet.</p>
                <p className="text-xs text-[#64748B]">
                  Browse upcoming Formula 1 races or verify your email if you previously checked out as a guest.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/races')}
                  className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Browse Grand Prix Events
                </button>
              </div>
            ) : (
              customerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-sports font-bold text-lg text-[#0B1F3A] font-mono">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[#CBD5E1]">·</span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          ord.status === 'confirmed' || ord.status === 'paid'
                            ? 'text-[#15803D]'
                            : ord.status === 'refunded'
                            ? 'text-[#B91C1C]'
                            : 'text-[#B45309]'
                        }`}>
                          Payment: {ord.status}
                        </span>
                        {ord.claimedAt && (
                          <>
                            <span className="text-[#CBD5E1]">·</span>
                            <span className="text-[11px] text-[#123B67] font-medium">
                              Linked from Guest Checkout
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Ordered on {new Date(ord.createdAt).toLocaleDateString()} · {ord.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] uppercase block font-medium">Total Paid</span>
                        <span className="font-bold text-base text-[#111827] font-mono tabular-nums">{formatPrice(ord.total)}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/order-confirmed/${ord.id}`)}
                        className="px-4 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Order Details</span>
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
                        <span className="font-mono text-[#111827] font-medium text-right tabular-nums">
                          Qty {item.quantity} · {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#64748B] text-[11px] font-mono">
                      Ref: {ord.paymentId || 'Verified'}
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate(`/orders/${ord.id}/tickets`)}
                        className="text-[#0B1F3A] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#123B67]" />
                        <span>Download Tickets</span>
                      </button>
                      <button
                        onClick={() => handleResend(ord.id)}
                        className="text-[#123B67] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Resend Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: My Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-3.5">
            {allCustomerTickets.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B] shadow-xs">
                No active tickets in your account yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allCustomerTickets.map(({ ticket }, i) => (
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#123B67] uppercase font-mono font-semibold tracking-wider">{ticket.raceDay}</span>
                        <span className="text-[#15803D] font-semibold text-[11px]">Gate Ready · {ticket.status.toUpperCase()}</span>
                      </div>
                      <h4 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">{ticket.eventName}</h4>
                      <p className="text-xs text-[#475569] mt-0.5">{ticket.category} · {ticket.section}</p>
                      
                      <div className="mt-3 p-3 bg-[#F5F7FA] rounded-lg border border-[#E2E8F0] grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#64748B] block font-medium">Attendee</span>
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

                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#64748B]">{ticket.ticketNumber}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/tickets/print/${ticket.ticketNumber}`)}
                          className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#163A63] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View / Print Ticket</span>
                        </button>
                      </div>
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
              {customerOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No tax receipts or VAT invoices issued yet. Completed bookings will appear here.
                </div>
              ) : (
                customerOrders.map((ord) => (
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
                        <strong className="text-[#111827] font-mono text-sm tabular-nums">{formatPrice(ord.total)}</strong>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#111827] text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
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

        {/* Tab 4: My Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-xl bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-xs">
            <h3 className="font-sports font-bold text-lg text-[#0B1F3A] uppercase tracking-wide mb-3">
              My Profile & Contact Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#475569] mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] mb-1 font-medium">Account Email</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#64748B] cursor-not-allowed"
                />
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  {currentUser.emailVerified
                    ? 'Verified email used for secure guest order linking.'
                    : 'Unverified email — verify above to claim matching guest bookings.'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#123B67] hover:bg-[#1D5288] text-white font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer text-xs shadow-xs"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-[#B91C1C] hover:bg-red-50 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>

              {savedProfileSuccess && (
                <p className="text-xs text-[#15803D] font-medium">Profile updated successfully!</p>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
