import { storeConfig } from "@/config/store.config";

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

export type ModifierType =
  | "DROPDOWN"
  | "RADIO_BUTTONS"
  | "RECTANGLE_LIST"
  | "CHECKBOX"
  | "SHORT_TEXT"
  | "MULTI_LINE_TEXT"
  | "NUMBERS_ONLY_TEXT"
  | "DATE"
  | "FILE_UPLOAD";

export interface ModifierOptionData {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  sortOrder?: number;
}

export interface ModifierGroupData {
  id: string;
  name: string;
  displayName?: string;
  type?: ModifierType | string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  defaultValue?: string | null;
  config?: {
    maxLength?: number;
    minLength?: number;
    minValue?: number;
    maxValue?: number;
    placeholder?: string;
    allowedExtensions?: string[];
  } | null;
  sortOrder?: number;
  options: ModifierOptionData[];
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
  modifierGroups?: ModifierGroupData[];
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

export const FALLBACK_PRODUCTS: ProductData[] = [];

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
