import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateShipping, generateOrderNumber } from "@/lib/format";

const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "card"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Always re-fetch prices from the database — never trust client-supplied prices.
  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
  });

  if (products.length !== new Set(data.items.map((i) => i.productId)).size) {
    return NextResponse.json({ error: "One or more products no longer exist" }, { status: 400 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId)!;
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `${product.name} is out of stock` },
        { status: 400 }
      );
    }
  }

  const subtotal = data.items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        subtotal,
        shipping,
        total,
        items: {
          create: data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
            };
          }),
        },
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
}
