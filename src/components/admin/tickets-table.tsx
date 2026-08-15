"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bulkSetTicketStatus, bulkAssignTickets } from "@/app/admin/(dashboard)/tickets/bulk-actions";
import { SLA_STATE_STYLES, SLA_STATE_LABELS, type SlaState } from "@/lib/sla";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customerName: string | null;
  orderNumber: string | null;
  updatedAt: Date;
  sla: { responseState: SlaState; resolutionState: SlaState } | null;
};

const statusStyles: Record<string, string> = {
  open: "bg-chili/20 text-chili-dark",
  pending: "bg-saffron/20 text-saffron-dark",
  in_progress: "bg-plum/20 text-plum",
  waiting_on_customer: "bg-plum/20 text-plum",
  resolved: "bg-basil/20 text-basil-dark",
  closed: "bg-cream-dark text-ink-soft",
};

const priorityStyles: Record<string, string> = {
  low: "text-ink-soft",
  normal: "text-ink",
  high: "text-saffron-dark",
  urgent: "text-chili-dark",
};

const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"];

export function TicketsTable({ tickets }: { tickets: TicketRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("resolved");
  const [assignee, setAssignee] = useState("");
  const [isPending, startTransition] = useTransition();

  const allSelected = tickets.length > 0 && selected.size === tickets.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tickets.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runStatus() {
    startTransition(async () => {
      await bulkSetTicketStatus([...selected], bulkStatus);
      setSelected(new Set());
    });
  }

  function runAssign() {
    startTransition(async () => {
      await bulkAssignTickets([...selected], assignee);
      setSelected(new Set());
      setAssignee("");
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
              <th className="px-6 py-3 font-medium">Ticket</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Priority</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">SLA</th>
              <th className="px-6 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-ink-soft">
                  Nothing here — nice and quiet.
                </td>
              </tr>
            )}
            {tickets.map((t) => (
              <tr key={t.id} className="border-b border-ink/5 last:border-0">
                <td className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    className="h-4 w-4 rounded border-ink/30"
                  />
                </td>
                <td className="px-6 py-3">
                  <Link href={`/admin/tickets/${t.id}`} className="font-medium hover:text-chili">
                    #{t.ticketNumber}
                  </Link>
                  <p className="text-xs text-ink-soft">{t.subject}</p>
                  {t.orderNumber && <p className="text-xs text-ink-soft">Order #{t.orderNumber}</p>}
                </td>
                <td className="px-6 py-3">{t.customerName ?? "—"}</td>
                <td className="px-6 py-3 capitalize text-ink-soft">{t.category}</td>
                <td className={`px-6 py-3 font-medium capitalize ${priorityStyles[t.priority] ?? ""}`}>{t.priority}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[t.status] ?? "bg-cream-dark"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {t.sla && (t.sla.responseState === "breached" || t.sla.resolutionState === "breached") ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.breached}`}>
                      {SLA_STATE_LABELS.breached}
                    </span>
                  ) : t.sla && (t.sla.responseState === "at_risk" || t.sla.resolutionState === "at_risk") ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.at_risk}`}>
                      {SLA_STATE_LABELS.at_risk}
                    </span>
                  ) : t.sla ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${SLA_STATE_STYLES.on_track}`}>
                      {SLA_STATE_LABELS.on_track}
                    </span>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-ink-soft">
                  {new Date(t.updatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-ink px-6 py-3 text-cream shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-full border-0 bg-white/10 px-3 py-1.5 text-xs capitalize text-cream focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="text-ink">
                  {s.replace("_", " ")}
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
          <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
}
