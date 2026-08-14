"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/pos", label: "POS", icon: "🧾" },
  { href: "/admin/products", label: "Products", icon: "🌶️" },
  { href: "/admin/bundles", label: "Bundles", icon: "🎁" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/shipping", label: "Shipping", icon: "🚚" },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-ink/10 bg-cream p-6">
      <Link href="/admin" className="flex items-center gap-2 font-heading text-lg font-extrabold">
        <span
          className="blob flex h-9 w-9 items-center justify-center bg-gradient-to-br from-chili to-saffron text-white"
          aria-hidden
        >
          K
        </span>
        Kun Foods
      </Link>
      <p className="mt-1 text-xs text-ink-soft">Admin panel</p>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-ink text-cream" : "hover:bg-cream-dark"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-ink/10 pt-4">
        <p className="truncate text-xs text-ink-soft">{userEmail}</p>
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-chili">
          ← Back to store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="rounded-full border border-ink/20 py-2 text-sm font-semibold hover:bg-cream-dark"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
