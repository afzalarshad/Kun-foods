import { WebhookForm } from "@/components/admin/webhook-form";
import { createWebhook } from "@/app/admin/(dashboard)/webhooks/actions";

export default function NewWebhookPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add webhook</h1>
      <p className="mt-1 text-ink-soft">
        A secret is generated automatically — you&apos;ll see it on the next screen to configure your receiver.
      </p>
      <div className="mt-8">
        <WebhookForm action={createWebhook} />
      </div>
    </div>
  );
}
