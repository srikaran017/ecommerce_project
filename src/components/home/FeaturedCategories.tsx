import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Layers } from "lucide-react";
import { ApiCategory } from "@/services/catalogApi";
import { ProductService } from "@/services/product.service";
import { FALLBACK_CATEGORIES } from "@/components/layout/Navbar";

// Curated luxury imagery fallback for known couture categories if none uploaded in admin
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "womens-couture": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80",
  "heritage-sarees": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  "bridal-festive-lehengas": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
  "luxury-menswear": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
  "resort-vacation": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop&q=80",
  "accessories-stoles": "https://images.unsplash.com/photo-1611591475871-33513a9d949b?w=600&auto=format&fit=crop&q=80",
};

function getRecursiveProductCount(cat: ApiCategory): number {
  let count = cat.productCount ?? 0;
  if (cat.children && cat.children.length > 0) {
    for (const child of cat.children) {
      count += getRecursiveProductCount(child);
    }
  }
  return count;
}

export async function FeaturedCategories() {
  const tree = await ProductService.getCategoryTree({ tree: true }).catch(() => []);
  const allCategories: ApiCategory[] =
    Array.isArray(tree) && tree.length > 0 ? tree : (FALLBACK_CATEGORIES as ApiCategory[]);
  
  // Show root categories
  const categories: ApiCategory[] = Array.isArray(allCategories) ? allCategories.slice(0, 6) : [];

  if (!categories || categories.length === 0) return null;

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
          {categories.map((cat) => {
            const totalProducts = getRecursiveProductCount(cat);
            const imageSrc = cat.imageUrl || DEFAULT_CATEGORY_IMAGES[cat.slug];

            return (
              <div
                key={cat.id || cat.slug}
                className="group flex flex-col items-center text-center p-4 rounded-3xl bg-white border border-neutral-200/80 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                {/* Category Image with Link */}
                <Link
                  href={`/categories/${cat.slug}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 mb-3 shadow-inner cursor-pointer block relative"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={cat.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-neutral-100 text-amber-800">
                      <Layers className="w-6 h-6 mb-1 opacity-70" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{cat.name.slice(0, 3)}</span>
                    </div>
                  )}
                </Link>

                <Link
                  href={`/categories/${cat.slug}`}
                  className="font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-amber-700 transition-colors uppercase cursor-pointer line-clamp-2 min-h-[2.5rem] flex items-center justify-center"
                >
                  {cat.name}
                </Link>
                
                <span className="text-[10px] text-neutral-400 font-medium mt-0.5 mb-2">
                  {totalProducts > 0
                    ? `${totalProducts} Garments`
                    : cat.children && cat.children.length > 0
                    ? `${cat.children.length} Silhouettes`
                    : "Handcrafted"}
                </span>

                {/* Quick Subcategory Chips */}
                {cat.children && cat.children.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mt-auto pt-2 border-t border-neutral-100 w-full">
                    {cat.children.slice(0, 2).map((sub) => (
                      <Link
                        key={sub.id || sub.slug}
                        href={`/categories/${sub.slug}`}
                        className="text-[9px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full transition-colors truncate max-w-full"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}


