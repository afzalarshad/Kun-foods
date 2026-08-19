"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getCourierAdapter } from "@/lib/providers/couriers";

export type QuickView = {
  customer: { id: string; name: string; email: string; phone: string; createdAt: string };
  stats: { orderCount: number; totalSpent: number; openOrders: number; openTickets: number };
  tags: string[];
  recentNotes: { id: string; note: string; createdAt: string }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    shipment: { courier: string; trackingNumber: string | null } | null;
  }[];
  recentTickets: { id: string; ticketNumber: string; subject: string; status: string }[];
};

export function CustomerQuickviewModal({
  quickView,
  loading,
  onClose,
}: {
  quickView: QuickView | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!loading && !quickView) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <p className="py-10 text-center text-ink-soft">Loading…</p>}
        {quickView && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold">{quickView.customer.name}</h2>
                <p className="text-sm text-ink-soft">
                  {quickView.customer.phone} · {quickView.customer.email}
                </p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-cream-dark" aria-label="Close">
                ✕
              </button>
            </div>

            {quickView.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quickView.tags.map((t) => (
                  <span key={t} className="rounded-full bg-plum/10 px-2.5 py-0.5 text-xs font-semibold text-plum">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white p-3 text-center">
                <p className="font-heading text-lg font-bold">{quickView.stats.orderCount}</p>
                <p className="text-xs text-ink-soft">Orders</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center">
                <p className="font-heading text-lg font-bold">{formatPrice(quickView.stats.totalSpent)}</p>
                <p className="text-xs text-ink-soft">Lifetime value</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center">
                <p className="font-heading text-lg font-bold">{quickView.stats.openOrders}</p>
                <p className="text-xs text-ink-soft">Open orders</p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-center">
                <p className={`font-heading text-lg font-bold ${quickView.stats.openTickets > 0 ? "text-chili-dark" : ""}`}>
                  {quickView.stats.openTickets}
                </p>
                <p className="text-xs text-ink-soft">Open tickets</p>
              </div>
            </div>

            {quickView.recentOrders.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  All orders ({quickView.recentOrders.length})
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {quickView.recentOrders.map((o) => {
                    const trackingUrl =
                      o.shipment?.trackingNumber
                        ? getCourierAdapter(o.shipment.courier).trackingUrl(o.shipment.trackingNumber)
                        : null;
                    return (
                      <li key={o.id} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                        <Link href={`/admin/orders/${o.id}`} onClick={onClose} className="flex-1 hover:text-chili">
                          #{o.orderNumber} <span className="capitalize text-ink-soft">· {o.status}</span>
                        </Link>
                        <span className="font-medium">{formatPrice(o.total)}</span>
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 rounded-full border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-cream-dark"
                          >
                            Track
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {quickView.recentTickets.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Support tickets</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {quickView.recentTickets.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        onClick={onClose}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm hover:text-chili"
                      >
                        <span>
                          #{t.ticketNumber} <span className="text-ink-soft">— {t.subject}</span>
                        </span>
                        <span className="capitalize text-ink-soft">{t.status.replace("_", " ")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickView.recentNotes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent notes</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {quickView.recentNotes.map((n) => (
                    <li key={n.id} className="rounded-xl bg-white px-3 py-2 text-sm text-ink-soft">
                      {n.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/admin/customers/${quickView.customer.id}`}
                onClick={onClose}
                className="rounded-full bg-chili px-4 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark"
              >
                Full profile
              </Link>
              <Link
                href="/admin/pos"
                onClick={onClose}
                className="rounded-full border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
              >
                + New order
              </Link>
              <Link
                href={`/admin/tickets/new?customerName=${encodeURIComponent(quickView.customer.name)}&customerEmail=${encodeURIComponent(quickView.customer.email)}&customerPhone=${encodeURIComponent(quickView.customer.phone)}`}
                onClick={onClose}
                className="rounded-full border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
              >
                🎫 New ticket
              </Link>
              <a
                href={`https://wa.me/${quickView.customer.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[#25D366] px-4 py-2 text-sm font-heading font-semibold text-[#128C7E] hover:bg-[#25D366]/10"
              >
                💬 WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
