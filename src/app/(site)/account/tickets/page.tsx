import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "My support tickets" };

const OPEN_STATUSES = new Set(["open", "pending", "in_progress", "waiting_on_customer"]);

export default async function AccountTicketsPage() {
  const { customer } = await requireCustomerRecord();

  const tickets = await prisma.supportTicket.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell customerName={customer.name}>
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Support tickets</h2>
        <Link
          href="/account/tickets/new"
          className="btn-3d rounded-full bg-chili px-4 py-2 font-heading text-sm font-semibold text-white hover:bg-chili-dark"
        >
          New ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white p-6 text-sm text-ink-soft shadow-sm">
          No support tickets yet. Need help with an order? Open a ticket and we&apos;ll get back to you.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/account/tickets/${t.id}`}
                className="flex flex-col gap-2 rounded-3xl bg-white p-5 shadow-sm hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading font-bold">#{t.ticketNumber} — {t.subject}</p>
                  <p className="text-xs capitalize text-ink-soft">{t.category}</p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    OPEN_STATUSES.has(t.status) ? "bg-saffron/20 text-ink" : "bg-basil/15 text-basil"
                  }`}
                >
                  {t.status.replace(/_/g, " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </AccountShell>
  );
}
