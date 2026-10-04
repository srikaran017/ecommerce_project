import React from "react";
import Link from "next/link";
import { ProductService } from "@/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronRight } from "lucide-react";
import { storeConfig } from "@/config/store.config";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
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

  const { category, products } = await ProductService.getCategoryProducts(slug, {
    page: resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1,
    limit: resolvedSearchParams.limit ? Number(resolvedSearchParams.limit) : 24,
    sort: resolvedSearchParams.sort,
    minPrice: resolvedSearchParams.minPrice
      ? Number(resolvedSearchParams.minPrice)
      : undefined,
    maxPrice: resolvedSearchParams.maxPrice
      ? Number(resolvedSearchParams.maxPrice)
      : undefined,
    search: resolvedSearchParams.search,
  });

  const catDetails = category || (await ProductService.getCategoryBySlug(slug));

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

        {/* Category Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 sm:p-12 mb-12 shadow-xl">
          {catDetails?.imageUrl && (
            <img
              src={catDetails.imageUrl}
              alt={catDetails.name}
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
          )}
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400 block">
              CURATED CATEGORY
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold uppercase tracking-tight">
              {catDetails?.name || slug.replace(/-/g, " ")}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {catDetails?.description ||
                "Explore our handcrafted haute couture and exclusive capsule edits."}
            </p>
          </div>
        </div>

        {/* Subcategories Chips if present */}
        {catDetails?.children && catDetails.children.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-10">
            {catDetails.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-neutral-200 text-neutral-800 hover:border-neutral-900 transition-all shadow-sm whitespace-nowrap"
              >
                {child.name}
              </Link>
            ))}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
