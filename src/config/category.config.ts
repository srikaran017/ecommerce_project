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
    id: "cat_sarees",
    name: "Sarees",
    slug: "sarees",
    tagline: "Handloomed Heritage Weaves",
    description: "Exquisite pure silk, Banarasi zari, Kanchipuram, organza, and festive sarees crafted by master artisans.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 1,
    isActive: true,
    subcategories: [
      { id: "sub_silk", name: "Pure Silk Sarees", slug: "silk-sarees", itemCount: "42 Designs" },
      { id: "sub_banarasi", name: "Banarasi Zari Sarees", slug: "banarasi-sarees", itemCount: "28 Designs" },
      { id: "sub_kanchi", name: "Kanchipuram Silks", slug: "kanchipuram-sarees", itemCount: "19 Designs" },
      { id: "sub_organza", name: "Organza & Chiffon", slug: "organza-sarees", itemCount: "35 Designs" },
      { id: "sub_wedding_saree", name: "Bridal & Wedding Sarees", slug: "wedding-sarees", itemCount: "50 Designs" },
    ],
  },
  {
    id: "cat_lehengas",
    name: "Lehengas",
    slug: "lehengas",
    tagline: "Grand Couture & Bridal Ensembles",
    description: "Opulent bridal lehengas, hand-embroidered velvet ensembles, and contemporary floral party-wear sets.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 2,
    isActive: true,
    subcategories: [
      { id: "sub_bridal_leh", name: "Bridal Couture Lehengas", slug: "bridal-lehengas", itemCount: "30 Designs" },
      { id: "sub_party_leh", name: "Party Wear & Sangeet", slug: "party-wear-lehengas", itemCount: "45 Designs" },
      { id: "sub_designer_leh", name: "Designer Georgette Sets", slug: "designer-lehengas", itemCount: "22 Designs" },
      { id: "sub_velvet_leh", name: "Rich Velvet & Zari", slug: "velvet-lehengas", itemCount: "18 Designs" },
    ],
  },
  {
    id: "cat_kurtis",
    name: "Kurtis & Sets",
    slug: "kurtis-and-sets",
    tagline: "Artisanal Tailored Elegance",
    description: "Flattering Anarkalis, tailored palazzo suit sets, festive co-ords, and everyday breathable cotton kurtis.",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 3,
    isActive: true,
    subcategories: [
      { id: "sub_anarkali", name: "Anarkali Sets", slug: "anarkali-sets", itemCount: "38 Designs" },
      { id: "sub_palazzo", name: "Palazzo & Pant Sets", slug: "palazzo-sets", itemCount: "54 Designs" },
      { id: "sub_coords", name: "Festive Co-ord Sets", slug: "coord-sets", itemCount: "29 Designs" },
      { id: "sub_straight", name: "Straight Cut Kurtis", slug: "straight-kurtis", itemCount: "60 Designs" },
    ],
  },
  {
    id: "cat_salwar",
    name: "Salwar Suits & Churidars",
    slug: "salwar-suits",
    tagline: "Timeless Silhouettes",
    description: "Chanderi silk suits, unstitched dress materials, and ready-to-wear Punjabi and churidar suits.",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 4,
    isActive: true,
    subcategories: [
      { id: "sub_chanderi", name: "Chanderi Silk Suits", slug: "chanderi-suits", itemCount: "24 Designs" },
      { id: "sub_sharara", name: "Sharara & Gharara Sets", slug: "sharara-sets", itemCount: "32 Designs" },
      { id: "sub_unstitched", name: "Unstitched Dress Fabrics", slug: "unstitched-fabrics", itemCount: "40 Designs" },
    ],
  },
  {
    id: "cat_gowns",
    name: "Dresses & Gowns",
    slug: "dresses-and-gowns",
    tagline: "Modern Fusion & Evening Glamour",
    description: "Floor-length draped silk evening gowns, maxi dresses, and contemporary Indo-western silhouettes.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 5,
    isActive: true,
    subcategories: [
      { id: "sub_evening_gown", name: "Draped Evening Gowns", slug: "evening-gowns", itemCount: "25 Designs" },
      { id: "sub_fusion_maxi", name: "Indo-Western Maxis", slug: "fusion-dresses", itemCount: "30 Designs" },
    ],
  },
  {
    id: "cat_accessories",
    name: "Dupattas & Accessories",
    slug: "accessories",
    tagline: "The Finishing Atelier Touch",
    description: "Pure silk twill scarves, handloom zari dupattas, embellished potli bags, and statement jewelry.",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop",
    bannerImage: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1600&auto=format&fit=crop",
    isFeatured: true,
    displayOrder: 6,
    isActive: true,
    subcategories: [
      { id: "sub_zari_dupatta", name: "Handloom Zari Dupattas", slug: "zari-dupattas", itemCount: "28 Designs" },
      { id: "sub_silk_scarf", name: "Pure Silk Scarves", slug: "silk-scarves", itemCount: "16 Designs" },
      { id: "sub_potli", name: "Embellished Potlis", slug: "potli-bags", itemCount: "20 Designs" },
    ],
  },
];

export const INITIAL_OCCASIONS: OccasionConfig[] = [
  {
    id: "occ_wedding",
    name: "The Wedding Edit",
    slug: "wedding",
    tagline: "Bridal Lehengas & Pure Zari Kanchipurams",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "48 Ensembles",
  },
  {
    id: "occ_festive",
    name: "Festive Celebrations",
    slug: "festive",
    tagline: "Diwali, Navratri & Royal Pujas",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "62 Silhouettes",
  },
  {
    id: "occ_reception",
    name: "Reception & Cocktails",
    slug: "reception",
    tagline: "Draped Silk Gowns & Contemporary Drapes",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "34 Silhouettes",
  },
  {
    id: "occ_sangeet",
    name: "Sangeet & Mehendi",
    slug: "sangeet-mehendi",
    tagline: "Vibrant Floral Lehengas & Playful Co-ords",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "41 Ensembles",
  },
  {
    id: "occ_casual",
    name: "Everyday Luxury",
    slug: "casual-luxe",
    tagline: "Belgian Linen & Breathable Cotton Kurtis",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "55 Pieces",
  },
  {
    id: "occ_office",
    name: "Smart Festive & Work",
    slug: "workwear",
    tagline: "Sophisticated Suits & Minimalist Cuts",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
    isFeatured: true,
    itemCount: "28 Pieces",
  },
];
