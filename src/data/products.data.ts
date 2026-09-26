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
  images: Array<{ url: string; altText?: string | null; isPrimary?: boolean }>;
  variants: ProductVariantData[];
  reviewsCount?: number;
  averageRating?: number;
}

export const FALLBACK_PRODUCTS: ProductData[] = [
  {
    id: "prod_01",
    name: "Handcrafted Banarasi Katan Raw Silk Saree",
    slug: "handcrafted-banarasi-raw-silk-saree",
    description: "An exquisite heritage piece woven with pure zari threads by master artisans in Varanasi. Features intricate floral kadwa weave, rich pallu, and a contrast unstitched blouse piece.",
    shortDescription: "Pure Banarasi Katan silk saree hand-loomed with antique gold zari floral motifs.",
    price: 28999,
    compareAtPrice: 34999,
    costPrice: 14000,
    sku: "BN-SAR-001",
    brand: "Shree Heritage",
    productType: "Sarees",
    gender: "WOMEN",
    tags: ["Saree", "Silk", "Banarasi", "Zari", "Wedding", "Festive"],
    categorySlug: "sarees",
    categoryName: "Sarees",
    subcategorySlug: "banarasi-sarees",
    collectionSlugs: ["festive-couture", "the-bridal-edit"],
    occasionSlugs: ["wedding", "festive", "reception"],
    fabric: "100% Pure Katan Silk",
    workType: "Kadwa Gold Zari Weave",
    pattern: "Floral Jaal",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isTrending: true,
    stock: 12,
    lowStockThreshold: 4,
    fabricInfo: "100% Handloom Raw Silk with Pure Zari. Includes Silk Mark Certification.",
    careInstructions: "Strictly dry clean only. Wrap in breathable muslin cloth.",
    fitInfo: "Free size saree (6.5 meters inclusive of unstitched blouse piece).",
    shippingInfo: "Dispatched in signature velvet gift box within 24 hours.",
    seoTitle: "Banarasi Katan Raw Silk Saree | Shree Heritage Couture",
    seoDescription: "Shop authentic hand-loomed Banarasi Katan Silk Sarees with gold zari floral weave. Free insured shipping across India.",
    images: [
      { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop", altText: "Banarasi Raw Silk Saree in Royal Magenta", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop", altText: "Detail of gold zari floral kadwa weave", isPrimary: false },
    ],
    variants: [
      { id: "v_1", sku: "BN-SAR-001-FS-MG", barcode: "8901234001", price: 28999, compareAtPrice: 34999, stock: 8, lowStockThreshold: 4, size: "Free Size", colorName: "Royal Magenta & Gold", colorHex: "#800080", imageUrl: null, isActive: true },
      { id: "v_2", sku: "BN-SAR-001-FS-EM", barcode: "8901234002", price: 29999, compareAtPrice: 35999, stock: 4, lowStockThreshold: 4, size: "Free Size", colorName: "Emerald Temple Green", colorHex: "#046307", imageUrl: null, isActive: true },
    ],
    reviewsCount: 24,
    averageRating: 5.0,
  },
  {
    id: "prod_02",
    name: "Hand-Embroidered Velvet Bridal Lehenga",
    slug: "hand-embroidered-velvet-bridal-lehenga",
    description: "A breathtaking bridal masterpiece tailored from micro-velvet, heavily embellished with dabka, zardozi, sequins, and pearls. Includes flared lehenga skirt, padded blouse, and double net dupatta.",
    shortDescription: "Opulent micro-velvet bridal lehenga adorned with zardozi and dabka hand embroidery.",
    price: 64999,
    compareAtPrice: 79999,
    costPrice: 32000,
    sku: "LH-BRD-002",
    brand: "Shree Couture",
    productType: "Lehengas",
    gender: "WOMEN",
    tags: ["Lehenga", "Bridal", "Velvet", "Zardozi", "Wedding", "Royal"],
    categorySlug: "lehengas",
    categoryName: "Lehengas",
    subcategorySlug: "bridal-lehengas",
    collectionSlugs: ["the-bridal-edit"],
    occasionSlugs: ["wedding", "reception"],
    fabric: "Micro Velvet & Silk Net",
    workType: "Zardozi, Dabka & Moti Work",
    pattern: "Heritage Mughal Motifs",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isTrending: true,
    stock: 8,
    lowStockThreshold: 3,
    fabricInfo: "Premium Micro-Velvet with dual can-can skirt lining for maximum flair.",
    careInstructions: "Specialist couture dry clean only.",
    fitInfo: "Semi-stitched lehenga with custom waist & blouse tailoring available.",
    modelInfo: "Model is 5'9\" wearing standard bridal fit.",
    shippingInfo: "Complimentary bridal trunk box with hanger and garment protector.",
    images: [
      { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop", altText: "Velvet Bridal Lehenga in Crimson Red", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop", altText: "Embroidered Dupatta Detail", isPrimary: false },
    ],
    variants: [
      { id: "v_3", sku: "LH-BRD-002-S-CR", barcode: "8901234003", price: 64999, compareAtPrice: 79999, stock: 3, lowStockThreshold: 3, size: "S", colorName: "Crimson Royal Red", colorHex: "#990000", imageUrl: null, isActive: true },
      { id: "v_4", sku: "LH-BRD-002-M-CR", barcode: "8901234004", price: 64999, compareAtPrice: 79999, stock: 4, lowStockThreshold: 3, size: "M", colorName: "Crimson Royal Red", colorHex: "#990000", imageUrl: null, isActive: true },
      { id: "v_5", sku: "LH-BRD-002-L-CR", barcode: "8901234005", price: 64999, compareAtPrice: 79999, stock: 1, lowStockThreshold: 3, size: "L", colorName: "Crimson Royal Red", colorHex: "#990000", imageUrl: null, isActive: true },
    ],
    reviewsCount: 18,
    averageRating: 4.9,
  },
  {
    id: "prod_03",
    name: "Pure Chanderi Silk Embroidered Anarkali Suit",
    slug: "pure-chanderi-silk-anarkali-suit",
    description: "Crafted in breathable Chanderi silk with delicate pita work embroidery on the yoke, paired with churidar pants and a hand-block printed organza dupatta.",
    shortDescription: "Pure Chanderi silk Anarkali suit set with pita work and hand-block organza dupatta.",
    price: 12999,
    compareAtPrice: 15999,
    costPrice: 5500,
    sku: "AN-CHK-003",
    brand: "Shree Atelier",
    productType: "Kurtis & Sets",
    gender: "WOMEN",
    tags: ["Anarkali", "Chanderi", "Pita Work", "Organza", "Festive", "Suits"],
    categorySlug: "kurtis-and-sets",
    categoryName: "Kurtis & Sets",
    subcategorySlug: "anarkali-sets",
    collectionSlugs: ["festive-couture"],
    occasionSlugs: ["festive", "sangeet-mehendi"],
    fabric: "Pure Chanderi Silk & Organza",
    workType: "Fine Pita Zari & Gota Patti",
    pattern: "Floral Booti",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    isTrending: true,
    stock: 25,
    lowStockThreshold: 5,
    fabricInfo: "100% Chanderi Silk with Mulmul cotton inner lining.",
    careInstructions: "Dry clean only. Iron on reverse side.",
    fitInfo: "Relaxed flared silhouette with structured bodice. True to size.",
    modelInfo: "Model is 5'8\" wearing Size M.",
    shippingInfo: "Dispatched within 24 hours.",
    images: [
      { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", altText: "Pure Chanderi Silk Anarkali Suit Set", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", altText: "Organza Dupatta and Bodice Embroidery", isPrimary: false },
    ],
    variants: [
      { id: "v_6", sku: "AN-CHK-003-S-PS", barcode: "8901234006", price: 12999, compareAtPrice: 15999, stock: 8, lowStockThreshold: 5, size: "S", colorName: "Pastel Sage Green", colorHex: "#9caf88", imageUrl: null, isActive: true },
      { id: "v_7", sku: "AN-CHK-003-M-PS", barcode: "8901234007", price: 12999, compareAtPrice: 15999, stock: 10, lowStockThreshold: 5, size: "M", colorName: "Pastel Sage Green", colorHex: "#9caf88", imageUrl: null, isActive: true },
      { id: "v_8", sku: "AN-CHK-003-L-PS", barcode: "8901234008", price: 12999, compareAtPrice: 15999, stock: 5, lowStockThreshold: 5, size: "L", colorName: "Pastel Sage Green", colorHex: "#9caf88", imageUrl: null, isActive: true },
      { id: "v_9", sku: "AN-CHK-003-XL-PS", barcode: "8901234009", price: 12999, compareAtPrice: 15999, stock: 2, lowStockThreshold: 5, size: "XL", colorName: "Pastel Sage Green", colorHex: "#9caf88", imageUrl: null, isActive: true },
    ],
    reviewsCount: 31,
    averageRating: 4.8,
  },
  {
    id: "prod_04",
    name: "Mulberry Silk Draped Evening Gown",
    slug: "mulberry-silk-draped-evening-gown",
    description: "Crafted from 100% pure 22-momme mulberry silk, this floor-length draped evening gown features an asymmetrical shoulder line, hand-finished seams, and a subtle waist tie.",
    shortDescription: "Pure 22-momme mulberry silk evening gown with handcrafted asymmetrical draping.",
    price: 18999,
    compareAtPrice: 22999,
    costPrice: 8500,
    sku: "MS-EGV-004",
    brand: "Shree Couture",
    productType: "Dresses & Gowns",
    gender: "WOMEN",
    tags: ["Silk", "Gown", "Evening", "Formal", "Luxury", "Reception"],
    categorySlug: "dresses-and-gowns",
    categoryName: "Dresses & Gowns",
    subcategorySlug: "evening-gowns",
    collectionSlugs: ["festive-couture"],
    occasionSlugs: ["reception", "party-wear"],
    fabric: "100% Organic Mulberry Silk (22 Momme)",
    workType: "Asymmetrical Hand Draping",
    pattern: "Solid Luminous Sheen",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isTrending: false,
    stock: 35,
    lowStockThreshold: 5,
    fabricInfo: "100% Organic Mulberry Silk (22 Momme)",
    careInstructions: "Dry clean only. Store in breathable garment cover.",
    fitInfo: "Fitted bust with relaxed flowing waist and skirt. True to size.",
    modelInfo: "Model is 5'9\" wearing Size S.",
    shippingInfo: "Complimentary signature gift box with velvet hanger.",
    images: [
      { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", altText: "Front view of Mulberry Silk Evening Gown", isPrimary: true },
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", altText: "Side view showing silk drape", isPrimary: false },
    ],
    variants: [
      { id: "v_10", sku: "MS-EGV-004-S-EM", barcode: "8901234010", price: 18999, compareAtPrice: 22999, stock: 10, lowStockThreshold: 5, size: "S", colorName: "Emerald Green", colorHex: "#046307", imageUrl: null, isActive: true },
      { id: "v_11", sku: "MS-EGV-004-M-EM", barcode: "8901234011", price: 18999, compareAtPrice: 22999, stock: 15, lowStockThreshold: 5, size: "M", colorName: "Emerald Green", colorHex: "#046307", imageUrl: null, isActive: true },
      { id: "v_12", sku: "MS-EGV-004-L-EM", barcode: "8901234012", price: 18999, compareAtPrice: 22999, stock: 4, lowStockThreshold: 5, size: "L", colorName: "Emerald Green", colorHex: "#046307", imageUrl: null, isActive: true },
      { id: "v_13", sku: "MS-EGV-004-M-CG", barcode: "8901234013", price: 19999, compareAtPrice: 24999, stock: 6, lowStockThreshold: 5, size: "M", colorName: "Champagne Gold", colorHex: "#d4af37", imageUrl: null, isActive: true },
    ],
    reviewsCount: 14,
    averageRating: 4.9,
  },
  {
    id: "prod_05",
    name: "Embellished Organza Silk Saree with Zari Border",
    slug: "embellished-organza-silk-saree",
    description: "Lightweight, sheer organza saree decorated with delicate scalloped cutwork borders and hand-embroidered sequin buttis.",
    shortDescription: "Ultra-sheer organza silk saree with scalloped hand-cut zari embroidery.",
    price: 16999,
    compareAtPrice: 20999,
    costPrice: 7200,
    sku: "OG-SAR-005",
    brand: "Shree Heritage",
    productType: "Sarees",
    gender: "WOMEN",
    tags: ["Organza", "Saree", "Pastel", "Scallop", "Cocktails"],
    categorySlug: "sarees",
    categoryName: "Sarees",
    subcategorySlug: "organza-sarees",
    collectionSlugs: ["summer-collection", "festive-couture"],
    occasionSlugs: ["reception", "festive", "sangeet-mehendi"],
    fabric: "100% Pure Organza Silk",
    workType: "Scalloped Cutwork & Muted Sequins",
    pattern: "Fine Pastel Buttis",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    isTrending: true,
    stock: 20,
    lowStockThreshold: 5,
    fabricInfo: "Pure Organza Silk with raw silk unstitched blouse fabric.",
    careInstructions: "Delicate dry clean only. Do not machine spin.",
    fitInfo: "Free size saree (6.5 meters).",
    shippingInfo: "Dispatched within 24 hours.",
    images: [
      { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop", altText: "Organza Silk Saree in Rose Blush", isPrimary: true },
    ],
    variants: [
      { id: "v_14", sku: "OG-SAR-005-FS-RB", barcode: "8901234014", price: 16999, compareAtPrice: 20999, stock: 15, lowStockThreshold: 5, size: "Free Size", colorName: "Rose Blush Pink", colorHex: "#ffb6c1", imageUrl: null, isActive: true },
      { id: "v_15", sku: "OG-SAR-005-FS-IV", barcode: "8901234015", price: 16999, compareAtPrice: 20999, stock: 5, lowStockThreshold: 5, size: "Free Size", colorName: "Pearl Ivory", colorHex: "#fffff0", imageUrl: null, isActive: true },
    ],
    reviewsCount: 22,
    averageRating: 4.9,
  },
  {
    id: "prod_06",
    name: "Printed Georgette Peplum Kurti with Sharara Pants",
    slug: "printed-georgette-peplum-kurti-sharara",
    description: "Flowy viscose georgette peplum top with mirror work detailing along the V-neckline, paired with multi-tiered sharara pants and chiffon dupatta.",
    shortDescription: "Floral printed georgette peplum kurti with flared tiered sharara pants.",
    price: 8499,
    compareAtPrice: 10499,
    costPrice: 3400,
    sku: "SH-KUR-006",
    brand: "Shree Atelier",
    productType: "Kurtis & Sets",
    gender: "WOMEN",
    tags: ["Sharara", "Georgette", "Peplum", "Floral", "Sangeet"],
    categorySlug: "kurtis-and-sets",
    categoryName: "Kurtis & Sets",
    subcategorySlug: "palazzo-sets",
    collectionSlugs: ["festive-couture"],
    occasionSlugs: ["sangeet-mehendi", "festive"],
    fabric: "Viscose Georgette & Chiffon",
    workType: "Foil Print & Mirror Embellishment",
    pattern: "Botanical Floral Print",
    status: "ACTIVE",
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: true,
    isTrending: true,
    stock: 40,
    lowStockThreshold: 6,
    fabricInfo: "Lightweight, twirl-friendly georgette with soft crepe lining.",
    careInstructions: "Gentle hand wash cold or dry clean.",
    fitInfo: "Fitted bust with flared peplum waist.",
    images: [
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop", altText: "Peplum Sharara Set", isPrimary: true },
    ],
    variants: [
      { id: "v_16", sku: "SH-KUR-006-S-YL", barcode: "8901234016", price: 8499, compareAtPrice: 10499, stock: 12, lowStockThreshold: 5, size: "S", colorName: "Mustard Marigold", colorHex: "#ffae42", imageUrl: null, isActive: true },
      { id: "v_17", sku: "SH-KUR-006-M-YL", barcode: "8901234017", price: 8499, compareAtPrice: 10499, stock: 18, lowStockThreshold: 5, size: "M", colorName: "Mustard Marigold", colorHex: "#ffae42", imageUrl: null, isActive: true },
      { id: "v_18", sku: "SH-KUR-006-L-YL", barcode: "8901234018", price: 8499, compareAtPrice: 10499, stock: 10, lowStockThreshold: 5, size: "L", colorName: "Mustard Marigold", colorHex: "#ffae42", imageUrl: null, isActive: true },
    ],
    reviewsCount: 39,
    averageRating: 4.8,
  },
  {
    id: "prod_07",
    name: "Pure Silk Twill Hand-Rolled Scarf",
    slug: "pure-mulberry-silk-hand-rolled-scarf",
    description: "Printed using traditional screen techniques on 16-momme silk twill. Edges are hand-rolled and hand-stitched by skilled craftswomen.",
    shortDescription: "16-momme pure silk twill scarf with hand-rolled artisan edges.",
    price: 3499,
    compareAtPrice: 4299,
    costPrice: 1200,
    sku: "MS-SCF-007",
    brand: "Shree Accessories",
    productType: "Accessories",
    gender: "WOMEN",
    tags: ["Scarf", "Silk", "Accessories", "Handmade", "Gift"],
    categorySlug: "accessories",
    categoryName: "Dupattas & Accessories",
    subcategorySlug: "silk-scarves",
    collectionSlugs: ["summer-collection", "festive-couture"],
    occasionSlugs: ["casual-luxe", "workwear"],
    fabric: "100% Silk Twill (16 Momme)",
    workType: "Artisanal Hand-Rolled Hem",
    pattern: "Heritage Baroque Flora",
    status: "ACTIVE",
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    isTrending: false,
    stock: 50,
    lowStockThreshold: 8,
    fabricInfo: "100% Silk Twill (16 Momme)",
    careInstructions: "Dry clean or gentle hand wash in cold water.",
    fitInfo: "Square 90cm x 90cm dimensions.",
    shippingInfo: "Packaged in luxury foiled drawer box.",
    images: [
      { url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1000&auto=format&fit=crop", altText: "Silk Scarf", isPrimary: true },
    ],
    variants: [
      { id: "v_19", sku: "MS-SCF-007-OS-GD", barcode: "8901234019", price: 3499, compareAtPrice: 4299, stock: 50, lowStockThreshold: 8, size: "90x90 cm", colorName: "Gilded Baroque Gold", colorHex: "#d4af37", imageUrl: null, isActive: true },
    ],
    reviewsCount: 27,
    averageRating: 4.9,
  }
];

export const FALLBACK_COLLECTIONS = [
  {
    id: "col_1",
    name: "The Bridal Heritage Edit",
    slug: "the-bridal-edit",
    description: "Opulent micro-velvet bridal lehengas, pure zari Kanchipurams, and heirloom jewelry.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200",
    itemCount: "24 Masterpieces",
  },
  {
    id: "col_2",
    name: "Festive Silk Royale",
    slug: "festive-couture",
    description: "Hand-loomed Banarasi raw silk sarees, Chanderi Anarkalis, and pure gold zari weaves.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200",
    itemCount: "38 Ensembles",
  },
  {
    id: "col_3",
    name: "Summer Silk & Organza",
    slug: "summer-collection",
    description: "Breathable pastel organza sarees, draped silk evening gowns, and pure linen kurtis.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200",
    itemCount: "19 Silhouettes",
  },
  {
    id: "col_4",
    name: "Contemporary Fusion Wear",
    slug: "fusion-collection",
    description: "Modern Indo-western gowns, peplum sharara sets, and festive co-ords.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200",
    itemCount: "15 Pieces",
  }
];
