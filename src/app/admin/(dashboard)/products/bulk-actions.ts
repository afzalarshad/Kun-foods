"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const idsSchema = z.array(z.string().min(1)).min(1);

export async function bulkSetProductActive(productIds: string[], active: boolean) {
  const session = await requireAdmin();
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(productIds);

  await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active } });

  await logAudit({
    actorEmail,
    action: active ? "product.bulk_activate" : "product.bulk_deactivate",
    entityType: "Product",
    after: { count: ids.length, ids },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}
