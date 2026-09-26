import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductService } from "@/services/product.service";
import { homepageConfig } from "@/config/homepage.config";

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  type?: "featured" | "newArrivals" | "bestSellers" | "trending";
  viewAllLink?: string;
}

export async function FeaturedProducts({
  title = "FEATURED PIECES",
  subtitle = "TIMELESS SILHOUETTES",
  type = "featured",
  viewAllLink = "/products",
}: FeaturedProductsProps) {
  const filters = {
    featured: type === "featured",
    newArrivals: type === "newArrivals",
    bestSellers: type === "bestSellers",
  };

  const products = await ProductService.getAllProducts(filters);
  const displayProducts = products.slice(0, 4);

  if (displayProducts.length === 0) return null;

  return (
    <section className="py-14 sm:py-16 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-700 block">
              {subtitle}
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900">
              {title}
            </h2>
          </div>

          <Link
            href={viewAllLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-700 transition-colors group"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
