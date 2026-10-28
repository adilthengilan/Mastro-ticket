import React, { useState } from 'react';
import { useStore } from '../services/store';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Ticket,
  Tag,
  Check
} from 'lucide-react';

interface CartPageProps {
  navigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ navigate }) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    formatPrice,
    appliedDiscount,
    applyDiscountCode,
    removeDiscountCode,
    reservationTimeRemaining
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Subtotal calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const serviceFees = cart.reduce((acc, item) => acc + item.fee * item.quantity, 0);
  const tax = Math.round((subtotal + serviceFees) * 0.10); // 10% VAT
  
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.discountPercent) {
      discountAmount = Math.round((subtotal * appliedDiscount.discountPercent) / 100);
    } else if (appliedDiscount.discountAmount) {
      discountAmount = appliedDiscount.discountAmount;
    }
  }

  const grandTotal = subtotal + serviceFees + tax - discountAmount;

  // Format timer mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyDiscountCode(promoInput.trim());
    setPromoMessage({ text: res.message, success: res.success });
    if (res.success) {
      setPromoInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-[#FFFFFF] min-h-[70vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-[#F5F7FA] text-[#123B67] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h2 className="font-sports font-bold text-2xl text-[#0B1F3A] uppercase tracking-wider">
            Your Cart is Empty
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 mb-6 font-sans">
            You haven't selected any Grand Prix tickets yet. Explore our official Formula 1 calendar and covered grandstands to secure your seats.
          </p>
          <button
            onClick={() => navigate('/races')}
            className="w-full py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <Ticket className="w-4 h-4" />
            <span>Discover Race Tickets</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] min-h-screen py-8 sm:py-12 text-[#111827]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & Reservation Hold Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-sports font-black text-3xl sm:text-4xl text-[#0B1F3A] uppercase tracking-tight">
              Review Your Shopping Cart
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 font-sans">
              {cart.length} ticket selection(s) held in your temporary reservation.
            </p>
          </div>

          {/* Hold Timer Banner */}
          <div className={`px-3.5 py-1.5 rounded-md border flex items-center gap-2 text-xs ${
            reservationTimeRemaining < 120
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-[#F5F7FA] border-[#E2E8F0] text-[#0B1F3A]'
          }`}>
            <Clock className="w-3.5 h-3.5 shrink-0 text-[#123B67]" />
            <div>
              <span className="text-[#64748B]">Tickets Reserved: </span>
              <strong className="font-mono font-bold text-[#0B1F3A]">
                {formatTimer(reservationTimeRemaining)}
              </strong>
            </div>
          </div>
        </div>

        {/* 2-Column Commerce Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Cart Items Column */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#64748B] uppercase tracking-wider bg-[#F5F7FA]">
                <span>Selected Tickets & Sessions</span>
                <button
                  onClick={clearCart}
                  className="text-[#B91C1C] hover:underline cursor-pointer lowercase font-normal"
                >
                  empty cart
                </button>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {cart.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Item Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#163A63] uppercase">
                        <span>{item.eventName}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[#64748B]">{item.raceDay}</span>
                      </div>

                      <h3 className="font-sports font-bold text-xl text-[#0B1F3A] uppercase tracking-wide">
                        {item.ticketName}
                      </h3>

                      <p className="text-xs text-[#64748B] font-sans">
                        {item.circuit} · {item.section}
                      </p>

                      {item.seatDetails && (
                        <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-[#F5F7FA] border border-[#E2E8F0] text-xs font-mono text-[#15803D]">
                          Seat Assigned: Row {item.seatDetails.row}, Seat {item.seatDetails.seatNumber}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2E8F0]">
                      
                      {!item.seatDetails ? (
                        <div className="flex items-center border border-[#E2E8F0] rounded bg-[#F5F7FA]">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-[#64748B] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-[#0B1F3A]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-[#64748B] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748B] font-mono">1 allocated seat</span>
                      )}

                      {/* Line Price */}
                      <div className="text-right">
                        <div className="text-base font-bold text-[#111827] font-mono tabular-nums">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          ({formatPrice(item.unitPrice)} each)
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] rounded transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Promo Code Input Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5 text-[#123B67]" />
                <span>Promotional or Corporate Access Code</span>
              </div>

              {appliedDiscount ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs">
                  <div className="flex items-center gap-2 text-[#15803D] font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Promo "{appliedDiscount.code}" applied (-{discountAmount > 0 ? formatPrice(discountAmount) : ''})</span>
                  </div>
                  <button
                    onClick={removeDiscountCode}
                    className="text-[#64748B] hover:text-[#111827] underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. F1START2026, YASVIP)..."
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded text-xs text-[#111827] placeholder-[#64748B] uppercase focus:border-[#0B1F3A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase rounded transition-colors cursor-pointer shrink-0"
                  >
                    Apply Code
                  </button>
                </form>
              )}

              {promoMessage && (
                <p className={`mt-2 text-xs ${promoMessage.success ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

          </div>

          {/* Sticky Order Summary Column */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="font-sports font-black text-xl text-[#0B1F3A] uppercase tracking-tight pb-3 border-b border-[#E2E8F0]">
                Order Summary
              </h3>

              <div className="py-3 space-y-2.5 text-xs text-[#475569] border-b border-[#E2E8F0]">
                <div className="flex justify-between">
                  <span>Tickets Subtotal:</span>
                  <span className="font-mono text-[#111827] font-semibold tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Service & Handling Fee:</span>
                  <span className="font-mono text-[#111827] font-semibold tabular-nums">{formatPrice(serviceFees)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Applicable VAT / Tax (10%):</span>
                  <span className="font-mono text-[#111827] font-semibold tabular-nums">{formatPrice(tax)}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-[#15803D] font-medium">
                    <span>Discount ({appliedDiscount.code}):</span>
                    <span className="font-mono tabular-nums">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 pb-5">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-sports font-bold text-base text-[#0B1F3A] uppercase tracking-wide">
                    Total Amount
                  </span>
                  <span className="font-mono font-bold text-2xl text-[#0B1F3A] tabular-nums">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B]">
                  Official VAT tax invoice provided upon payment confirmation
                </p>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/races')}
                className="w-full mt-2 py-1.5 text-[#64748B] hover:text-[#0B1F3A] text-xs font-medium text-center transition-colors cursor-pointer"
              >
                ← Continue Shopping
              </button>

              {/* Guarantees */}
              <div className="mt-5 pt-3 border-t border-[#E2E8F0] space-y-1.5 text-[11px] text-[#64748B]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  <span>Stripe 256-bit encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-[#123B67] shrink-0" />
                  <span>Official barcoded electronic entry passes</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
