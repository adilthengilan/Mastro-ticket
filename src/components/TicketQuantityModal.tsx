import React, { useState, useEffect } from 'react';
import { Minus, Plus, Ticket, X, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface TicketQuantityModalProps {
  isOpen: boolean;
  eventName: string;
  initialQuantity: number;
  maxSelectable: number;
  hasAnyStock: boolean;
  isLoadingInventory?: boolean;
  canClose?: boolean;
  onConfirm: (quantity: number) => void;
  onClose?: () => void;
  onRefreshInventory?: () => void;
}

export const TicketQuantityModal: React.FC<TicketQuantityModalProps> = ({
  isOpen,
  eventName,
  initialQuantity,
  maxSelectable,
  hasAnyStock,
  isLoadingInventory = false,
  canClose = false,
  onConfirm,
  onClose,
  onRefreshInventory,
}) => {
  const effectiveMax = Math.max(1, maxSelectable);
  const [quantity, setQuantity] = useState<number>(() =>
    Math.min(effectiveMax, Math.max(1, initialQuantity || 1))
  );
  const [inputValue, setInputValue] = useState<string>(
    String(Math.min(effectiveMax, Math.max(1, initialQuantity || 1)))
  );
  const [validationMessage, setValidationMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const clamped = Math.min(effectiveMax, Math.max(1, initialQuantity || 1));
      setQuantity(clamped);
      setInputValue(String(clamped));
      setValidationMessage('');
    }
  }, [isOpen, initialQuantity, effectiveMax]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canClose, onClose]);

  if (!isOpen) return null;

  const updateQuantity = (next: number) => {
    setValidationMessage('');
    if (next < 1) {
      setQuantity(1);
      setInputValue('1');
      return;
    }
    if (next > effectiveMax) {
      setQuantity(effectiveMax);
      setInputValue(String(effectiveMax));
      setValidationMessage(
        `Maximum ${effectiveMax} ticket${effectiveMax === 1 ? '' : 's'} currently available per booking.`
      );
      return;
    }
    setQuantity(next);
    setInputValue(String(next));
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(raw);
    setValidationMessage('');
    if (raw === '') return;

    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      if (parsed > effectiveMax) {
        setQuantity(effectiveMax);
        setValidationMessage(
          `Maximum ${effectiveMax} ticket${effectiveMax === 1 ? '' : 's'} currently available per booking.`
        );
      } else if (parsed >= 1) {
        setQuantity(parsed);
      }
    }
  };

  const handleNumericBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      updateQuantity(1);
    } else if (parsed > effectiveMax) {
      updateQuantity(effectiveMax);
    } else {
      setQuantity(parsed);
      setInputValue(String(parsed));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyStock) return;
    const finalQty = Math.min(effectiveMax, Math.max(1, quantity));
    onConfirm(finalQty);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071629]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-qty-modal-title"
      aria-describedby="ticket-qty-modal-subtitle"
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose && onClose) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-2xl overflow-hidden text-[#111827]">
        {/* Navy Accent Header */}
        <div className="bg-[#0B1F3A] px-6 py-5 text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300 mb-1.5">
                <Ticket className="w-3.5 h-3.5" />
                <span>Live Ticket Inventory</span>
              </div>
              <h2
                id="ticket-qty-modal-title"
                className="font-sports font-black text-2xl sm:text-3xl uppercase tracking-tight leading-tight text-white"
              >
                How many tickets do you need?
              </h2>
              <p
                id="ticket-qty-modal-subtitle"
                className="text-xs sm:text-sm text-slate-300 mt-1 font-sans"
              >
                Select your ticket quantity to see available options.
              </p>
            </div>
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Close quantity dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {eventName && (
            <p className="mt-3 pt-3 border-t border-white/15 text-[11px] text-slate-300 truncate font-sans">
              Event: <span className="text-white font-semibold">{eventName}</span>
            </p>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!hasAnyStock && !isLoadingInventory ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">No tickets currently available for this event.</p>
                  <p className="text-amber-800 mt-0.5">
                    All ticket categories are sold out or temporarily held by other customers. Please check again shortly.
                  </p>
                </div>
              </div>
              {onRefreshInventory && (
                <button
                  type="button"
                  onClick={onRefreshInventory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded font-semibold text-xs hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Live Stock Again</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <label
                    htmlFor="ticket-quantity-input"
                    className="font-semibold text-[#0B1F3A] uppercase tracking-wider text-[11px]"
                  >
                    Number of Tickets
                  </label>
                  <span className="text-[11px] text-[#64748B] font-mono tabular-nums">
                    Min 1 · Max {effectiveMax}
                  </span>
                </div>

                {/* Stepper Control */}
                <div className="flex items-center justify-between gap-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg p-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity - 1)}
                    disabled={quantity <= 1 || isLoadingInventory}
                    aria-label="Decrease ticket quantity"
                    className="w-12 h-12 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white hover:border-[#0B1F3A] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#0B1F3A] disabled:hover:border-[#E2E8F0] disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 text-center">
                    <input
                      id="ticket-quantity-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Ticket quantity"
                      value={inputValue}
                      onChange={handleNumericInputChange}
                      onBlur={handleNumericBlur}
                      className="w-20 text-center bg-transparent font-mono font-black text-3xl text-[#0B1F3A] tabular-nums focus:outline-none"
                    />
                    <span className="block text-[11px] font-medium text-[#64748B]">
                      {quantity === 1 ? 'Ticket' : 'Tickets'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity + 1)}
                    disabled={quantity >= effectiveMax || isLoadingInventory}
                    aria-label="Increase ticket quantity"
                    className="w-12 h-12 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white hover:border-[#0B1F3A] disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#0B1F3A] disabled:hover:border-[#E2E8F0] disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {validationMessage && (
                  <p className="mt-2 text-xs text-[#B45309] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationMessage}</span>
                  </p>
                )}
              </div>

              <p className="text-xs text-[#475569] bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 font-sans">
                Only ticket categories with at least{' '}
                <strong className="text-[#0B1F3A] font-mono tabular-nums">{quantity}</strong>{' '}
                available {quantity === 1 ? 'ticket' : 'tickets'} in live inventory will be shown.
              </p>
            </>
          )}

          {/* Action Footer */}
          <div className="flex items-center gap-2.5 pt-1">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-[#CBD5E1] bg-white hover:bg-[#F5F7FA] text-[#475569] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!hasAnyStock || isLoadingInventory}
              className="flex-1 py-3 px-5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingInventory ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Live Inventory...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
