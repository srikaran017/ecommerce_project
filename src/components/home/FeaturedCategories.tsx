import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Layers } from "lucide-react";
import { INITIAL_CATEGORIES } from "@/config/category.config";

export function FeaturedCategories() {
  const categories = INITIAL_CATEGORIES.filter((c) => c.isActive && c.isFeatured);

  return (
    <section className="py-14 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Direct Link to Category Directory */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXPLORE BY CATEGORY</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold uppercase text-neutral-900">
              Handcrafted Curations
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-lg">
              Explore bespoke silhouettes, pure silk weaves, and Savile Row inspired tailored ensembles.
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer shadow-sm hover:shadow"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Curated Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group flex flex-col items-center text-center p-4 rounded-3xl bg-white border border-neutral-200/80 hover:border-amber-400 hover:shadow-lg transition-all"
            >
              {/* Category Image with Link */}
              <Link
                href={`/categories/${cat.slug}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 mb-3 shadow-inner cursor-pointer block"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                />
              </Link>

              <Link
                href={`/categories/${cat.slug}`}
                className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-amber-700 transition-colors uppercase cursor-pointer"
              >
                {cat.name}
              </Link>
              
              <span className="text-[10px] text-neutral-400 font-medium mt-0.5 mb-2">
                {cat.subcategories.length > 0
                  ? `${cat.subcategories.length} Silhouettes`
                  : "Handcrafted"}
              </span>

              {/* Quick Subcategory Chip */}
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-auto pt-2 border-t border-neutral-100 w-full">
                  {cat.subcategories.slice(0, 2).map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      className="text-[9px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full transition-colors truncate max-w-full"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

