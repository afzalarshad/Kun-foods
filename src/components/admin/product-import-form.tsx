"use client";

import { useRef, useState } from "react";

type ImportResult = { created: number; updated: number; errors: { row: number; message: string }[] };

export function ProductImportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/admin/import/products", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setResult(data);
      formRef.current?.reset();
    } catch {
      setError("Import failed — check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="rounded-2xl border border-ink/20 bg-white px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-cream-dark file:px-3 file:py-1.5 file:text-sm file:font-semibold"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-chili px-5 py-2.5 text-sm font-heading font-semibold text-white hover:bg-chili-dark disabled:opacity-60"
        >
          {isSubmitting ? "Importing…" : "Import products"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm font-medium text-chili">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl bg-cream-dark/60 p-4">
          <p className="text-sm font-semibold">
            {result.created} created · {result.updated} updated
            {result.errors.length > 0 && ` · ${result.errors.length} error(s)`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm text-chili-dark">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
