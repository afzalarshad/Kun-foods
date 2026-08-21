"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { createOrder, OrderError } from "@/lib/create-order";
import { pakistaniMobileSchema } from "@/lib/phone";
import { personNameSchema } from "@/lib/name";

const posOrderSchema = z.object({
  customerName: personNameSchema,
  email: z.string().email(),
  phone: pakistaniMobileSchema,
  address: z.string().min(2).max(300).optional(),
  city: z.string().min(2).max(100).optional(),
  paymentMethod: z.enum(["cash", "cod", "card"]),
  payments: z
    .array(
      z.object({
        method: z.enum(["cash", "cod", "card", "bank_transfer", "other"]),
        amount: z.number().min(1),
      })
    )
    .optional(),
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
  const parsed = posOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order data" };
  }

  try {
    const order = await createOrder({
      ...parsed.data,
      address: parsed.data.address ?? "",
      city: parsed.data.city ?? "",
      source: "pos",
    });
    return { orderId: order.id, orderNumber: order.orderNumber };
  } catch (err) {
    if (err instanceof OrderError) {
      return { error: err.message };
    }
    console.error("[createPosOrder] Unexpected error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
