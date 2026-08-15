"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { DEFAULT_TEMPLATES, type TemplateKey } from "@/lib/templates";

const schema = z.object({
  key: z.enum(Object.keys(DEFAULT_TEMPLATES) as [TemplateKey, ...TemplateKey[]]),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
  enabled: z.coerce.boolean().optional(),
});

export async function updateTemplate(formData: FormData) {
  const session = await requirePermission("settings.manage");
  const actorEmail = session.user.email ?? "unknown";

  const parsed = schema.parse({
    key: formData.get("key"),
    subject: formData.get("subject") || undefined,
    body: formData.get("body"),
    enabled: formData.get("enabled") === "on",
  });

  const fallback = DEFAULT_TEMPLATES[parsed.key];

  await prisma.notificationTemplate.upsert({
    where: { key: parsed.key },
    update: { subject: parsed.subject ?? null, body: parsed.body, enabled: parsed.enabled ?? false, channel: fallback.channel },
    create: {
      key: parsed.key,
      channel: fallback.channel,
      subject: parsed.subject ?? null,
      body: parsed.body,
      enabled: parsed.enabled ?? false,
    },
  });

  await logAudit({
    actorEmail,
    action: "notification_template.update",
    entityType: "NotificationTemplate",
    entityId: parsed.key,
    after: { enabled: parsed.enabled },
  });

  revalidatePath("/admin/settings/templates");
}

export async function resetTemplate(key: string) {
  await requirePermission("settings.manage");
  await prisma.notificationTemplate.deleteMany({ where: { key } });
  revalidatePath("/admin/settings/templates");
}
