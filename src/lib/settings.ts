import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  storeName: "store.name",
  storeAddress: "store.address",
  storePhone: "store.phone",
  emailNotificationsEnabled: "notifications.email_enabled",
  smsNotificationsEnabled: "notifications.sms_enabled",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.storeName]: "Kun Foods",
  [SETTING_KEYS.storeAddress]: process.env.STORE_ADDRESS || "Kun Foods, Main Boulevard, Lahore, Pakistan",
  [SETTING_KEYS.storePhone]: process.env.STORE_PHONE || "",
  [SETTING_KEYS.emailNotificationsEnabled]: "true",
  [SETTING_KEYS.smsNotificationsEnabled]: "true",
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
