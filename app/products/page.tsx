import React from "react";
import { ProductService } from "@/services/product.service";
import { ProductsCatalogClient } from "./ProductsCatalogClient";

export const metadata = {
  title: "Atelier Catalogue & Collections | Maison De Élégance",
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

  const products = await ProductService.getAllProducts({
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
  });

  return (
    <ProductsCatalogClient
      initialProducts={products}
      category={category}
      gender={gender}
      collection={collection}
      occasion={occasion}
      sort={sort}
      search={search}
    />
  );
}
