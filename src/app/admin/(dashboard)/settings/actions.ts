"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { setSettings, SETTING_KEYS } from "@/lib/settings";

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
