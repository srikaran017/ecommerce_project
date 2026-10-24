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
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { ProductData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";
import { INITIAL_CATEGORIES, INITIAL_OCCASIONS } from "@/config/category.config";
import { AdminService } from "@/services/admin.service";
import { transformAdminProductToProductData } from "@/services/product.service";
import { ApiCategory } from "@/services/catalogApi";
import { AdminCategory } from "@/types/admin.types";

export interface CategoryGroup {
  id: string;
  label: string;
  value: string;
  children: Array<{ id: string; label: string; value: string }>;
}

interface ProductsCatalogClientProps {
  initialProducts: ProductData[];
  initialCategories?: ApiCategory[];
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
  const [selectedSize, setSelectedSize] = useState(searchParams.get("size") || "");
  const [selectedColor, setSelectedColor] = useState(searchParams.get("color") || "");
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
    setSelectedSize(searchParams.get("size") || "");
    setSelectedColor(searchParams.get("color") || "");
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
    // Curated Master Departments to organize the storefront
    const rootDepartments: Array<{
      id: string;
      label: string;
      value: string;
      keywords: string[];
      children: Array<{ id: string; label: string; value: string }>;
    }> = [
      {
        id: "dept_women",
        label: "Women's Couture",
        value: "womens-couture",
        keywords: [
          "women",
          "saree",
          "gown",
          "lehenga",
          "kaftan",
          "dress",
          "anarkali",
          "sharara",
          "corset",
          "blouse",
          "co-ord",
          "cape",
          "robe",
          "resort",
        ],
        children: [],
      },
      {
        id: "dept_men",
        label: "Men's Apparel",
        value: "mens-apparel",
        keywords: ["men", "suit", "blazer", "shirt", "kurta", "bespoke"],
        children: [],
      },
      {
        id: "dept_kids",
        label: "Kids & Festive",
        value: "kids",
        keywords: ["kid", "child", "boy", "girl", "sub children"],
        children: [],
      },
      {
        id: "dept_accessories",
        label: "Artisanal Accessories",
        value: "accessories",
        keywords: ["accessori", "jewel", "stole", "shawl", "belt", "cufflink"],
        children: [],
      },
    ];

    const registeredSubSlugs = new Set<string>();

    // 1. Ingest initialCategories from API Tree
    if (initialCategories && initialCategories.length > 0) {
      initialCategories.forEach((cat) => {
        const lowerName = cat.name.toLowerCase();
        const matchedDept = rootDepartments.find(
          (d) =>
            d.value === cat.slug ||
            d.id === cat.id ||
            d.keywords.some((kw) => lowerName.includes(kw))
        );

        if (matchedDept) {
          (cat.children || []).forEach((sub) => {
            if (!matchedDept.children.some((c) => c.value === sub.slug)) {
              matchedDept.children.push({ id: sub.id, label: sub.name, value: sub.slug });
              registeredSubSlugs.add(sub.slug);
            }
          });
        } else if (cat.children && cat.children.length > 0) {
          rootDepartments.push({
            id: cat.id,
            label: cat.name,
            value: cat.slug,
            keywords: [cat.slug.toLowerCase()],
            children: cat.children.map((sub) => {
              registeredSubSlugs.add(sub.slug);
              return { id: sub.id, label: sub.name, value: sub.slug };
            }),
          });
        }
      });
    }

    // 2. Ingest INITIAL_CATEGORIES
    INITIAL_CATEGORIES.forEach((cat) => {
      const lowerName = cat.name.toLowerCase();
      const matchedDept = rootDepartments.find(
        (d) =>
          d.value === cat.slug ||
          d.id === cat.id ||
          d.keywords.some((kw) => lowerName.includes(kw))
      );

      if (matchedDept) {
        (cat.subcategories || []).forEach((sub) => {
          if (!matchedDept.children.some((c) => c.value === sub.slug)) {
            matchedDept.children.push({ id: sub.id, label: sub.name, value: sub.slug });
            registeredSubSlugs.add(sub.slug);
          }
        });
      }
    });

    // 3. Ingest localCategories from Admin
    localCategories.forEach((cat) => {
      if (cat.isActive === false) return;
      const lowerName = cat.name.toLowerCase();
      const matchedDept = rootDepartments.find(
        (d) =>
          d.value === cat.slug ||
          d.id === cat.id ||
          d.id === cat.parentId ||
          d.keywords.some((kw) => lowerName.includes(kw))
      );

      if (matchedDept && cat.slug !== matchedDept.value) {
        if (!matchedDept.children.some((c) => c.value === cat.slug)) {
          matchedDept.children.push({ id: cat.id, label: cat.name, value: cat.slug });
          registeredSubSlugs.add(cat.slug);
        }
      }
    });

    // 4. Ingest any remaining subcategories from allProducts
    allProducts.forEach((p) => {
      if (!p.categorySlug) return;
      const isAlreadyChild = rootDepartments.some(
        (d) => d.value === p.categorySlug || d.children.some((c) => c.value === p.categorySlug)
      );
      if (!isAlreadyChild) {
        const lowerName = (p.categoryName || p.categorySlug).toLowerCase();
        const matchedDept = rootDepartments.find((d) =>
          d.keywords.some((kw) => lowerName.includes(kw))
        );
        if (matchedDept) {
          matchedDept.children.push({
            id: p.categorySlug,
            label: p.categoryName || p.categorySlug,
            value: p.categorySlug,
          });
          registeredSubSlugs.add(p.categorySlug);
        } else {
          rootDepartments[rootDepartments.length - 1].children.push({
            id: p.categorySlug,
            label: p.categoryName || p.categorySlug,
            value: p.categorySlug,
          });
        }
      }
    });

    return rootDepartments
      .filter((d) => d.children.length > 0 || allProducts.some((p) => p.categorySlug === d.value))
      .map((d) => ({
        id: d.id,
        label: d.label,
        value: d.value,
        children: d.children,
      }));
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

  // Dynamic garment sizes
  const sizes = useMemo(() => {
    const extracted = Array.from(
      new Set(
        allProducts
          .flatMap((p) => p.variants?.map((v) => v.size) || [])
          .filter(Boolean)
      )
    );
    if (extracted.length > 0) {
      return extracted;
    }
    return ["S", "M", "L", "XL", "Free Size"];
  }, [allProducts]);

  const colors = [
    { name: "Emerald Green", slug: "emerald-green", hex: "#046307" },
    { name: "Crimson Red", slug: "crimson-red", hex: "#990000" },
    { name: "Navy Blue", slug: "navy-blue", hex: "#000080" },
    { name: "Ivory White", slug: "ivory-white", hex: "#ffffff" },
    { name: "Champagne Gold", slug: "champagne-gold", hex: "#d4af37" },
    { name: "Onyx Black", slug: "onyx-black", hex: "#111111" },
  ];

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
      list = list.filter(
        (p) =>
          p.occasionSlugs?.includes(selectedOccasion) ||
          p.tags?.some((t) => t.toLowerCase().includes(selectedOccasion.toLowerCase())) ||
          p.description?.toLowerCase().includes(selectedOccasion.toLowerCase())
      );
    }

    // Size filter
    if (selectedSize) {
      const targetSize = selectedSize.toLowerCase();
      list = list.filter((p) =>
        p.variants?.some((v) => v.size?.toLowerCase() === targetSize)
      );
    }

    // Color filter
    if (selectedColor) {
      const targetColor = selectedColor.toLowerCase();
      list = list.filter(
        (p) =>
          p.variants?.some(
            (v) =>
              v.colorName?.toLowerCase().includes(targetColor) ||
              v.colorHex?.toLowerCase() === targetColor
          ) ||
          p.tags?.some((t) => t.toLowerCase().includes(targetColor))
      );
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
    selectedSize,
    selectedColor,
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

  const handleSizeChange = (s: string) => {
    const sizeSlug = s.toLowerCase();
    const nextSize = selectedSize === sizeSlug ? "" : sizeSlug;
    setSelectedSize(nextSize);
    updateFilters({ size: nextSize || null });
  };

  const handleColorChange = (colorSlug: string) => {
    const nextColor = selectedColor === colorSlug ? "" : colorSlug;
    setSelectedColor(nextColor);
    updateFilters({ color: nextColor || null });
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
    setSelectedSize("");
    setSelectedColor("");
    setInStockOnly(false);
    setSelectedSort("featured");
    router.push("/products");
  };

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedOccasion) ||
    Boolean(selectedSize) ||
    Boolean(selectedColor) ||
    inStockOnly ||
    Boolean(search);

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
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Active:
            </span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold uppercase border border-amber-200">
                {categories.find((c) => c.value === selectedCategory)?.label}
                <button onClick={() => handleCategoryChange("")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedOccasion && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold uppercase border border-amber-200">
                {occasions.find((o) => o.value === selectedOccasion)?.label}
                <button onClick={() => handleOccasionChange("")} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSize && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200">
                Size: {selectedSize}
                <button onClick={() => handleSizeChange(selectedSize)} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedColor && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-xs font-bold uppercase border border-neutral-200">
                Color: {selectedColor}
                <button onClick={() => handleColorChange(selectedColor)} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-xs font-bold uppercase border border-emerald-200">
                In Stock Only
                <button onClick={handleInStockToggle} className="hover:text-rose-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={clearAllFilters}
              className="text-xs font-bold uppercase text-amber-700 hover:underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Grid: Desktop Sidebar (3 Cols) + 4-Col Products Grid (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Filter Sidebar (3 Cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-sm space-y-6">
              
              {/* Category Filter */}
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

                {/* Categories List (Accordion + Search Filter) */}
                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {/* "All Products" Button (hidden when searching) */}
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

                  {/* Filtered Search Results */}
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
                    /* Default: Luxury Department Accordion */
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

                          {/* Subcategories (Indented Tree) */}
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

              {/* Occasion Filter */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  Shop By Occasion
                </h3>
                <div className="space-y-1">
                  {occasions.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => handleOccasionChange(o.value)}
                      className={`w-full text-left text-xs uppercase font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedOccasion === o.value
                          ? "bg-neutral-900 text-white font-bold"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{o.label}</span>
                      {selectedOccasion === o.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Garment Size */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  Sizes
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {sizes.map((s) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleSizeChange(s)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-900"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatches */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((col) => {
                    const isSelected = selectedColor === col.slug;
                    return (
                      <button
                        key={col.slug}
                        onClick={() => handleColorChange(col.slug)}
                        title={col.name}
                        className={`w-7 h-7 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                          isSelected ? "ring-2 ring-neutral-900 scale-110" : "border-neutral-300"
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              col.name.includes("Ivory") ? "text-black" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Stock Toggle */}
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    In Stock Only
                  </span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={handleInStockToggle}
                    className="w-4 h-4 rounded-md accent-neutral-900"
                  />
                </label>
              </div>

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
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-neutral-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-neutral-800">Categories</h4>
                    {selectedCategory && (
                      <button
                        onClick={() => handleCategoryChange("")}
                        className="text-[10px] font-bold text-amber-700 hover:underline uppercase"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    <button
                      onClick={() => handleCategoryChange("")}
                      className={`w-full text-left text-xs uppercase py-2 px-3 rounded-xl border flex items-center justify-between ${
                        !selectedCategory
                          ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                          : "border-neutral-200 text-neutral-600"
                      }`}
                    >
                      <span>All Products</span>
                      {!selectedCategory && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {categoryGroups.map((group) => {
                      const isGroupActive =
                        selectedCategory === group.value ||
                        group.children.some((c) => c.value === selectedCategory);
                      const isExpanded = Boolean(expandedGroups[group.value]);
                      const count = getGroupCount(group);

                      return (
                        <div key={group.value} className="space-y-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCategoryChange(group.value)}
                              className={`flex-1 text-left text-xs uppercase py-2 px-3 rounded-xl border flex items-center justify-between ${
                                selectedCategory === group.value
                                  ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                                  : isGroupActive
                                  ? "border-neutral-900 text-neutral-900 font-bold bg-neutral-50"
                                  : "border-neutral-200 text-neutral-700 font-semibold"
                              }`}
                            >
                              <span className="truncate">{group.label}</span>
                              {count > 0 && (
                                <span className="text-[10px] text-neutral-500 font-normal">
                                  ({count})
                                </span>
                              )}
                            </button>
                            {group.children.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleGroupExpanded(group.value)}
                                className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900"
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

                          {/* Subcategories */}
                          {isExpanded && group.children.length > 0 && (
                            <div className="pl-3 ml-2 border-l-2 border-neutral-100 space-y-1 py-1">
                              {group.children.map((sub) => {
                                const isSubSelected = selectedCategory === sub.value;
                                return (
                                  <button
                                    key={sub.value}
                                    onClick={() => handleCategoryChange(sub.value)}
                                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg border flex items-center justify-between ${
                                      isSubSelected
                                        ? "bg-amber-100 border-amber-300 text-amber-950 font-bold"
                                        : "border-neutral-100 text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                  >
                                    <span className="truncate">{sub.label}</span>
                                    {isSubSelected && (
                                      <Check className="w-3 h-3 text-amber-800" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-neutral-800">Sizes</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSizeChange(s)}
                        className={`py-2 text-xs font-bold rounded-xl border ${
                          selectedSize === s
                            ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                            : "border-neutral-200 text-neutral-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 text-xs font-bold uppercase border border-neutral-200 rounded-xl text-neutral-700"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase bg-neutral-900 text-white rounded-xl"
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
