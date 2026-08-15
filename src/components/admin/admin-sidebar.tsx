"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { hasPermission, ROLE_LABELS, type Permission } from "@/lib/permissions";

type NavLink = { href: string; label: string; icon: string; exact?: boolean; permission?: Permission };

const links: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/reports", label: "Reports", icon: "📈", permission: "reports.view" },
  { href: "/admin/pos", label: "POS", icon: "🧾", permission: "pos.operate" },
  { href: "/admin/products", label: "Products", icon: "🌶️", permission: "products.view" },
  { href: "/admin/inventory", label: "Inventory", icon: "📋", permission: "inventory.view" },
  { href: "/admin/warehouse", label: "Warehouse", icon: "📲", permission: "warehouse.pick" },
  { href: "/admin/bundles", label: "Bundles", icon: "🎁", permission: "promotions.manage" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️", permission: "promotions.manage" },
  { href: "/admin/orders", label: "Orders", icon: "📦", permission: "orders.view" },
  { href: "/admin/customers", label: "Customers", icon: "👥", permission: "customers.view" },
  { href: "/admin/tickets", label: "Support", icon: "🎫", permission: "support.manage" },
  { href: "/admin/shipping", label: "Shipping zones", icon: "🚚", permission: "shipping.manage" },
  { href: "/admin/shipments", label: "Shipments", icon: "📮", permission: "shipping.manage" },
  { href: "/admin/import-export", label: "Import/Export", icon: "🗂️", permission: "import_export.manage" },
  { href: "/admin/users", label: "Users", icon: "🔑", permission: "users.manage" },
  { href: "/admin/audit-log", label: "Audit Log", icon: "🕵️", permission: "audit.view" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", permission: "settings.manage" },
];

export function AdminSidebar({ userEmail, role }: { userEmail: string; role: string }) {
  const pathname = usePathname();
  const visibleLinks = links.filter(
    (link) =>
      !link.permission ||
      hasPermission(role, link.permission) ||
      (link.href === "/admin/warehouse" && hasPermission(role, "warehouse.pack"))
  );

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
        {visibleLinks.map((link) => {
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
        <div className="truncate text-xs text-ink-soft">
          {userEmail}
          <span className="ml-1.5 rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
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
