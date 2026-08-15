import { requirePermission } from "@/lib/require-admin";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { updateSettings } from "@/app/admin/(dashboard)/settings/actions";

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

        <button
          type="submit"
          className="mt-6 rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
        >
          Save settings
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
