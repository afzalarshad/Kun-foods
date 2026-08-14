import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Spices & Masalas",
    slug: "spices-masalas",
    description: "Freshly ground, sun-dried spice blends made in small batches.",
    image: "🌶️",
  },
  {
    name: "Pickles & Chutneys",
    slug: "pickles-chutneys",
    description: "Tangy, hand-mixed achaar and chutneys, slow-cured in oil.",
    image: "🥭",
  },
  {
    name: "Rice & Grains",
    slug: "rice-grains",
    description: "Aged basmati rice and wholesome grains sourced from trusted farms.",
    image: "🌾",
  },
  {
    name: "Snacks & Namkeen",
    slug: "snacks-namkeen",
    description: "Crunchy, crave-worthy snacks made fresh every week.",
    image: "🥨",
  },
  {
    name: "Sweets & Desserts",
    slug: "sweets-desserts",
    description: "Traditional mithai and desserts made with pure ghee.",
    image: "🍮",
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Refreshing drinks, syrups and teas for every season.",
    image: "🥤",
  },
];

const products: Array<{
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  badge?: string;
  weightLabel: string;
  featured?: boolean;
  category: string;
}> = [
  {
    name: "Kun Signature Garam Masala",
    slug: "signature-garam-masala",
    description:
      "Our founder's original blend of 12 hand-roasted whole spices, stone-ground fresh every week. No fillers, no anti-caking agents — just bold, aromatic flavor.",
    price: 45000,
    compareAtPrice: 55000,
    images: ["🌶️", "🫙"],
    badge: "Bestseller",
    weightLabel: "200g",
    featured: true,
    category: "spices-masalas",
  },
  {
    name: "Red Chili Powder (Extra Hot)",
    slug: "red-chili-powder-extra-hot",
    description:
      "Sun-dried red chilies from Kunri, ground to a vivid crimson powder. Adds color and fire to every curry.",
    price: 32000,
    images: ["🌶️"],
    weightLabel: "500g",
    featured: true,
    category: "spices-masalas",
  },
  {
    name: "Golden Turmeric Powder",
    slug: "golden-turmeric-powder",
    description:
      "High-curcumin turmeric root, dried and milled for deep golden color and earthy flavor.",
    price: 28000,
    images: ["✨"],
    weightLabel: "400g",
    category: "spices-masalas",
  },
  {
    name: "Biryani Masala Special",
    slug: "biryani-masala-special",
    description:
      "A festive blend crafted for the perfect pot of biryani — layered, fragrant, and unforgettable.",
    price: 42000,
    images: ["🍛"],
    badge: "New",
    weightLabel: "150g",
    featured: true,
    category: "spices-masalas",
  },
  {
    name: "Mango Achaar (Classic)",
    slug: "mango-achaar-classic",
    description:
      "Raw green mangoes hand-cut and cured in mustard oil with a secret family spice mix. Sun-ripened for 21 days.",
    price: 38000,
    images: ["🥭"],
    badge: "Bestseller",
    weightLabel: "500g",
    featured: true,
    category: "pickles-chutneys",
  },
  {
    name: "Mixed Vegetable Achaar",
    slug: "mixed-vegetable-achaar",
    description:
      "Carrots, turnips, and green chilies pickled together in a fiery, tangy oil blend.",
    price: 36000,
    images: ["🥕"],
    weightLabel: "500g",
    category: "pickles-chutneys",
  },
  {
    name: "Tamarind Imli Chutney",
    slug: "tamarind-imli-chutney",
    description:
      "Sweet, sour and smoky — the perfect dip for samosas, chaat, and pakoras.",
    price: 25000,
    images: ["🍯"],
    weightLabel: "300g",
    category: "pickles-chutneys",
  },
  {
    name: "Premium Basmati Rice",
    slug: "premium-basmati-rice",
    description:
      "Aged for two years for maximum aroma and elongation. The gold standard for biryani and pulao.",
    price: 65000,
    compareAtPrice: 75000,
    images: ["🍚"],
    badge: "Bestseller",
    weightLabel: "5kg",
    featured: true,
    category: "rice-grains",
  },
  {
    name: "Sella Basmati Rice",
    slug: "sella-basmati-rice",
    description: "Parboiled basmati that holds its shape beautifully — a kitchen staple.",
    price: 58000,
    images: ["🍚"],
    weightLabel: "5kg",
    category: "rice-grains",
  },
  {
    name: "Roasted Chana Namkeen",
    slug: "roasted-chana-namkeen",
    description: "Crunchy roasted gram, lightly salted and spiced. A guilt-free snack.",
    price: 18000,
    images: ["🥨"],
    weightLabel: "250g",
    category: "snacks-namkeen",
  },
  {
    name: "Spicy Mixture Namkeen",
    slug: "spicy-mixture-namkeen",
    description: "A crunchy mix of lentils, peanuts, and sev tossed in aromatic spices.",
    price: 22000,
    images: ["🥜"],
    badge: "New",
    weightLabel: "300g",
    featured: true,
    category: "snacks-namkeen",
  },
  {
    name: "Masala Peanuts",
    slug: "masala-peanuts",
    description: "Crispy fried peanuts coated in a tangy chaat masala crust.",
    price: 20000,
    images: ["🥜"],
    weightLabel: "250g",
    category: "snacks-namkeen",
  },
  {
    name: "Gulab Jamun (Ready to Eat)",
    slug: "gulab-jamun-ready-to-eat",
    description: "Soft, syrup-soaked milk dumplings — a classic dessert made with pure ghee.",
    price: 35000,
    images: ["🍮"],
    weightLabel: "1kg box",
    featured: true,
    category: "sweets-desserts",
  },
  {
    name: "Kaju Katli",
    slug: "kaju-katli",
    description: "Silky cashew fudge dusted with edible silver leaf — a festival favorite.",
    price: 55000,
    compareAtPrice: 62000,
    images: ["💎"],
    badge: "Sale",
    weightLabel: "500g box",
    category: "sweets-desserts",
  },
  {
    name: "Rose Sharbat Syrup",
    slug: "rose-sharbat-syrup",
    description: "A fragrant rose concentrate — just add water and ice for an instant summer cooler.",
    price: 24000,
    images: ["🌹"],
    weightLabel: "750ml",
    category: "beverages",
  },
  {
    name: "Kashmiri Kahwa Tea",
    slug: "kashmiri-kahwa-tea",
    description: "Green tea leaves blended with saffron, cinnamon, and cardamom.",
    price: 30000,
    images: ["🍵"],
    badge: "New",
    weightLabel: "100g",
    featured: true,
    category: "beverages",
  },
];

async function main() {
  console.log("Seeding database...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  for (const p of products) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: p.category },
    });
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: JSON.stringify(p.images),
        badge: p.badge,
        weightLabel: p.weightLabel,
        featured: p.featured ?? false,
        categoryId: category.id,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: JSON.stringify(p.images),
        badge: p.badge,
        weightLabel: p.weightLabel,
        featured: p.featured ?? false,
        categoryId: category.id,
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kunfoods.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "kunfoods123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Kun Foods Admin",
    },
  });

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
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
