import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Star, ShoppingBag, Eye } from "lucide-react";
import { CollectionService } from "@/services/collection.service";
import { storeConfig } from "@/config/store.config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const collection = await CollectionService.getCollectionBySlug(slug);

  if (!collection) {
    return {
      title: "Collection Not Found | Maison De Élégance",
    };
  }

  return {
    title: `${collection.name} | Curated Lookbook | Maison De Élégance`,
    description:
      collection.description ||
      `Explore ${collection.name} curated seasonal capsule lookbook at Maison De Élégance.`,
  };
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await CollectionService.getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const products = collection.products || [];

  return (
    <div className="bg-[var(--background)] min-h-screen pb-24 text-[var(--foreground)]">
      {/* 1. Capsule Editorial Hero Banner - Luxury Pastel Aesthetic */}
      <div className="relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf5ef] via-[#f7ece2] to-[#fdede0] border-b border-[#ead9c9]">
        {collection.imageUrl ? (
          <>
            <img
              src={collection.imageUrl}
              alt={collection.name}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-20 filter blur-[0.5px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#faf5ef] via-[#faf5ef]/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-rose-50/50 to-orange-50/40" />
        )}
        {/* Subtle decorative ambient pastel glow orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-200/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-88 h-88 rounded-full bg-rose-200/30 blur-3xl"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 py-16">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-900 hover:text-amber-950 transition-colors mb-2 bg-white/80 border border-amber-200/60 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Curated Capsules</span>
          </Link>

          <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Curated Capsule Edition</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 uppercase">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="text-xs sm:text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              {collection.description}
            </p>
          )}

          <div className="pt-2 text-xs font-mono text-neutral-500">
            {products.length} {products.length === 1 ? "Curated Piece" : "Curated Pieces"}
          </div>
        </div>
      </div>

      {/* 2. Breadcrumbs & Sub-nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-[var(--foreground)] transition-colors">
            Collections
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)] font-semibold truncate">{collection.name}</span>
        </nav>
      </div>

      {/* 3. Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-20 px-4 bg-[var(--muted)]/40 rounded-3xl border border-[var(--border)] max-w-2xl mx-auto my-8">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold uppercase tracking-wide mb-2 text-[var(--foreground)]">
              Capsule Under Curation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-6">
              Garments for this seasonal capsule are currently being tailored in the atelier. Explore our full catalog or discover other lookbooks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/products"
                className="px-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Browse All Garments
              </Link>
              <Link
                href="/collections"
                className="px-6 py-2.5 border border-[var(--border)] hover:bg-[var(--muted)] rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Other Collections
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {products.map((p) => {
              const regPrice = Number(p.price?.regularPrice || 0);
              const salePrice = p.price?.salePrice ? Number(p.price.salePrice) : null;
              const effPrice = Number(p.price?.effectivePrice || salePrice || regPrice);
              const discount = p.price?.discountPercentage || (salePrice ? Math.round(((regPrice - salePrice) / regPrice) * 100) : 0);

              return (
                <div
                  key={p.id}
                  className="group bg-[var(--muted)]/30 border border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                    <img
                      src={p.thumbnail || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"}
                      alt={p.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />

                    {p.price?.onSale && discount > 0 && (
                      <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                        {discount}% OFF
                      </span>
                    )}

                    {!p.inStock && (
                      <span className="absolute top-3 right-3 bg-slate-900/90 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                        WAITLIST
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link
                        href={`/products/${p.slug}`}
                        className="p-3 bg-white text-slate-950 rounded-full hover:scale-110 transition-transform shadow-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                        <span>{p.brand}</span>
                        {p.rating > 0 && (
                          <span className="flex items-center gap-1 font-mono text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {p.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <Link href={`/products/${p.slug}`}>
                        <h3 className="font-heading font-bold text-sm text-[var(--foreground)] group-hover:text-amber-500 transition-colors line-clamp-2">
                          {p.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-[var(--foreground)] font-mono">
                          {storeConfig.currency.symbol}
                          {effPrice.toLocaleString()}
                        </div>
                        {salePrice && salePrice < regPrice && (
                          <div className="text-[11px] text-[var(--muted-foreground)] line-through font-mono">
                            {storeConfig.currency.symbol}
                            {regPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/products/${p.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
