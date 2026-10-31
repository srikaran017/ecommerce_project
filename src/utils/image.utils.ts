/**
 * Production Image Resolution & Fallback Engine
 * Provides graceful, high-fashion fallback images tailored by category and garment type.
 * Ensures zero broken images across storefront cards, quick view modals, and product details
 * without affecting products that already have valid image URLs.
 */

export interface ProductLike {
  id?: string;
  name?: string;
  slug?: string;
  brand?: string;
  categoryName?: string;
  categorySlug?: string;
  category?: { name?: string; slug?: string } | string | null;
  tags?: string[];
  description?: string;
  thumbnail?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  images?: any[] | null;
  variants?: any[] | null;
}

// Curated high-resolution Unsplash fashion images keyed by category/silhouette
export const LUXURY_FALLBACK_IMAGES = {
  // Tailored suits, blazers, tuxedos
  blazers: {
    primary: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop&q=80",
  },
  // Sarees, silks, handloom
  sarees: {
    primary: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=80",
  },
  // Lehengas, bridal, velvet couture
  lehengas: {
    primary: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80",
  },
  // Evening gowns, haute couture dresses
  gowns: {
    primary: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
  },
  // Sherwanis, ethnic menswear, kurtas
  sherwanis: {
    primary: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80",
  },
  // Default atelier apparel
  default: {
    primary: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
    hover: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80",
  },
};

export const KNOWN_FALLBACK_IMAGE_PATTERNS = [
  "1507679799987-c73779587ccf", // Blazers primary
  "1594938298603-c8148c4dae35", // Blazers hover / Sherwanis primary
  "1610030469983-98e550d6193c", // Sarees primary
  "1617627143750-d86bc21e42bb", // Sarees hover
  "1583391733956-3750e0ff4e8b", // Lehengas primary
  "1595777457583-95e059d581b8", // Lehengas hover
  "1566174053879-31528523f8ae", // Gowns primary
  "1515886657613-9f3515b0c78f", // Gowns hover / Default primary
];

/**
 * Checks if a given image URL matches any of the static Unsplash fallback photos.
 * Returns false for any user-uploaded images (e.g. Cloudinary, local uploads, blobs, data URIs).
 */
export function isFallbackImageUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // User uploaded assets (Cloudinary, local, data, blob) are NEVER fallbacks
  if (
    trimmed.includes("cloudinary.com") ||
    trimmed.includes("/uploads/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return false;
  }
  return KNOWN_FALLBACK_IMAGE_PATTERNS.some((pattern) => trimmed.includes(pattern));
}

/**
 * Validates and cleans a raw image URL string.
 * Rejects empty strings, "null", "undefined", or invalid whitespace strings.
 */
export function sanitizeImageUrl(url: unknown): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Determines the most appropriate luxury fallback images based on the product's
 * name, category, and tags.
 */
export function getProductFallbackImages(product?: ProductLike | null): { primary: string; hover: string } {
  if (!product) return LUXURY_FALLBACK_IMAGES.default;

  const categoryStr =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || product.category?.slug || product.categoryName || product.categorySlug || "";

  const tagsStr = Array.isArray(product.tags) ? product.tags.join(" ") : "";
  const haystack = `${product.name || ""} ${categoryStr} ${tagsStr} ${product.description || ""}`.toLowerCase();

  // Blazers / Suits / Tuxedos / Jackets / Coats
  if (
    haystack.includes("blazer") ||
    haystack.includes("tuxedo") ||
    haystack.includes("suit") ||
    haystack.includes("jacket") ||
    haystack.includes("coat") ||
    haystack.includes("bespoke")
  ) {
    return LUXURY_FALLBACK_IMAGES.blazers;
  }

  // Sarees / Silks / Kanjivaram / Banarasi
  if (
    haystack.includes("saree") ||
    haystack.includes("sari") ||
    haystack.includes("silk") ||
    haystack.includes("kanjivaram") ||
    haystack.includes("banarasi") ||
    haystack.includes("zari") ||
    haystack.includes("handloom")
  ) {
    return LUXURY_FALLBACK_IMAGES.sarees;
  }

  // Lehengas / Velvet / Bridal
  if (
    haystack.includes("lehenga") ||
    haystack.includes("choli") ||
    haystack.includes("bridal") ||
    haystack.includes("velvet") ||
    haystack.includes("wedding")
  ) {
    return LUXURY_FALLBACK_IMAGES.lehengas;
  }

  // Sherwani / Kurta / Men's ethnic
  if (
    haystack.includes("sherwani") ||
    haystack.includes("kurta") ||
    haystack.includes("nehru") ||
    haystack.includes("indo-western")
  ) {
    return LUXURY_FALLBACK_IMAGES.sherwanis;
  }

  // Gowns / Dresses / Evening wear
  if (
    haystack.includes("gown") ||
    haystack.includes("evening") ||
    haystack.includes("dress") ||
    haystack.includes("cocktail") ||
    haystack.includes("couture")
  ) {
    return LUXURY_FALLBACK_IMAGES.gowns;
  }

  return LUXURY_FALLBACK_IMAGES.default;
}

/**
 * Returns a single primary fallback image URL for a given product or category string.
 */
export function getProductFallbackImage(product?: ProductLike | null): string {
  return getProductFallbackImages(product).primary;
}

/**
 * Comprehensive Product Image Resolver:
 * Extracts valid image URLs from all possible data shapes:
 * 1. product.images[0].url (object shape)
 * 2. product.images[0] (string shape)
 * 3. product.thumbnail
 * 4. product.image / product.imageUrl
 * 5. product.variants[0].imageUrl
 *
 * Prioritizes actual user-uploaded images over static fallback placeholders.
 * If no valid URL exists, falls back gracefully to a category-matched luxury image.
 * Guarantees zero regression on products with valid URLs.
 */
export function resolveProductImage(product?: ProductLike | null): {
  primary: string;
  hover: string;
  hasRealImage: boolean;
} {
  const fallback = getProductFallbackImages(product);

  if (!product) {
    return {
      primary: fallback.primary,
      hover: fallback.hover,
      hasRealImage: false,
    };
  }

  // 1. Gather all candidate images from all sources
  const candidateUrls: string[] = [];

  const addCandidate = (url: unknown) => {
    const clean = sanitizeImageUrl(url);
    if (clean && !candidateUrls.includes(clean)) {
      candidateUrls.push(clean);
    }
  };

  // Check thumbnail first (usually set directly on the product record)
  addCandidate(product.thumbnail);

  // Check product.images
  if (Array.isArray(product.images)) {
    for (const item of product.images) {
      if (typeof item === "string") {
        addCandidate(item);
      } else if (item && typeof item === "object") {
        addCandidate(item.url);
      }
    }
  }

  // Check image / imageUrl
  addCandidate(product.image);
  addCandidate(product.imageUrl);

  // Check variant images
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      addCandidate(v?.imageUrl);
    }
  }

  // Prioritize real user uploaded / non-fallback images
  const realCandidates = candidateUrls.filter((url) => !isFallbackImageUrl(url));
  const fallbackCandidates = candidateUrls.filter((url) => isFallbackImageUrl(url));

  if (realCandidates.length > 0) {
    return {
      primary: realCandidates[0],
      hover: realCandidates[1] || realCandidates[0],
      hasRealImage: true,
    };
  }

  if (fallbackCandidates.length > 0) {
    return {
      primary: fallbackCandidates[0],
      hover: fallbackCandidates[1] || fallbackCandidates[0],
      hasRealImage: false,
    };
  }

  return {
    primary: fallback.primary,
    hover: fallback.hover,
    hasRealImage: false,
  };
}
