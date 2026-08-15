import { prisma } from "@/lib/prisma";

export type TemplateKey =
  | "order_created_email"
  | "order_created_sms"
  | "order_status_changed_email"
  | "order_status_changed_sms";

export const TEMPLATE_VARIABLES = [
  "{{customer_name}}",
  "{{order_number}}",
  "{{total}}",
  "{{status}}",
  "{{items_list}}",
] as const;

type DefaultTemplate = { channel: "email" | "sms"; subject?: string; body: string; label: string };

export const DEFAULT_TEMPLATES: Record<TemplateKey, DefaultTemplate> = {
  order_created_email: {
    channel: "email",
    label: "Order confirmation — email",
    subject: "Order confirmed — #{{order_number}}",
    body:
      "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\">" +
      "<h2>Thanks, {{customer_name}}!</h2>" +
      "<p>Your Kun Foods order <strong>#{{order_number}}</strong> has been placed.</p>" +
      "<p>{{items_list}}</p>" +
      "<p style=\"margin-top:12px\"><strong>Total: {{total}}</strong></p>" +
      "</div>",
  },
  order_created_sms: {
    channel: "sms",
    label: "Order confirmation — SMS",
    body: "Kun Foods: Order #{{order_number}} confirmed. Total {{total}}. Thank you!",
  },
  order_status_changed_email: {
    channel: "email",
    label: "Status update — email",
    subject: "Order #{{order_number}} — {{status}}",
    body:
      "<div style=\"font-family:sans-serif;max-width:480px;margin:0 auto\">" +
      "<h2>Your order is now: {{status}}</h2>" +
      "<p>Order <strong>#{{order_number}}</strong> for {{total}}.</p>" +
      "</div>",
  },
  order_status_changed_sms: {
    channel: "sms",
    label: "Status update — SMS",
    body: "Kun Foods: Order #{{order_number}} is now {{status}}.",
  },
};

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    body
  );
}

export async function getTemplate(key: TemplateKey) {
  const row = await prisma.notificationTemplate.findUnique({ where: { key } });
  const fallback = DEFAULT_TEMPLATES[key];
  return {
    channel: fallback.channel,
    subject: row?.subject ?? fallback.subject ?? "",
    body: row?.body ?? fallback.body,
    enabled: row?.enabled ?? true,
  };
}
