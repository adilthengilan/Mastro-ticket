import React from 'react';
import { ShieldCheck, Ticket, Star, Lock, CheckCircle2, Music } from 'lucide-react';

interface BannerItem {
  id: string;
  label: string;
  icon: 'shield' | 'ticket' | 'star' | 'lock' | 'check' | 'music';
  path?: string;
  externalHref?: string;
}

interface ScrollingTrustBannerProps {
  variant?: 'top' | 'showcase';
  navigate?: (path: string) => void;
}

const TOP_ITEMS: BannerItem[] = [
  {
    id: 'trusted-reseller',
    label: 'Trusted Ticket Reseller',
    icon: 'shield',
    path: '/ticket-enquiry'
  },
  {
    id: 'authentic-passes',
    label: '100% Verified F1 & Concert Passes',
    icon: 'check',
    path: '/ticket-enquiry'
  },
  {
    id: 'guest-checkout',
    label: 'Instant Guest Checkout — No Account Required',
    icon: 'ticket',
    path: '/races'
  },
  {
    id: 'five-star',
    label: 'Five-Star Customer Experience',
    icon: 'star',
    externalHref: 'https://www.trustpilot.com/review/mastrotickets.co'
  },
  {
    id: 'hungarian-gp-2026',
    label: 'Hungarian Grand Prix 2026 · Budapest — Covered Grandstands Available',
    icon: 'ticket',
    path: '/races/hungarian-grand-prix-2026'
  },
  {
    id: 'stripe-usd',
    label: 'Secure Encrypted Stripe Payments in USD',
    icon: 'lock',
    path: '/races'
  },
  {
    id: 'budapest-concerts',
    label: 'Hungaroring Budapest Weekend Passes & After-Race Events',
    icon: 'music',
    path: '/#concerts'
  }
];

const SHOWCASE_ITEMS: BannerItem[] = [
  {
    id: 'sc-trusted',
    label: 'TRUSTED RESELLER',
    icon: 'shield',
    path: '/ticket-enquiry'
  },
  {
    id: 'sc-f1',
    label: 'HUNGARIAN GRAND PRIX 2026 · BUDAPEST, HUNGARY',
    icon: 'ticket',
    path: '/races/hungarian-grand-prix-2026'
  },
  {
    id: 'sc-reviews',
    label: 'TRUSTPILOT & GOOGLE VERIFIED REVIEWS',
    icon: 'star',
    externalHref: 'https://www.trustpilot.com/review/mastrotickets.co'
  },
  {
    id: 'sc-guest',
    label: 'FAST & SECURE GUEST CHECKOUT',
    icon: 'lock',
    path: '/races'
  },
  {
    id: 'sc-concerts',
    label: 'HUNGARORING BUDAPEST · GRANDSTANDS & HOSPITALITY',
    icon: 'music',
    path: '/#concerts'
  },
  {
    id: 'sc-verify',
    label: 'OFFICIAL BARCODED E-TICKET AUTHENTICITY',
    icon: 'check',
    path: '/ticket-enquiry'
  }
];

const renderIcon = (icon: BannerItem['icon'], sizeClass: string) => {
  switch (icon) {
    case 'shield':
      return <ShieldCheck className={sizeClass} aria-hidden="true" />;
    case 'ticket':
      return <Ticket className={sizeClass} aria-hidden="true" />;
    case 'star':
      return <Star className={sizeClass} aria-hidden="true" />;
    case 'lock':
      return <Lock className={sizeClass} aria-hidden="true" />;
    case 'music':
      return <Music className={sizeClass} aria-hidden="true" />;
    default:
      return <CheckCircle2 className={sizeClass} aria-hidden="true" />;
  }
};

export const ScrollingTrustBanner: React.FC<ScrollingTrustBannerProps> = ({
  variant = 'top',
  navigate
}) => {
  const isShowcase = variant === 'showcase';
  const items = isShowcase ? SHOWCASE_ITEMS : TOP_ITEMS;

  const renderTrackGroup = (groupKey: string, isDuplicate: boolean) => (
    <div
      key={groupKey}
      aria-hidden={isDuplicate ? 'true' : undefined}
      className="flex items-center shrink-0"
    >
      {items.map((item) => {
        const content = (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            {renderIcon(item.icon, isShowcase ? 'w-4 h-4 text-white/95 shrink-0' : 'w-3.5 h-3.5 text-white/90 shrink-0')}
            <span
              className={
                isShowcase
                  ? 'font-sports font-extrabold text-sm sm:text-base tracking-wider uppercase text-white'
                  : 'text-xs font-semibold tracking-wide text-white'
              }
            >
              {item.label}
            </span>
          </span>
        );

        const interactiveClass =
          'inline-flex items-center hover:opacity-85 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded px-1 cursor-pointer';

        return (
          <div
            key={`${groupKey}-${item.id}`}
            className="inline-flex items-center shrink-0"
          >
            {item.externalHref ? (
              <a
                href={item.externalHref}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isDuplicate ? -1 : undefined}
                className={interactiveClass}
              >
                {content}
              </a>
            ) : item.path && navigate ? (
              <button
                type="button"
                onClick={() => navigate(item.path!)}
                tabIndex={isDuplicate ? -1 : undefined}
                className={interactiveClass}
              >
                {content}
              </button>
            ) : (
              <span className="inline-flex items-center px-1">{content}</span>
            )}

            <span
              aria-hidden="true"
              className={
                isShowcase
                  ? 'mx-6 sm:mx-8 text-white/45 font-bold select-none'
                  : 'mx-5 sm:mx-7 text-white/45 select-none'
              }
            >
              /
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      role="region"
      aria-label="MastroTickets trusted reseller highlights"
      className={`mastro-marquee-container relative w-full overflow-hidden no-print select-none ${
        isShowcase
          ? 'bg-gradient-to-r from-[#B80D27] via-[#D4112C] to-[#B80D27] border-y border-[#990B20] py-3 shadow-sm'
          : 'bg-[#C8102E] border-b border-[#9E0B22] py-2'
      }`}
    >
      {/* Subtle left/right edge fades for seamless broadcast ticker entry */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 z-10 bg-gradient-to-r ${
          isShowcase ? 'from-[#B80D27]' : 'from-[#C8102E]'
        } to-transparent`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 z-10 bg-gradient-to-l ${
          isShowcase ? 'from-[#B80D27]' : 'from-[#C8102E]'
        } to-transparent`}
      />

      <div
        className={`mastro-marquee-track ${
          isShowcase ? 'mastro-marquee-track-slow' : ''
        }`}
      >
        {renderTrackGroup('primary', false)}
        {renderTrackGroup('duplicate', true)}
      </div>
    </div>
  );
};
