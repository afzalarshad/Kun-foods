import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, OrderError } from "@/lib/create-order";

const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "card"]),
  couponCode: z.string().max(40).optional(),
  items: z
    .array(
      z.object({
        type: z.enum(["product", "bundle"]),
        id: z.string(),
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

  try {
    const order = await createOrder({ ...parsed.data, source: "web" });
    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/orders] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
