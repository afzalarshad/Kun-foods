import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  await requirePermission("orders.view");
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["orderNumber", "customerName", "email", "phone", "city", "address", "status", "priority", "paymentMethod", "source", "subtotal", "discount", "shipping", "total", "createdAt"],
    ...orders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.email,
      o.phone,
      o.city,
      o.address,
      o.status,
      o.priority,
      o.paymentMethod,
      o.source,
      (o.subtotal / 100).toFixed(2),
      (o.discount / 100).toFixed(2),
      (o.shipping / 100).toFixed(2),
      (o.total / 100).toFixed(2),
      o.createdAt.toISOString(),
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
