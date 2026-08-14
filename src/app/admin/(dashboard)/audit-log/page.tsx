import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-admin";

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole(["admin"]);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Audit Log</h1>
      <p className="mt-1 text-ink-soft">{total} recorded actions</p>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="px-6 py-3 font-medium">When</th>
              <th className="px-6 py-3 font-medium">Actor</th>
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                  Nothing recorded yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-ink/5 last:border-0 align-top">
                <td className="px-6 py-3 whitespace-nowrap text-ink-soft">
                  {new Date(e.createdAt).toLocaleString("en-PK", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-3">{e.actorEmail}</td>
                <td className="px-6 py-3 font-mono text-xs">{e.action}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {e.entityType}
                  {e.entityId && <span className="text-xs"> · {e.entityId}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              ← Newer
            </a>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="rounded-full border border-ink/20 px-4 py-1.5 hover:bg-cream-dark">
              Older →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
