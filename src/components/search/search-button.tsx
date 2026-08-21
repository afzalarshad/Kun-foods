"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  categoryName: string;
};

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Search products"
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-dark"
      >
        <span className="text-xl" aria-hidden>
          🔍
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-ink/10 bg-cream p-3 shadow-xl sm:w-96">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm focus:border-chili focus:outline-none"
          />

          <div className="mt-2 max-h-80 overflow-y-auto">
            {loading && <p className="px-2 py-3 text-sm text-ink-soft">Searching…</p>}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-2 py-3 text-sm text-ink-soft">No products found for &ldquo;{query}&rdquo;.</p>
            )}
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream-dark"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl" aria-hidden>
                  {product.images[0] ?? "🌶️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-ink-soft">{product.categoryName}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatPrice(product.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
