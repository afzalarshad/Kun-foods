import { Resend } from "resend";
import twilio from "twilio";
import { formatPrice } from "@/lib/format";
import { getBooleanSetting, SETTING_KEYS } from "@/lib/settings";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { createAdminNotification } from "@/lib/admin-notifications";

type OrderItemLike = { name: string; price: number; quantity: number };
type OrderLike = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  status: string;
  total: number;
  items: OrderItemLike[];
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const emailFrom = process.env.EMAIL_FROM ?? "Kun Foods <onboarding@resend.dev>";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

async function sendEmail(to: string, subject: string, html: string) {
  if (!(await getBooleanSetting(SETTING_KEYS.emailNotificationsEnabled))) {
    console.log(`[notifications] Email notifications disabled in Settings — skipping "${subject}" to ${to}`);
    return;
  }
  if (!resend) {
    console.log(`[notifications] RESEND_API_KEY not set — skipping email "${subject}" to ${to}`);
    return;
  }
  try {
    await resend.emails.send({ from: emailFrom, to, subject, html });
  } catch (err) {
    console.error("[notifications] Failed to send email:", err);
  }
}

async function sendSMS(to: string, body: string) {
  if (!(await getBooleanSetting(SETTING_KEYS.smsNotificationsEnabled))) {
    console.log(`[notifications] SMS notifications disabled in Settings — skipping SMS to ${to}`);
    return;
  }
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`[notifications] Twilio not configured — skipping SMS to ${to}: ${body}`);
    return;
  }
  try {
    await twilioClient.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to, body });
  } catch (err) {
    console.error("[notifications] Failed to send SMS:", err);
  }
}

function itemsHtml(items: OrderItemLike[]) {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0">${item.name} × ${item.quantity}</td><td style="text-align:right">${formatPrice(item.price * item.quantity)}</td></tr>`
    )
    .join("");
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function sendTemplated(
  emailKey: "order_created_email" | "order_status_changed_email",
  smsKey: "order_created_sms" | "order_status_changed_sms",
  order: OrderLike
) {
  const vars = {
    customer_name: order.customerName.split(" ")[0],
    order_number: order.orderNumber,
    total: formatPrice(order.total),
    status: statusLabel(order.status),
  };

  const emailTemplate = await getTemplate(emailKey);
  if (emailTemplate.enabled) {
    const itemsListHtml = order.items.map((i) => `${i.quantity}× ${i.name} — ${formatPrice(i.price * i.quantity)}`).join("<br>");
    await sendEmail(
      order.email,
      renderTemplate(emailTemplate.subject, vars),
      renderTemplate(emailTemplate.body, { ...vars, items_list: itemsListHtml })
    );
  }

  const smsTemplate = await getTemplate(smsKey);
  if (smsTemplate.enabled) {
    const itemsListPlain = order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
    await sendSMS(order.phone, renderTemplate(smsTemplate.body, { ...vars, items_list: itemsListPlain }));
  }
}

export async function notifyOrderCreated(order: OrderLike) {
  await sendTemplated("order_created_email", "order_created_sms", order);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    await sendEmail(
      adminEmail,
      `New order — #${order.orderNumber}`,
      `<div style="font-family:sans-serif">
        <h2>New order from ${order.customerName}</h2>
        <p>${order.email} · ${order.phone}</p>
        <table style="width:100%;border-collapse:collapse">${itemsHtml(order.items)}</table>
        <p><strong>Total: ${formatPrice(order.total)}</strong></p>
      </div>`
    );
  }

  await createAdminNotification({
    type: "new_order",
    message: `New order #${order.orderNumber} from ${order.customerName} — ${formatPrice(order.total)}`,
    link: `/admin/orders/${order.id}`,
  });
}

export async function notifyOrderStatusChanged(order: OrderLike) {
  await sendTemplated("order_status_changed_email", "order_status_changed_sms", order);
}
