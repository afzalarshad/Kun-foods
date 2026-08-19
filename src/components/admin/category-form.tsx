"use client";

import { useState } from "react";
import type { Category } from "@prisma/client";

const EMOJI_OPTIONS = [
  "🌶️", "🥭", "🌾", "🥨", "🍮", "🥤", "🍚", "🍯", "🧂", "🫙", "🍛", "✨",
];

export function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => void;
  category?: Category;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState(category?.image ?? EMOJI_OPTIONS[0]);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Spices & Masalas"
          defaultValue={category?.name ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description (optional)</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Icon</label>
        <input type="hidden" name="image" value={selectedEmoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl ${
                selectedEmoji === emoji ? "border-chili bg-chili/10" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={category?.active ?? true} />
        Active (shown in storefront navigation and collections)
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {category ? "Save changes" : "Add category"}
      </button>
    </form>
  );
}
