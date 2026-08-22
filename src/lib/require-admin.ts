import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, type Permission } from "@/lib/permissions";

export type AdminRole = string;

export async function requireAdmin() {
  const session = await auth();
  // audience must be checked explicitly -- a signed-in customer session also has
  // `session.user` set, and must never be treated as an admin session.
  if (!session?.user || session.user.audience !== "admin") redirect("/admin/login");
  return session;
}

/** Redirects to the dashboard if the signed-in admin doesn't hold one of the given roles. */
export async function requireRole(roles: AdminRole[]) {
  const session = await requireAdmin();
  const role = session.user.role ?? "staff";
  if (!roles.includes(role)) redirect("/admin");
  return session;
}

/**
 * Redirects to the dashboard if the signed-in admin's role doesn't grant the
 * given permission. This is the server-side gate -- never trust a hidden UI
 * element alone, every mutating action and API route re-checks here.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireAdmin();
  const role = session.user.role ?? "staff";
  if (!hasPermission(role, permission)) redirect("/admin");
  return session;
}

/** Like requirePermission, but passes if the role holds any one of the given permissions. */
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAdmin();
  const role = session.user.role ?? "staff";
  if (!permissions.some((p) => hasPermission(role, p))) redirect("/admin");
  return session;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
