// Instagram Followers/Likes pricing.
// Rule: base price per unit, minus 1% per 100 units, capped at 5000 units
// (= 50% off, the maximum discount). Steps of 100, minimum 100.

const RULES = {
  followers: { unitPriceSantim: 89, min: 100, max: 5000, step: 100 }, // 0.89 birr
  likes: { unitPriceSantim: 44, min: 100, max: 5000, step: 100 },     // 0.44 birr
} as const;

export type InstagramProduct = keyof typeof RULES;

export function quoteInstagramPrice(product: InstagramProduct, qty: number): { ok: true; priceBirr: number; discountPct: number } | { ok: false; error: string } {
  const rule = RULES[product];
  if (!rule) return { ok: false, error: 'Unknown product.' };
  if (!Number.isInteger(qty) || qty < rule.min) return { ok: false, error: `Minimum order is ${rule.min}.` };
  if (qty > rule.max) return { ok: false, error: `Maximum order is ${rule.max}.` };
  if (qty % rule.step !== 0) return { ok: false, error: `Order must be in steps of ${rule.step}.` };

  const discountPct = Math.min(50, Math.floor(qty / 100)); // 1% per 100, capped at 50%
  const rawSantim = qty * rule.unitPriceSantim;
  const discountedSantim = rawSantim * (100 - discountPct) / 100;
  const priceBirr = Math.round(discountedSantim) / 100;
  return { ok: true, priceBirr, discountPct };
}

/** instagram.com/username or instagram.com/p/... or /reel/... — a format check only, never confirms the account is real. */
export function isValidInstagramUsername(value: string): boolean {
  return /^[a-zA-Z0-9._]{1,30}$/.test(value.replace(/^@/, '').trim());
}
export function isValidInstagramPostUrl(value: string): boolean {
  return /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/.test(value.trim());
}
