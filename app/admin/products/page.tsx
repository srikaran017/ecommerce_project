"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Package,
  Trash2,
  Search,
  ExternalLink,
  Check,
  Image as ImageIcon,
  X,
  Archive,
  Upload,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import { AdminProduct, CreateProductInput } from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState("Sarees");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Emerald Green, Rose Pink");
  const [stock, setStock] = useState("20");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = () => {
    setIsLoading(true);
    AdminService.getProducts(searchTerm)
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm]);

  // Handle Local Device Image Upload (Multer / Cloudinary Pipeline Ready)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Soft Delete / Archive (Protects Order History)
  const handleArchiveProduct = async (productId: string, productName: string) => {
    if (confirm(`Archive "${productName}"? It will be hidden from the storefront without corrupting past orders.`)) {
      await AdminService.archiveProduct(productId);
      setFeedback(`"${productName}" was archived.`);
      loadProducts();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Hard Delete (Super Admin Only)
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!rbac.canDeleteProduct(user?.role)) {
      alert("Permission denied. Only Super Admin can hard delete products.");
      return;
    }
    if (confirm(`Are you sure you want to permanently delete "${productName}"?`)) {
      await AdminService.deleteProduct(productId);
      setFeedback(`"${productName}" was permanently removed.`);
      loadProducts();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const sizeArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colorArray = colors.split(",").map((c) => c.trim()).filter(Boolean);

    const generatedVariants = sizeArray.flatMap((sz, i) =>
      colorArray.map((col, j) => ({
        size: sz,
        colorName: col,
        colorHex: col.toLowerCase().includes("pink") ? "#ffb6c1" : "#046307",
        price: Number(price),
        compareAtPrice: comparePrice ? Number(comparePrice) : null,
        costPrice: costPrice ? Number(costPrice) : Math.round(Number(price) * 0.45),
        stock: Math.floor(Number(stock) / (sizeArray.length || 1)),
        sku: `${name.slice(0, 3).toUpperCase()}-${sz}-${col.slice(0, 2).toUpperCase()}`,
        lowStockThreshold: 5,
      }))
    );

    const input: CreateProductInput = {
      name: name.trim(),
      description: `${name.trim()} crafted with premium fabric and elegant tailoring.`,
      shortDescription: `Handcrafted ${category} silhouette.`,
      categorySlug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryName: category,
      tags: [category, "Fashion", "Handcrafted"],
      gender: "WOMEN",
      images: [
        {
          url:
            imageUrl.trim() ||
            imagePreview ||
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
          isPrimary: true,
          altText: name.trim(),
        },
      ],
      variants:
        generatedVariants.length > 0
          ? generatedVariants
          : [
              {
                size: "Free Size",
                colorName: "Standard",
                colorHex: "#000000",
                price: Number(price),
                stock: Number(stock),
                sku: `SKU-${Date.now().toString().slice(-4)}`,
              },
            ],
    };

    await AdminService.createProduct(input);
    setName("");
    setPrice("");
    setComparePrice("");
    setCostPrice("");
    setImageUrl("");
    setImagePreview(null);
    setIsAddModalOpen(false);
    setFeedback(`"${name.trim()}" added successfully!`);
    loadProducts();
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              CATALOG ENGINE
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Multi-Variant Apparel</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage garment collections, variants, inventory thresholds, and pricing.
          </p>
        </div>

        {rbac.canCreateProduct(user?.role) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Garment</span>
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search by garment title, category, or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none transition-colors"
        />
      </div>

      {/* Products Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Stock</th>
                <th className="py-4 px-6">Variants</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isArchived = p.status === "ARCHIVED";
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isArchived ? "opacity-60 bg-slate-950/40" : ""
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]?.url || "https://placehold.co/100"}
                            alt={p.name}
                            className="w-11 h-13 object-cover rounded-md border border-slate-800 bg-slate-900"
                          />
                          <div>
                            <span className="font-bold text-white text-xs block hover:text-amber-400 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {p.variants[0]?.sku || p.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium">
                          {p.categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-white">
                          {storeConfig.currency.symbol}
                          {p.basePrice.toLocaleString()}
                        </span>
                        {p.variants[0]?.compareAtPrice && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            {storeConfig.currency.symbol}
                            {p.variants[0].compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">
                        <span
                          className={
                            p.totalStock === 0
                              ? "text-rose-400"
                              : p.totalStock < 10
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {p.totalStock} units
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {p.variants.length} options
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isArchived
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {p.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
                            title="View on Storefront"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Soft Delete / Archive */}
                          {!isArchived && rbac.canArchiveProduct(user?.role) && (
                            <button
                              onClick={() => handleArchiveProduct(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Archive (Soft Delete - preserves invoices)"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Permanent Delete (Super Admin only) */}
                          {rbac.canDeleteProduct(user?.role) && (
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal (with Image Upload & Multi-Variant Builder) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Add New Product</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="space-y-4 text-xs">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Garment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mulberry Silk Hand-Embroidered Kurta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="12999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Compare Price (₹)</label>
                  <input
                    type="number"
                    placeholder="15999"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Cost Price (₹)</label>
                  <input
                    type="number"
                    placeholder="5500"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Total Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Sarees">Sarees</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Kurtas">Kurtas & Sets</option>
                    <option value="Blazers">Suits & Blazers</option>
                    <option value="Lehengas">Lehengas</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Variant Sizing & Color Swatches */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Automatic Multi-Variant Generator
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 text-[11px]">
                    Garment Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="XS, S, M, L, XL"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 text-[11px]">
                    Color Swatches (comma separated)
                  </label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Emerald Green, Midnight Black, Ruby Red"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Image Upload Pipeline (Device Upload & URL) */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Dress Photography / Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-slate-900 border border-slate-800 border-dashed hover:border-amber-400 rounded-xl text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload from Phone / Laptop</span>
                  </button>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-12 h-14 object-cover rounded-lg border border-slate-700 bg-slate-900"
                    />
                  )}
                </div>

                <input
                  type="url"
                  placeholder="Or paste an image web URL..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-[11px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Create & Publish Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
