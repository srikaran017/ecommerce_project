"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";
import { INITIAL_CATEGORIES, INITIAL_OCCASIONS } from "@/config/category.config";

interface ProductsCatalogClientProps {
  initialProducts: ProductData[];
  category?: string;
  gender?: string;
  collection?: string;
  occasion?: string;
  sort?: string;
  search?: string;
}

export function ProductsCatalogClient({
  initialProducts,
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

  const categories = [
    { label: "All Products", value: "" },
    ...INITIAL_CATEGORIES.map((c) => ({ label: c.name, value: c.slug })),
  ];

  const occasions = [
    { label: "All Occasions", value: "" },
    ...INITIAL_OCCASIONS.map((o) => ({ label: o.name, value: o.slug })),
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

  const colors = [
    { name: "Emerald Green", hex: "#046307" },
    { name: "Champagne Gold", hex: "#d4af37" },
    { name: "Rose Blush", hex: "#ffb6c1" },
    { name: "Royal Magenta", hex: "#800080" },
    { name: "Mustard Gold", hex: "#ffae42" },
    { name: "Crisp Ivory", hex: "#ffffff" },
    { name: "Onyx Black", hex: "#111111" },
  ];

  const sortOptions = [
    { label: "Recommended", value: "featured" },
    { label: "Newest Arrivals", value: "newest" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
    { label: "Best Selling", value: "best-selling" },
    { label: "Highest Discount", value: "discount" },
  ];

  const updateFilters = (overrides: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(overrides).forEach(([key, val]) => {
      if (val === null || val === "") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    router.push(`/products?${current.toString()}`);
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
    const nextSize = selectedSize === s ? "" : s;
    setSelectedSize(nextSize);
    updateFilters({ size: nextSize || null });
  };

  const handleColorChange = (c: string) => {
    const nextColor = selectedColor === c ? "" : c;
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

        {/* Dynamic Horizontal Category Chips Selector */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-8 justify-start sm:justify-center">
          {categories.map((c) => {
            const isSelected = selectedCategory === c.value;
            return (
              <button
                key={c.value}
                onClick={() => handleCategoryChange(c.value)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                  isSelected
                    ? "bg-neutral-900 text-white shadow-md"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                {c.label}
              </button>
            );
          })}
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
              Showing {initialProducts.length} {initialProducts.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          {/* Right: Quick Sort */}
          <div className="flex items-center gap-2 text-xs">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
                  Category
                </h3>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleCategoryChange(c.value)}
                      className={`w-full text-left text-xs uppercase font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === c.value
                          ? "bg-neutral-900 text-white font-bold"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{c.label}</span>
                      {selectedCategory === c.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
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
                    const isSelected = selectedColor === col.name;
                    return (
                      <button
                        key={col.name}
                        onClick={() => handleColorChange(col.name)}
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

          {/* Products Grid (9 Cols on Desktop, 4 products per row / 2 per row on mobile) */}
          <div className="lg:col-span-9">
            {initialProducts.length === 0 ? (
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                {initialProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
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
                  <h4 className="text-xs font-bold uppercase text-neutral-800">Categories</h4>
                  <div className="space-y-1">
                    {categories.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleCategoryChange(c.value)}
                        className={`w-full text-left text-xs uppercase py-2 px-3 rounded-xl border ${
                          selectedCategory === c.value
                            ? "bg-neutral-900 text-white border-neutral-900 font-bold"
                            : "border-neutral-200 text-neutral-600"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
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
                  View ({initialProducts.length})
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
