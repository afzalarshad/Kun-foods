import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CustomerQuickSearch } from "@/components/admin/customer-quick-search";
import { NotificationBell } from "@/components/admin/notification-bell";
import { hasPermission, CONFINED_ROLES } from "@/lib/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const role = session.user.role ?? "staff";
  const canSearchCustomers = hasPermission(role, "customers.view");
  const isConfined = !!CONFINED_ROLES[role];

  return (
    <div className="flex min-h-screen bg-cream-dark/40 text-ink">
      <div className="print:hidden">
        <AdminSidebar userEmail={session.user.email ?? ""} role={role} />
      </div>
      <div className="flex-1">
        {!isConfined && (
          <div className="flex items-center justify-between gap-4 border-b border-ink/10 bg-cream px-6 py-3 sm:px-10 print:hidden">
            {canSearchCustomers ? <CustomerQuickSearch /> : <div />}
            <NotificationBell />
          </div>
        )}
        <main className="p-6 sm:p-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}
