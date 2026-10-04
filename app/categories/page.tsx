import React from "react";
import { ProductService } from "@/services/product.service";
import { CategoriesDirectoryClient } from "./CategoriesDirectoryClient";
import { storeConfig } from "@/config/store.config";

export const metadata = {
  title: `Categories Directory | ${storeConfig.name}`,
  description:
    "Explore our complete hierarchy of luxury evening gowns, royal sarees, tailored suits, and fine cotton shirts.",
};

export default async function CategoriesPage() {
  const categoriesTree = await ProductService.getCategoryTree({ tree: true });

  return <CategoriesDirectoryClient categoriesTree={categoriesTree} />;
}
