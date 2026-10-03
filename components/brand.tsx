"use client";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="ZTN Official">
      <span className="brand__text">ZTN</span>
      <span className="brand__badge" aria-label="Official">✓</span>
    </div>
  );
}
