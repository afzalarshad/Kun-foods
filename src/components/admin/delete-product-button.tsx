"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/admin/(dashboard)/actions";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(`Delete "${productName}"? This cannot be undone.`)) {
          startTransition(async () => {
            const result = await deleteProduct(productId);
            if (result?.message) alert(result.message);
          });
        }
      }}
      className="font-medium text-chili hover:underline disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
