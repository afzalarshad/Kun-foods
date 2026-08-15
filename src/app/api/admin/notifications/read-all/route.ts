import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function POST() {
  await requireAdmin();
  await prisma.adminNotification.updateMany({ where: { read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
