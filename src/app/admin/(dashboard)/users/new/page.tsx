import { requirePermission } from "@/lib/require-admin";
import { UserForm } from "@/components/admin/user-form";
import { createUser } from "@/app/admin/(dashboard)/users/actions";

export default async function NewUserPage() {
  await requirePermission("users.manage");

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add user</h1>
      <p className="mt-1 text-ink-soft">Create a login for a staff member or POS operator.</p>
      <div className="mt-8">
        <UserForm action={createUser} />
      </div>
    </div>
  );
}
