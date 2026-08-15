import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteWebhook } from "@/app/admin/(dashboard)/webhooks/actions";

export default async function AdminWebhooksPage() {
  await requirePermission("settings.manage");
  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-extrabold">Webhooks</h1>
          <p className="mt-1 text-ink-soft">
            {webhooks.length} total — notify an external system when orders or tickets happen.
          </p>
        </div>
        <Link
          href="/admin/webhooks/new"
          className="rounded-full bg-chili px-5 py-2.5 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          + Add webhook
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">URL</th>
              <th className="px-6 py-3 font-medium">Events</th>
              <th className="px-6 py-3 font-medium">Last delivery</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                  No webhooks yet.
                </td>
              </tr>
            )}
            {webhooks.map((w) => {
              const events: string[] = JSON.parse(w.events);
              const lastOk = w.lastStatus ? /^2\d\d$/.test(w.lastStatus) : null;
              return (
                <tr key={w.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-3 font-semibold">{w.name}</td>
                  <td className="max-w-xs truncate px-6 py-3 font-mono text-xs text-ink-soft">{w.url}</td>
                  <td className="px-6 py-3 text-xs text-ink-soft">{events.join(", ")}</td>
                  <td className="px-6 py-3 text-xs">
                    {w.lastTriggeredAt ? (
                      <span className={lastOk ? "text-basil-dark" : "text-chili-dark"}>
                        {w.lastStatus} · {new Date(w.lastTriggeredAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : (
                      <span className="text-ink-soft">Never fired</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {w.active ? (
                      <span className="rounded-full bg-basil/20 px-3 py-1 text-xs font-semibold text-basil-dark">Active</span>
                    ) : (
                      <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/webhooks/${w.id}/edit`} className="font-medium text-basil hover:underline">
                        Edit
                      </Link>
                      <DeleteButton confirmMessage={`Delete webhook "${w.name}"?`} action={deleteWebhook.bind(null, w.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
