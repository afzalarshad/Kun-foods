import { requireRole } from "@/lib/require-admin";
import { ProductImportForm } from "@/components/admin/product-import-form";

export default async function ImportExportPage() {
  await requireRole(["admin"]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl font-extrabold">Import &amp; export</h1>
      <p className="mt-1 text-ink-soft">Bulk move data in and out of Kun Foods as CSV.</p>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Export</h2>
        <p className="mt-1 text-sm text-ink-soft">Download a spreadsheet-ready CSV of current data.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/admin/export/products"
            className="rounded-full border-2 border-ink px-5 py-2.5 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
          >
            ⬇ Products
          </a>
          <a
            href="/api/admin/export/orders"
            className="rounded-full border-2 border-ink px-5 py-2.5 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
          >
            ⬇ Orders
          </a>
          <a
            href="/api/admin/export/customers"
            className="rounded-full border-2 border-ink px-5 py-2.5 text-sm font-heading font-semibold hover:bg-ink hover:text-cream"
          >
            ⬇ Customers
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-heading font-bold">Import products</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Upload a CSV with columns: <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">name</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">category</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">price</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">stock</code> required — plus optional{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">sku</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">barcode</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">compareAtPrice</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">costPrice</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">reorderLevel</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">supplier</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">weightLabel</code>,{" "}
          <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">featured</code>. Category must match an
          existing category name exactly. A row with a matching <code className="rounded bg-cream-dark px-1.5 py-0.5 text-xs">sku</code>{" "}
          updates that product; otherwise a new one is created. The products export above is a ready-made template.
        </p>
        <div className="mt-4">
          <ProductImportForm />
        </div>
      </div>
    </div>
  );
}
