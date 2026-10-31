import React from "react";
import Link from "next/link";
import { ProductService } from "@/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/ui/Pagination";
import { ChevronRight, Sparkles } from "lucide-react";
import { storeConfig } from "@/config/store.config";

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "womens-couture": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80",
  "heritage-sarees": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
  "bridal-festive-lehengas": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
  "luxury-menswear": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
  "resort-vacation": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
  "accessories-stoles": "https://images.unsplash.com/photo-1611591475871-33513a9d949b?w=800&auto=format&fit=crop&q=80",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    color?: string;
    size?: string;
    fabric?: string;
    brand?: string;
    rating?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await ProductService.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category | " + storeConfig.name,
    };
  }

  return {
    title: `${category.name} | ${storeConfig.name}`,
    description:
      category.description || `Shop exclusive luxury ${category.name} collections.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const page = resolvedSearchParams.page ? Math.max(1, Number(resolvedSearchParams.page)) : 1;
  const limit = resolvedSearchParams.limit ? Number(resolvedSearchParams.limit) : 12;

  const { category, products, pagination } = await ProductService.getCategoryProducts(slug, {
    page,
    limit,
    sort: resolvedSearchParams.sort,
    minPrice: resolvedSearchParams.minPrice
      ? Number(resolvedSearchParams.minPrice)
      : undefined,
    maxPrice: resolvedSearchParams.maxPrice
      ? Number(resolvedSearchParams.maxPrice)
      : undefined,
    search: resolvedSearchParams.search,
    color: resolvedSearchParams.color,
    size: resolvedSearchParams.size,
    fabric: resolvedSearchParams.fabric,
    brand: resolvedSearchParams.brand,
    rating: resolvedSearchParams.rating,
    inStock: resolvedSearchParams.inStock,
  });

  const catDetails = category || (await ProductService.getCategoryBySlug(slug));
  const heroImage =
    catDetails?.imageUrl ||
    DEFAULT_CATEGORY_IMAGES[slug] ||
    (catDetails?.parent?.slug ? DEFAULT_CATEGORY_IMAGES[catDetails.parent.slug] : null);

  // Subcategories to display: direct children, or siblings if this is a leaf category
  const displayChips = catDetails?.children && catDetails.children.length > 0 ? catDetails.children : [];

  return (
    <div className="py-10 bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Hierarchy */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted-foreground)] flex-wrap">
            <Link href="/" className="hover:text-[var(--foreground)]">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/categories" className="hover:text-[var(--foreground)] text-amber-700">
              Categories
            </Link>
            {catDetails?.parent?.parent && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/categories/${catDetails.parent.parent.slug}`}
                  className="hover:text-[var(--foreground)]"
                >
                  {catDetails.parent.parent.name}
                </Link>
              </>
            )}
            {catDetails?.parent && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/categories/${catDetails.parent.slug}`}
                  className="hover:text-[var(--foreground)]"
                >
                  {catDetails.parent.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--foreground)] font-bold">
              {catDetails?.name || slug}
            </span>
          </nav>

          <Link
            href="/categories"
            className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-amber-700 transition-colors flex items-center gap-1"
          >
            <span>All Categories</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Hero Banner - Luxury Pastel Aesthetic */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#faf5ef] via-[#f7ece2] to-[#fdede0] border border-[#ead9c9] p-8 sm:p-12 mb-12 shadow-sm">
          {/* Subtle decorative ambient pastel glow orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-88 h-88 rounded-full bg-amber-200/35 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl"
          />

          {/* Background ambient texture watermark on mobile */}
          {heroImage && (
            <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={heroImage}
                alt=""
                className="w-full h-full object-cover opacity-15 mix-blend-multiply filter blur-[0.5px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#faf5ef]/95 via-[#faf5ef]/85 to-transparent" />
            </div>
          )}

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.25em] bg-white/90 text-amber-900 border border-amber-200/80 shadow-2xs backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>CURATED CATEGORY</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight text-neutral-900">
                {catDetails?.name || slug.replace(/-/g, " ")}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl">
                {catDetails?.description ||
                  "Explore our handcrafted haute couture and exclusive capsule edits."}
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-neutral-500 font-medium flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/85 border border-amber-200/70 text-amber-900 font-semibold text-[11px] shadow-2xs">
                  {pagination?.total ?? products.length}{" "}
                  {(pagination?.total ?? products.length) === 1
                    ? "Curated Silhouette"
                    : "Curated Silhouettes"}
                </span>
                {catDetails?.parent && (
                  <span className="text-neutral-500">
                    Department: <strong className="text-neutral-800">{catDetails.parent.name}</strong>
                  </span>
                )}
                {pagination && pagination.totalPages > 1 && (
                  <span className="text-neutral-500 font-mono text-[11px]">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                )}
              </div>
            </div>

            {/* Editorial Category Image Card on Tablet & Desktop */}
            {heroImage && (
              <div className="hidden md:block relative w-48 h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden shadow-sm border-2 border-white/90 flex-shrink-0 group">
                <img
                  src={heroImage}
                  alt={catDetails?.name || slug}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-t from-black/15 via-transparent to-transparent pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Subcategories Chips if present */}
        {displayChips.length > 0 && (
          <div className="space-y-3 mb-10">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500 block">
              Subcategories & Silhouettes
            </span>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {displayChips.map((child) => (
                <Link
                  key={child.id || child.slug}
                  href={`/categories/${child.slug}`}
                  className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-800 hover:border-amber-600 hover:text-amber-800 transition-all shadow-sm whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{child.name}</span>
                  {child.productCount !== undefined && child.productCount > 0 && (
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ({child.productCount})
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              No garments currently found in this category
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white hover:bg-amber-700 transition-colors"
            >
              Browse All Collections
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Category Products Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page || page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit || limit}
                basePath={`/categories/${encodeURIComponent(slug)}`}
                queryParams={resolvedSearchParams}
                itemLabel="silhouettes"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
