"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const idsSchema = z.array(z.string().min(1)).min(1);

export async function bulkAddCustomerTag(customerIds: string[], tag: string) {
  const session = await requirePermission("customers.edit");
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(customerIds);
  const cleanTag = z.string().min(1).max(40).parse(tag.trim());

  await prisma.$transaction(
    ids.map((customerId) =>
      prisma.customerTag.upsert({
        where: { customerId_tag: { customerId, tag: cleanTag } },
        update: {},
        create: { customerId, tag: cleanTag },
      })
    )
  );

  await logAudit({
    actorEmail,
    action: "customer.bulk_tag",
    entityType: "Customer",
    after: { count: ids.length, ids, tag: cleanTag },
  });

  revalidatePath("/admin/customers");
}
