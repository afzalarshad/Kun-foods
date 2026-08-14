import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-cream-dark/40 text-ink">
      <AdminSidebar userEmail={session.user.email ?? ""} />
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
