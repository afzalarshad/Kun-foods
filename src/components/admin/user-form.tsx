"use client";

import type { AdminUser } from "@prisma/client";

export function UserForm({
  action,
  user,
}: {
  action: (formData: FormData) => void;
  user?: AdminUser;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name</label>
        <input
          name="name"
          required
          defaultValue={user?.name}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      {!user && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {user ? "New password (leave blank to keep current)" : "Password"}
        </label>
        <input
          type="password"
          name="password"
          required={!user}
          minLength={6}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Role</label>
        <select
          name="role"
          defaultValue={user?.role ?? "staff"}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        >
          <option value="admin">Admin — full access</option>
          <option value="staff">Staff — everything except users/audit log</option>
          <option value="pos">POS only — confined to the POS screen</option>
        </select>
      </div>

      {user && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={user.active} />
          Active (unchecking blocks this account from signing in)
        </label>
      )}

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {user ? "Save changes" : "Create user"}
      </button>
    </form>
  );
}
