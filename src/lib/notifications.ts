import { Resend } from "resend";
import twilio from "twilio";
import { formatPrice } from "@/lib/format";

type OrderItemLike = { name: string; price: number; quantity: number };
type OrderLike = {
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
        `<tr><td style="padding:4px 0">${item.name} × ${item.quantity}</td><td style="padding:4px 0;text-align:right">${formatPrice(item.price * item.quantity)}</td></tr>`
    )
    .join("");
}

export async function notifyOrderCreated(order: OrderLike) {
  await sendEmail(
    order.email,
    `Order confirmed — #${order.orderNumber}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Thanks, ${order.customerName.split(" ")[0]}!</h2>
      <p>Your Kun Foods order <strong>#${order.orderNumber}</strong> has been placed.</p>
      <table style="width:100%;border-collapse:collapse">${itemsHtml(order.items)}</table>
      <p style="margin-top:12px"><strong>Total: ${formatPrice(order.total)}</strong></p>
    </div>`
  );

  await sendSMS(
    order.phone,
    `Kun Foods: Order #${order.orderNumber} confirmed. Total ${formatPrice(order.total)}. Thank you!`
  );

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
}

export async function notifyOrderStatusChanged(order: OrderLike) {
  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

  await sendEmail(
    order.email,
    `Order #${order.orderNumber} — ${statusLabel}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Your order is now: ${statusLabel}</h2>
      <p>Order <strong>#${order.orderNumber}</strong> for ${formatPrice(order.total)}.</p>
    </div>`
  );

  await sendSMS(
    order.phone,
    `Kun Foods: Order #${order.orderNumber} is now ${statusLabel}.`
  );
}
