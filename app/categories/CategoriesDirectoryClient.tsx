"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  Shirt,
  Sparkle,
  Compass,
} from "lucide-react";
import { ApiCategory } from "@/services/catalogApi";
import { CategoryConfig, INITIAL_CATEGORIES } from "@/config/category.config";

interface CategoriesDirectoryClientProps {
  categoriesTree: ApiCategory[];
}

export function CategoriesDirectoryClient({
  categoriesTree,
}: CategoriesDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Default curated visual catalog images if backend imageUrl is null
  const defaultImages: Record<string, string> = {
    women: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
    "womens-couture": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    "evening-gowns": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    sarees: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    dresses: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
    men: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
    "mens-apparel": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
    "mens-suits": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
    "mens-shirts": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
  };

  const getCategoryImage = (slug: string, fallbackUrl?: string | null): string => {
    return (
      fallbackUrl ||
      defaultImages[slug] ||
      INITIAL_CATEGORIES.find((c) => c.slug === slug)?.image ||
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800"
    );
  };

  // Flatten categories for quick search filtering
  const allLeafCategories: Array<{
    name: string;
    slug: string;
    description?: string;
    parentName?: string;
    image: string;
  }> = [];

  const extractLeaves = (nodes: ApiCategory[], parentName?: string) => {
    for (const node of nodes) {
      const currentParent = parentName ? `${parentName} › ${node.name}` : node.name;
      allLeafCategories.push({
        name: node.name,
        slug: node.slug,
        description: node.description || undefined,
        parentName: parentName,
        image: getCategoryImage(node.slug, node.imageUrl),
      });

      if (node.children && node.children.length > 0) {
        extractLeaves(node.children, currentParent);
      }
    }
  };

  if (categoriesTree.length > 0) {
    extractLeaves(categoriesTree);
  } else {
    // Fallback leaves from INITIAL_CATEGORIES
    INITIAL_CATEGORIES.forEach((cat) => {
      allLeafCategories.push({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
      });
      cat.subcategories.forEach((sub) => {
        allLeafCategories.push({
          name: sub.name,
          slug: sub.slug,
          parentName: cat.name,
          image: sub.image || cat.image,
        });
      });
    });
  }

  const filteredLeaves = searchQuery.trim()
    ? allLeafCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.parentName && c.parentName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="py-8 sm:py-12 bg-neutral-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Hierarchy */}
        <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-neutral-400 mb-6">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-900 font-bold">Categories Directory</span>
        </nav>

        {/* Editorial Directory Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.25em] bg-amber-100/60 text-amber-800 rounded-full border border-amber-200">
            <Compass className="w-3.5 h-3.5" />
            <span>CUSTOMER CATALOG HIERARCHY</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-neutral-900">
            Category Directory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Browse our complete multi-tier sartorial categories. Filter by department, explore dedicated category product listings, and find handcrafted silhouettes with ease.
          </p>

          {/* Quick Search Within Categories */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search categories (e.g. Sarees, Evening Gowns, Linen Suits)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-amber-600 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-neutral-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtered Search Results View */}
        {searchQuery.trim() ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Matching Categories ({filteredLeaves.length})
              </h2>
            </div>

            {filteredLeaves.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-sm">
                <p className="font-heading text-lg font-bold text-neutral-800 uppercase">
                  No Categories Found Matching "{searchQuery}"
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Try searching for couture, gowns, sarees, blazers, or shirts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeaves.map((cat, idx) => (
                  <Link
                    key={`${cat.slug}-${idx}`}
                    href={`/categories/${cat.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col p-5"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        {cat.parentName && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block truncate">
                            {cat.parentName}
                          </span>
                        )}
                        <h3 className="font-heading text-base font-bold uppercase text-neutral-900 group-hover:text-amber-700 transition-colors truncate">
                          {cat.name}
                        </h3>
                        <span className="text-[11px] text-neutral-500 block">
                          Slug: /{cat.slug}
                        </span>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-auto pt-2 border-t border-neutral-100">
                        {cat.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-900 group-hover:text-amber-700 pt-2 border-t border-neutral-100">
                      <span>View Products</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Multi-Tier Tree Visualization */
          <div className="space-y-16">
            {categoriesTree && categoriesTree.length > 0 ? (
              categoriesTree.map((rootCategory) => (
                <div
                  key={rootCategory.id}
                  className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm"
                >
                  {/* Department Banner Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-100 mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-inner">
                        <img
                          src={getCategoryImage(rootCategory.slug, rootCategory.imageUrl)}
                          alt={rootCategory.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          Primary Department
                        </span>
                        <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase text-neutral-900">
                          {rootCategory.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mt-1">
                          {rootCategory.description || `Luxury collections for ${rootCategory.name.toLowerCase()}.`}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/categories/${rootCategory.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all self-start md:self-auto cursor-pointer shadow-sm"
                    >
                      <span>Explore {rootCategory.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Level 2 Subcategories */}
                  <div className="space-y-8">
                    {rootCategory.children && rootCategory.children.length > 0 ? (
                      rootCategory.children.map((subLevel2) => (
                        <div
                          key={subLevel2.id}
                          className="bg-neutral-50/70 rounded-2xl p-6 border border-neutral-200/60"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-600" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                  Sub-Department
                                </span>
                              </div>
                              <h3 className="font-heading text-xl sm:text-2xl font-bold uppercase text-neutral-900 mt-1">
                                {subLevel2.name}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {subLevel2.description || `Browse curated ${subLevel2.name.toLowerCase()} pieces.`}
                              </p>
                            </div>

                            <Link
                              href={`/categories/${subLevel2.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-700 transition-colors"
                            >
                              <span>View All {subLevel2.name}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          {/* Level 3 Children (Silhouettes / Specific lines) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subLevel2.children && subLevel2.children.length > 0 ? (
                              subLevel2.children.map((leaf) => (
                                <Link
                                  key={leaf.id}
                                  href={`/categories/${leaf.slug}`}
                                  className="group bg-white p-4 rounded-xl border border-neutral-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                      <img
                                        src={getCategoryImage(leaf.slug, leaf.imageUrl)}
                                        alt={leaf.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-heading text-xs sm:text-sm font-bold uppercase text-neutral-900 group-hover:text-amber-700 transition-colors truncate">
                                        {leaf.name}
                                      </h4>
                                      <span className="text-[10px] text-neutral-400 font-medium block truncate">
                                        {leaf.productCount !== undefined && leaf.productCount > 0
                                          ? `${leaf.productCount} Products Available`
                                          : leaf.description || `Shop ${leaf.name}`}
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                                </Link>
                              ))
                            ) : (
                              <Link
                                href={`/categories/${subLevel2.slug}`}
                                className="group bg-white p-4 rounded-xl border border-neutral-200 hover:border-amber-400 transition-all flex items-center justify-between"
                              >
                                <div>
                                  <h4 className="font-heading text-sm font-bold uppercase text-neutral-900">
                                    {subLevel2.name} Full Line
                                  </h4>
                                  <span className="text-[10px] text-neutral-400">
                                    Shop all pieces
                                  </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Link
                          href={`/categories/${rootCategory.slug}`}
                          className="text-xs font-bold uppercase tracking-wider text-amber-700 hover:underline"
                        >
                          View all {rootCategory.name} products &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback UI using INITIAL_CATEGORIES */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {INITIAL_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-56 rounded-2xl overflow-hidden bg-neutral-100 mb-6 relative">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                              {cat.tagline || "Haute Couture"}
                            </span>
                            <h3 className="font-heading text-2xl font-bold uppercase text-white">
                              {cat.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="space-y-2 mb-6">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                          Silhouettes & Lines:
                        </span>
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categories/${sub.slug}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-amber-50/70 border border-neutral-200/60 transition-colors"
                          >
                            <span className="text-xs font-bold uppercase text-neutral-800">
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium">
                              {sub.itemCount} &rarr;
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={`/categories/${cat.slug}`}
                      className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2"
                    >
                      <span>Explore {cat.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Jump Pill Cloud */}
        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 block mb-2">
            DIRECT SARTORIAL SHORTCUTS
          </span>
          <h3 className="font-heading text-xl font-bold uppercase text-neutral-900 mb-6">
            Jump Directly to Any Category
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              { name: "Women's Couture", slug: "womens-couture" },
              { name: "Evening Gowns", slug: "evening-gowns" },
              { name: "Royal Sarees", slug: "sarees" },
              { name: "Designer Dresses", slug: "dresses" },
              { name: "Men's Apparel", slug: "mens-apparel" },
              { name: "Suits & Blazers", slug: "mens-suits" },
              { name: "Formal & Casual Shirts", slug: "mens-shirts" },
            ].map((tag) => (
              <Link
                key={tag.slug}
                href={`/categories/${tag.slug}`}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 transition-all border border-neutral-200 cursor-pointer shadow-sm"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
