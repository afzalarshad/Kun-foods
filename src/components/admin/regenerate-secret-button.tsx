"use client";

import { useTransition } from "react";

export function RegenerateSecretButton({ action }: { action: () => Promise<void> | void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Regenerate the signing secret? Any receiver still verifying against the old secret will start rejecting deliveries until you update it.")) {
          startTransition(() => action());
        }
      }}
      className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold hover:bg-cream-dark disabled:opacity-50"
    >
      {isPending ? "Regenerating…" : "Regenerate secret"}
    </button>
  );
}
