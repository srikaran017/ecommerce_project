"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Image as ImageIcon, Sparkles } from "lucide-react";
import { storeConfig } from "@/config/store.config";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sarees");
  const [price, setPrice] = useState("2499");
  const [comparePrice, setComparePrice] = useState("3499");
  const [stock, setStock] = useState("25");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Rose Pink, Emerald Green, Royal Blue");
  const [fabric, setFabric] = useState("Pure Katan Silk");
  const [description, setDescription] = useState("Exquisite handcrafted fashion piece designed with rich zari borders and comfortable tailoring.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1200);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Add New Product</h1>
            <p className="text-xs text-neutral-500">Fill in the details below to add a product to your store.</p>
          </div>
        </div>

        {success && (
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Product Added!</span>
          </div>
        )}
      </div>

      {/* Simple Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-5 text-xs">
        
        <div>
          <label className="font-bold text-neutral-800 block mb-1">Product Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Handcrafted Banarasi Silk Saree"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-medium focus:bg-white focus:outline-none focus:border-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-neutral-800 block mb-1">Selling Price (₹)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-bold focus:bg-white focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Original Price (₹ - for discount badge)</label>
            <input
              type="number"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-neutral-800 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-medium"
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
            <label className="font-bold text-neutral-800 block mb-1">Total Stock Count</label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-neutral-800 block mb-1">Product Photo URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900"
          />
          {imageUrl && (
            <div className="mt-3 w-20 h-24 rounded-2xl overflow-hidden border bg-neutral-100">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-neutral-800 block mb-1">Available Sizes (comma separated)</label>
            <input
              type="text"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-800 block mb-1">Fabric / Material</label>
            <input
              type="text"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-neutral-800 block mb-1">Product Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 font-medium"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-2xl transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-neutral-900 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? "Publishing..." : "Add to Store"}
          </button>
        </div>

      </form>

    </div>
  );
}
