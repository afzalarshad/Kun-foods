"use client";

import { useState } from "react";
import { CustomerQuickviewModal, type QuickView } from "@/components/admin/customer-quickview-modal";

export function CustomerNameLink({
  customerId,
  customerName,
  className,
}: {
  customerId: string | null;
  customerName: string;
  className?: string;
}) {
  const [quickView, setQuickView] = useState<QuickView | null>(null);
  const [loading, setLoading] = useState(false);

  if (!customerId) return <span className={className}>{customerName}</span>;

  async function open() {
    setLoading(true);
    setQuickView(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/quickview`);
      const data = await res.json();
      setQuickView(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={className ?? "hover:text-chili hover:underline"}>
        {customerName}
      </button>
      <CustomerQuickviewModal quickView={quickView} loading={loading} onClose={() => setQuickView(null)} />
    </>
  );
}
