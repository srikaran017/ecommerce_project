import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductService } from "@/services/product.service";

export const metadata = {
  title: "Curated Seasonal Collections | Maison De Élégance",
  description: "Explore our limited edition seasonal lookbooks and curated capsule collections.",
};

export default async function CollectionsPage() {
  const collections = await ProductService.getAllCollections();

  return (
    <div className="py-16 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--secondary)]">
            EDITORIAL LOOKBOOKS
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            CURATED COLLECTIONS
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Discover intentional capsule edits crafted for elevated living and modern formal occasions.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/products?collection=${col.slug}`}
              className="group relative h-[520px] rounded-[var(--radius)] overflow-hidden bg-[var(--muted)] border border-[var(--border)] block shadow-lg"
            >
              <img
                src={col.image}
                alt={col.name}
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                  {col.itemCount}
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-2 text-white">
                  {col.name}
                </h3>
                <p className="text-xs text-white/80 max-w-md line-clamp-2 mb-4 leading-relaxed">
                  {col.description}
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">
                  <span>DISCOVER THE CAPSULE</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
