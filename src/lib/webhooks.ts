import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const WEBHOOK_EVENTS = ["order.created", "order.status_changed", "ticket.created"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Fire-and-forget: notifies every active webhook subscribed to `event`. Never throws. */
export async function dispatchWebhookEvent(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
  const webhooks = await prisma.webhook.findMany({ where: { active: true } });
  const subscribed = webhooks.filter((w) => {
    try {
      return (JSON.parse(w.events) as string[]).includes(event);
    } catch {
      return false;
    }
  });
  await Promise.all(subscribed.map((w) => deliver(w, event, payload)));
}

async function deliver(webhook: { id: string; url: string; secret: string }, event: WebhookEvent, payload: Record<string, unknown>) {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");

  let status: string;
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kun-Event": event,
        "X-Kun-Signature": `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    status = String(res.status);
  } catch (err) {
    status = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  await prisma.webhook
    .update({ where: { id: webhook.id }, data: { lastStatus: status, lastTriggeredAt: new Date() } })
    .catch(() => {});
}
