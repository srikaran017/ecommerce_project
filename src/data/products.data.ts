export interface ProductVariantData {
  id: string;
  sku: string;
  barcode?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  reservedStock?: number;
  lowStockThreshold?: number;
  size: string;
  colorName: string;
  colorHex?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  name?: string;
  inStock?: boolean;
  priceObject?: {
    regular: number;
    sale: number | null;
    offer: number | null;
    effective: number;
    discountPercentage: number;
  };
  attributes?: Array<{
    attribute: string;
    attributeSlug: string;
    value: string;
    valueSlug: string;
  }>;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  sku?: string | null;
  brand: string;
  productType?: string | null;
  gender: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  tags: string[];
  categorySlug: string;
  categoryName: string;
  subcategorySlug?: string;
  collectionSlugs?: string[];
  occasionSlugs?: string[];
  fabric?: string;
  workType?: string;
  pattern?: string;
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  stock: number;
  lowStockThreshold?: number;
  sizeChartUrl?: string | null;
  fabricInfo?: string | null;
  careInstructions?: string | null;
  modelInfo?: string | null;
  fitInfo?: string | null;
  shippingInfo?: string | null;
  returnInfo?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: Array<{ url: string; altText?: string | null; isPrimary?: boolean; id?: string }>;
  variants: ProductVariantData[];
  reviewsCount?: number;
  averageRating?: number;
  // 3-Tier Price Object and Discovery Fields
  priceObject?: {
    regular: number;
    sale: number | null;
    offer: number | null;
    effective: number;
    discountPercentage: number;
  };
  hasVariants?: boolean;
  hasModifiers?: boolean;
  requiresConfiguration?: boolean;
  isWishlisted?: boolean;
  inStock?: boolean;
  stockQuantity?: number;
  thumbnail?: string;
  categoryData?: {
    id: string;
    name: string;
    slug: string;
    parent?: any;
  };
  dynamicAttributes?: Array<{
    attribute: string;
    attributeSlug: string;
    value: string;
    valueSlug: string;
  }>;
  modifierGroups?: Array<{
    id: string;
    name: string;
    isRequired: boolean;
    minSelection: number;
    maxSelection: number;
    options: Array<{
      id: string;
      name: string;
      priceDelta: number;
      isDefault: boolean;
    }>;
  }>;
}

export function ensureProductData(p: ProductData): ProductData {
  const effective = p.priceObject?.effective ?? p.price;
  const regular = p.priceObject?.regular ?? p.compareAtPrice ?? p.price;
  const discountPercentage =
    p.priceObject?.discountPercentage !== undefined
      ? p.priceObject.discountPercentage
      : regular > effective
      ? Math.round(((regular - effective) / regular) * 100)
      : 0;

  return {
    ...p,
    price: effective,
    compareAtPrice: regular > effective ? regular : null,
    priceObject: p.priceObject || {
      regular,
      sale: p.compareAtPrice ? effective : null,
      offer: null,
      effective,
      discountPercentage,
    },
    requiresConfiguration:
      p.requiresConfiguration !== undefined
        ? p.requiresConfiguration
        : (p.variants && p.variants.length > 1) || Boolean(p.modifierGroups?.length),
    hasVariants: p.hasVariants !== undefined ? p.hasVariants : Boolean(p.variants?.length),
    hasModifiers: p.hasModifiers !== undefined ? p.hasModifiers : Boolean(p.modifierGroups?.length),
    isWishlisted: p.isWishlisted ?? false,
    inStock: p.inStock ?? (p.stock > 0),
    stockQuantity: p.stockQuantity ?? p.stock,
  };
}

export const FALLBACK_PRODUCTS: ProductData[] = [
  // 1. Elysian Emerald Silk Evening Gown (Matches Backend API)
  {
    id: "04de36fe-1b09-4c27-a793-5bf9c9ff0412",
    name: "Elysian Emerald Silk Evening Gown",
    slug: "elysian-emerald-silk-evening-gown",
    description: "Handcrafted from 100% pure Mulberry silk with an asymmetric draped silhouette and cowl neckline.",
    shortDescription: "Pure Mulberry silk evening gown with draped cowl silhouette.",
    price: 8499,
    compareAtPrice: 12500,
    priceObject: {
      regular: 12500,
      sale: 9999,
      offer: 8499,
      effective: 8499,
      discountPercentage: 32,
    },
    sku: "MDE-EVE-001",
    brand: "Maison De Élégance",
    gender: "WOMEN",
    tags: ["Evening", "Gown", "Silk", "Mulberry", "Couture"],
    categorySlug: "evening-gowns",
    categoryName: "Evening Gowns",
    collectionSlugs: ["womens-couture", "evening-gowns"],
    occasionSlugs: ["evening", "reception"],
    fabric: "Mulberry Silk",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    stock: 45,
    stockQuantity: 45,
    inStock: true,
    hasVariants: true,
    hasModifiers: true,
    requiresConfiguration: true,
    isWishlisted: false,
    images: [
      { id: "img_eve_1", url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", altText: "Emerald Gown Front View", isPrimary: true },
      { id: "img_eve_2", url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800", altText: "Emerald Gown Back View", isPrimary: false },
    ],
    variants: [
      { id: "91547e56-5e37-49dd-904b-1623fd86e128", sku: "MDE-EVE-001-S", name: "Emerald / S", price: 8499, compareAtPrice: 12500, stock: 15, size: "S", colorName: "Emerald Green", colorHex: "#046307", isActive: true },
      { id: "c1bf3f4d-11d3-46a7-a25c-f00e70599df4", sku: "MDE-EVE-001-M", name: "Emerald / M", price: 8499, compareAtPrice: 12500, stock: 15, size: "M", colorName: "Emerald Green", colorHex: "#046307", isActive: true },
      { id: "8bafa52c-6631-4a77-970a-f3a1a5a0d1b2", sku: "MDE-EVE-001-L", name: "Emerald / L", price: 8999, compareAtPrice: 13000, stock: 15, size: "L", colorName: "Emerald Green", colorHex: "#046307", isActive: true },
    ],
    dynamicAttributes: [
      { attribute: "Fabric", attributeSlug: "fabric", value: "Mulberry Silk", valueSlug: "mulberry-silk" },
      { attribute: "Occasion", attributeSlug: "occasion", value: "Evening", valueSlug: "evening" },
      { attribute: "Color", attributeSlug: "color", value: "Emerald Green", valueSlug: "emerald-green" },
    ],
    modifierGroups: [
      {
        id: "c459b117-6031-4d21-95fd-6ee9d2b68423",
        name: "Luxury Gift Box",
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: "6afab7e7-0e3a-48ff-9558-e45d50f447f1", name: "Standard Eco Bag", priceDelta: 0, isDefault: true },
          { id: "a14d0059-9d8d-4d75-bf4c-2261c032abcc", name: "Velvet Signature Keepsake Box", priceDelta: 450, isDefault: false },
        ],
      },
      {
        id: "0eda6619-cae9-426e-8fdb-c182ff8c7c53",
        name: "Custom Tailoring & Hemming",
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: "1aec31a4-7b30-4bfc-83bc-851209a60213", name: "Standard Length", priceDelta: 0, isDefault: true },
          { id: "00198613-92bb-41d9-b190-bd74ec95f867", name: "Custom Floor Hemming (-2 inches)", priceDelta: 200, isDefault: false },
        ],
      },
    ],
    reviewsCount: 36,
    averageRating: 4.9,
  },

  // 2. Royal Crimson Velvet Saree (Matches Backend API)
  {
    id: "1c59e5d3-2698-494e-bc34-68bff2a5a32d",
    name: "Royal Crimson Velvet Saree",
    slug: "royal-crimson-velvet-saree",
    description: "Opulent micro-velvet saree adorned with intricate hand-embroidered zardozi and antique gold motifs.",
    shortDescription: "Royal crimson micro-velvet saree with artisanal zardozi embroidery.",
    price: 6800,
    compareAtPrice: 8500,
    priceObject: {
      regular: 8500,
      sale: 6800,
      offer: null,
      effective: 6800,
      discountPercentage: 20,
    },
    sku: "MDE-SAR-002",
    brand: "Maison De Élégance",
    gender: "WOMEN",
    tags: ["Saree", "Velvet", "Wedding", "Festive", "Zardozi"],
    categorySlug: "sarees",
    categoryName: "Sarees",
    collectionSlugs: ["womens-couture", "sarees"],
    occasionSlugs: ["wedding", "festive"],
    fabric: "Micro Velvet",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    stock: 25,
    stockQuantity: 25,
    inStock: true,
    hasVariants: false,
    hasModifiers: true,
    requiresConfiguration: true,
    isWishlisted: false,
    images: [
      { id: "img_sar_1", url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", altText: "Royal Crimson Velvet Saree", isPrimary: true },
    ],
    variants: [
      { id: "v_sar_1", sku: "MDE-SAR-002-FS", name: "Free Size", price: 6800, compareAtPrice: 8500, stock: 25, size: "Free Size", colorName: "Crimson Red", colorHex: "#990000", isActive: true },
    ],
    dynamicAttributes: [
      { attribute: "Fabric", attributeSlug: "fabric", value: "Micro Velvet", valueSlug: "micro-velvet" },
      { attribute: "Color", attributeSlug: "color", value: "Crimson Red", valueSlug: "crimson-red" },
      { attribute: "Occasion", attributeSlug: "occasion", value: "Wedding", valueSlug: "wedding" },
    ],
    modifierGroups: [
      {
        id: "mod_sar_blouse",
        name: "Blouse Stitching Service",
        isRequired: false,
        minSelection: 0,
        maxSelection: 1,
        options: [
          { id: "opt_blouse_unstitched", name: "Unstitched Blouse Piece", priceDelta: 0, isDefault: true },
          { id: "opt_blouse_custom", name: "Custom Bespoke Tailored Blouse", priceDelta: 1200, isDefault: false },
        ],
      },
    ],
    reviewsCount: 45,
    averageRating: 4.8,
  },

  // 3. Bespoke Navy Tailored Linen Suit (Matches Backend API)
  {
    id: "a62ceca5-4571-4d8a-ab99-fddf4cdd1bb8",
    name: "Bespoke Navy Tailored Linen Suit",
    slug: "bespoke-navy-tailored-linen-suit",
    description: "Crafted from breathable organic Irish linen, single-breasted with natural horn buttons and structured lapels.",
    shortDescription: "Savile Row inspired bespoke single-breasted navy Irish linen suit.",
    price: 18000,
    compareAtPrice: null,
    priceObject: {
      regular: 18000,
      sale: null,
      offer: null,
      effective: 18000,
      discountPercentage: 0,
    },
    sku: "SAV-SUIT-003",
    brand: "Savile & Co",
    gender: "MEN",
    tags: ["Suit", "Linen", "Menswear", "Tailored", "Formal"],
    categorySlug: "mens-suits",
    categoryName: "Suits & Blazers",
    collectionSlugs: ["mens-apparel", "mens-suits"],
    occasionSlugs: ["formal", "reception"],
    fabric: "Organic Linen",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    stock: 12,
    stockQuantity: 12,
    inStock: true,
    hasVariants: false,
    hasModifiers: false,
    requiresConfiguration: false,
    isWishlisted: false,
    images: [
      { id: "img_suit_1", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", altText: "Navy Linen Suit", isPrimary: true },
    ],
    variants: [
      { id: "v_suit_38", sku: "SAV-SUIT-003-38", name: "38R", price: 18000, stock: 4, size: "38R", colorName: "Navy Blue", colorHex: "#000080", isActive: true },
      { id: "v_suit_40", sku: "SAV-SUIT-003-40", name: "40R", price: 18000, stock: 4, size: "40R", colorName: "Navy Blue", colorHex: "#000080", isActive: true },
      { id: "v_suit_42", sku: "SAV-SUIT-003-42", name: "42R", price: 18000, stock: 4, size: "42R", colorName: "Navy Blue", colorHex: "#000080", isActive: true },
    ],
    dynamicAttributes: [
      { attribute: "Fabric", attributeSlug: "fabric", value: "Organic Linen", valueSlug: "organic-linen" },
      { attribute: "Color", attributeSlug: "color", value: "Navy Blue", valueSlug: "navy-blue" },
      { attribute: "Occasion", attributeSlug: "occasion", value: "Formal", valueSlug: "formal" },
    ],
    modifierGroups: [],
    reviewsCount: 18,
    averageRating: 4.7,
  },

  // 4. Classic Ivory Oxford Cotton Shirt (Matches Backend API)
  {
    id: "370f0e46-c6cd-4a5e-9fe0-96a70af2e32d",
    name: "Classic Ivory Oxford Cotton Shirt",
    slug: "classic-ivory-oxford-cotton-shirt",
    description: "Refined 120s two-ply organic cotton shirt with mother-of-pearl buttons and tailored French seams.",
    shortDescription: "Two-ply organic Egyptian cotton Oxford shirt with mother-of-pearl buttons.",
    price: 2400,
    compareAtPrice: 3200,
    priceObject: {
      regular: 3200,
      sale: 2800,
      offer: 2400,
      effective: 2400,
      discountPercentage: 25,
    },
    sku: "SAV-SHIRT-004",
    brand: "Savile & Co",
    gender: "MEN",
    tags: ["Shirt", "Cotton", "Oxford", "Menswear", "Casual"],
    categorySlug: "mens-shirts",
    categoryName: "Formal & Casual Shirts",
    collectionSlugs: ["mens-apparel", "mens-shirts"],
    occasionSlugs: ["casual", "formal"],
    fabric: "Pure Cotton",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    stock: 80,
    stockQuantity: 80,
    inStock: true,
    hasVariants: false,
    hasModifiers: false,
    requiresConfiguration: false,
    isWishlisted: false,
    images: [
      { id: "img_shirt_1", url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800", altText: "Ivory Oxford Shirt", isPrimary: true },
    ],
    variants: [
      { id: "v_shirt_s", sku: "SAV-SHIRT-004-S", name: "S", price: 2400, compareAtPrice: 3200, stock: 25, size: "S", colorName: "Ivory White", colorHex: "#ffffff", isActive: true },
      { id: "v_shirt_m", sku: "SAV-SHIRT-004-M", name: "M", price: 2400, compareAtPrice: 3200, stock: 35, size: "M", colorName: "Ivory White", colorHex: "#ffffff", isActive: true },
      { id: "v_shirt_l", sku: "SAV-SHIRT-004-L", name: "L", price: 2400, compareAtPrice: 3200, stock: 20, size: "L", colorName: "Ivory White", colorHex: "#ffffff", isActive: true },
    ],
    dynamicAttributes: [
      { attribute: "Fabric", attributeSlug: "fabric", value: "Pure Cotton", valueSlug: "pure-cotton" },
      { attribute: "Color", attributeSlug: "color", value: "Ivory White", valueSlug: "ivory-white" },
      { attribute: "Occasion", attributeSlug: "occasion", value: "Casual", valueSlug: "casual" },
    ],
    modifierGroups: [],
    reviewsCount: 92,
    averageRating: 4.95,
  },

  // 5. Handcrafted Banarasi Katan Raw Silk Saree
  {
    id: "prod_01",
    name: "Handcrafted Banarasi Katan Raw Silk Saree",
    slug: "handcrafted-banarasi-raw-silk-saree",
    description: "An exquisite heritage piece woven with pure zari threads by master artisans in Varanasi. Features intricate floral kadwa weave, rich pallu, and a contrast unstitched blouse piece.",
    shortDescription: "Pure Banarasi Katan silk saree hand-loomed with antique gold zari floral motifs.",
    price: 28999,
    compareAtPrice: 34999,
    priceObject: {
      regular: 34999,
      sale: 28999,
      offer: null,
      effective: 28999,
      discountPercentage: 17,
    },
    sku: "BN-SAR-001",
    brand: "Maison De Élégance",
    productType: "Sarees",
    gender: "WOMEN",
    tags: ["Saree", "Silk", "Banarasi", "Zari", "Wedding", "Festive"],
    categorySlug: "sarees",
    categoryName: "Sarees",
    collectionSlugs: ["womens-couture", "sarees"],
    occasionSlugs: ["wedding", "festive"],
    fabric: "100% Pure Katan Silk",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    stock: 12,
    stockQuantity: 12,
    inStock: true,
    hasVariants: true,
    hasModifiers: false,
    requiresConfiguration: false,
    isWishlisted: false,
    images: [
      { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000", altText: "Banarasi Raw Silk Saree", isPrimary: true },
    ],
    variants: [
      { id: "v_1", sku: "BN-SAR-001-FS-MG", price: 28999, compareAtPrice: 34999, stock: 8, size: "Free Size", colorName: "Royal Magenta & Gold", colorHex: "#800080", isActive: true },
    ],
    reviewsCount: 24,
    averageRating: 5.0,
  },
];

export const FALLBACK_COLLECTIONS = [
  {
    id: "col_1",
    name: "Women's Haute Couture",
    slug: "womens-couture",
    description: "Exclusive luxury evening gowns, royal velvet sarees, and red-carpet ready designer dresses.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200",
    itemCount: "Curated Masterpieces",
  },
  {
    id: "col_2",
    name: "Luxury Men's Tailoring",
    slug: "mens-apparel",
    description: "Bespoke organic Irish linen suits, Savile Row cuts, and Egyptian Oxford cotton shirts.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200",
    itemCount: "Bespoke Attire",
  },
  {
    id: "col_3",
    name: "Red-Carpet Evening Gowns",
    slug: "evening-gowns",
    description: "Handcrafted pure Mulberry silk gowns with cowl necklines and asymmetric drape.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200",
    itemCount: "Silk Silhouettes",
  },
  {
    id: "col_4",
    name: "Royal Crimson & Heritage Sarees",
    slug: "sarees",
    description: "Opulent micro-velvet and handwoven heritage sarees with antique gold zardozi embellishments.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200",
    itemCount: "Heirloom Weaves",
  },
];
