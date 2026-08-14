import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CustomerQuickSearch } from "@/components/admin/customer-quick-search";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const role = session.user.role ?? "staff";

  return (
    <div className="flex min-h-screen bg-cream-dark/40 text-ink">
      <div className="print:hidden">
        <AdminSidebar userEmail={session.user.email ?? ""} role={role} />
      </div>
      <div className="flex-1">
        {role !== "pos" && (
          <div className="flex items-center border-b border-ink/10 bg-cream px-6 py-3 sm:px-10 print:hidden">
            <CustomerQuickSearch />
          </div>
        )}
        <main className="p-6 sm:p-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}
