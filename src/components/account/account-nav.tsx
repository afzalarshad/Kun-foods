"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/account", label: "Dashboard", icon: "🏠", exact: true },
  { href: "/account/orders", label: "Orders", icon: "📦" },
  { href: "/account/tickets", label: "Support", icon: "🎫" },
  { href: "/account/profile", label: "Profile", icon: "👤" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto sm:flex-col sm:gap-1 sm:overflow-visible">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:rounded-2xl ${
              active ? "bg-chili text-white" : "text-ink-soft hover:bg-cream-dark"
            }`}
          >
            <span aria-hidden>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-0 flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-left text-sm font-semibold text-ink-soft hover:bg-cream-dark sm:mt-4 sm:rounded-2xl"
      >
        <span aria-hidden>↪️</span>
        Sign out
      </button>
    </nav>
  );
}
