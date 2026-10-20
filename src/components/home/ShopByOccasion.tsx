import React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { ProductService } from "@/services/product.service";

export async function ShopByOccasion() {
  const collections = await ProductService.getAllCollections();

  // If there are no curated collections in the database, do not display fake showcase content
  if (!collections || collections.length === 0) return null;

  return (
    <section className="py-20 bg-[var(--background)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CURATED EDITS</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            CURATED COLLECTIONS
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Explore bespoke silhouettes, capsule edits, and regal attire hand-tailored for life’s grandest celebrations.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group relative h-80 sm:h-96 rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] block shadow-md hover:shadow-xl transition-all"
            >
              {col.image && (
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                  {col.itemCount}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mb-1">
                  {col.name}
                </h3>
                <p className="text-xs text-white/80 line-clamp-1 mb-3">
                  {col.description}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 group-hover:translate-x-1 transition-transform">
                  <span>Explore Edit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

