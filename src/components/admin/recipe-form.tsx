"use client";

import { useState } from "react";
import type { Recipe } from "@prisma/client";

const EMOJI_OPTIONS = ["🍛", "🌶️", "🥘", "🍲", "🫓", "🍢", "🍚", "🥗", "🍮", "🥤", "🧆", "✨"];

export function RecipeForm({
  action,
  recipe,
}: {
  action: (formData: FormData) => void;
  recipe?: Recipe;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState(recipe?.image ?? EMOJI_OPTIONS[0]);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Title</label>
        <input
          name="title"
          required
          placeholder="e.g. 15-Minute Kashmiri Kahwa"
          defaultValue={recipe?.title ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Excerpt</label>
        <textarea
          name="excerpt"
          required
          rows={2}
          placeholder="A short teaser shown on the recipes listing page."
          defaultValue={recipe?.excerpt ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Recipe</label>
        <textarea
          name="body"
          required
          rows={10}
          placeholder="Ingredients, steps, tips — plain text, shown with line breaks preserved."
          defaultValue={recipe?.body ?? ""}
          className="w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 font-mono text-sm focus:border-chili focus:outline-none"
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
        <input type="checkbox" name="published" defaultChecked={recipe?.published ?? false} />
        Published (visible on the storefront)
      </label>

      <button
        type="submit"
        className="mt-2 w-fit rounded-full bg-chili px-7 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        {recipe ? "Save changes" : "Add recipe"}
      </button>
    </form>
  );
}
