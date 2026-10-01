'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string };

export function NavLinks({ items, className }: { items: Item[]; className?: string }) {
  const path = usePathname() || '/';
  return (
    <>
      {items.map((i) => {
        const active = i.href === '/' ? path === '/' : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={active ? 'active' : undefined}>{i.label}</Link>;
      })}
    </>
  );
}
