import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPakistaniMobile, normalizePakistaniMobile } from "@/lib/phone";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPhone = searchParams.get("phone")?.trim();
  const orderNumber = searchParams.get("orderNumber")?.trim();

  if (!rawPhone || !isValidPakistaniMobile(rawPhone)) {
    return NextResponse.json({ error: "Enter a valid Pakistani mobile number" }, { status: 400 });
  }
  const phone = normalizePakistaniMobile(rawPhone);

  if (orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order || order.phone !== phone) {
      return NextResponse.json({ error: "No matching order found for that order number and mobile number" }, { status: 404 });
    }
    return NextResponse.json({ orders: [order] });
  }

  const orders = await prisma.order.findMany({
    where: { phone },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: "No orders found for that mobile number" }, { status: 404 });
  }

  return NextResponse.json({ orders });
}
