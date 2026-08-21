import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductCard } from "@/lib/types";
import { dedupeByVariantGroup } from "@/lib/variants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
    },
    include: { category: true },
    orderBy: { name: "asc" },
    take: 30,
  });

  const results = dedupeByVariantGroup(products).slice(0, 8).map(toProductCard);
  return NextResponse.json({ results });
}
