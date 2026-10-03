"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { BookmarkIcon, HomeIcon, ProfileIcon, StoreIcon, Icons } from "./icons";
import { useState } from "react";

const nav = [
  ["Home", "/"],
  ["Marketplace", "/marketplace"],
  ["Store", "/official-store"],
  ["Premium", "/premium"],
  ["Profile", "/profile"],
] as const;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <Link href="/" className="brand-link"><Brand /></Link>
          <div className="desktop-search">
            <Icons.Search size={18} />
            <input aria-label="Search ZTN" placeholder="Search accounts, top-ups, designs..." />
            <span className="shortcut">/</span>
          </div>
          <nav className="desktop-nav">
            <Link className={pathname === "/marketplace" ? "active" : ""} href="/marketplace">Marketplace</Link>
            <Link className={pathname.startsWith("/official-store") ? "active" : ""} href="/official-store">Official Store</Link>
            <Link className={pathname.startsWith("/premium") ? "active" : ""} href="/premium">Premium</Link>
          </nav>
          <div className="topbar__actions">
            <button className={`icon-button ${saved ? "is-saved" : ""}`} onClick={() => setSaved((v: boolean) => !v)} aria-label="Save"><BookmarkIcon saved={saved} /></button>
            <ThemeToggle />
            <Link href="/profile" className="avatar avatar--small">ZT</Link>
            <button className="mobile-menu-toggle icon-button" onClick={() => setMenuOpen((v: boolean) => !v)} aria-label="Open menu">
              {menuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && <div className="mobile-menu glass-panel">
          {nav.slice(0, 4).map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}
          <Link href="/sell" className="mobile-menu__sell" onClick={() => setMenuOpen(false)}>Sell</Link>
        </div>}
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer__top">
          <div><Brand compact /><p>BUY • SELL • DISCOVER • GROW</p></div>
          <div className="footer__links"><Link href="/plan">Plan</Link><Link href="/profile">Profile</Link><Link href="/sell">Sell</Link><Link href="/official-store">Official Store</Link></div>
        </div>
        <div className="integration-strip">
          <span>Clerk</span><span>Neon</span><span>Veritas</span><span>Didit</span><span>Waliya</span><span>Brevo</span><span>Cloudflare R2</span>
        </div>
      </footer>

      <nav className="mobile-nav">
        <Link href="/" className={pathname === "/" ? "active" : ""}><HomeIcon /><span>Home</span></Link>
        <Link href="/marketplace" className={pathname.startsWith("/marketplace") ? "active" : ""}><Icons.ShoppingBag size={24} /><span>Marketplace</span></Link>
        <Link href="/sell" className="sell-fab" aria-label="Sell"><Icons.Plus size={25} /></Link>
        <Link href="/official-store" className={pathname.startsWith("/official-store") ? "active" : ""}><StoreIcon /><span>Store</span></Link>
        <Link href="/profile" className={pathname.startsWith("/profile") ? "active" : ""}><ProfileIcon /><span>Profile</span></Link>
      </nav>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><Brand compact /></Link>
        <div className="admin-kicker">CONTROL CENTER</div>
        {navAdmin.map(([label, href, icon]) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          const Comp = icon;
          return <Link key={href} href={href} className={`admin-link ${active ? "active" : ""}`}><Comp size={18} />{label}</Link>;
        })}
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><div className="desktop-search admin-search"><Icons.Search size={18} /><input placeholder="Search anything..." /></div><div className="admin-actions"><span className="admin-status"><i /> live database</span><ThemeToggle /><Link href="/profile" className="avatar avatar--small">ZT</Link></div></header>
        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}

const navAdmin = [
  ["Overview", "/admin", Icons.LayoutDashboard], ["Orders", "/admin/orders", Icons.ReceiptText], ["Sellers", "/admin/sellers", Icons.Users], ["Products", "/admin/products", Icons.PackageSearch], ["Users", "/admin/users", Icons.UserRound], ["Payments", "/admin/payments", Icons.CreditCard], ["Payouts", "/admin/payouts", Icons.WalletCards], ["Official Store", "/admin/official-store", Icons.Store], ["KYC", "/admin/kyc", Icons.BadgeCheck], ["Disputes", "/admin/disputes", Icons.Gavel], ["Analytics", "/admin/analytics", Icons.BarChart3], ["Settings", "/admin/settings", Icons.Settings], ["Audit Logs", "/admin/audit-logs", Icons.FileClock],
] as const;
