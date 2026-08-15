"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { CustomerQuickviewModal, type QuickView } from "@/components/admin/customer-quickview-modal";

type SearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
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

      <CustomerQuickviewModal quickView={quickView} loading={loadingQuickView} onClose={() => setQuickView(null)} />
    </>
  );
}
