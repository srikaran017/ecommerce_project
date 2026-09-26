import { PrismaClient, Role, ProductStatus, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed script for Maison De Élégance Clothing Platform...");

  // 1. Create Default Store
  const store = await prisma.store.upsert({
    where: { slug: "maison-elegance" },
    update: {},
    create: {
      name: "MAISON DE ÉLÉGANCE",
      slug: "maison-elegance",
      domain: "maison-elegance.local",
      activeTheme: "luxury-fashion",
    },
  });

  console.log(`✅ Store created: ${store.name} (${store.id})`);

  // 2. Create Users (Admin & Customer)
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@maison-elegance.com" },
    update: {},
    create: {
      email: "admin@maison-elegance.com",
      passwordHash: hashedPassword,
      name: "Victoria Sterling",
      phone: "+91 98765 00001",
      role: Role.STORE_ADMIN,
      storeId: store.id,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: hashedPassword,
      name: "Aarav Sharma",
      phone: "+91 98765 00002",
      role: Role.CUSTOMER,
      storeId: store.id,
      addresses: {
        create: {
          name: "Aarav Sharma",
          phone: "+91 98765 00002",
          street: "102, Skyline Residency, Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400050",
          country: "India",
          isDefault: true,
        },
      },
    },
  });

  console.log(`✅ Users created: Admin (${adminUser.email}), Customer (${customerUser.email})`);

  // 3. Create Categories & Subcategories
  const categoriesData = [
    {
      name: "Women's Couture",
      slug: "womens-couture",
      description: "Hand-tailored silk gowns, sarees, and modern luxury silhouettes.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
      subcategories: ["Evening Gowns", "Designer Sarees", "Silk Shirts", "Tailored Blazers"],
    },
    {
      name: "Men's Apparel",
      slug: "mens-apparel",
      description: "Bespoke linen suits, structured shirts, and minimal everyday staples.",
      image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
      subcategories: ["Linen Shirts", "Tailored Suits", "Organic T-Shirts", "Outerwear"],
    },
    {
      name: "Luxury Accessories",
      slug: "luxury-accessories",
      description: "Pure mulberry silk scarves, handcrafted leather belts, and cashmere shawls.",
      image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop",
      subcategories: ["Silk Scarves", "Cashmere Shawls", "Leather Goods"],
    },
  ];

  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: {
        storeId_slug: { storeId: store.id, slug: catData.slug },
      },
      update: {},
      create: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        image: catData.image,
        storeId: store.id,
      },
    });

    for (const subName of catData.subcategories) {
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const existingSub = await prisma.subcategory.findFirst({
        where: { categoryId: category.id, slug: subSlug },
      });
      if (!existingSub) {
        await prisma.subcategory.create({
          data: {
            name: subName,
            slug: subSlug,
            categoryId: category.id,
          },
        });
      }
    }
  }

  console.log("✅ Categories and Subcategories seeded.");

  // 4. Fetch created categories for Product Association
  const womensCat = await prisma.category.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: "womens-couture" } },
  });
  const mensCat = await prisma.category.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: "mens-apparel" } },
  });

  // 5. Seed Realistic Clothing Products
  const sampleProducts = [
    {
      name: "Mulberry Silk Draped Evening Gown",
      slug: "mulberry-silk-draped-evening-gown",
      description: "Crafted from 100% pure 22-momme mulberry silk, this floor-length draped evening gown features an asymmetrical shoulder line, hand-finished seams, and a subtle waist tie.",
      shortDescription: "Pure 22-momme mulberry silk evening gown with handcrafted asymmetrical draping.",
      price: 18999,
      compareAtPrice: 22999,
      sku: "MS-EGV-001",
      brand: "Maison Haute",
      categoryId: womensCat!.id,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      stock: 45,
      fabricInfo: "100% Organic Mulberry Silk (22 Momme)",
      careInstructions: "Dry clean only. Store in breathable garment cover.",
      fitInfo: "Fitted bust with relaxed flowing waist and skirt.",
      shippingInfo: "Complimentary signature gift box with velvet hanger.",
      images: [
        { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", isPrimary: true, altText: "Front view of Mulberry Silk Evening Gown" },
        { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", isPrimary: false, altText: "Side view showing silk drape" },
      ],
      variants: [
        { size: "S", colorName: "Emerald Green", colorHex: "#046307", price: 18999, stock: 10, sku: "MS-EGV-001-S-EM" },
        { size: "M", colorName: "Emerald Green", colorHex: "#046307", price: 18999, stock: 15, sku: "MS-EGV-001-M-EM" },
        { size: "L", colorName: "Emerald Green", colorHex: "#046307", price: 18999, stock: 8, sku: "MS-EGV-001-L-EM" },
        { size: "M", colorName: "Champagne Gold", colorHex: "#d4af37", price: 19999, stock: 12, sku: "MS-EGV-001-M-CG" },
      ],
    },
    {
      name: "Structured Belgian Linen Shirt",
      slug: "structured-belgian-linen-shirt",
      description: "Made from 100% natural pre-washed Belgian flax linen. Designed with a mother-of-pearl button closure, relaxed tailored collar, and reinforced single-needle stitchwork.",
      shortDescription: "100% pre-washed Belgian flax linen shirt with genuine mother-of-pearl buttons.",
      price: 4999,
      compareAtPrice: 6499,
      sku: "BL-SHR-002",
      brand: "Maison Atelier",
      categoryId: mensCat!.id,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      stock: 80,
      fabricInfo: "100% Pre-Washed Belgian Flax Linen",
      careInstructions: "Machine wash cold delicate cycle. Hang dry in shade.",
      fitInfo: "Regular modern fit. True to size.",
      shippingInfo: "Dispatched within 24 hours.",
      images: [
        { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", isPrimary: true, altText: "Front view of Belgian Linen Shirt" },
        { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1000&auto=format&fit=crop", isPrimary: false, altText: "Detail view of linen collar" },
      ],
      variants: [
        { size: "S", colorName: "Crisp Ivory", colorHex: "#ffffff", price: 4999, stock: 20, sku: "BL-SHR-002-S-IV" },
        { size: "M", colorName: "Crisp Ivory", colorHex: "#ffffff", price: 4999, stock: 25, sku: "BL-SHR-002-M-IV" },
        { size: "L", colorName: "Crisp Ivory", colorHex: "#ffffff", price: 4999, stock: 20, sku: "BL-SHR-002-L-IV" },
        { size: "XL", colorName: "French Navy", colorHex: "#000080", price: 4999, stock: 15, sku: "BL-SHR-002-XL-NV" },
      ],
    },
    {
      name: "Handcrafted Banarasi Raw Silk Saree",
      slug: "handcrafted-banarasi-raw-silk-saree",
      description: "An exquisite heritage piece woven with pure zari threads by master artisans in Varanasi. Features intricate floral kadwa weave and a contrast unstitched blouse piece.",
      shortDescription: "Pure Banarasi silk saree hand-loomed with gold zari floral motifs.",
      price: 28999,
      compareAtPrice: 34999,
      sku: "BN-SAR-003",
      brand: "Maison Heritage",
      categoryId: womensCat!.id,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      stock: 12,
      fabricInfo: "100% Handloom Raw Silk with Real Silver/Gold Zari",
      careInstructions: "Strictly dry clean only. Wrap in muslin cloth.",
      fitInfo: "Free size saree (6.5 meters with blouse piece).",
      shippingInfo: "Includes Silk Mark Authenticity Certificate.",
      images: [
        { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop", isPrimary: true, altText: "Heritage Banarasi Silk Saree" },
      ],
      variants: [
        { size: "Free Size", colorName: "Royal Magenta & Gold", colorHex: "#800080", price: 28999, stock: 12, sku: "BN-SAR-003-FS-MG" },
      ],
    },
    {
      name: "Double-Breasted Italian Wool Blazer",
      slug: "double-breasted-italian-wool-blazer",
      description: "Tailored from 100% Super 130s Italian wool yarn. Built with canvas chest piece, Horn buttons, peak lapels, and interior pocket slots.",
      shortDescription: "Super 130s Italian wool double-breasted blazer with horn button detailing.",
      price: 24999,
      compareAtPrice: 29999,
      sku: "DB-BLZ-004",
      brand: "Maison Bespoke",
      categoryId: mensCat!.id,
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      stock: 25,
      fabricInfo: "100% Super 130s Italian Merino Wool",
      careInstructions: "Specialist dry clean only.",
      fitInfo: "Structured shoulder pad, hourglass waist reduction.",
      shippingInfo: "Dispatched with wooden suit hanger & suit carrier.",
      images: [
        { url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop", isPrimary: true, altText: "Italian Wool Blazer" },
      ],
      variants: [
        { size: "38R", colorName: "Charcoal Slate", colorHex: "#36454F", price: 24999, stock: 5, sku: "DB-BLZ-004-38-CS" },
        { size: "40R", colorName: "Charcoal Slate", colorHex: "#36454F", price: 24999, stock: 10, sku: "DB-BLZ-004-40-CS" },
        { size: "42R", colorName: "Charcoal Slate", colorHex: "#36454F", price: 24999, stock: 10, sku: "DB-BLZ-004-42-CS" },
      ],
    },
  ];

  for (const prodData of sampleProducts) {
    const product = await prisma.product.upsert({
      where: {
        storeId_slug: { storeId: store.id, slug: prodData.slug },
      },
      update: {},
      create: {
        name: prodData.name,
        slug: prodData.slug,
        description: prodData.description,
        shortDescription: prodData.shortDescription,
        price: prodData.price,
        compareAtPrice: prodData.compareAtPrice,
        sku: prodData.sku,
        brand: prodData.brand,
        categoryId: prodData.categoryId,
        status: prodData.status,
        isFeatured: prodData.isFeatured,
        isNewArrival: prodData.isNewArrival,
        isBestSeller: prodData.isBestSeller,
        stock: prodData.stock,
        fabricInfo: prodData.fabricInfo,
        careInstructions: prodData.careInstructions,
        fitInfo: prodData.fitInfo,
        shippingInfo: prodData.shippingInfo,
        storeId: store.id,
        images: {
          create: prodData.images,
        },
      },
    });

    for (const vData of prodData.variants) {
      await prisma.productVariant.upsert({
        where: { sku: vData.sku },
        update: {},
        create: {
          productId: product.id,
          sku: vData.sku,
          price: vData.price,
          stock: vData.stock,
          size: vData.size,
          colorName: vData.colorName,
          colorHex: vData.colorHex,
        },
      });
    }
  }

  console.log("✅ Sample clothing products and variants seeded.");

  // 6. Seed Coupons
  await prisma.coupon.upsert({
    where: {
      storeId_code: { storeId: store.id, code: "LUXE10" },
    },
    update: {},
    create: {
      code: "LUXE10",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 3000,
      maxDiscountAmount: 2500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usageLimit: 500,
      perUserLimit: 1,
      storeId: store.id,
    },
  });

  await prisma.coupon.upsert({
    where: {
      storeId_code: { storeId: store.id, code: "WELCOME1000" },
    },
    update: {},
    create: {
      code: "WELCOME1000",
      discountType: DiscountType.FIXED,
      discountValue: 1000,
      minOrderAmount: 5000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      perUserLimit: 1,
      storeId: store.id,
    },
  });

  console.log("✅ Coupons seeded (LUXE10, WELCOME1000).");
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
