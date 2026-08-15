import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteUser } from "@/app/admin/(dashboard)/users/actions";

const roleStyles: Record<string, string> = {
  admin: "bg-chili/20 text-chili-dark",
  staff: "bg-basil/20 text-basil-dark",
  pos: "bg-saffron/20 text-saffron-dark",
};

export default async function AdminUsersPage() {
  const session = await requirePermission("users.manage");
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Users</h1>
          <p className="mt-1 text-ink-soft">{users.length} admin accounts</p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add user
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3 font-medium">
                  {u.name} {u.email === session.user.email && <span className="text-xs text-ink-soft">(you)</span>}
                </td>
                <td className="px-6 py-3 text-ink-soft">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${roleStyles[u.role] ?? "bg-cream-dark"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {u.active ? (
                    <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">Active</span>
                  ) : (
                    <span className="rounded-full bg-chili/20 px-3 py-1 text-xs font-semibold text-chili-dark">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/users/${u.id}/edit`} className="font-medium text-basil hover:underline">
                      Edit
                    </Link>
                    {u.email !== session.user.email && (
                      <DeleteButton
                        confirmMessage={`Delete user "${u.name}"?`}
                        action={deleteUser.bind(null, u.id)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
