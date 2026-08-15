import { prisma } from "@/lib/prisma";

const SLA_PRIORITIES = ["urgent", "high", "normal", "low"] as const;

/** Ticket response/resolution and order fulfillment SLA hour thresholds, one setting key per priority. */
export const SLA_SETTING_KEYS = {
  ticketResponseHours: Object.fromEntries(
    SLA_PRIORITIES.map((p) => [p, `sla.ticket_response.${p}`])
  ) as Record<(typeof SLA_PRIORITIES)[number], string>,
  ticketResolutionHours: Object.fromEntries(
    SLA_PRIORITIES.map((p) => [p, `sla.ticket_resolution.${p}`])
  ) as Record<(typeof SLA_PRIORITIES)[number], string>,
  orderFulfillmentHours: Object.fromEntries(
    SLA_PRIORITIES.map((p) => [p, `sla.order_fulfillment.${p}`])
  ) as Record<(typeof SLA_PRIORITIES)[number], string>,
};

export const SETTING_KEYS = {
  storeName: "store.name",
  storeAddress: "store.address",
  storePhone: "store.phone",
  emailNotificationsEnabled: "notifications.email_enabled",
  smsNotificationsEnabled: "notifications.sms_enabled",
} as const;

const SLA_DEFAULT_HOURS = {
  ticketResponseHours: { urgent: "1", high: "4", normal: "24", low: "48" },
  ticketResolutionHours: { urgent: "4", high: "24", normal: "72", low: "120" },
  orderFulfillmentHours: { urgent: "4", high: "12", normal: "24", low: "48" },
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.storeName]: "Kun Foods",
  [SETTING_KEYS.storeAddress]: process.env.STORE_ADDRESS || "Kun Foods, Main Boulevard, Lahore, Pakistan",
  [SETTING_KEYS.storePhone]: process.env.STORE_PHONE || "",
  [SETTING_KEYS.emailNotificationsEnabled]: "true",
  [SETTING_KEYS.smsNotificationsEnabled]: "true",
  ...Object.fromEntries(
    (Object.keys(SLA_DEFAULT_HOURS) as (keyof typeof SLA_DEFAULT_HOURS)[]).flatMap((metric) =>
      SLA_PRIORITIES.map((p) => [SLA_SETTING_KEYS[metric][p], SLA_DEFAULT_HOURS[metric][p]])
    )
  ),
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...overrides };
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getBooleanSetting(key: string): Promise<boolean> {
  const value = await getSetting(key);
  return value === "true";
}

export async function setSettings(values: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  );
}
