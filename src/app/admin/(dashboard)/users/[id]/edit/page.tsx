import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-admin";
import { UserForm } from "@/components/admin/user-form";
import { updateUser } from "@/app/admin/(dashboard)/users/actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) notFound();

  const updateWithId = updateUser.bind(null, user.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit user</h1>
      <p className="mt-1 text-ink-soft">{user.email}</p>
      <div className="mt-8">
        <UserForm action={updateWithId} user={user} />
      </div>
    </div>
  );
}
