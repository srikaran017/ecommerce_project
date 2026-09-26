import React from "react";
import { notFound } from "next/navigation";
import { ProductService } from "@/services/product.service";
import { ProductDetailClient } from "./ProductDetailClient";
import { storeConfig } from "@/config/store.config";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const product = await ProductService.getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found | " + storeConfig.name,
    };
  }

  return {
    title: `${product.name} | ${storeConfig.name}`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = await params;
  const product = await ProductService.getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = (await ProductService.getAllProducts({ category: product.categorySlug }))
    .filter((p: any) => p.id !== product.id)
    .slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
