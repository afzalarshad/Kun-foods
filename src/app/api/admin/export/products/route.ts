import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { toCsv } from "@/lib/csv";

export async function GET() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const rows = [
    ["id", "name", "sku", "barcode", "category", "price", "compareAtPrice", "costPrice", "stock", "reorderLevel", "supplier", "weightLabel", "featured", "createdAt"],
    ...products.map((p) => [
      p.id,
      p.name,
      p.sku ?? "",
      p.barcode ?? "",
      p.category.name,
      (p.price / 100).toFixed(2),
      p.compareAtPrice !== null ? (p.compareAtPrice / 100).toFixed(2) : "",
      p.costPrice !== null ? (p.costPrice / 100).toFixed(2) : "",
      p.stock,
      p.reorderLevel ?? "",
      p.supplier ?? "",
      p.weightLabel ?? "",
      p.featured ? "yes" : "no",
      p.createdAt.toISOString(),
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
