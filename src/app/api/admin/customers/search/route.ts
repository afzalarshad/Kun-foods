import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { id: q },
      ],
    },
    include: { orders: { select: { total: true } } },
    take: 8,
  });

  const orderByNumber = await prisma.order.findFirst({
    where: { orderNumber: { contains: q, mode: "insensitive" } },
    select: { customerId: true },
  });
  if (orderByNumber?.customerId && !customers.some((c) => c.id === orderByNumber.customerId)) {
    const extra = await prisma.customer.findUnique({
      where: { id: orderByNumber.customerId },
      include: { orders: { select: { total: true } } },
    });
    if (extra) customers.push(extra);
  }

  const results = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
  }));

  return NextResponse.json({ results });
}
