import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";
import { SEGMENTS, matchesSegment, type SegmentId } from "@/lib/segments";

export async function GET(request: Request) {
  await requirePermission("customers.export");
  const { searchParams } = new URL(request.url);
  const segment = SEGMENTS.find((s) => s.id === searchParams.get("segment"))?.id as SegmentId | undefined;

  const customers = await prisma.customer.findMany({
    include: {
      tags: true,
      orders: {
        select: { total: true, status: true, createdAt: true, couponId: true, paymentMethod: true, returns: { select: { id: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = segment ? customers.filter((c) => matchesSegment(c, segment)) : customers;

  const rows = [
    ["id", "name", "email", "phone", "city", "address", "source", "orderCount", "totalSpent", "createdAt"],
    ...filtered.map((c) => {
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

  const suffix = segment ? `-${segment}` : "";
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers${suffix}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
