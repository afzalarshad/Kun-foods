"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { bulkAddCustomerTag } from "@/app/admin/(dashboard)/customers/bulk-actions";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
};

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState("");
  const [isPending, startTransition] = useTransition();

  const allSelected = customers.length > 0 && selected.size === customers.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runTag() {
    if (!tag.trim()) return;
    startTransition(async () => {
      await bulkAddCustomerTag([...selected], tag);
      setSelected(new Set());
      setTag("");
    });
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-ink-soft">
              <th className="w-10 px-6 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-ink/30" />
              </th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Orders</th>
              <th className="px-6 py-3 font-medium">Total spent</th>
              <th className="px-6 py-3 font-medium">Customer since</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                  No customers found.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    className="h-4 w-4 rounded border-ink/30"
                  />
                </td>
                <td className="px-6 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-chili">
                    {c.name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-ink-soft">
                  {c.email}
                  <br />
                  {c.phone}
                </td>
                <td className="px-6 py-3">{c.orderCount}</td>
                <td className="px-6 py-3 font-medium">{formatPrice(c.totalSpent)}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {new Date(c.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-ink px-6 py-3 text-cream shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag, e.g. VIP"
            className="w-40 rounded-full border-0 bg-white/10 px-3 py-1.5 text-xs text-cream placeholder:text-cream/50 focus:outline-none"
          />
          <button
            onClick={runTag}
            disabled={isPending || !tag.trim()}
            className="rounded-full bg-chili px-4 py-1.5 text-xs font-heading font-semibold hover:bg-chili-dark disabled:opacity-60"
          >
            Add tag to selected
          </button>
        </div>
      )}
    </div>
  );
}
