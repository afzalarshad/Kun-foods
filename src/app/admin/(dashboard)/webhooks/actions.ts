"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { WEBHOOK_EVENTS, generateWebhookSecret } from "@/lib/webhooks";

const webhookSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url().max(500),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  active: z.coerce.boolean().optional(),
});

function parseForm(formData: FormData) {
  return webhookSchema.parse({
    name: formData.get("name"),
    url: formData.get("url"),
    events: formData.getAll("events"),
    active: formData.get("active") === "on",
  });
}

export async function createWebhook(formData: FormData) {
  const session = await requirePermission("settings.manage");
  const parsed = parseForm(formData);

  const created = await prisma.webhook.create({
    data: {
      name: parsed.name,
      url: parsed.url,
      events: JSON.stringify(parsed.events),
      active: parsed.active ?? true,
      secret: generateWebhookSecret(),
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "webhook.create",
    entityType: "Webhook",
    entityId: created.id,
    after: { name: created.name, url: created.url, events: parsed.events },
  });

  revalidatePath("/admin/webhooks");
  redirect("/admin/webhooks");
}

export async function updateWebhook(webhookId: string, formData: FormData) {
  const session = await requirePermission("settings.manage");
  const parsed = parseForm(formData);
  const before = await prisma.webhook.findUniqueOrThrow({ where: { id: webhookId } });

  const updated = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      name: parsed.name,
      url: parsed.url,
      events: JSON.stringify(parsed.events),
      active: parsed.active ?? true,
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "webhook.update",
    entityType: "Webhook",
    entityId: webhookId,
    before: { name: before.name, url: before.url, active: before.active },
    after: { name: updated.name, url: updated.url, active: updated.active },
  });

  revalidatePath("/admin/webhooks");
  redirect("/admin/webhooks");
}

export async function regenerateWebhookSecret(webhookId: string) {
  const session = await requirePermission("settings.manage");
  await prisma.webhook.update({ where: { id: webhookId }, data: { secret: generateWebhookSecret() } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "webhook.regenerate_secret",
    entityType: "Webhook",
    entityId: webhookId,
  });

  revalidatePath(`/admin/webhooks/${webhookId}/edit`);
}

export async function deleteWebhook(webhookId: string) {
  const session = await requirePermission("settings.manage");
  const before = await prisma.webhook.findUniqueOrThrow({ where: { id: webhookId } });
  await prisma.webhook.delete({ where: { id: webhookId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "webhook.delete",
    entityType: "Webhook",
    entityId: webhookId,
    before: { name: before.name },
  });

  revalidatePath("/admin/webhooks");
}
