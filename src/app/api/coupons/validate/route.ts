import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const subtotal = typeof body?.subtotal === "number" ? body.subtotal : 0;

  if (!code) return NextResponse.json({ error: "Enter a coupon code" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });
  }
  if (subtotal < coupon.minSubtotal) {
    return NextResponse.json(
      { error: `Minimum order of Rs. ${coupon.minSubtotal / 100} required for this coupon` },
      { status: 400 }
    );
  }

  const discount =
    coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;

  return NextResponse.json({ code: coupon.code, discount: Math.min(discount, subtotal) });
}
