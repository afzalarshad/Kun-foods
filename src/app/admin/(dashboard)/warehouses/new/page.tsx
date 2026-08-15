import { WarehouseForm } from "@/components/admin/warehouse-form";
import { createWarehouse } from "@/app/admin/(dashboard)/warehouses/actions";

export default function NewWarehousePage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Add warehouse</h1>
      <p className="mt-1 text-ink-soft">A new physical location that can hold and fulfill stock.</p>
      <div className="mt-8">
        <WarehouseForm action={createWarehouse} />
      </div>
    </div>
  );
}
