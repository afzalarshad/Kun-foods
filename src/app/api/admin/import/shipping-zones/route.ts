import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";
import { PAKISTAN_PROVINCES, isKnownPakistanCity, type PakistanProvince } from "@/lib/pakistan-locations";

type RowError = { row: number; message: string };

function toRupeeCents(value: string): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

const provinceSet = new Set<string>(PAKISTAN_PROVINCES);

export async function POST(request: Request) {
  const session = await requirePermission("shipping.manage");
  const actorEmail = session.user.email ?? "unknown";

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    scope: col("scope"),
    city: col("city"),
    province: col("province"),
    rate: col("rate"),
    freeAbove: col("freeabove"),
    excluded: col("excluded"),
    active: col("active"),
  };

  if (idx.scope === -1 || idx.rate === -1) {
    return NextResponse.json({ error: "CSV must include at least: scope, rate columns" }, { status: 400 });
  }

  const errors: RowError[] = [];
  let created = 0;
  let updated = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;
    const get = (i: number) => (i >= 0 ? (row[i] ?? "").trim() : "");
    const boolFrom = (raw: string) => ["yes", "true", "1"].includes(raw.toLowerCase());

    const scope = get(idx.scope).toLowerCase();
    if (scope !== "city" && scope !== "province") {
      errors.push({ row: rowNum, message: `scope must be "city" or "province", got "${scope}"` });
      continue;
    }

    const rate = toRupeeCents(get(idx.rate));
    if (rate === null) {
      errors.push({ row: rowNum, message: `Invalid rate "${get(idx.rate)}"` });
      continue;
    }
    const freeAboveRaw = get(idx.freeAbove);
    const freeAbove = freeAboveRaw ? toRupeeCents(freeAboveRaw) : null;
    const excluded = idx.excluded >= 0 ? boolFrom(get(idx.excluded)) : false;
    const active = idx.active >= 0 ? boolFrom(get(idx.active)) : true;

    let city: string | null = null;
    let province: PakistanProvince | null = null;

    if (scope === "city") {
      city = get(idx.city);
      if (!city) {
        errors.push({ row: rowNum, message: "Missing city" });
        continue;
      }
      if (!isKnownPakistanCity(city)) {
        errors.push({ row: rowNum, message: `Unknown city "${city}"` });
        continue;
      }
    } else {
      const provinceRaw = get(idx.province);
      if (!provinceSet.has(provinceRaw)) {
        errors.push({ row: rowNum, message: `Unknown province "${provinceRaw}"` });
        continue;
      }
      province = provinceRaw as PakistanProvince;
    }

    try {
      const existing = await prisma.shippingZone.findFirst({
        where: { scope, ...(scope === "city" ? { city } : { province }) },
      });

      if (existing) {
        await prisma.shippingZone.update({
          where: { id: existing.id },
          data: { rate, freeAbove, excluded, active },
        });
        updated++;
      } else {
        await prisma.shippingZone.create({
          data: { scope, city, province, rate, freeAbove, excluded, active },
        });
        created++;
      }
    } catch {
      errors.push({ row: rowNum, message: "Failed to save row" });
    }
  }

  await logAudit({
    actorEmail,
    action: "shipping_zone.import",
    entityType: "ShippingZone",
    after: { created, updated, errorCount: errors.length },
  });

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");

  return NextResponse.json({ created, updated, errors });
}
