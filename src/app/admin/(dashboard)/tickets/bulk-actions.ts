"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

const idsSchema = z.array(z.string().min(1)).min(1);
const statuses = ["open", "pending", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;

export async function bulkSetTicketStatus(ticketIds: string[], status: string) {
  const session = await requirePermission("support.manage");
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(ticketIds);
  const parsedStatus = z.enum(statuses).parse(status);

  await prisma.supportTicket.updateMany({ where: { id: { in: ids } }, data: { status: parsedStatus } });

  await logAudit({
    actorEmail,
    action: "ticket.bulk_status_update",
    entityType: "SupportTicket",
    after: { count: ids.length, ids, status: parsedStatus },
  });

  revalidatePath("/admin/tickets");
}

export async function bulkAssignTickets(ticketIds: string[], assignedTo: string) {
  const session = await requirePermission("support.manage");
  const actorEmail = session.user.email ?? "unknown";
  const ids = idsSchema.parse(ticketIds);
  const cleanAssignee = assignedTo.trim() || null;

  await prisma.supportTicket.updateMany({ where: { id: { in: ids } }, data: { assignedTo: cleanAssignee } });

  await logAudit({
    actorEmail,
    action: "ticket.bulk_assign",
    entityType: "SupportTicket",
    after: { count: ids.length, ids, assignedTo: cleanAssignee },
  });

  revalidatePath("/admin/tickets");
}
