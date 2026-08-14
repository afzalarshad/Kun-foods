import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AdminRole = "admin" | "staff" | "pos";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

/** Redirects to the dashboard if the signed-in admin doesn't hold one of the given roles. */
export async function requireRole(roles: AdminRole[]) {
  const session = await requireAdmin();
  const role = (session.user.role as AdminRole) ?? "staff";
  if (!roles.includes(role)) redirect("/admin");
  return session;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
