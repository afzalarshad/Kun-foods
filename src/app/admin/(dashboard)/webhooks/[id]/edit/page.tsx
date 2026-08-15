import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WebhookForm } from "@/components/admin/webhook-form";
import { RegenerateSecretButton } from "@/components/admin/regenerate-secret-button";
import { updateWebhook, regenerateWebhookSecret } from "@/app/admin/(dashboard)/webhooks/actions";

export default async function EditWebhookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) notFound();

  const updateWithId = updateWebhook.bind(null, webhook.id);
  const regenerateWithId = regenerateWebhookSecret.bind(null, webhook.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit webhook</h1>
      <p className="mt-1 text-ink-soft">{webhook.name}</p>

      <div className="mt-6 max-w-lg rounded-3xl bg-cream-dark/60 p-5">
        <p className="text-sm font-medium">Signing secret</p>
        <p className="mt-1 break-all font-mono text-xs text-ink-soft">{webhook.secret}</p>
        <p className="mt-2 text-xs text-ink-soft">
          Every delivery is sent with an <code>X-Kun-Signature: sha256=…</code> header — an HMAC-SHA256 of the raw
          request body using this secret. Verify it on your receiver to confirm the request really came from Kun
          Foods.
        </p>
        <div className="mt-3">
          <RegenerateSecretButton action={regenerateWithId} />
        </div>
      </div>

      <div className="mt-8">
        <WebhookForm action={updateWithId} webhook={webhook} />
      </div>
    </div>
  );
}
