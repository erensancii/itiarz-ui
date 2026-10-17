"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/** Left menu; the items are already filtered by permission on the server. */
export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="sidenav" aria-label="Ana menü">
      <ul>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
