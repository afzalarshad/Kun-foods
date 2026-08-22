import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/format";
import { getShippingRate, ShippingError } from "@/lib/shipping";
import { notifyOrderCreated } from "@/lib/notifications";
import { notifyLowStockIfNeeded } from "@/lib/admin-notifications";
import { computePromotionsForCart } from "@/lib/promotions";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import { resolveFulfillmentWarehouse, decrementWarehouseStock } from "@/lib/warehouse-stock";

export type CreateOrderInput = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
  paymentMethod: "cod" | "card" | "cash";
  /** Optional split/partial payment lines actually collected (POS). Falls back to a single
   *  payment for the full total under `paymentMethod` when omitted (storefront checkout). */
  payments?: Array<{ method: "cash" | "cod" | "card" | "bank_transfer" | "other"; amount: number }>;
  source: "web" | "pos";
  status?: string;
  couponCode?: string;
  items: Array<{ type: "product" | "bundle"; id: string; quantity: number }>;
};

export class OrderError extends Error {}

export async function createOrder(input: CreateOrderInput) {
  if (input.items.length === 0) throw new OrderError("Cart is empty");

  const productIds = input.items.filter((i) => i.type === "product").map((i) => i.id);
  const bundleIds = input.items.filter((i) => i.type === "bundle").map((i) => i.id);

  const [directProducts, bundles] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } } })
      : Promise.resolve([]),
    bundleIds.length
      ? prisma.bundle.findMany({
          where: { id: { in: bundleIds } },
          include: { items: { include: { product: true } } },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(directProducts.map((p) => [p.id, p]));
  const bundleMap = new Map(bundles.map((b) => [b.id, b]));

  if (productIds.some((id) => !productMap.has(id))) {
    throw new OrderError("One or more products no longer exist");
  }
  if (bundleIds.some((id) => !bundleMap.has(id) || !bundleMap.get(id)!.active)) {
    throw new OrderError("One or more bundles are no longer available");
  }

  // Aggregate total product stock needed (direct + inside bundles)
  const neededStock = new Map<string, number>();
  for (const item of input.items) {
    if (item.type === "product") {
      neededStock.set(item.id, (neededStock.get(item.id) ?? 0) + item.quantity);
    } else {
      const bundle = bundleMap.get(item.id)!;
      for (const bi of bundle.items) {
        neededStock.set(
          bi.productId,
          (neededStock.get(bi.productId) ?? 0) + bi.quantity * item.quantity
        );
      }
    }
  }
  for (const [productId, qty] of neededStock) {
    const product =
      productMap.get(productId) ?? bundles.flatMap((b) => b.items).find((bi) => bi.productId === productId)?.product;
    if (product && product.stock < qty) {
      throw new OrderError(`${product.name} doesn't have enough stock`);
    }
  }

  const subtotal = input.items.reduce((sum, item) => {
    const unitPrice =
      item.type === "product" ? productMap.get(item.id)!.price : bundleMap.get(item.id)!.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  let discount = 0;
  let couponId: string | undefined;
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.trim().toUpperCase() } });
    if (!coupon || !coupon.active) throw new OrderError("Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new OrderError("This coupon has expired");
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new OrderError("This coupon has reached its usage limit");
    }
    if (coupon.firstOrderOnly) {
      const priorOrder = await prisma.order.findFirst({ where: { email: input.email.toLowerCase() } });
      if (priorOrder) throw new OrderError("This coupon is only valid on your first order");
    }
    if (subtotal < coupon.minSubtotal) {
      throw new OrderError(`This coupon requires a minimum order of ${coupon.minSubtotal / 100} Rs.`);
    }
    discount =
      coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    discount = Math.min(discount, subtotal);
    couponId = coupon.id;
  }

  const promoProductMap = new Map(
    directProducts.map((p) => [p.id, { id: p.id, price: p.price, categoryId: p.categoryId }])
  );
  const { discount: rawPromoDiscount, applied: appliedPromotions } = await computePromotionsForCart({
    items: input.items,
    productMap: promoProductMap,
    subtotal,
    email: input.email,
  });
  const promoDiscount = Math.min(rawPromoDiscount, subtotal - discount);

  // An empty city means a walk-in/pickup POS sale — no delivery, no shipping charge.
  // Only look up a real shipping rate when a city was actually given.
  const rawCity = input.city.trim();
  let shipping = 0;
  if (rawCity) {
    try {
      shipping = await getShippingRate(rawCity, subtotal - discount - promoDiscount);
    } catch (err) {
      if (err instanceof ShippingError) throw new OrderError(err.message);
      throw err;
    }
  }
  const total = subtotal - discount - promoDiscount + shipping;

  const city = rawCity || "Walk-in / Pickup";
  const address = input.address.trim() || "In-store purchase";

  const stockUpdates: { id: string; name: string; stock: number; reorderLevel: number | null }[] = [];
  const distinctMethods = new Set((input.payments ?? []).map((p) => p.method));
  const orderPaymentMethod = distinctMethods.size > 1 ? "split" : (input.payments?.[0]?.method ?? input.paymentMethod);

  const runTransaction = () => prisma.$transaction(async (tx) => {
    // Orders aren't split across locations, so the whole order must be fully
    // coverable by one warehouse's stock (see resolveFulfillmentWarehouse).
    const fulfillmentWarehouse = await resolveFulfillmentWarehouse(tx, city, neededStock);
    if (!fulfillmentWarehouse) {
      throw new OrderError(
        "Not enough stock at any single fulfillment location for this combination of items"
      );
    }

    const customer = await tx.customer.upsert({
      where: { email: input.email },
      update: { name: input.customerName, phone: input.phone, address, city },
      create: {
        name: input.customerName,
        email: input.email,
        phone: input.phone,
        address,
        city,
      },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        customerName: input.customerName,
        email: input.email,
        phone: input.phone,
        address,
        city,
        postalCode: input.postalCode,
        notes: input.notes,
        paymentMethod: orderPaymentMethod,
        source: input.source,
        status: input.status ?? "pending",
        subtotal,
        discount,
        couponId,
        promoDiscount,
        promotionsJson: appliedPromotions.length > 0 ? JSON.stringify(appliedPromotions) : null,
        shipping,
        total,
        warehouseId: fulfillmentWarehouse.id,
        items: {
          create: input.items.map((item) => {
            if (item.type === "product") {
              const product = productMap.get(item.id)!;
              return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity };
            }
            const bundle = bundleMap.get(item.id)!;
            return { bundleId: bundle.id, name: `${bundle.name} (bundle)`, price: bundle.price, quantity: item.quantity };
          }),
        },
      },
      include: { items: true },
    });

    for (const [productId, qty] of neededStock) {
      try {
        await decrementWarehouseStock(tx, { productId, warehouseId: fulfillmentWarehouse.id, quantity: qty });
      } catch {
        // resolveFulfillmentWarehouse picked this warehouse based on a read
        // moments earlier; a concurrent order can still win the atomic
        // decrement race in between. That's a correct rejection (no
        // overselling), so surface it as a normal out-of-stock OrderError
        // (400) rather than letting a generic Error fall through to the
        // customer as a 500 "something went wrong".
        throw new OrderError(
          "Sorry, this item just sold out while you were checking out. Please refresh and try again."
        );
      }
      const updated = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      stockUpdates.push(updated);
      await tx.inventoryMovement.create({
        data: {
          productId,
          warehouseId: fulfillmentWarehouse.id,
          type: "sale",
          quantity: -qty,
          reason: `Order ${created.orderNumber}`,
          orderId: created.id,
        },
      });
    }

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    if (input.payments && input.payments.length > 0) {
      for (const p of input.payments) {
        await tx.payment.create({
          data: {
            orderId: created.id,
            amount: p.amount,
            method: p.method,
            status: p.method === "cod" ? "pending" : "paid",
          },
        });
      }
    } else {
      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: total,
          method: input.paymentMethod,
          status: input.paymentMethod === "cod" ? "pending" : "paid",
        },
      });
    }

    return created;
  });

  // orderNumber is a short random string regenerated fresh on each call to
  // runTransaction(), so two concurrent orders can occasionally collide on
  // its unique constraint (found via load testing). Retry the whole
  // transaction a few times with a freshly generated number rather than
  // failing the customer's order over what's really just a naming clash.
  let order;
  let attempt = 0;
  for (;;) {
    try {
      order = await runTransaction();
      break;
    } catch (err) {
      attempt++;
      const isOrderNumberClash =
        err instanceof Error &&
        "code" in err &&
        err.code === "P2002" &&
        "meta" in err &&
        (err.meta as { target?: string[] } | undefined)?.target?.includes("orderNumber");
      if (isOrderNumberClash && attempt < 5) continue;
      throw err;
    }
  }

  notifyOrderCreated(order).catch((err) => console.error("[create-order] notification failed:", err));
  dispatchWebhookEvent("order.created", {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    total: order.total,
    status: order.status,
    source: order.source,
  }).catch((err) => console.error("[create-order] webhook dispatch failed:", err));
  for (const p of stockUpdates) {
    if (p.reorderLevel !== null) {
      notifyLowStockIfNeeded(p.id, p.name, p.stock, p.reorderLevel).catch((err) =>
        console.error("[create-order] low-stock notification failed:", err)
      );
    }
  }

  return order;
}
