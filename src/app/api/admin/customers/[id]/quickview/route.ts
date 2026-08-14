import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 5 },
      tags: true,
      notes: { orderBy: { createdAt: "desc" }, take: 3 },
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allOrders = await prisma.order.findMany({ where: { customerId: id }, select: { total: true, status: true } });
  const totalSpent = allOrders.reduce((sum, o) => sum + o.total, 0);
  const openOrders = allOrders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const openTickets = customer.tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    },
    stats: {
      orderCount: allOrders.length,
      totalSpent,
      openOrders,
      openTickets,
    },
    tags: customer.tags.map((t) => t.tag),
    recentNotes: customer.notes,
    recentOrders: customer.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
    })),
    recentTickets: customer.tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      status: t.status,
    })),
  });
}
