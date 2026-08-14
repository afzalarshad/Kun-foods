import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

/**
 * One-time setup helper for hosts without CLI/shell access (e.g. deploying
 * from a phone). Visit /api/seed?key=<AUTH_SECRET> once after the first
 * successful deploy to populate categories, products, and the admin user.
 * No-ops if products already exist, so it's safe to hit more than once.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    return NextResponse.json({
      message: `Database already has ${existingCount} products — nothing to do.`,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kunfoods.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "kunfoods123";
  const { categoryCount, productCount } = await seedDatabase(prisma, adminEmail, adminPassword);

  return NextResponse.json({
    message: `Seeded ${categoryCount} categories and ${productCount} products.`,
    adminLogin: adminEmail,
  });
}
