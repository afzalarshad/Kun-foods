"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { createOrder, OrderError } from "@/lib/create-order";

const posOrderSchema = z.object({
  customerName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().min(2).max(300).optional(),
  city: z.string().min(2).max(100).optional(),
  paymentMethod: z.enum(["cash", "cod", "card"]),
  status: z.enum(["pending", "processing", "delivered"]),
  couponCode: z.string().max(40).optional(),
  items: z
    .array(
      z.object({
        type: z.enum(["product", "bundle"]),
        id: z.string(),
        quantity: z.number().int().min(1).max(500),
      })
    )
    .min(1),
});

export type PosOrderInput = z.infer<typeof posOrderSchema>;

export async function createPosOrder(input: PosOrderInput) {
  await requirePermission("pos.operate");
  const parsed = posOrderSchema.parse(input);

  try {
    const order = await createOrder({
      ...parsed,
      address: parsed.address ?? "",
      city: parsed.city ?? "",
      source: "pos",
    });
    return { orderNumber: order.orderNumber };
  } catch (err) {
    if (err instanceof OrderError) {
      return { error: err.message };
    }
    console.error("[createPosOrder] Unexpected error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
