import Link from 'next/link';
import { NavLinks } from './nav-links';
import { ThemeToggle } from './theme-toggle';

const desktop = [
  { href: '/', label: 'Home' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/store', label: 'Official Store' },
  { href: '/search', label: 'Search' },
  { href: '/subscription', label: 'Subscription' },
  { href: '/profile', label: 'Profile' },
];
const mobile = [
  { href: '/', label: 'Home' },
  { href: '/marketplace', label: 'Market' },
  { href: '/store', label: 'Store' },
  { href: '/search', label: 'Search' },
  { href: '/profile', label: 'Profile' },
];

export function Header() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">ZTN <span>Store</span></Link>
          <nav className="nav" aria-label="Primary navigation"><NavLinks items={desktop} /></nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link className="btn" href="/login">Log in</Link>
            <Link className="btn btn-primary" href="/store">Open Store</Link>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation"><NavLinks items={mobile} /></nav>
    </>
  );
}
