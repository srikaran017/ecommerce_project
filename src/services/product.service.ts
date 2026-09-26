import { prisma } from "@/lib/prisma";
import {
  FALLBACK_PRODUCTS,
  FALLBACK_COLLECTIONS,
  ProductData,
  ProductVariantData,
} from "@/data/products.data";

export { FALLBACK_PRODUCTS, FALLBACK_COLLECTIONS };
export type { ProductData, ProductVariantData };

export class ProductService {
  static async getAllProducts(filters?: {
    category?: string;
    gender?: string;
    size?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    collection?: string;
    occasion?: string;
    fabric?: string;
    sort?: string;
    search?: string;
    featured?: boolean;
    newArrivals?: boolean;
    bestSellers?: boolean;
  }): Promise<ProductData[]> {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432")) {
        const dbProducts = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            ...(filters?.category ? { category: { slug: filters.category } } : {}),
            ...(filters?.gender ? { gender: filters.gender.toUpperCase() as any } : {}),
            ...(filters?.featured ? { isFeatured: true } : {}),
            ...(filters?.newArrivals ? { isNewArrival: true } : {}),
            ...(filters?.bestSellers ? { isBestSeller: true } : {}),
          },
          include: {
            images: { orderBy: { displayOrder: "asc" } },
            variants: true,
            category: true,
            reviews: true,
          },
        });
        if (dbProducts && dbProducts.length > 0) {
          return dbProducts.map((p: any) => ({
            ...p,
            categorySlug: p.category.slug,
            categoryName: p.category.name,
            gender: p.gender || "WOMEN",
            tags: p.tags || [],
            reviewsCount: p.reviews?.length || 0,
            averageRating: p.reviews?.length
              ? p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length
              : 5.0,
          }));
        }
      }
    } catch (e) {
      // Fall back to memory catalog
    }

    let products = [...FALLBACK_PRODUCTS];

    if (filters?.category) {
      products = products.filter((p) => p.categorySlug === filters.category);
    }
    if (filters?.gender) {
      products = products.filter(
        (p) => p.gender.toLowerCase() === filters.gender?.toLowerCase() || p.gender === "UNISEX"
      );
    }
    if (filters?.collection) {
      products = products.filter(
        (p) => p.collectionSlugs && p.collectionSlugs.includes(filters.collection!)
      );
    }
    if (filters?.occasion) {
      products = products.filter(
        (p) => p.occasionSlugs && p.occasionSlugs.includes(filters.occasion!)
      );
    }
    if (filters?.fabric) {
      products = products.filter(
        (p) => p.fabric && p.fabric.toLowerCase().includes(filters.fabric!.toLowerCase())
      );
    }
    if (filters?.size) {
      products = products.filter((p) =>
        p.variants.some((v) => v.size.toLowerCase() === filters.size?.toLowerCase())
      );
    }
    if (filters?.color) {
      products = products.filter((p) =>
        p.variants.some((v) => v.colorName.toLowerCase().includes(filters.color!.toLowerCase()))
      );
    }
    if (filters?.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }
    if (filters?.inStockOnly) {
      products = products.filter((p) => p.variants.some((v) => v.stock > 0));
    }
    if (filters?.featured) {
      products = products.filter((p) => p.isFeatured);
    }
    if (filters?.newArrivals) {
      products = products.filter((p) => p.isNewArrival);
    }
    if (filters?.bestSellers) {
      products = products.filter((p) => p.isBestSeller);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (filters?.sort === "price-low") {
      products.sort((a, b) => a.price - b.price);
    } else if (filters?.sort === "price-high") {
      products.sort((a, b) => b.price - a.price);
    } else if (filters?.sort === "best-selling") {
      products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (filters?.sort === "highest-rated") {
      products.sort((a, b) => (b.averageRating || 5) - (a.averageRating || 5));
    } else if (filters?.sort === "discount") {
      products.sort((a, b) => {
        const discA = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      });
    }

    return products;
  }

  static async getProductBySlug(slug: string): Promise<ProductData | null> {
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432")) {
        const product = await prisma.product.findFirst({
          where: { slug, status: "ACTIVE" },
          include: {
            images: { orderBy: { displayOrder: "asc" } },
            variants: true,
            category: true,
            reviews: true,
          },
        });
        if (product) {
          return {
            ...product,
            categorySlug: product.category.slug,
            categoryName: product.category.name,
            gender: (product as any).gender || "WOMEN",
            tags: product.tags || [],
            reviewsCount: product.reviews?.length || 0,
            averageRating: product.reviews?.length
              ? product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length
              : 5.0,
          };
        }
      }
    } catch (e) {
      // Fallback
    }

    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }

  static async getProductById(id: string): Promise<ProductData | null> {
    const product = FALLBACK_PRODUCTS.find((p) => p.id === id);
    return product || null;
  }

  static async getAllCollections() {
    return FALLBACK_COLLECTIONS;
  }

  static async getCollectionBySlug(slug: string) {
    return FALLBACK_COLLECTIONS.find((c) => c.slug === slug) || null;
  }
}
