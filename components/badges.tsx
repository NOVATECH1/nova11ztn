"use client";

export type BadgeTier = "Premium" | "Premium+" | "Official" | "Top Seller" | undefined;

export function TierBadge({ tier }: { tier: BadgeTier }) {
  if (!tier) return null;
  const cls = tier === "Premium+"
    ? "tier-badge tier-badge--plus"
    : tier === "Premium"
      ? "tier-badge tier-badge--premium"
      : tier === "Official"
        ? "tier-badge tier-badge--official"
        : "tier-badge tier-badge--top";

  return (
    <svg
      className={cls}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-label={tier}
      role="img"
    >
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="currentColor" />
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="currentColor" transform="rotate(45 12 12)" />
      <path
        d="M8.2 12.4l2.6 2.6 5-5.6"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VerifiedLine() {
  return <div className="verified-line"><span>✓</span> Verified</div>;
}
