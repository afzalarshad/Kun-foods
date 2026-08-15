import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";

export async function GET() {
  await requirePermission("shipping.manage");

  const zones = await prisma.shippingZone.findMany({ orderBy: [{ scope: "asc" }, { city: "asc" }, { province: "asc" }] });

  const rows = [
    ["scope", "city", "province", "rate", "freeAbove", "excluded", "active"],
    ...zones.map((z) => [
      z.scope,
      z.city ?? "",
      z.province ?? "",
      (z.rate / 100).toFixed(2),
      z.freeAbove !== null ? (z.freeAbove / 100).toFixed(2) : "",
      z.excluded ? "yes" : "no",
      z.active ? "yes" : "no",
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipping-zones-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
