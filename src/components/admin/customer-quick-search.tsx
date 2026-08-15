"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

type SearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
};

type QuickView = {
  customer: { id: string; name: string; email: string; phone: string; createdAt: string };
  stats: { orderCount: number; totalSpent: number; openOrders: number; openTickets: number };
  tags: string[];
  recentNotes: { id: string; note: string; createdAt: string }[];
  recentOrders: { id: string; orderNumber: string; status: string; total: number; createdAt: string }[];
  recentTickets: { id: string; ticketNumber: string; subject: string; status: string }[];
};

export function CustomerQuickSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [quickView, setQuickView] = useState<QuickView | null>(null);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/admin/customers/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results ?? []);
          setOpen(true);
        })
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openQuickView(customerId: string) {
    setOpen(false);
    setLoadingQuickView(true);
    setQuickView(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/quickview`);
      const data = await res.json();
      setQuickView(data);
    } finally {
      setLoadingQuickView(false);
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => visibleResults.length > 0 && setOpen(true)}
          placeholder="🔍 Search customer — name, phone, email, order #"
          className="w-full rounded-full border border-ink/20 bg-white px-4 py-2 text-sm focus:border-chili focus:outline-none"
        />
        {open && visibleResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-xl">
            {visibleResults.map((r) => (
              <button
                key={r.id}
                onClick={() => openQuickView(r.id)}
                className="flex w-full flex-col items-start gap-0.5 border-b border-ink/5 px-4 py-2.5 text-left last:border-0 hover:bg-cream-dark"
              >
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="text-xs text-ink-soft">
                  {r.phone} · {r.email} · {r.orderCount} orders · {formatPrice(r.totalSpent)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {(loadingQuickView || quickView) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setQuickView(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingQuickView && <p className="py-10 text-center text-ink-soft">Loading…</p>}
            {quickView && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold">{quickView.customer.name}</h2>
                    <p className="text-sm text-ink-soft">
                      {quickView.customer.phone} · {quickView.customer.email}
                    </p>
                  </div>
                  <button onClick={() => setQuickView(null)} className="rounded-full p-1.5 hover:bg-cream-dark" aria-label="Close">
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent orders</p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {quickView.recentOrders.map((o) => (
                        <li key={o.id}>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            onClick={() => setQuickView(null)}
                            className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm hover:text-chili"
                          >
                            <span>
                              #{o.orderNumber} <span className="capitalize text-ink-soft">· {o.status}</span>
                            </span>
                            <span className="font-medium">{formatPrice(o.total)}</span>
                          </Link>
                        </li>
                      ))}
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
                            onClick={() => setQuickView(null)}
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
                    onClick={() => setQuickView(null)}
                    className="rounded-full bg-chili px-4 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark"
                  >
                    Full profile
                  </Link>
                  <Link
                    href="/admin/pos"
                    onClick={() => setQuickView(null)}
                    className="rounded-full border-2 border-ink px-4 py-2 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
                  >
                    + New order
                  </Link>
                  <Link
                    href={`/admin/tickets/new?customerName=${encodeURIComponent(quickView.customer.name)}&customerEmail=${encodeURIComponent(quickView.customer.email)}&customerPhone=${encodeURIComponent(quickView.customer.phone)}`}
                    onClick={() => setQuickView(null)}
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
      )}
    </>
  );
}
