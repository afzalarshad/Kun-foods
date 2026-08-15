"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Order } from "@prisma/client";
import { formatPrice } from "@/lib/format";
import { bulkAssignOrders, bulkSetOrderStatus } from "@/app/admin/(dashboard)/orders/bulk-actions";
import { SLA_STATE_STYLES, SLA_STATE_LABELS, type SlaState } from "@/lib/sla";

const statusStyles: Record<string, string> = {
  pending: "bg-saffron/20 text-saffron-dark",
  processing: "bg-plum/20 text-plum",
  packed: "bg-saffron/30 text-saffron-dark",
  shipped: "bg-basil/20 text-basil-dark",
  delivered: "bg-basil text-white",
  cancelled: "bg-chili/20 text-chili-dark",
};

const priorityDot: Record<string, string> = {
  low: "bg-ink/20",
  normal: "",
  high: "bg-saffron",
  urgent: "bg-chili",
};

const statuses = ["pending", "processing", "packed", "shipped", "delivered", "cancelled"];

export function OrdersTable({
  orders,
  slaByOrderId = {},
}: {
  orders: Order[];
  slaByOrderId?: Record<string, { fulfillmentState: SlaState }>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignee, setAssignee] = useState("");
  const [bulkStatus, setBulkStatus] = useState("processing");
  const [isPending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runAssign() {
    startTransition(async () => {
      await bulkAssignOrders([...selected], assignee);
      setSelected(new Set());
      setAssignee("");
    });
  }

  function runStatus() {
    if (!confirm(`Mark ${selected.size} order(s) as "${bulkStatus}"?`)) return;
    startTransition(async () => {
      await bulkSetOrderStatus([...selected], bulkStatus);
      setSelected(new Set());
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
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Source</th>
              <th className="px-6 py-3 font-medium">Payment</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">SLA</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-ink-soft">
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggleOne(order.id)}
                    className="h-4 w-4 rounded border-ink/30"
                  />
                </td>
                <td className="px-6 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 font-medium hover:text-chili">
                    {priorityDot[order.priority] && (
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${priorityDot[order.priority]}`}
                        title={`${order.priority} priority`}
                      />
                    )}
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-3">{order.customerName}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      order.source === "pos" ? "bg-plum/20 text-plum" : "bg-cream-dark"
                    }`}
                  >
                    {order.source === "pos" ? "POS" : "Online"}
                  </span>
                </td>
                <td className="px-6 py-3 uppercase text-ink-soft">{order.paymentMethod}</td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyles[order.status] ?? "bg-cream-dark"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {slaByOrderId[order.id] ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES[slaByOrderId[order.id].fulfillmentState]}`}
                    >
                      {SLA_STATE_LABELS[slaByOrderId[order.id].fulfillmentState]}
                    </span>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </td>
                <td className="px-6 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-6 py-3 text-ink-soft">
                  {new Date(order.createdAt).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-ink px-6 py-3 text-cream shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="staff@kunfoods.com"
              className="w-44 rounded-full border-0 bg-white/10 px-3 py-1.5 text-xs text-cream placeholder:text-cream/50 focus:outline-none"
            />
            <button
              onClick={runAssign}
              disabled={isPending}
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-heading font-semibold hover:bg-white/20 disabled:opacity-60"
            >
              Assign
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-full border-0 bg-white/10 px-3 py-1.5 text-xs capitalize text-cream focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="text-ink">
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={runStatus}
              disabled={isPending}
              className="rounded-full bg-chili px-4 py-1.5 text-xs font-heading font-semibold hover:bg-chili-dark disabled:opacity-60"
            >
              Set status
            </button>
          </div>
          <Link
            href={`/admin/orders/labels?ids=${[...selected].join(",")}`}
            target="_blank"
            className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-heading font-semibold hover:bg-white/20"
          >
            🖨️ Print labels
          </Link>
        </div>
      )}
    </div>
  );
}
