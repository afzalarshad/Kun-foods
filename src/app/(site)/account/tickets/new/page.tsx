import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCustomerRecord } from "@/lib/require-customer";
import { NewTicketForm } from "@/components/account/new-ticket-form";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "New support ticket" };

export default async function NewAccountTicketPage() {
  const { customer } = await requireCustomerRecord();

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true },
    take: 20,
  });

  return (
    <AccountShell customerName={customer.name}>
    <div>
      <h2 className="font-heading text-lg font-bold">New support ticket</h2>
      <p className="mt-1 text-sm text-ink-soft">Tell us what&apos;s going on and we&apos;ll get back to you.</p>
      <NewTicketForm orders={orders} />
    </div>
    </AccountShell>
  );
}
