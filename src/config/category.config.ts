export interface SubcategoryConfig {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  image: string;
  bannerImage?: string;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  subcategories: SubcategoryConfig[];
}

export interface OccasionConfig {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  image: string;
  isFeatured: boolean;
  itemCount: string;
}

export const INITIAL_CATEGORIES: CategoryConfig[] = [
  {
    id: "cat_womens_couture",
    name: "Women's Couture",
    slug: "womens-couture",
    tagline: "Haute Couture & Designer Ensembles",
    description: "Exclusive luxury evening gowns, bridal sarees, and artisanal handcrafted silhouettes.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    bannerImage: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1600",
    isFeatured: true,
    displayOrder: 1,
    isActive: true,
    subcategories: [
      { id: "sub_evening_gowns", name: "Evening Gowns", slug: "evening-gowns", itemCount: "Bespoke Gowns" },
      { id: "sub_sarees", name: "Sarees", slug: "sarees", itemCount: "Heritage Weaves" },
      { id: "sub_dresses", name: "Dresses", slug: "dresses", itemCount: "Designer Dresses" },
    ],
  },
  {
    id: "cat_mens_apparel",
    name: "Men's Apparel",
    slug: "mens-apparel",
    tagline: "Tailored Menswear & Bespoke Attire",
    description: "Savile Row inspired bespoke tailored suits, handcrafted blazers, and Egyptian cotton shirts.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
    bannerImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600",
    isFeatured: true,
    displayOrder: 2,
    isActive: true,
    subcategories: [
      { id: "sub_mens_suits", name: "Suits & Blazers", slug: "mens-suits", itemCount: "Tailored Cuts" },
      { id: "sub_mens_shirts", name: "Formal & Casual Shirts", slug: "mens-shirts", itemCount: "Pure Cotton" },
    ],
  },
  {
    id: "cat_evening_gowns",
    name: "Evening Gowns",
    slug: "evening-gowns",
    tagline: "Red-Carpet Ready Silhouettes",
    description: "Handcrafted pure Mulberry silk gowns with cowl necklines and asymmetric drape.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    bannerImage: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1600",
    isFeatured: true,
    displayOrder: 3,
    isActive: true,
    subcategories: [
      { id: "sub_silk_gowns", name: "Mulberry Silk Gowns", slug: "evening-gowns", itemCount: "Silk Drapes" },
    ],
  },
  {
    id: "cat_sarees",
    name: "Sarees",
    slug: "sarees",
    tagline: "Royal Crimson & Heritage Zari",
    description: "Opulent micro-velvet and handwoven heritage sarees with intricate embellishments.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    bannerImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600",
    isFeatured: true,
    displayOrder: 4,
    isActive: true,
    subcategories: [
      { id: "sub_velvet_saree", name: "Velvet Sarees", slug: "sarees", itemCount: "Couture Weaves" },
    ],
  },
  {
    id: "cat_suits",
    name: "Suits & Blazers",
    slug: "mens-suits",
    tagline: "Bespoke Navy & Organic Linen",
    description: "Tailored linen and wool suits crafted with horn buttons and single-needle stitching.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
    bannerImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600",
    isFeatured: true,
    displayOrder: 5,
    isActive: true,
    subcategories: [
      { id: "sub_linen_suits", name: "Linen Suits", slug: "mens-suits", itemCount: "Tailored Cuts" },
    ],
  },
  {
    id: "cat_shirts",
    name: "Shirts",
    slug: "mens-shirts",
    tagline: "Classic Ivory Oxford Cotton",
    description: "Refined two-ply organic cotton shirts with mother-of-pearl buttons.",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    bannerImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600",
    isFeatured: true,
    displayOrder: 6,
    isActive: true,
    subcategories: [
      { id: "sub_oxford_shirts", name: "Oxford Shirts", slug: "mens-shirts", itemCount: "Pure Cotton" },
    ],
  },
];

export const INITIAL_OCCASIONS: OccasionConfig[] = [
  {
    id: "occ_evening",
    name: "Evening Gala",
    slug: "evening",
    tagline: "Red-Carpet Gowns & Asymmetric Drapes",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    isFeatured: true,
    itemCount: "Couture Pieces",
  },
  {
    id: "occ_wedding",
    name: "Wedding & Festive",
    slug: "wedding",
    tagline: "Royal Velvet & Heritage Weaves",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    isFeatured: true,
    itemCount: "Heritage Sets",
  },
  {
    id: "occ_formal",
    name: "Formal & Sartorial",
    slug: "formal",
    tagline: "Bespoke Navy Linen & Tailored Suits",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
    isFeatured: true,
    itemCount: "Tailored Fits",
  },
  {
    id: "occ_casual",
    name: "Casual Luxe",
    slug: "casual",
    tagline: "Classic Ivory Cotton Oxford Shirts",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    isFeatured: true,
    itemCount: "Pure Comfort",
  },
];
