import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission, CONFINED_ROLES, type Permission } from "@/lib/permissions";

// Route prefix -> permission required to view it. Checked longest-prefix-first
// so a specific section's rule wins over a broader one. This is the
// server-side gate -- the sidebar only hides links it knows the role can't
// use, but a direct URL visit is blocked here regardless.
const ROUTE_PERMISSIONS: [string, Permission[]][] = [
  ["/admin/users", ["users.manage"]],
  ["/admin/audit-log", ["audit.view"]],
  ["/admin/settings", ["settings.manage"]],
  ["/admin/import-export", ["import_export.manage"]],
  ["/admin/warehouse", ["warehouse.pick", "warehouse.pack"]],
  ["/admin/pos", ["pos.operate"]],
  ["/admin/inventory", ["inventory.view"]],
  ["/admin/products", ["products.view"]],
  ["/admin/bundles", ["promotions.manage"]],
  ["/admin/coupons", ["promotions.manage"]],
  ["/admin/tickets", ["support.manage"]],
  ["/admin/shipping", ["shipping.manage"]],
  ["/admin/shipments", ["shipping.manage"]],
  ["/admin/reports", ["reports.view"]],
  ["/admin/orders", ["orders.view"]],
  ["/admin/customers", ["customers.view"]],
  ["/admin/recipes", ["content.manage"]],
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return;

  // audience must be checked explicitly -- a signed-in customer session also has req.auth.user
  // set, and must never fall through to admin route access.
  if (!req.auth?.user || req.auth.user.audience !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const role = req.auth.user.role ?? "staff";

  // Roles confined to a single admin section (POS operators, warehouse
  // pickers/packers) can't wander into the rest of the admin panel.
  const homeBase = CONFINED_ROLES[role];
  if (homeBase && !pathname.startsWith(homeBase)) {
    return NextResponse.redirect(new URL(homeBase, req.url));
  }

  const match = ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix));
  if (match && !match[1].some((permission) => hasPermission(role, permission))) {
    return NextResponse.redirect(new URL(homeBase ?? "/admin", req.url));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
