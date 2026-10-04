"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { FALLBACK_PRODUCTS, ProductData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";

import { ProductService } from "@/services/product.service";

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductData[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const matched = await ProductService.getAllProducts({ search: query });
        setResults(matched.slice(0, 6));
      } catch {
        const q = query.toLowerCase();
        const matched = FALLBACK_PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        ).slice(0, 4);
        setResults(matched);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, closeSearch]);

  if (!isSearchOpen) return null;

  const popularSearches = [
    "Mulberry Silk Gown",
    "Belgian Linen",
    "Banarasi Saree",
    "Wool Blazer",
    "Streetwear Hoodie",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="min-h-screen px-4 text-center">
        {/* Click outside backdrop */}
        <div className="fixed inset-0" onClick={closeSearch} />

        <div className="inline-block w-full max-w-3xl my-12 p-6 sm:p-8 overflow-hidden text-left align-middle bg-[var(--background)] border border-[var(--border)] shadow-2xl rounded-[var(--radius)] relative z-10 transition-all">
          
          {/* Search Input Header */}
          <div className="relative flex items-center border-b border-[var(--border)] pb-4">
            <Search className="w-6 h-6 text-[var(--muted-foreground)] mr-3 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search garments, fabrics, styles, or collections..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-lg sm:text-xl font-heading text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={closeSearch}
              className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-2"
            >
              ESC
            </button>
          </div>

          {/* Body */}
          <div className="py-6 space-y-6">
            
            {/* Live Results if query exists */}
            {query.trim() && (
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-4">
                  <span>SEARCH RESULTS ({results.length})</span>
                  {results.length > 0 && (
                    <Link
                      href={`/products?search=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="text-[var(--secondary)] hover:underline flex items-center gap-1"
                    >
                      <span>View all matching pieces</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">
                      No silhouettes found matching "{query}"
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Try searching for silk, linen, blazer, saree, or explore our curated collections.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={closeSearch}
                        className="flex items-center gap-3.5 p-2.5 rounded-[var(--radius)] border border-[var(--border)] hover:bg-[var(--muted)] transition-colors group"
                      >
                        <img
                          src={product.images[0]?.url}
                          alt={product.name}
                          className="w-14 h-18 object-cover rounded-[var(--radius)] flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--secondary)] block truncate">
                            {product.categoryName}
                          </span>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)] group-hover:text-[var(--secondary)] transition-colors truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-[var(--foreground)]">
                              {storeConfig.currency.symbol}{product.price.toLocaleString()}
                            </span>
                            {product.compareAtPrice && (
                              <span className="text-[10px] text-[var(--muted-foreground)] line-through">
                                {storeConfig.currency.symbol}{product.compareAtPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Popular Searches & Quick Trends */}
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                <TrendingUp className="w-4 h-4 text-[var(--secondary)]" />
                <span>POPULAR FASHION SEARCHES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-[var(--radius)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-xs font-medium transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Category Shortcuts */}
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>BROWSE BY CATEGORY</span>
                </div>
                <Link
                  href="/categories"
                  onClick={closeSearch}
                  className="text-amber-700 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Category Directory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Women's Couture", slug: "womens-couture" },
                  { name: "Evening Gowns", slug: "evening-gowns" },
                  { name: "Royal Sarees", slug: "sarees" },
                  { name: "Men's Apparel", slug: "mens-apparel" },
                  { name: "Suits & Blazers", slug: "mens-suits" },
                  { name: "Cotton Shirts", slug: "mens-shirts" },
                ].map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    onClick={closeSearch}
                    className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Collections Link */}
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--secondary)]" />
                <span>Explore seasonal curations</span>
              </div>
              <Link
                href="/collections"
                onClick={closeSearch}
                className="font-bold text-[var(--foreground)] uppercase hover:underline"
              >
                BROWSE ALL COLLECTIONS →
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
