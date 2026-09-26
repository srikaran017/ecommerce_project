import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { INITIAL_CATEGORIES } from "@/config/category.config";

export function FeaturedCategories() {
  const categories = INITIAL_CATEGORIES.filter((c) => c.isActive && c.isFeatured);

  return (
    <section className="py-12 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700 block">
            EXPLORE BY CATEGORY
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase text-neutral-900">
            Handcrafted Curations
          </h2>
        </div>

        {/* Curvy Rounded Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-3 rounded-3xl bg-white border border-amber-100/60 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Curly Rounded Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 mb-3 shadow-inner">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-amber-700 transition-colors uppercase">
                {cat.name}
              </h3>
              <span className="text-[10px] text-neutral-400 font-medium mt-0.5">
                {cat.subcategories.length} Collections
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
