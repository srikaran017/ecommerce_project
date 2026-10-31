"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Search,
  RotateCcw,
  Star,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { ProductData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";
import { INITIAL_CATEGORIES, INITIAL_OCCASIONS } from "@/config/category.config";
import { AdminService } from "@/services/admin.service";
import { transformAdminProductToProductData } from "@/services/product.service";
import {
  ApiCategory,
  CatalogFilterResponse,
  AttributeFilterGroup,
  FilterBrand,
  FilterRating,
} from "@/services/catalogApi";
import { AdminCategory } from "@/types/admin.types";
import { FALLBACK_CATEGORIES } from "@/components/layout/Navbar";

export interface CategoryGroup {
  id: string;
  label: string;
  value: string;
  children: Array<{ id: string; label: string; value: string }>;
}

const COLOR_HEX_MAP: Record<string, string> = {
  "midnight-black": "#111111",
  black: "#111111",
  "onyx-black": "#111111",
  "emerald-green": "#046307",
  green: "#046307",
  "sage-green": "#87ae73",
  "mint-green": "#98ff98",
  "crimson-red": "#990000",
  red: "#990000",
  "ruby-red": "#9b111e",
  maroon: "#800000",
  burgundy: "#800020",
  "navy-blue": "#000080",
  "royal-blue": "#4169e1",
  "sky-blue": "#87ceeb",
  blue: "#000080",
  "ivory-white": "#fcfbf7",
  ivory: "#fffff0",
  white: "#ffffff",
  "champagne-gold": "#d4af37",
  gold: "#ffd700",
  "rose-gold": "#b76e79",
  "rose-pink": "#ff66cc",
  "blush-pink": "#ffd1dc",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  lavender: "#e6e6fa",
  purple: "#800080",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
  teal: "#008080",
  mustard: "#ffdb58",
  yellow: "#eab308",
  coral: "#ff7f50",
  beige: "#f5f5dc",
};

/**
 * Resolves a hex color representation from an attribute value name or slug
 */
function getColorHex(nameOrSlug: string): string {
  const normalized = nameOrSlug.toLowerCase().trim().replace(/\s+/g, "-");
  if (COLOR_HEX_MAP[normalized]) return COLOR_HEX_MAP[normalized];
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) return hex;
  }
  return "#52525b";
}

/**
 * Splits comma-separated URL query param into an array of lowercase strings
 */
function parseMultiParam(paramValue: string | null | undefined): string[] {
  if (!paramValue) return [];
  return paramValue
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Toggles an item inside a comma-separated list
 */
function toggleInList(currentList: string[], item: string): string[] {
  const lower = item.toLowerCase().trim();
  if (currentList.includes(lower)) {
    return currentList.filter((x) => x !== lower);
  }
  return [...currentList, lower];
}

interface ProductsCatalogClientProps {
  initialProducts: ProductData[];
  initialCategories?: ApiCategory[];
  initialFilters?: CatalogFilterResponse | null;
  category?: string;
  gender?: string;
  collection?: string;
  occasion?: string;
  sort?: string;
  search?: string;
}

export function ProductsCatalogClient({
  initialProducts,
  initialCategories,
  initialFilters,
  category,
  gender,
  collection,
  occasion,
  sort,
  search,
}: ProductsCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [selectedOccasion, setSelectedOccasion] = useState(occasion || "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() =>
    parseMultiParam(searchParams.get("size"))
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(() =>
    parseMultiParam(searchParams.get("color"))
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(() =>
    parseMultiParam(searchParams.get("fabric"))
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() =>
    parseMultiParam(searchParams.get("brand"))
  );
  const [selectedMinPrice, setSelectedMinPrice] = useState(searchParams.get("minPrice") || "");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [priceInputMin, setPriceInputMin] = useState(searchParams.get("minPrice") || "");
  const [priceInputMax, setPriceInputMax] = useState(searchParams.get("maxPrice") || "");
  const [selectedRating, setSelectedRating] = useState(searchParams.get("rating") || "");
  const [selectedSort, setSelectedSort] = useState(sort || "featured");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const p = searchParams.get("page");
    return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    const l = searchParams.get("limit");
    return l ? parseInt(l, 10) || 12 : 12;
  });

  // Keep state in sync if URL searchParams change
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || category || "");
    setSelectedOccasion(searchParams.get("occasion") || occasion || "");
    setSelectedSizes(parseMultiParam(searchParams.get("size")));
    setSelectedColors(parseMultiParam(searchParams.get("color")));
    setSelectedFabrics(parseMultiParam(searchParams.get("fabric")));
    setSelectedBrands(parseMultiParam(searchParams.get("brand")));
    setSelectedMinPrice(searchParams.get("minPrice") || "");
    setSelectedMaxPrice(searchParams.get("maxPrice") || "");
    setPriceInputMin(searchParams.get("minPrice") || "");
    setPriceInputMax(searchParams.get("maxPrice") || "");
    setSelectedRating(searchParams.get("rating") || "");
    setInStockOnly(searchParams.get("inStock") === "true");
    setSelectedSort(searchParams.get("sort") || sort || "featured");

    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(Math.max(1, parseInt(pageParam, 10) || 1));
    } else {
      setCurrentPage(1);
    }

    const limitParam = searchParams.get("limit");
    if (limitParam) {
      setPageSize(parseInt(limitParam, 10) || 12);
    }
  }, [searchParams, category, occasion, sort]);

  const [allProducts, setAllProducts] = useState<ProductData[]>(initialProducts);
  const [localCategories, setLocalCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    setAllProducts(initialProducts);
  }, [initialProducts]);

  // Synchronize dynamic products added/edited by admin in real-time
  const syncDynamicProducts = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const localAdminProducts = AdminService.getLocalProducts();
      if (!localAdminProducts || localAdminProducts.length === 0) return;

      setAllProducts((prev) => {
        let updated = [...prev];
        const inactiveIds = new Set(
          localAdminProducts
            .filter((p) => !p.isActive || p.status === "ARCHIVED")
            .map((p) => p.id)
        );

        // Remove products archived/deactivated by admin
        updated = updated.filter((p) => !inactiveIds.has(p.id));

        // Add or update active products added/edited by admin
        localAdminProducts.forEach((adminP) => {
          if (adminP.isActive && adminP.status !== "ARCHIVED") {
            const transformed = transformAdminProductToProductData(adminP);
            const idx = updated.findIndex(
              (p) => p.id === adminP.id || p.slug === adminP.slug
            );
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], ...transformed };
            } else {
              updated.unshift(transformed);
            }
          }
        });

        return updated;
      });
    } catch (e) {
      console.warn("Failed to sync dynamic products in ProductsCatalogClient:", e);
    }
  }, []);

  // Synchronize dynamic categories added/edited by admin in real-time
  const syncDynamicCategories = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const localCats = AdminService.getLocalCategories();
      if (localCats && localCats.length > 0) {
        setLocalCategories(localCats);
      }
    } catch (e) {
      console.warn("Failed to sync dynamic categories in ProductsCatalogClient:", e);
    }
  }, []);

  useEffect(() => {
    syncDynamicProducts();
    syncDynamicCategories();

    const handleDataChange = () => {
      syncDynamicProducts();
      syncDynamicCategories();
    };

    window.addEventListener("products-changed", handleDataChange);
    window.addEventListener("categories-changed", handleDataChange);
    window.addEventListener("storage", handleDataChange);
    return () => {
      window.removeEventListener("products-changed", handleDataChange);
      window.removeEventListener("categories-changed", handleDataChange);
      window.removeEventListener("storage", handleDataChange);
    };
  }, [syncDynamicProducts, syncDynamicCategories]);

  // Hierarchical category groups (Root Departments -> Subcategories)
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const rawRoots: ApiCategory[] =
      initialCategories && initialCategories.length > 0
        ? initialCategories
        : (FALLBACK_CATEGORIES as ApiCategory[]);

    const groups: CategoryGroup[] = [];
    const groupMap = new Map<string, CategoryGroup>();
    const registeredSubSlugs = new Set<string>();

    // 1. Process root categories from API tree
    rawRoots.forEach((cat) => {
      const childrenList: Array<{ id: string; label: string; value: string }> = [];

      function extractChildren(subs?: ApiCategory[]) {
        if (!subs) return;
        subs.forEach((sub) => {
          if (!childrenList.some((c) => c.value === sub.slug)) {
            childrenList.push({ id: sub.id, label: sub.name, value: sub.slug });
            registeredSubSlugs.add(sub.slug);
          }
          if (sub.children && sub.children.length > 0) {
            extractChildren(sub.children);
          }
        });
      }

      extractChildren(cat.children);

      const group: CategoryGroup = {
        id: cat.id || cat.slug,
        label: cat.name,
        value: cat.slug,
        children: childrenList,
      };

      groups.push(group);
      groupMap.set(cat.slug, group);
      if (cat.id) groupMap.set(cat.id, group);
    });

    // 2. Ingest localCategories from Admin portal (live updates)
    localCategories.forEach((cat) => {
      if (cat.isActive === false) return;

      if (cat.parentId) {
        // Child category created in admin
        const parentGroup =
          groupMap.get(cat.parentId) ||
          groups.find((g) => g.id === cat.parentId || g.value === cat.parentId);

        if (parentGroup) {
          if (!parentGroup.children.some((c) => c.value === cat.slug)) {
            parentGroup.children.push({ id: cat.id, label: cat.name, value: cat.slug });
            registeredSubSlugs.add(cat.slug);
          }
          return;
        }
      }

      // Root category created in admin
      if (!groupMap.has(cat.slug)) {
        const newGroup: CategoryGroup = {
          id: cat.id,
          label: cat.name,
          value: cat.slug,
          children: [],
        };
        groups.push(newGroup);
        groupMap.set(cat.slug, newGroup);
        if (cat.id) groupMap.set(cat.id, newGroup);
      }
    });

    // 3. Ingest any remaining subcategories from allProducts
    allProducts.forEach((p) => {
      if (!p.categorySlug) return;
      const isAlreadyCovered =
        groups.some((g) => g.value === p.categorySlug) || registeredSubSlugs.has(p.categorySlug);

      if (!isAlreadyCovered) {
        // Check if product's parent category matches any group
        const parentSlug = p.categoryData?.parent?.slug;
        const targetGroup = parentSlug ? groupMap.get(parentSlug) : null;

        if (targetGroup) {
          targetGroup.children.push({
            id: p.categorySlug,
            label: p.categoryName || p.categorySlug.replace(/-/g, " "),
            value: p.categorySlug,
          });
          registeredSubSlugs.add(p.categorySlug);
        } else if (groups.length > 0) {
          // Add as child to the first matching or last general group
          groups[groups.length - 1].children.push({
            id: p.categorySlug,
            label: p.categoryName || p.categorySlug.replace(/-/g, " "),
            value: p.categorySlug,
          });
          registeredSubSlugs.add(p.categorySlug);
        }
      }
    });

    return groups;
  }, [initialCategories, localCategories, allProducts]);

  // Flat categories list (contains All Products + all roots + all subcategories)
  const categories = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [
      { label: "All Products", value: "" },
    ];
    const seen = new Set<string>([""]);

    categoryGroups.forEach((g) => {
      if (!seen.has(g.value)) {
        seen.add(g.value);
        list.push({ label: g.label, value: g.value });
      }
      g.children.forEach((c) => {
        if (!seen.has(c.value)) {
          seen.add(c.value);
          list.push({ label: c.label, value: c.value });
        }
      });
    });

    return list;
  }, [categoryGroups]);

  // Dynamic product counts by category slug
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach((p) => {
      if (p.categorySlug) {
        counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
      }
      if (p.subcategorySlug) {
        counts[p.subcategorySlug] = (counts[p.subcategorySlug] || 0) + 1;
      }
      if (p.categoryData?.slug) {
        counts[p.categoryData.slug] = (counts[p.categoryData.slug] || 0) + 1;
      }
      if (p.categoryData?.parent?.slug) {
        counts[p.categoryData.parent.slug] = (counts[p.categoryData.parent.slug] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  const getGroupCount = useCallback(
    (group: CategoryGroup) => {
      let count = categoryCounts[group.value] || 0;
      group.children.forEach((c) => {
        count += categoryCounts[c.value] || 0;
      });
      return count;
    },
    [categoryCounts]
  );

  // Auto-expand group containing selectedCategory
  useEffect(() => {
    if (!selectedCategory) return;
    const parentGroup = categoryGroups.find(
      (g) => g.value === selectedCategory || g.children.some((c) => c.value === selectedCategory)
    );
    if (parentGroup) {
      setExpandedGroups((prev) => ({ ...prev, [parentGroup.value]: true }));
    }
  }, [selectedCategory, categoryGroups]);

  const toggleGroupExpanded = (groupValue: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupValue]: !prev[groupValue],
    }));
  };

  // Instant category search filter
  const filteredSearchCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return [];
    const q = categorySearchQuery.toLowerCase().trim();
    return categories.filter((c) => c.value && c.label.toLowerCase().includes(q));
  }, [categories, categorySearchQuery]);

  // Active department for top horizontal subcategory pills
  const activeDepartment = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      categoryGroups.find(
        (g) => g.value === selectedCategory || g.children.some((c) => c.value === selectedCategory)
      ) || null
    );
  }, [selectedCategory, categoryGroups]);

  // Dynamic occasions
  const occasions = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [
      { label: "All Occasions", value: "" },
    ];
    const seen = new Set<string>([""]);

    INITIAL_OCCASIONS.forEach((o) => {
      if (!seen.has(o.slug)) {
        seen.add(o.slug);
        list.push({ label: o.name, value: o.slug });
      }
    });

    allProducts.forEach((p) => {
      p.occasionSlugs?.forEach((occ) => {
        if (!seen.has(occ)) {
          seen.add(occ);
          list.push({
            label: occ.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            value: occ,
          });
        }
      });
    });

    return list;
  }, [allProducts]);

  // Dynamic filter facet resolution: Uses backend aggregated facets, gracefully falling back to client-derived data
  const facetAttributes = useMemo(() => {
    return initialFilters?.attributes || [];
  }, [initialFilters]);

  // Color attribute options
  const colorOptions = useMemo(() => {
    const colorAttr = facetAttributes.find(
      (a) => a.slug === "color" || a.name.toLowerCase() === "color"
    );
    if (colorAttr && colorAttr.values.length > 0) {
      return colorAttr.values;
    }
    return [
      { id: "c1", name: "Midnight Black", slug: "midnight-black", count: 0 },
      { id: "c2", name: "Emerald Green", slug: "emerald-green", count: 0 },
      { id: "c3", name: "Crimson Red", slug: "crimson-red", count: 0 },
      { id: "c4", name: "Navy Blue", slug: "navy-blue", count: 0 },
      { id: "c5", name: "Ivory White", slug: "ivory-white", count: 0 },
      { id: "c6", name: "Champagne Gold", slug: "champagne-gold", count: 0 },
      { id: "c7", name: "Onyx Black", slug: "onyx-black", count: 0 },
    ];
  }, [facetAttributes]);

  // Size attribute options
  const sizeOptions = useMemo(() => {
    const sizeAttr = facetAttributes.find(
      (a) => a.slug === "size" || a.name.toLowerCase() === "size"
    );
    if (sizeAttr && sizeAttr.values.length > 0) {
      return sizeAttr.values;
    }
    const extracted = Array.from(
      new Set(
        allProducts
          .flatMap((p) => p.variants?.map((v) => v.size) || [])
          .filter(Boolean)
      )
    );
    const fallbackList = extracted.length > 0 ? extracted : ["S", "M", "L", "XL", "Free Size"];
    return fallbackList.map((s) => ({
      id: `size-${s}`,
      name: s,
      slug: s.toLowerCase(),
      count: 0,
    }));
  }, [facetAttributes, allProducts]);

  // Fabric attribute options
  const fabricOptions = useMemo(() => {
    const fabricAttr = facetAttributes.find(
      (a) => a.slug === "fabric" || a.name.toLowerCase() === "fabric"
    );
    if (fabricAttr && fabricAttr.values.length > 0) {
      return fabricAttr.values;
    }
    return [];
  }, [facetAttributes]);

  // Occasion attribute options from facets
  const occasionAttrOptions = useMemo(() => {
    const occAttr = facetAttributes.find(
      (a) => a.slug === "occasion" || a.name.toLowerCase() === "occasion"
    );
    if (occAttr && occAttr.values.length > 0) {
      return occAttr.values;
    }
    return [];
  }, [facetAttributes]);

  // Brand options
  const brandOptions = useMemo(() => {
    if (initialFilters?.brands && initialFilters.brands.length > 0) {
      return initialFilters.brands;
    }
    const map = new Map<string, number>();
    allProducts.forEach((p) => {
      if (p.brand?.trim()) {
        const b = p.brand.trim();
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialFilters, allProducts]);

  // Dynamic price range boundaries
  const priceRangeBounds = useMemo(() => {
    if (
      initialFilters?.priceRange &&
      (initialFilters.priceRange.min > 0 || initialFilters.priceRange.max > 0)
    ) {
      return initialFilters.priceRange;
    }
    let min = Infinity;
    let max = 0;
    allProducts.forEach((p) => {
      const eff = p.priceObject?.effective ?? p.price ?? 0;
      if (eff > 0) {
        if (eff < min) min = eff;
        if (eff > max) max = eff;
      }
    });
    return {
      min: min === Infinity ? 1000 : min,
      max: max === 0 ? 100000 : max,
    };
  }, [initialFilters, allProducts]);

  // Ratings options
  const ratingOptions = useMemo(() => {
    if (initialFilters?.ratings && initialFilters.ratings.length > 0) {
      return initialFilters.ratings;
    }
    return [
      {
        rating: 4,
        label: "4★ & above",
        count: allProducts.filter((p) => (p.averageRating ?? 5) >= 4).length,
      },
      {
        rating: 3,
        label: "3★ & above",
        count: allProducts.filter((p) => (p.averageRating ?? 5) >= 3).length,
      },
    ];
  }, [initialFilters, allProducts]);

  // Availability counts
  const availabilityCounts = useMemo(() => {
    if (initialFilters?.availability) {
      return initialFilters.availability;
    }
    const inStock = allProducts.filter((p) => (p.stockQuantity ?? p.stock) > 0).length;
    return {
      inStock,
      outOfStock: allProducts.length - inStock,
    };
  }, [initialFilters, allProducts]);

  const sortOptions = [
    { label: "Recommended", value: "featured" },
    { label: "Newest Arrivals", value: "newest" },
    { label: "Best Sellers", value: "bestselling" },
    { label: "Sale & Offers", value: "best_deals" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Top Rated", value: "rating" },
    { label: "Alphabetical: A to Z", value: "name_asc" },
    { label: "Alphabetical: Z to A", value: "name_desc" },
  ];

  // Dynamically filtered and sorted product list
  const displayProducts = useMemo(() => {
    let list = [...allProducts];

    // Search query filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      const activeGroup = categoryGroups.find((g) => g.value === selectedCategory);
      const targetSlugs = new Set<string>([selectedCategory]);
      if (activeGroup && activeGroup.children.length > 0) {
        activeGroup.children.forEach((c) => targetSlugs.add(c.value));
      }

      list = list.filter(
        (p) =>
          targetSlugs.has(p.categorySlug) ||
          (p.categoryData?.slug && targetSlugs.has(p.categoryData.slug)) ||
          (p.categoryData?.id && targetSlugs.has(p.categoryData.id)) ||
          (p.categoryData?.parent?.slug && targetSlugs.has(p.categoryData.parent.slug)) ||
          (p.subcategorySlug && targetSlugs.has(p.subcategorySlug))
      );
    }

    // Occasion filter
    if (selectedOccasion) {
      const targetOccasions = selectedOccasion
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      list = list.filter((p) =>
        targetOccasions.some(
          (occ) =>
            p.occasionSlugs?.includes(occ) ||
            p.tags?.some((t) => t.toLowerCase().includes(occ)) ||
            p.description?.toLowerCase().includes(occ) ||
            (p as any).dynamicAttributes?.some(
              (a: any) =>
                (a.attributeSlug === "occasion" || a.attributeName?.toLowerCase() === "occasion") &&
                (a.valueSlug?.toLowerCase() === occ || a.value?.toLowerCase().includes(occ))
            )
        )
      );
    }

    // Multi-select Sizes filter
    if (selectedSizes.length > 0) {
      list = list.filter((p) =>
        p.variants?.some((v) =>
          v.size && selectedSizes.includes(v.size.toLowerCase())
        ) ||
        (p as any).dynamicAttributes?.some(
          (a: any) =>
            (a.attributeSlug === "size" || a.attributeName?.toLowerCase() === "size") &&
            selectedSizes.some((s) => a.valueSlug?.toLowerCase() === s || a.value?.toLowerCase() === s)
        )
      );
    }

    // Multi-select Colors filter
    if (selectedColors.length > 0) {
      list = list.filter((p) =>
        p.variants?.some((v) =>
          selectedColors.some(
            (c) =>
              v.colorName?.toLowerCase().includes(c) ||
              v.colorHex?.toLowerCase() === c
          )
        ) ||
        p.tags?.some((t) => selectedColors.some((c) => t.toLowerCase().includes(c))) ||
        (p as any).dynamicAttributes?.some(
          (a: any) =>
            (a.attributeSlug === "color" || a.attributeName?.toLowerCase() === "color") &&
            selectedColors.some((c) => a.valueSlug?.toLowerCase() === c || a.value?.toLowerCase().includes(c))
        )
      );
    }

    // Multi-select Fabrics filter
    if (selectedFabrics.length > 0) {
      list = list.filter((p) =>
        selectedFabrics.some(
          (f) =>
            p.fabric?.toLowerCase().includes(f) ||
            p.tags?.some((t) => t.toLowerCase().includes(f)) ||
            (p as any).dynamicAttributes?.some(
              (a: any) =>
                a.attributeSlug === "fabric" &&
                selectedFabrics.includes(a.valueSlug?.toLowerCase())
            )
        )
      );
    }

    // Multi-select Brands filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) =>
        p.brand && selectedBrands.some((b) => p.brand.toLowerCase() === b.toLowerCase())
      );
    }

    // Min / Max Price
    if (selectedMinPrice) {
      const min = parseFloat(selectedMinPrice);
      if (!isNaN(min)) {
        list = list.filter((p) => (p.priceObject?.effective ?? p.price ?? 0) >= min);
      }
    }
    if (selectedMaxPrice) {
      const max = parseFloat(selectedMaxPrice);
      if (!isNaN(max)) {
        list = list.filter((p) => (p.priceObject?.effective ?? p.price ?? 0) <= max);
      }
    }

    // Rating filter
    if (selectedRating) {
      const minR = parseFloat(selectedRating);
      if (!isNaN(minR)) {
        list = list.filter((p) => (p.averageRating ?? 5) >= minR);
      }
    }

    // In Stock Only filter
    if (inStockOnly) {
      list = list.filter((p) => (p.stockQuantity ?? p.stock) > 0);
    }

    // Sorting
    list.sort((a, b) => {
      const priceA = a.priceObject?.effective ?? a.price ?? 0;
      const priceB = b.priceObject?.effective ?? b.price ?? 0;

      switch (selectedSort) {
        case "price_asc":
        case "price-low":
          return priceA - priceB;
        case "price_desc":
        case "price-high":
          return priceB - priceA;
        case "best_deals":
        case "discount": {
          const discA = a.priceObject?.discountPercentage ?? 0;
          const discB = b.priceObject?.discountPercentage ?? 0;
          return discB - discA;
        }
        case "rating":
        case "highest-rated":
          return (b.averageRating ?? 5) - (a.averageRating ?? 5);
        case "bestselling":
        case "best-selling":
          return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return 0;
        case "featured":
        default:
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
      }
    });

    return list;
  }, [
    allProducts,
    search,
    selectedCategory,
    categoryGroups,
    selectedOccasion,
    selectedSizes,
    selectedColors,
    selectedFabrics,
    selectedBrands,
    selectedMinPrice,
    selectedMaxPrice,
    selectedRating,
    inStockOnly,
    selectedSort,
  ]);

  // Derived Pagination Calculations
  const totalCount = displayProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return displayProducts.slice(start, start + pageSize);
  }, [displayProducts, safePage, pageSize]);

  // Reset page if filtered results shrink below currentPage
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const updateFilters = (
    overrides: Record<string, string | null>,
    resetPage = true
  ) => {
    const current = new URLSearchParams(searchParams.toString());

    if (resetPage && !("page" in overrides)) {
      current.delete("page");
      setCurrentPage(1);
    }

    Object.entries(overrides).forEach(([key, val]) => {
      if (val === null || val === "") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    router.push(`/products?${current.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateFilters({ page: String(newPage) }, false);

    // Smooth scroll to top of catalog
    if (typeof window !== "undefined") {
      const el = document.getElementById("catalog-results");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 300, behavior: "smooth" });
      }
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    updateFilters({ limit: String(newSize), page: "1" }, false);
  };

  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategory(catSlug);
    updateFilters({ category: catSlug || null });
  };

  const handleOccasionChange = (occSlug: string) => {
    setSelectedOccasion(occSlug);
    updateFilters({ occasion: occSlug || null });
  };

  const handleToggleSize = (sizeSlug: string) => {
    const next = toggleInList(selectedSizes, sizeSlug);
    setSelectedSizes(next);
    updateFilters({ size: next.length > 0 ? next.join(",") : null });
  };

  const handleToggleColor = (colorSlug: string) => {
    const next = toggleInList(selectedColors, colorSlug);
    setSelectedColors(next);
    updateFilters({ color: next.length > 0 ? next.join(",") : null });
  };

  const handleToggleFabric = (fabricSlug: string) => {
    const next = toggleInList(selectedFabrics, fabricSlug);
    setSelectedFabrics(next);
    updateFilters({ fabric: next.length > 0 ? next.join(",") : null });
  };

  const handleToggleBrand = (brandName: string) => {
    const next = toggleInList(selectedBrands, brandName);
    setSelectedBrands(next);
    updateFilters({ brand: next.length > 0 ? next.join(",") : null });
  };

  const handleToggleRating = (ratingVal: number) => {
    const strVal = String(ratingVal);
    const next = selectedRating === strVal ? null : strVal;
    setSelectedRating(next || "");
    updateFilters({ rating: next });
  };

  const applyPriceFilter = () => {
    const minVal = priceInputMin.trim() ? priceInputMin.trim() : null;
    const maxVal = priceInputMax.trim() ? priceInputMax.trim() : null;
    setSelectedMinPrice(minVal || "");
    setSelectedMaxPrice(maxVal || "");
    updateFilters({ minPrice: minVal, maxPrice: maxVal });
  };

  const clearPriceFilter = () => {
    setPriceInputMin("");
    setPriceInputMax("");
    setSelectedMinPrice("");
    setSelectedMaxPrice("");
    updateFilters({ minPrice: null, maxPrice: null });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSort = e.target.value;
    setSelectedSort(nextSort);
    updateFilters({ sort: nextSort });
  };

  const handleInStockToggle = () => {
    const next = !inStockOnly;
    setInStockOnly(next);
    updateFilters({ inStock: next ? "true" : null });
  };

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedOccasion("");
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFabrics([]);
    setSelectedBrands([]);
    setSelectedMinPrice("");
    setSelectedMaxPrice("");
    setPriceInputMin("");
    setPriceInputMax("");
    setSelectedRating("");
    setInStockOnly(false);
    setSelectedSort("featured");
    router.push("/products");
  };

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedOccasion) ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedBrands.length > 0 ||
    Boolean(selectedMinPrice) ||
    Boolean(selectedMaxPrice) ||
    Boolean(selectedRating) ||
    inStockOnly ||
    Boolean(search);

  /**
   * Renders the multifaceted dynamic filter sections (shared across desktop sidebar and mobile drawer)
   */
  const renderFacetFilters = (isMobile: boolean = false) => (
    <div className="space-y-6">
      {/* 1. Category Filter Accordion + Instant Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Category
          </h3>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryChange("")}
              className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Instant Category Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all placeholder:text-neutral-400"
          />
          {categorySearchQuery && (
            <button
              onClick={() => setCategorySearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Categories List */}
        <div
          className={`space-y-1 ${
            isMobile ? "max-h-60" : "max-h-[380px]"
          } overflow-y-auto pr-1 scrollbar-thin`}
        >
          {!categorySearchQuery && (
            <button
              onClick={() => handleCategoryChange("")}
              className={`w-full text-left text-xs uppercase font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                !selectedCategory
                  ? "bg-neutral-900 text-white font-bold shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <span>All Products</span>
              {!selectedCategory && <Check className="w-3.5 h-3.5" />}
            </button>
          )}

          {categorySearchQuery ? (
            filteredSearchCategories.length === 0 ? (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs text-neutral-400">No categories found</p>
                <button
                  onClick={() => setCategorySearchQuery("")}
                  className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSearchCategories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    handleCategoryChange(c.value);
                    setCategorySearchQuery("");
                  }}
                  className={`w-full text-left text-xs uppercase font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === c.value
                      ? "bg-neutral-900 text-white font-bold shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  <span>{c.label}</span>
                  {selectedCategory === c.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )
          ) : (
            categoryGroups.map((group) => {
              const isGroupActive =
                selectedCategory === group.value ||
                group.children.some((c) => c.value === selectedCategory);
              const isExpanded = Boolean(expandedGroups[group.value]);
              const count = getGroupCount(group);

              return (
                <div key={group.value} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleCategoryChange(group.value)}
                      className={`flex-1 text-left text-xs uppercase font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === group.value
                          ? "bg-neutral-900 text-white shadow-sm"
                          : isGroupActive
                          ? "text-neutral-900 bg-neutral-100/90 font-bold"
                          : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <span className="truncate">{group.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ml-1 ${
                            selectedCategory === group.value
                              ? "bg-neutral-700 text-white"
                              : "bg-neutral-200/70 text-neutral-600"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                    {group.children.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleGroupExpanded(group.value)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer transition-colors"
                        aria-label={`Toggle ${group.label}`}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {isExpanded && group.children.length > 0 && (
                    <div className="pl-3 ml-2.5 border-l-2 border-neutral-100 space-y-0.5 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {group.children.map((sub) => {
                        const isSubSelected = selectedCategory === sub.value;
                        const subCount = categoryCounts[sub.value] || 0;
                        return (
                          <button
                            key={sub.value}
                            onClick={() => handleCategoryChange(sub.value)}
                            className={`w-full text-left text-[11px] font-medium py-1 px-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                              isSubSelected
                                ? "bg-amber-100/70 text-amber-950 font-bold"
                                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            <div className="flex items-center gap-1">
                              {subCount > 0 && (
                                <span className="text-[9px] text-neutral-400">
                                  {subCount}
                                </span>
                              )}
                              {isSubSelected && (
                                <Check className="w-3 h-3 text-amber-800" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Price Range Slider / Boundary Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Price Range
          </h3>
          {(selectedMinPrice || selectedMaxPrice) && (
            <button
              onClick={clearPriceFilter}
              className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                ₹
              </span>
              <input
                type="number"
                value={priceInputMin}
                onChange={(e) => setPriceInputMin(e.target.value)}
                placeholder={String(priceRangeBounds.min)}
                className="w-full text-xs pl-6 pr-2 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all font-mono"
              />
            </div>
            <span className="text-xs text-neutral-400">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                ₹
              </span>
              <input
                type="number"
                value={priceInputMax}
                onChange={(e) => setPriceInputMax(e.target.value)}
                placeholder={String(priceRangeBounds.max)}
                className="w-full text-xs pl-6 pr-2 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-400">
              ₹{priceRangeBounds.min.toLocaleString()} – ₹{priceRangeBounds.max.toLocaleString()}
            </span>
            <button
              onClick={applyPriceFilter}
              className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* 3. Garment Sizes (Multi-Select) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Sizes {selectedSizes.length > 0 && `(${selectedSizes.length})`}
          </h3>
          {selectedSizes.length > 0 && (
            <button
              onClick={() => {
                setSelectedSizes([]);
                updateFilters({ size: null });
              }}
              className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {sizeOptions.map((s) => {
            const isSelected = selectedSizes.includes(s.slug);
            return (
              <button
                key={s.id}
                onClick={() => handleToggleSize(s.slug)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50"
                }`}
              >
                <span>{s.name}</span>
                {s.count > 0 && (
                  <span
                    className={`text-[9px] font-normal ${
                      isSelected ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    ({s.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Color Swatches (Multi-Select) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Colors {selectedColors.length > 0 && `(${selectedColors.length})`}
          </h3>
          {selectedColors.length > 0 && (
            <button
              onClick={() => {
                setSelectedColors([]);
                updateFilters({ color: null });
              }}
              className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {colorOptions.map((col) => {
            const isSelected = selectedColors.includes(col.slug);
            const hex = getColorHex(col.slug || col.name);
            const isWhiteOrLight =
              col.name.toLowerCase().includes("ivory") ||
              col.name.toLowerCase().includes("white") ||
              hex.toLowerCase() === "#ffffff";

            return (
              <button
                key={col.id}
                onClick={() => handleToggleColor(col.slug)}
                title={`${col.name}${col.count > 0 ? ` (${col.count})` : ""}`}
                className={`relative w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "ring-2 ring-neutral-900 ring-offset-2 scale-110 shadow-sm"
                    : "border-neutral-300 hover:scale-105"
                }`}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      isWhiteOrLight ? "text-neutral-900" : "text-white"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Fabrics (Multi-Select, if available) */}
      {fabricOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Fabric {selectedFabrics.length > 0 && `(${selectedFabrics.length})`}
            </h3>
            {selectedFabrics.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFabrics([]);
                  updateFilters({ fabric: null });
                }}
                className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {fabricOptions.map((f) => {
              const isSelected = selectedFabrics.includes(f.slug);
              return (
                <button
                  key={f.id}
                  onClick={() => handleToggleFabric(f.slug)}
                  className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white font-bold shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  <div className="flex items-center gap-1.5">
                    {f.count > 0 && (
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        ({f.count})
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Brands (Multi-Select, if available) */}
      {brandOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Brands {selectedBrands.length > 0 && `(${selectedBrands.length})`}
            </h3>
            {selectedBrands.length > 0 && (
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  updateFilters({ brand: null });
                }}
                className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {brandOptions.map((b) => {
              const isSelected = selectedBrands.includes(b.name);
              return (
                <button
                  key={b.name}
                  onClick={() => handleToggleBrand(b.name)}
                  className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white font-bold shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <div className="flex items-center gap-1.5">
                    {b.count > 0 && (
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        ({b.count})
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Shop By Occasion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Shop By Occasion
          </h3>
          {selectedOccasion && (
            <button
              onClick={() => handleOccasionChange("")}
              className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {occasions.map((o) => {
            const isSelected = selectedOccasion === o.value;
            const matchedOccAttr = occasionAttrOptions.find(
              (oa) =>
                oa.slug === o.value ||
                oa.name.toLowerCase() === o.label.toLowerCase()
            );

            return (
              <button
                key={o.value}
                onClick={() => handleOccasionChange(o.value)}
                className={`w-full text-left text-xs uppercase font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white font-bold shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <span>{o.label}</span>
                <div className="flex items-center gap-1.5">
                  {matchedOccAttr && matchedOccAttr.count > 0 && (
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      ({matchedOccAttr.count})
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Any Other Dynamic Attributes */}
      {facetAttributes
        .filter(
          (attr) =>
            !["color", "size", "fabric", "occasion"].includes(
              attr.slug.toLowerCase()
            )
        )
        .map((attr) => (
          <div key={attr.id} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
              {attr.name}
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {attr.values.map((val) => {
                const currentVals = parseMultiParam(searchParams.get(attr.slug));
                const isSelected = currentVals.includes(val.slug);
                return (
                  <button
                    key={val.id}
                    onClick={() => {
                      const next = toggleInList(currentVals, val.slug);
                      updateFilters({
                        [attr.slug]: next.length > 0 ? next.join(",") : null,
                      });
                    }}
                    className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 text-white font-bold shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    }`}
                  >
                    <span>{val.name}</span>
                    <div className="flex items-center gap-1.5">
                      {val.count > 0 && (
                        <span
                          className={`text-[10px] ${
                            isSelected ? "text-neutral-300" : "text-neutral-400"
                          }`}
                        >
                          ({val.count})
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {/* 9. Customer Ratings Filter */}
      {ratingOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Ratings
            </h3>
            {selectedRating && (
              <button
                onClick={() => updateFilters({ rating: null })}
                className="text-[10px] font-bold text-amber-700 hover:underline uppercase cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {ratingOptions.map((r) => {
              const isSelected = selectedRating === String(r.rating);
              return (
                <button
                  key={r.rating}
                  onClick={() => handleToggleRating(r.rating)}
                  className={`w-full text-left text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white font-bold shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star
                      className={`w-3.5 h-3.5 fill-amber-400 ${
                        isSelected ? "text-amber-300" : "text-amber-500"
                      }`}
                    />
                    <span>{r.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {r.count > 0 && (
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        ({r.count})
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. Availability In-Stock Toggle */}
      <div className="pt-2 border-t border-neutral-100">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              In Stock Only
            </span>
            {availabilityCounts.inStock > 0 && (
              <span className="text-[10px] text-neutral-400 block font-normal">
                {availabilityCounts.inStock} silhouettes available
              </span>
            )}
          </div>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={handleInStockToggle}
            className="w-4 h-4 rounded-md accent-neutral-900 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );

  return (
    <div className="py-8 sm:py-12 bg-neutral-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Shop Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700">
            OUR COMPLETE COLLECTION
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-neutral-900">
            {search
              ? `SEARCH: "${search}"`
              : selectedCategory
              ? categories.find((c) => c.value === selectedCategory)?.label
              : selectedOccasion
              ? occasions.find((o) => o.value === selectedOccasion)?.label
              : "SHOP ALL"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Discover handcrafted silhouettes, pure silk weaves, and bespoke festive ensembles.
          </p>
        </div>

        {/* Dynamic Horizontal Category Chips Selector (Clean Two-Tier Navigation) */}
        <div className="flex flex-col gap-2.5 mb-8">
          {/* Master Departments Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
            <button
              onClick={() => handleCategoryChange("")}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                !selectedCategory
                  ? "bg-neutral-900 text-white shadow-md"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              All Products
            </button>
            {categoryGroups.map((group) => {
              const isGroupActive =
                selectedCategory === group.value ||
                group.children.some((c) => c.value === selectedCategory);
              return (
                <button
                  key={group.value}
                  onClick={() => handleCategoryChange(group.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                    isGroupActive
                      ? "bg-neutral-900 text-white shadow-md"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
            <Link
              href="/categories"
              className="px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1"
            >
              <span>Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Subcategory Refinement Chips (Shown when a department is active) */}
          {activeDepartment && activeDepartment.children.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">
                Refine {activeDepartment.label}:
              </span>
              <button
                onClick={() => handleCategoryChange(activeDepartment.value)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                  selectedCategory === activeDepartment.value
                    ? "bg-amber-700 text-white border-amber-700 shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                }`}
              >
                All {activeDepartment.label}
              </button>
              {activeDepartment.children.map((sub) => {
                const isSelected = selectedCategory === sub.value;
                return (
                  <button
                    key={sub.value}
                    onClick={() => handleCategoryChange(sub.value)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? "bg-amber-700 text-white border-amber-700 shadow-sm"
                        : "bg-white text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Bar & Sort Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-neutral-200/80 mb-8 bg-white px-4 sm:px-6 rounded-2xl shadow-sm">
          
          {/* Left: Mobile Filter Trigger & Count */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && "• Active"}</span>
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Showing{" "}
              {displayProducts.length === 0
                ? "0"
                : `${(safePage - 1) * pageSize + 1}–${Math.min(
                    safePage * pageSize,
                    displayProducts.length
                  )}`}{" "}
              of {displayProducts.length}{" "}
              {displayProducts.length === 1 ? "Silhouette" : "Silhouettes"}
            </span>
          </div>

          {/* Right: Items Per Page & Quick Sort */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-500 uppercase tracking-wider">
                Show:
              </span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-neutral-700 uppercase tracking-wider">
                Sort:
              </span>
              <select
                value={selectedSort}
                onChange={handleSortChange}
                className="bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3.5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
              Active:
            </span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold uppercase border border-amber-200/90">
                {categories.find((c) => c.value === selectedCategory)?.label || selectedCategory}
                <button
                  onClick={() => handleCategoryChange("")}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedOccasion && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold uppercase border border-amber-200/90">
                {occasions.find((o) => o.value === selectedOccasion)?.label || selectedOccasion}
                <button
                  onClick={() => handleOccasionChange("")}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove occasion filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSizes.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200"
              >
                Size: {s.toUpperCase()}
                <button
                  onClick={() => handleToggleSize(s)}
                  className="hover:text-rose-600 cursor-pointer"
                  title={`Remove size ${s}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedColors.map((c) => {
              const matched = colorOptions.find(
                (co) => co.slug === c || co.name.toLowerCase() === c
              );
              return (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: getColorHex(c) }}
                  />
                  Color: {matched?.name || c}
                  <button
                    onClick={() => handleToggleColor(c)}
                    className="hover:text-rose-600 cursor-pointer"
                    title={`Remove color ${c}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {selectedFabrics.map((f) => {
              const matched = fabricOptions.find(
                (fo) => fo.slug === f || fo.name.toLowerCase() === f
              );
              return (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200"
                >
                  Fabric: {matched?.name || f}
                  <button
                    onClick={() => handleToggleFabric(f)}
                    className="hover:text-rose-600 cursor-pointer"
                    title={`Remove fabric ${f}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200"
              >
                Brand: {b}
                <button
                  onClick={() => handleToggleBrand(b)}
                  className="hover:text-rose-600 cursor-pointer"
                  title={`Remove brand ${b}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {(selectedMinPrice || selectedMaxPrice) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200">
                Price: ₹{Number(selectedMinPrice || priceRangeBounds.min).toLocaleString()} – ₹{Number(selectedMaxPrice || priceRangeBounds.max).toLocaleString()}
                <button
                  onClick={clearPriceFilter}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove price boundary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold uppercase border border-amber-200/90">
                {selectedRating}★ & above
                <button
                  onClick={() => updateFilters({ rating: null })}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove rating filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-xs font-bold uppercase border border-emerald-200">
                In Stock Only
                <button
                  onClick={handleInStockToggle}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove in-stock filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs font-bold uppercase text-amber-700 hover:text-amber-900 hover:underline ml-auto cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* Main Grid: Desktop Sidebar (3 Cols) + 4-Col Products Grid (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Filter Sidebar (3 Cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-6">
              {renderFacetFilters(false)}
            </div>
          </aside>

          {/* Products Grid (9 Cols on Desktop, 3 products per row / 2 per row on mobile) */}
          <div className="lg:col-span-9">
            {displayProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-600 mx-auto opacity-60" />
                <h3 className="font-heading text-lg font-bold uppercase text-neutral-900">
                  No Silhouettes Match Your Selection
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try clearing some filter tags or explore our complete catalog.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded-xl"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div id="catalog-results" className="scroll-mt-24 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  itemLabel="silhouettes"
                />
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Filter Slide Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white p-6 flex flex-col justify-between overflow-y-auto rounded-l-3xl shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-900">
                    Filter Options
                  </h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {renderFacetFilters(true)}
              </div>

              <div className="pt-6 border-t border-neutral-100 flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 text-xs font-bold uppercase border border-neutral-200 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  View ({displayProducts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
