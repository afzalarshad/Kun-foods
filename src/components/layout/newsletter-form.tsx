"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="mt-4 text-sm text-saffron">Thanks for subscribing! 🎉</p>;
  }

  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        placeholder="Your email"
        className="w-full min-w-0 rounded-full border border-cream/30 bg-transparent px-4 py-2 text-sm placeholder:text-cream/50 focus:border-saffron focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-saffron px-4 py-2 font-heading text-sm font-semibold text-ink hover:bg-saffron-dark"
      >
        Join
      </button>
    </form>
  );
}
