import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { DEFAULT_TEMPLATES, type TemplateKey } from "@/lib/templates";
import { TemplateEditor } from "@/components/admin/template-editor";

export default async function NotificationTemplatesPage() {
  await requirePermission("settings.manage");

  const rows = await prisma.notificationTemplate.findMany();
  const rowByKey = new Map(rows.map((r) => [r.key, r]));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/settings" className="text-sm font-semibold text-ink-soft hover:text-chili">
        ← Back to settings
      </Link>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Notification templates</h1>
      <p className="mt-1 text-ink-soft">
        Customize what customers see in order emails and SMS. Changes apply immediately to new sends.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {(Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]).map((key) => {
          const fallback = DEFAULT_TEMPLATES[key];
          const row = rowByKey.get(key);
          return (
            <TemplateEditor
              key={key}
              templateKey={key}
              label={fallback.label}
              channel={fallback.channel}
              initialSubject={row?.subject ?? fallback.subject ?? ""}
              initialBody={row?.body ?? fallback.body}
              initialEnabled={row?.enabled ?? true}
              isCustomized={!!row}
            />
          );
        })}
      </div>
    </div>
  );
}
