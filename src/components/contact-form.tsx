"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl bg-basil/10 p-6 text-basil-dark">
        <p className="font-heading font-semibold">Thanks for reaching out! 🎉</p>
        <p className="mt-1 text-sm">We&apos;ll get back to you within 1 business day.</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        required
        placeholder="Your name"
        className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
      />
      <input
        type="email"
        required
        placeholder="Your email"
        className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
      />
      <textarea
        required
        rows={4}
        placeholder="How can we help?"
        className="rounded-2xl border border-ink/20 bg-white px-4 py-3 focus:border-chili focus:outline-none"
      />
      <button
        type="submit"
        className="w-fit rounded-full bg-chili px-6 py-3 font-heading font-semibold text-white hover:bg-chili-dark"
      >
        Send message
      </button>
    </form>
  );
}
