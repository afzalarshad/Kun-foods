"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  /** May return { message } to explain a non-delete outcome (e.g. deactivated instead of removed). */
  action: () => Promise<{ message?: string } | void> | void;
  confirmMessage: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(async () => {
            const result = await action();
            if (result?.message) alert(result.message);
          });
        }
      }}
      className="font-medium text-chili hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting…" : label}
    </button>
  );
}
