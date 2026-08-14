import type { OrderStatusEvent } from "@prisma/client";

const statusIcons: Record<string, string> = {
  pending: "🕐",
  processing: "⚙️",
  shipped: "🚚",
  delivered: "✅",
  cancelled: "✕",
};

export function OrderTimeline({ events }: { events: OrderStatusEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-soft">No status changes recorded yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-dark text-sm">
            {statusIcons[e.status] ?? "•"}
          </span>
          <div>
            <p className="text-sm font-medium capitalize">{e.status}</p>
            {e.note && <p className="text-sm text-ink-soft">{e.note}</p>}
            <p className="text-xs text-ink-soft">
              {new Date(e.createdAt).toLocaleString("en-PK", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {e.actorEmail && ` · ${e.actorEmail}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
