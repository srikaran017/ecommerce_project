import React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { INITIAL_OCCASIONS } from "@/config/category.config";

export function ShopByOccasion() {
  const occasions = INITIAL_OCCASIONS.filter((o) => o.isFeatured);

  return (
    <section className="py-20 bg-[var(--background)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CURATED CELEBRATIONS</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            SHOP BY OCCASION
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            From regal bridal ceremonies to intimate sangeet nights and modern everyday luxury.
          </p>
        </div>

        {/* Occasions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {occasions.map((occ) => (
            <Link
              key={occ.id}
              href={`/products?occasion=${occ.slug}`}
              className="group relative h-80 sm:h-96 rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] block shadow-md hover:shadow-xl transition-all"
            >
              <img
                src={occ.image}
                alt={occ.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                  {occ.itemCount}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wide text-white mb-1">
                  {occ.name}
                </h3>
                <p className="text-xs text-white/80 line-clamp-1 mb-3">
                  {occ.tagline}
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
