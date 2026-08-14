import { prisma } from "@/lib/prisma";

export async function logAudit(entry: {
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: entry.actorEmail,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: entry.before !== undefined ? JSON.stringify(entry.before) : undefined,
        after: entry.after !== undefined ? JSON.stringify(entry.after) : undefined,
      },
    });
  } catch (err) {
    // Never let audit logging break the actual operation it's recording.
    console.error("[audit] Failed to write audit log:", err);
  }
}
