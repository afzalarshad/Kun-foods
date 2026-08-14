import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

/**
 * One-time (and safe-to-repeat) setup helper for hosts without CLI/shell
 * access (e.g. deploying from a phone). Visit /api/seed?key=<AUTH_SECRET>
 * after each deploy that adds new seed data (products, shipping zones,
 * etc.) — every operation inside seedDatabase is an upsert, so re-running
 * it never duplicates existing data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!process.env.AUTH_SECRET || key !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kunfoods.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "kunfoods123";
  const { categoryCount, productCount, shippingZoneCount } = await seedDatabase(
    prisma,
    adminEmail,
    adminPassword
  );

  return NextResponse.json({
    message: `Up to date: ${categoryCount} categories, ${productCount} products, ${shippingZoneCount} shipping zones.`,
    adminLogin: adminEmail,
  });
}
