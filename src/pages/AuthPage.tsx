import React, { useState } from 'react';
import { useStore } from '../services/store';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Ticket,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface AuthPageProps {
  navigate: (path: string) => void;
  initialMode?: 'login' | 'register';
  prefillEmail?: string;
  redirectAfter?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  navigate,
  initialMode = 'login',
  prefillEmail = '',
  redirectAfter = '/account',
}) => {
  const {
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    isAuthenticated,
    currentUser,
  } = useStore();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Hungary');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (isAuthenticated) {
    return (
      <div className="bg-[#F5F7FA] min-h-[70vh] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-[#15803D] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="font-sports font-black text-2xl text-[#0B1F3A] uppercase tracking-wide">
            Signed In as {currentUser.displayName}
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-sans">{currentUser.email}</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="flex-1 py-2.5 px-4 bg-[#0B1F3A] hover:bg-[#163A63] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Open My Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/races')}
              className="flex-1 py-2.5 px-4 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#0B1F3A] border border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Browse Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'reset') {
      setIsSubmitting(true);
      const res = await sendPasswordReset(email);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      setSuccessMsg(res.message);
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        mode === 'register'
          ? await registerWithEmail({ displayName, email, password, phone, country })
          : await loginWithEmail(email, password);

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(res.message);
      setIsSubmitting(false);
      setTimeout(() => {
        navigate(redirectAfter);
      }, 650);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.message);
        setIsGoogleLoading(false);
        return;
      }

      setSuccessMsg(res.message);
      setIsGoogleLoading(false);
      setTimeout(() => {
        navigate(redirectAfter);
      }, 650);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in could not be completed.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] min-h-screen py-10 sm:py-14 px-4 text-[#111827]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Brand & Guest Benefit Panel */}
        <div className="lg:col-span-5 bg-[#071629] text-white rounded-xl p-6 sm:p-8 flex flex-col justify-between border border-[#163A63]">
          <div>
            <div className="bg-white px-3 py-1.5 rounded-lg inline-flex items-center mb-6">
              <img
                src="/assets/aistudio/mastro-logo_504ab54e.png"
                alt="MastroTickets"
                className="h-7 w-auto object-contain"
              />
            </div>

            <h1 className="font-sports font-black text-3xl uppercase tracking-tight leading-tight">
              Trusted F1 & Live Event Ticket Platform
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed font-sans">
              MastroTickets is a trusted ticket seller platform for Formula 1 race weekends, covered grandstands, VIP hospitality, and after-race concerts in Budapest. Book securely anytime — as a guest or with your account — and manage every verified pass in one place.
            </p>

            <div className="mt-6 space-y-3.5 text-xs text-slate-200 border-t border-white/10 pt-5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">100% Verified Authentic Tickets</strong>
                  <span className="text-slate-400">
                    Every grandstand seat, VIP hospitality package, and concert pass is verified for official venue turnstile entry with full buyer protection.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Ticket className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Secure Checkout & Instant E-Tickets</strong>
                  <span className="text-slate-400">
                    Encrypted payments in USD ($) with barcoded passes, VAT invoices, and automatic linking of past guest orders via your verified email.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Trusted Reseller & Race-Week Support</strong>
                  <span className="text-slate-400">
                    Dedicated ticketing specialists supporting fans from booking through race day, with transparent reviews on Trustpilot and Google.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/races')}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Continue Browsing as Guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Segmented Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                mode === 'login' || mode === 'reset'
                  ? 'bg-[#0B1F3A] text-white shadow-2xs'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0B1F3A] text-white shadow-2xs'
                  : 'text-[#475569] hover:text-[#0B1F3A]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Firebase Google Sign-In Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#111827] flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#123B67]" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#64748B] uppercase tracking-wider whitespace-nowrap">
              {mode === 'reset' ? 'reset password' : 'or with email & password'}
            </span>
            <div className="border-t border-[#E2E8F0] w-full" />
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#15803D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-[#475569] mb-1 font-medium">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[#475569] mb-1 font-medium">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                />
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-[#64748B] mt-1">
                  Use the same email from guest checkout to automatically link your previous tickets after verification.
                </p>
              )}
            </div>

            {mode !== 'reset' && (
              <div className={mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[#475569] font-medium">Password *</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] text-[#123B67] hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[#475569] mb-1 font-medium">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+36 30 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#475569] mb-1 font-medium">Country</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Hungary"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg text-[#111827] focus:border-[#0B1F3A] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full mt-2 py-3 px-4 bg-[#123B67] hover:bg-[#1D5288] text-white font-sports font-black text-sm uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'reset' && !isSubmitting && <KeyRound className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'register'
                  ? 'Create Account'
                  : mode === 'reset'
                  ? 'Send Password Reset Email'
                  : 'Sign In to My Account'}
              </span>
            </button>

            {mode === 'reset' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-[#64748B] hover:text-[#0B1F3A] underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
