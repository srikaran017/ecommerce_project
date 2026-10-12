import { getApiBaseUrl } from "./apiConfig";
import {
  PublicCollectionSummary,
  PublicCollectionDetail,
  CollectionsListResponse,
  CollectionDetailResponse,
} from "@/types/collection.types";
import { FALLBACK_COLLECTIONS } from "@/data/products.data";

const getBaseUrl = () => getApiBaseUrl();

export class CollectionService {
  /**
   * Fetch all active curated collections & lookbooks
   * GET /api/v1/collections (or /api/collections)
   */
  static async getCollections(): Promise<PublicCollectionSummary[]> {
    try {
      const res = await fetch(`${getBaseUrl()}/collections`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        return this.getFallbackSummaries();
      }

      const json: CollectionsListResponse = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
      return this.getFallbackSummaries();
    } catch (err) {
      console.warn("[CollectionService] Error fetching collections:", err);
      return this.getFallbackSummaries();
    }
  }

  /**
   * Fetch single curated collection details & active products
   * GET /api/v1/collections/:slug (or /api/collections/:slug)
   */
  static async getCollectionBySlug(slug: string): Promise<PublicCollectionDetail | null> {
    try {
      const res = await fetch(`${getBaseUrl()}/collections/${encodeURIComponent(slug)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      });

      if (!res.ok) {
        return this.getFallbackDetail(slug);
      }

      const json: CollectionDetailResponse = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return this.getFallbackDetail(slug);
    } catch (err) {
      console.warn(`[CollectionService] Error fetching collection '${slug}':`, err);
      return this.getFallbackDetail(slug);
    }
  }

  private static getFallbackSummaries(): PublicCollectionSummary[] {
    return FALLBACK_COLLECTIONS.map((c, idx) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || null,
      imageUrl: c.image || null,
      isFeatured: true,
      sortOrder: idx + 1,
      productsCount: typeof c.itemCount === "number" ? c.itemCount : 4,
    }));
  }

  private static getFallbackDetail(slug: string): PublicCollectionDetail | null {
    const found = FALLBACK_COLLECTIONS.find((c) => c.slug === slug);
    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      slug: found.slug,
      description: found.description || null,
      imageUrl: found.image || null,
      isFeatured: true,
      sortOrder: 1,
      productsCount: typeof found.itemCount === "number" ? found.itemCount : 0,
      products: [],
    };
  }
}
