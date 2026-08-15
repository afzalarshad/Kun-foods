"use client";

import { useState, useTransition } from "react";
import { renderTemplate, TEMPLATE_VARIABLES, type TemplateKey } from "@/lib/templates";
import { updateTemplate, resetTemplate } from "@/app/admin/(dashboard)/settings/templates-actions";

const SAMPLE_VARS = {
  customer_name: "Ayesha",
  order_number: "KF2608-1234",
  total: "Rs 1,450",
  status: "Shipped",
  items_list: "2x Kaju Katli, 1x Kashmiri Kahwa Tea",
};

export function TemplateEditor({
  templateKey,
  label,
  channel,
  initialSubject,
  initialBody,
  initialEnabled,
  isCustomized,
}: {
  templateKey: TemplateKey;
  label: string;
  channel: "email" | "sms";
  initialSubject: string;
  initialBody: string;
  initialEnabled: boolean;
  isCustomized: boolean;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [isResetting, startReset] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => updateTemplate(formData));
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold">{label}</h3>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${channel === "email" ? "bg-plum/20 text-plum" : "bg-saffron/20 text-saffron-dark"}`}>
            {channel.toUpperCase()}
          </span>
        </div>
        {isCustomized && (
          <button
            onClick={() => startReset(() => resetTemplate(templateKey))}
            disabled={isResetting}
            className="text-xs font-semibold text-ink-soft hover:text-chili"
          >
            {isResetting ? "…" : "Reset to default"}
          </button>
        )}
      </div>

      <form action={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="key" value={templateKey} />
        {channel === "email" && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Subject</label>
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm focus:border-chili focus:outline-none"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Body</label>
          <textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={channel === "email" ? 5 : 3}
            className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 font-mono text-xs focus:border-chili focus:outline-none"
          />
        </div>
        <p className="text-xs text-ink-soft">
          Variables: {TEMPLATE_VARIABLES.map((v) => (
            <code key={v} className="mr-1 rounded bg-cream-dark px-1 py-0.5">
              {v}
            </code>
          ))}
        </p>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Enabled
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-chili px-5 py-2 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <div className="mt-4 rounded-2xl bg-cream-dark/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Preview</p>
        {channel === "email" && subject && (
          <p className="mt-2 text-sm font-semibold">{renderTemplate(subject, SAMPLE_VARS)}</p>
        )}
        {channel === "email" ? (
          <div
            className="mt-2 text-sm text-ink-soft [&_*]:max-w-full"
            dangerouslySetInnerHTML={{ __html: renderTemplate(body, SAMPLE_VARS) }}
          />
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{renderTemplate(body, SAMPLE_VARS)}</p>
        )}
      </div>
    </div>
  );
}
