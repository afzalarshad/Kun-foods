"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { setSettings, SETTING_KEYS, SLA_SETTING_KEYS, FIRST_ORDER_COUPON_CODE } from "@/lib/settings";

const schema = z.object({
  storeName: z.string().min(1).max(150),
  storeAddress: z.string().min(1).max(300),
  storePhone: z.string().max(50).optional(),
  emailEnabled: z.coerce.boolean().optional(),
  smsEnabled: z.coerce.boolean().optional(),
});

export async function updateSettings(formData: FormData) {
  const session = await requirePermission("settings.manage");
  const actorEmail = session.user.email ?? "unknown";

  const parsed = schema.parse({
    storeName: formData.get("storeName"),
    storeAddress: formData.get("storeAddress"),
    storePhone: formData.get("storePhone") || undefined,
    emailEnabled: formData.get("emailEnabled") === "on",
    smsEnabled: formData.get("smsEnabled") === "on",
  });

  await setSettings({
    [SETTING_KEYS.storeName]: parsed.storeName,
    [SETTING_KEYS.storeAddress]: parsed.storeAddress,
    [SETTING_KEYS.storePhone]: parsed.storePhone ?? "",
    [SETTING_KEYS.emailNotificationsEnabled]: String(parsed.emailEnabled ?? false),
    [SETTING_KEYS.smsNotificationsEnabled]: String(parsed.smsEnabled ?? false),
  });

  await logAudit({
    actorEmail,
    action: "settings.update",
    entityType: "Setting",
    after: parsed,
  });

  revalidatePath("/admin/settings");
}

export async function updateFirstOrderDiscount(formData: FormData) {
  const session = await requirePermission("settings.manage");
  const actorEmail = session.user.email ?? "unknown";

  const percent = z.coerce.number().int().min(0).max(90).parse(formData.get("percent"));

  await setSettings({ [SETTING_KEYS.firstOrderDiscountPercent]: String(percent) });

  // The popup always unlocks the same well-known code; keep its coupon row's value/active state
  // in sync so a percent of 0 turns the whole thing off without an admin having to remember a
  // second place to disable it.
  await prisma.coupon.upsert({
    where: { code: FIRST_ORDER_COUPON_CODE },
    update: { value: percent, active: percent > 0 },
    create: {
      code: FIRST_ORDER_COUPON_CODE,
      type: "percentage",
      value: percent,
      active: percent > 0,
      firstOrderOnly: true,
    },
  });

  await logAudit({
    actorEmail,
    action: "settings.first_order_discount_update",
    entityType: "Setting",
    after: { percent },
  });

  revalidatePath("/admin/settings");
  // The popup renders from the root storefront layout on every page, several of which are
  // statically generated (ISR) -- without this the new percent wouldn't show up until the next
  // revalidation window instead of immediately.
  revalidatePath("/", "layout");
}

const slaPriorities = ["urgent", "high", "normal", "low"] as const;
const slaMetrics = ["ticketResponseHours", "ticketResolutionHours", "orderFulfillmentHours"] as const;
const slaFieldName = (metric: (typeof slaMetrics)[number], priority: (typeof slaPriorities)[number]) => `${metric}.${priority}`;

export async function updateSlaThresholds(formData: FormData) {
  const session = await requirePermission("settings.manage");
  const actorEmail = session.user.email ?? "unknown";

  const values: Record<string, string> = {};
  const summary: Record<string, number> = {};
  for (const metric of slaMetrics) {
    for (const priority of slaPriorities) {
      const hours = z.coerce.number().min(1).max(720).parse(formData.get(slaFieldName(metric, priority)));
      values[SLA_SETTING_KEYS[metric][priority]] = String(hours);
      summary[slaFieldName(metric, priority)] = hours;
    }
  }

  await setSettings(values);

  await logAudit({
    actorEmail,
    action: "settings.sla_update",
    entityType: "Setting",
    after: summary,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/operations");
}
