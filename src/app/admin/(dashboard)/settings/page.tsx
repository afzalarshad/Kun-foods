import Link from "next/link";
import { requirePermission } from "@/lib/require-admin";
import { getSettings, SETTING_KEYS, SLA_SETTING_KEYS } from "@/lib/settings";
import { updateSettings, updateSlaThresholds, updateFirstOrderDiscount } from "@/app/admin/(dashboard)/settings/actions";

const slaPriorities = ["urgent", "high", "normal", "low"] as const;
const slaMetrics = [
  { key: "ticketResponseHours" as const, label: "Ticket first response (hrs)" },
  { key: "ticketResolutionHours" as const, label: "Ticket resolution (hrs)" },
  { key: "orderFulfillmentHours" as const, label: "Order fulfillment (hrs)" },
];

function statusRow(label: string, configured: boolean, hint: string) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-cream-dark/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-soft">{hint}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          configured ? "bg-basil/20 text-basil-dark" : "bg-chili/20 text-chili-dark"
        }`}
      >
        {configured ? "Configured" : "Not set"}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const settings = await getSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-extrabold">Settings</h1>
      <p className="mt-1 text-ink-soft">Store details and notification toggles for the whole platform.</p>

      <form action={updateSettings} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Store</h2>
        <p className="mt-1 text-sm text-ink-soft">Shown on printable shipping labels and manifests.</p>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Store name</label>
            <input
              name="storeName"
              required
              defaultValue={settings[SETTING_KEYS.storeName]}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Address</label>
            <input
              name="storeAddress"
              required
              defaultValue={settings[SETTING_KEYS.storeAddress]}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone (optional)</label>
            <input
              name="storePhone"
              defaultValue={settings[SETTING_KEYS.storePhone]}
              className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
            />
          </div>
        </div>

        <h2 className="mt-8 font-heading font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Turn a channel off here to silence it platform-wide, even if the provider below is configured.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="emailEnabled" defaultChecked={settings[SETTING_KEYS.emailNotificationsEnabled] === "true"} />
            Send order confirmation / status emails
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="smsEnabled" defaultChecked={settings[SETTING_KEYS.smsNotificationsEnabled] === "true"} />
            Send order confirmation / status SMS
          </label>
        </div>
        <Link href="/admin/settings/templates" className="mt-3 inline-block text-sm font-semibold text-chili hover:underline">
          Edit email/SMS templates →
        </Link>

        <button
          type="submit"
          className="mt-6 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Save settings
        </button>
      </form>

      <form action={updateFirstOrderDiscount} className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">First-order discount popup</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Shown once to first-time visitors: &ldquo;Get X% off your first order&rdquo;, unlocked by
          entering an email. Set to 0 to turn the popup off entirely.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            name="percent"
            min={0}
            max={90}
            defaultValue={settings[SETTING_KEYS.firstOrderDiscountPercent]}
            className="w-24 rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
          />
          <span className="text-sm font-medium text-ink-soft">% off, code WELCOME</span>
        </div>
        <button
          type="submit"
          className="mt-6 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Save discount
        </button>
      </form>

      <form action={updateSlaThresholds} className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">SLA thresholds</h2>
        <p className="mt-1 text-sm text-ink-soft">
          How many hours staff have before a ticket or order counts as overdue. Drives the{" "}
          <Link href="/admin/operations" className="font-semibold text-chili hover:underline">
            Operations
          </Link>{" "}
          dashboard and the SLA badges on tickets and orders.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink-soft">
                <th className="py-2 pr-4 font-medium">Priority</th>
                {slaMetrics.map((m) => (
                  <th key={m.key} className="py-2 pr-4 font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slaPriorities.map((priority) => (
                <tr key={priority} className="border-t border-ink/10">
                  <td className="py-2 pr-4 font-medium capitalize">{priority}</td>
                  {slaMetrics.map((m) => (
                    <td key={m.key} className="py-2 pr-4">
                      <input
                        type="number"
                        min={1}
                        max={720}
                        name={`${m.key}.${priority}`}
                        defaultValue={settings[SLA_SETTING_KEYS[m.key][priority]]}
                        className="w-20 rounded-xl border border-ink/20 bg-white px-3 py-1.5 focus:border-chili focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="submit"
          className="mt-6 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Save SLA thresholds
        </button>
      </form>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Integration status</h2>
        <p className="mt-1 text-sm text-ink-soft">
          API keys and provider credentials live in environment variables, not here — set them in your hosting
          provider&apos;s dashboard, then redeploy. This is a read-only status check.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {statusRow("Email (Resend)", !!process.env.RESEND_API_KEY, "RESEND_API_KEY")}
          {statusRow(
            "SMS (Twilio)",
            !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
            "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
          )}
          {statusRow("WhatsApp order button", !!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "NEXT_PUBLIC_WHATSAPP_NUMBER")}
        </div>
      </div>
    </div>
  );
}
