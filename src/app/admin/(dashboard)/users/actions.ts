"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

const roleEnum = z.enum(Object.keys(ROLE_PERMISSIONS) as [string, ...string[]]);

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: roleEnum,
});

export async function createUser(formData: FormData) {
  const session = await requirePermission("users.manage");
  const parsed = createUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const created = await prisma.adminUser.create({
    data: { name: parsed.name, email: parsed.email, passwordHash, role: parsed.role },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "user.create",
    entityType: "AdminUser",
    entityId: created.id,
    after: { name: created.name, email: created.email, role: created.role },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

const updateUserSchema = z.object({
  name: z.string().min(2).max(100),
  role: roleEnum,
  active: z.coerce.boolean().optional(),
  password: z.string().min(6).max(100).optional().or(z.literal("")),
});

export async function updateUser(userId: string, formData: FormData) {
  const session = await requirePermission("users.manage");
  const parsed = updateUserSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active") === "on",
    password: formData.get("password") || undefined,
  });

  const before = await prisma.adminUser.findUniqueOrThrow({ where: { id: userId } });

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      name: parsed.name,
      role: parsed.role,
      active: parsed.active ?? true,
      ...(parsed.password ? { passwordHash: await bcrypt.hash(parsed.password, 10) } : {}),
    },
  });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "user.update",
    entityType: "AdminUser",
    entityId: userId,
    before: { name: before.name, role: before.role, active: before.active },
    after: { name: updated.name, role: updated.role, active: updated.active },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(userId: string) {
  const session = await requirePermission("users.manage");

  if (session.user.email && (await prisma.adminUser.findUnique({ where: { id: userId } }))?.email === session.user.email) {
    throw new Error("You can't delete your own account");
  }

  const before = await prisma.adminUser.findUniqueOrThrow({ where: { id: userId } });
  await prisma.adminUser.delete({ where: { id: userId } });

  await logAudit({
    actorEmail: session.user.email ?? "unknown",
    action: "user.delete",
    entityType: "AdminUser",
    entityId: userId,
    before: { name: before.name, email: before.email, role: before.role },
  });

  revalidatePath("/admin/users");
}
