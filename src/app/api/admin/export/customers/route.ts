import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";

export async function GET() {
  await requirePermission("customers.export");

  const customers = await prisma.customer.findMany({
    include: { orders: { select: { total: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["id", "name", "email", "phone", "city", "address", "source", "orderCount", "totalSpent", "createdAt"],
    ...customers.map((c) => {
      const nonCancelled = c.orders.filter((o) => o.status !== "cancelled");
      const totalSpent = nonCancelled.reduce((sum, o) => sum + o.total, 0);
      return [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.city ?? "",
        c.address ?? "",
        c.source ?? "",
        c.orders.length,
        (totalSpent / 100).toFixed(2),
        c.createdAt.toISOString(),
      ];
    }),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
