import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { slugify } from "../lib/utils/slug";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@store.dev").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const adminPasswordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: "Store Administrator",
    },
    create: {
      email: adminEmail,
      name: "Store Administrator",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Seeded Admin User: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Customer User for Testing
  const customerEmail = "customer@example.com";
  const customerPassword = "CustomerPassword123!";
  const customerPasswordHash = await hashPassword(customerPassword);

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      name: "Jane Customer",
    },
    create: {
      email: customerEmail,
      name: "Jane Customer",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  console.log(`✅ Seeded Customer User: ${customer.email} (Role: ${customer.role})`);

  // 3. Seed Sample Products (At least 12 active, across 4 categories, plus 2 inactive products)
  const sampleProducts = [
    {
      name: "Acoustic Pro Wireless Headphones",
      description: "High-fidelity active noise-canceling over-ear wireless headphones with 40-hour battery life and memory foam cushions.",
      price: 249.99,
      category: "Audio",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      stock: 45,
      isActive: true,
    },
    {
      name: "Studio Reference In-Ear Monitors",
      description: "Triple-driver hybrid in-ear monitors tailored for audiophiles and live performance monitoring with detachable silver cable.",
      price: 129.50,
      category: "Audio",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
      stock: 60,
      isActive: true,
    },
    {
      name: "Retro Hi-Fi Bluetooth Speaker",
      description: "Vintage aesthetics paired with modern DSP acoustics, delivering warm bass and crystal-clear vocals.",
      price: 189.00,
      category: "Audio",
      imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
      stock: 25,
      isActive: true,
    },
    {
      name: "Ergonomic Mechanical Keyboard",
      description: "Split layout mechanical keyboard with hot-swappable tactile switches, programmable rotary encoders, and RGB underglow.",
      price: 179.99,
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      stock: 80,
      isActive: true,
    },
    {
      name: "Precision Wireless Gaming Mouse",
      description: "Ultra-lightweight 58-gram gaming mouse with 26K DPI optical sensor, optical switches, and zero-latency wireless connection.",
      price: 89.99,
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
      stock: 110,
      isActive: true,
    },
    {
      name: "Ultra-Wide 34-Inch Curved Monitor",
      description: "WQHD 3440x1440 curved IPS panel with 144Hz refresh rate, 99% sRGB color accuracy, and 90W USB-C power delivery.",
      price: 599.00,
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      stock: 18,
      isActive: true,
    },
    {
      name: "Minimalist Solid Oak Desk Shelf",
      description: "Handcrafted solid white oak dual-monitor riser with integrated aluminum trays and felt cable organizers.",
      price: 145.00,
      category: "Office",
      imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
      stock: 35,
      isActive: true,
    },
    {
      name: "Top-Grain Leather Desk Pad",
      description: "Generous 36x18 inch vegetable-tanned leather desk mat that develops an organic patina with daily use.",
      price: 75.00,
      category: "Office",
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      stock: 95,
      isActive: true,
    },
    {
      name: "Articulated Aluminum Monitor Arm",
      description: "Gas-spring monitor desk mount supporting up to 32-inch displays with integrated cable routing channels.",
      price: 69.50,
      category: "Office",
      imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80",
      stock: 50,
      isActive: true,
    },
    {
      name: "Water-Resistant Commuter Backpack",
      description: "Weatherproof 22-liter daypack crafted from recycled Cordura nylon, with dedicated padded 16-inch laptop compartment.",
      price: 119.00,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      stock: 40,
      isActive: true,
    },
    {
      name: "Anodized Aluminum MagSafe Stand",
      description: "Weighted bedside and desk stand with multi-angle pivot and anti-slip silicone base for seamless magnetic charging.",
      price: 39.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80",
      stock: 150,
      isActive: true,
    },
    {
      name: "Braided USB-C Fast-Charging Cable",
      description: "2-meter ultra-durable aramid fiber braided USB-C to USB-C cable rated for 240W Power Delivery and 40Gbps data.",
      price: 24.99,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1609743522653-52354461eb27?auto=format&fit=crop&w=800&q=80",
      stock: 220,
      isActive: true,
    },
    {
      name: "Discontinued Generation 1 Smartwatch",
      description: "Legacy smartwatch model retained for archive purposes. Not for public sale.",
      price: 149.00,
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      stock: 0,
      isActive: false, // Inactive product to verify exclusion from public listing
    },
    {
      name: "Archived Vintage Radio Receiver",
      description: "Historical radio unit in archive. Not available in public catalogue.",
      price: 99.00,
      category: "Audio",
      imageUrl: null,
      stock: 0,
      isActive: false, // Inactive product
    },
  ];

  for (const item of sampleProducts) {
    const slug = slugify(item.name);
    await prisma.product.upsert({
      where: { slug },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        stock: item.stock,
        isActive: item.isActive,
      },
      create: {
        name: item.name,
        slug,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        stock: item.stock,
        isActive: item.isActive,
      },
    });
  }

  console.log(`✅ Seeded ${sampleProducts.length} sample products across Audio, Electronics, Office, and Accessories.`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
