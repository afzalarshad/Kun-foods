import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WarehouseForm } from "@/components/admin/warehouse-form";
import { updateWarehouse } from "@/app/admin/(dashboard)/warehouses/actions";

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const warehouse = await prisma.warehouse.findUnique({ where: { id } });
  if (!warehouse) notFound();

  const updateWithId = updateWarehouse.bind(null, warehouse.id);

  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold">Edit warehouse</h1>
      <p className="mt-1 text-ink-soft">{warehouse.name}</p>
      <div className="mt-8">
        <WarehouseForm action={updateWithId} warehouse={warehouse} />
      </div>
    </div>
  );
}
