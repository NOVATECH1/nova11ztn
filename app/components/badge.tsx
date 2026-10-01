import type { ReactNode } from 'react';

type SubscriptionTierName = 'PREMIUM' | 'PREMIUM_PLUS';

type BadgeProps = {
  isVerified?: boolean;
  isOfficial?: boolean;
  subscriptionTier?: SubscriptionTierName | null;
  interactive?: boolean;
};

function CheckMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`ztn-badge-svg ${className}`} viewBox="0 0 44 44" aria-hidden="true">
      <path
        d="M22 2.5l3.9 2.9 4.8-1.1 2.5 4.2 4.7 1.7-.3 4.9 3.3 3.6-2.4 4.2 1 4.8-4.2 2.6-1.7 4.6-4.9-.3-3.5 3.4-4.3-2.5-4.7 1-2.6-4.2-4.6-1.7.3-4.9-3.4-3.6 2.5-4.2-1-4.8 4.2-2.6 1.7-4.6 4.9.3z"
        fill="currentColor"
      />
      <path
        d="M13.8 22.1l5.3 5.3 11.2-11.5"
        fill="none"
        stroke="white"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OfficialMark() {
  return (
    <span className="ztn-official-mark" aria-hidden="true">
      <svg viewBox="0 0 44 44" className="ztn-badge-svg">
        <circle cx="22" cy="22" r="19" fill="#c73b3b" />
        <path
          d="M13.5 22.2l5.3 5.4 11.8-12"
          fill="none"
          stroke="white"
          strokeWidth="5.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function explainButton(label: string, children: ReactNode) {
  return (
    <a className="ztn-badge-link" href="/badges" title={label} aria-label={label}>
      {children}
    </a>
  );
}

export function UserBadges({ isVerified, isOfficial, subscriptionTier, interactive = false }: BadgeProps) {
  const badges: ReactNode[] = [];
  const wrap = (label: string, content: ReactNode) => interactive ? explainButton(label, content) : content;

  if (isOfficial) {
    badges.push(
      <span key="official" className="ztn-badge-item ztn-badge-item-official">
        {wrap('Official — the official ZTN account', <><OfficialMark /><span>Official</span></>)}
      </span>,
    );
  }

  if (isVerified) {
    badges.push(
      <span key="verified" className="ztn-badge-item ztn-badge-item-verified">
        {wrap('Verified — identity verification completed', <><CheckMark className="ztn-badge-verified-icon" /><span>Verified</span></>)}
      </span>,
    );
  }

  if (subscriptionTier === 'PREMIUM') {
    badges.push(
      <span key="premium" className="ztn-badge-item ztn-badge-item-premium">
        {wrap('Premium — active Premium subscription', <CheckMark className="ztn-badge-premium-icon" />)}
      </span>,
    );
  }

  if (subscriptionTier === 'PREMIUM_PLUS') {
    badges.push(
      <span key="premium-plus" className="ztn-badge-item ztn-badge-item-premium-plus">
        {wrap('Premium+ — active Premium+ subscription', <CheckMark className="ztn-badge-premium-plus-icon" />)}
      </span>,
    );
  }

  if (!badges.length) return null;

  return <span className="ztn-badges" aria-label="Account badges">{badges}</span>;
}
