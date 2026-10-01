export const APP_NAME = 'ZTN Store & Marketplace';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muhdinnovel2@gmail.com';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const subscriptionPlans = [
  { id: 'premium-7d', tier: 'PREMIUM', durationDays: 7, price: 99, label: '7 days' },
  { id: 'premium-1m', tier: 'PREMIUM', durationDays: 30, price: 299, label: '1 month' },
  { id: 'premium-3m', tier: 'PREMIUM', durationDays: 90, price: 799, label: '3 months' },
  { id: 'premium-6m', tier: 'PREMIUM', durationDays: 180, price: 1399, label: '6 months' },
  { id: 'premium-12m', tier: 'PREMIUM', durationDays: 365, price: 2499, label: '12 months' },
  { id: 'premiumplus-7d', tier: 'PREMIUM_PLUS', durationDays: 7, price: 299, label: '7 days' },
  { id: 'premiumplus-1m', tier: 'PREMIUM_PLUS', durationDays: 30, price: 499, label: '1 month' },
  { id: 'premiumplus-3m', tier: 'PREMIUM_PLUS', durationDays: 90, price: 999, label: '3 months' },
  { id: 'premiumplus-6m', tier: 'PREMIUM_PLUS', durationDays: 180, price: 1599, label: '6 months' },
  { id: 'premiumplus-12m', tier: 'PREMIUM_PLUS', durationDays: 365, price: 2699, label: '12 months' },
] as const;

export function etb(amount: number) {
  return new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 }).format(amount) + ' ETB';
}
