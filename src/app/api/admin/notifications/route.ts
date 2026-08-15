import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  await requireAdmin();

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.adminNotification.count({ where: { read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
