"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Package, Trash2, Search, ExternalLink, Check, Image as ImageIcon, X } from "lucide-react";
import { FALLBACK_PRODUCTS, ProductData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>(FALLBACK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Simple Add Product Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [category, setCategory] = useState("Sarees");
  const [imageUrl, setImageUrl] = useState("");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Emerald Green, Rose Pink");
  const [stock, setStock] = useState("20");

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setFeedback(`"${productName}" was deleted.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const sizeArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colorArray = colors.split(",").map((c) => c.trim()).filter(Boolean);

    const generatedVariants = sizeArray.flatMap((sz, i) =>
      colorArray.map((col, j) => ({
        id: `v_${Date.now()}_${i}_${j}`,
        sku: `${name.slice(0, 3).toUpperCase()}-${sz}-${col.slice(0, 2).toUpperCase()}`,
        price: Number(price),
        compareAtPrice: comparePrice ? Number(comparePrice) : null,
        stock: Math.floor(Number(stock) / (sizeArray.length || 1)),
        size: sz,
        colorName: col,
        colorHex: col.toLowerCase().includes("pink") ? "#ffb6c1" : "#046307",
        isActive: true,
      }))
    );

    const newProd: ProductData = {
      id: `prod_${Date.now()}`,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: `${name.trim()} crafted with premium fabric and elegant tailoring.`,
      shortDescription: `Premium ${category} with handcrafted detailing.`,
      price: Number(price),
      compareAtPrice: comparePrice ? Number(comparePrice) : null,
      brand: storeConfig.name,
      gender: "WOMEN",
      tags: [category],
      categorySlug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryName: category,
      stock: Number(stock),
      lowStockThreshold: 5,
      images: [
        {
          url:
            imageUrl.trim() ||
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
          isPrimary: true,
        },
      ],
      variants: generatedVariants.length > 0 ? generatedVariants : [
        {
          id: `v_${Date.now()}`,
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          price: Number(price),
          stock: Number(stock),
          size: "Free Size",
          colorName: "Standard",
          colorHex: "#000000",
          isActive: true,
        }
      ],
      reviewsCount: 1,
      averageRating: 5.0,
    };

    setProducts([newProd, ...products]);
    setName("");
    setPrice("");
    setComparePrice("");
    setImageUrl("");
    setIsAddModalOpen(false);
    setFeedback(`"${newProd.name}" added successfully!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <span>My Products</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Easily add, view, or delete products for your online store.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative bg-white rounded-2xl border border-neutral-100 shadow-sm">
        <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search your products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-transparent text-xs font-medium text-neutral-900 rounded-2xl focus:outline-none"
        />
      </div>

      {/* Clean Simple Products List */}
      <div className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Total Products ({filteredProducts.length})
        </div>

        <div className="divide-y divide-neutral-100">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-neutral-50/60 transition-colors"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={p.images[0]?.url}
                  alt={p.name}
                  className="w-14 h-18 object-cover rounded-xl bg-neutral-100 flex-shrink-0 shadow-sm"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    {p.categoryName}
                  </span>
                  <h4 className="font-bold text-sm text-neutral-900 truncate mt-0.5">
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-neutral-900">
                      {storeConfig.currency.symbol}{p.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-400">
                      • Stock: <strong className="text-neutral-700">{p.stock} units</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/products/${p.slug}`}
                  target="_blank"
                  className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
                  title="Preview on website"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                {/* Instant Delete Button */}
                <button
                  onClick={() => handleDeleteProduct(p.id, p.name)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-xs text-neutral-400">
              No products found matching "{searchTerm}".
            </div>
          )}
        </div>
      </div>

      {/* Simple "Add Product" Pop-up Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-neutral-100 space-y-5 relative">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-neutral-900">
                Add New Product
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Silk Banarasi Saree"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900 text-neutral-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="2499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900 text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="3999 (optional discount)"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-medium"
                  >
                    <option value="Sarees">Sarees</option>
                    <option value="Lehengas">Lehengas</option>
                    <option value="Kurtis & Sets">Kurtis & Sets</option>
                    <option value="Salwar Suits">Salwar Suits</option>
                    <option value="Dresses & Gowns">Dresses & Gowns</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Total Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Product Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (paste image link)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Available Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Available Colors</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Red, Green, Blue"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save & Publish Product
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
