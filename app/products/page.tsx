import React from "react";
import { ProductService } from "@/services/product.service";
import { storeConfig } from "@/config/store.config";
import { ProductsCatalogClient } from "./ProductsCatalogClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: `Atelier Catalogue & Collections | ${storeConfig.name}`,
  description: "Browse our complete catalog of handcrafted luxury apparel and bespoke accessories.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    gender?: string;
    collection?: string;
    occasion?: string;
    fabric?: string;
    size?: string;
    color?: string;
    inStock?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { category, gender, collection, occasion, fabric, size, color, inStock, sort, search } = resolvedParams;

  const [products, categoriesTree] = await Promise.all([
    ProductService.getAllProducts({
      category,
      gender,
      collection,
      occasion,
      fabric,
      size,
      color,
      inStockOnly: inStock === "true",
      sort,
      search,
    }),
    ProductService.getCategoryTree(),
  ]);

  return (
    <ProductsCatalogClient
      initialProducts={products}
      initialCategories={categoriesTree}
      category={category}
      gender={gender}
      collection={collection}
      occasion={occasion}
      sort={sort}
      search={search}
    />
  );
}
