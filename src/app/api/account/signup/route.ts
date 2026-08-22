import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { personNameSchema } from "@/lib/name";
import { pakistaniMobileSchema } from "@/lib/phone";

const signupSchema = z.object({
  name: personNameSchema,
  email: z.string().trim().toLowerCase().email(),
  phone: pakistaniMobileSchema,
  password: z.string().min(6).max(72),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details" },
      { status: 400 }
    );
  }

  const existing = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (existing?.passwordHash) {
    return NextResponse.json(
      { error: "An account already exists for this email — try signing in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  if (existing) {
    // Order-derived customer record with no account yet -- attach credentials to it rather
    // than creating a duplicate, so their existing order history is already linked.
    await prisma.customer.update({
      where: { id: existing.id },
      data: { passwordHash, authProvider: "credentials", name: parsed.data.name, phone: parsed.data.phone },
    });
  } else {
    await prisma.customer.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        authProvider: "credentials",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
