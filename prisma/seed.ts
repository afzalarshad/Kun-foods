import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kunfoods.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "kunfoods123";

  const { categoryCount, productCount, shippingZoneCount } = await seedDatabase(
    prisma,
    adminEmail,
    adminPassword
  );

  console.log(
    `Seeded ${categoryCount} categories, ${productCount} products, and ${shippingZoneCount} shipping zones.`
  );
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
