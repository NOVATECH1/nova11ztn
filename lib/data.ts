export const categories = [
  { name: "Gaming Accounts", icon: "Gamepad2" },
  { name: "Gaming Top-Up", icon: "Zap" },
  { name: "Design & Graphics", icon: "Palette" },
  { name: "Free Fire Sensitivity", icon: "Target" },
] as const;

export const premiumPlans = [
  { tier: "Premium", duration: "7 days", price: 99, popular: false },
  { tier: "Premium", duration: "1 month", price: 299, popular: true },
  { tier: "Premium", duration: "3 months", price: 799, popular: false },
  { tier: "Premium", duration: "6 months", price: 1399, popular: false },
  { tier: "Premium", duration: "12 months", price: 2499, popular: false },
  { tier: "Premium+", duration: "7 days", price: 299, popular: false },
  { tier: "Premium+", duration: "1 month", price: 499, popular: false },
  { tier: "Premium+", duration: "3 months", price: 999, popular: false },
  { tier: "Premium+", duration: "6 months", price: 1599, popular: false },
  { tier: "Premium+", duration: "12 months", price: 2699, popular: false },
] as const;

export const officialStore = {
  games: [
    { name: "Free Fire", status: "available", subtitle: "Top Up · Membership · Booyah Pass", href: "/official-store/free-fire", image: "/assets/free-fire.svg" },
  ],
  social: [
    { name: "Instagram Followers", status: "available", subtitle: "0.89 ETB each with volume discount · max 5,000", href: "/official-store/instagram", image: "/assets/instagram.svg" },
    { name: "Instagram Likes", status: "available", subtitle: "0.44 ETB each · quantity in steps of 100", href: "/official-store/instagram", image: "/assets/instagram-likes.svg" },
  ],
} as const;

export const adminSections = [
  ["Overview", "/admin"], ["Orders", "/admin/orders"], ["Sellers", "/admin/sellers"], ["Products", "/admin/products"], ["Users", "/admin/users"], ["Payments", "/admin/payments"], ["Payouts", "/admin/payouts"], ["Official Store", "/admin/official-store"], ["KYC", "/admin/kyc"], ["Disputes", "/admin/disputes"], ["Analytics", "/admin/analytics"], ["Settings", "/admin/settings"], ["Audit Logs", "/admin/audit-logs"],
] as const;
