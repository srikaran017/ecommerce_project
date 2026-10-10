"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import { AdminCategory, CreateProductInput } from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("Maison De Élégance");
  const [categoryId, setCategoryId] = useState("");
  const [regularPrice, setRegularPrice] = useState("24999");
  const [salePrice, setSalePrice] = useState("19999");
  const [costPrice, setCostPrice] = useState("11000");
  const [offerPrice, setOfferPrice] = useState("");
  const [description, setDescription] = useState(
    "Exquisite handcrafted couture silhouette designed with rich pure fabrics and tailored finish."
  );
  const [sizes, setSizes] = useState("S, M, L, XL");
  const [colors, setColors] = useState("Midnight Navy, Emerald Green, Rose Pink");
  const [stockPerVariant, setStockPerVariant] = useState("5");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AdminService.getCategories({ view: "flat" })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
          setCategoryId(res.data[0].id);
        }
      })
      .catch((err) => console.warn("Error loading categories:", err));
  }, []);

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

  const getColorHex = (cName: string) => {
    const lower = cName.toLowerCase();
    if (lower.includes("navy")) return "#0b1b3d";
    if (lower.includes("emerald") || lower.includes("green")) return "#046307";
    if (lower.includes("pink") || lower.includes("rose")) return "#e05297";
    if (lower.includes("red") || lower.includes("ruby")) return "#990000";
    if (lower.includes("gold") || lower.includes("yellow")) return "#d4af37";
    if (lower.includes("black")) return "#111111";
    if (lower.includes("white") || lower.includes("ivory")) return "#f8f9fa";
    return "#334155";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regularPrice) return;

    if (!rbac.canWriteProducts(user?.role)) {
      setErrorMessage("Permission required (products:write) to publish garments.");
      return;
    }

    const regP = Number(regularPrice);
    const sP = salePrice ? Number(salePrice) : null;
    const cP = costPrice ? Number(costPrice) : Math.round(regP * 0.45);
    const oP = offerPrice ? Number(offerPrice) : null;

    if (sP !== null && sP > regP) {
      alert("Sale price cannot exceed Compare-At / Regular Price.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const sizeArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colorArray = colors.split(",").map((c) => c.trim()).filter(Boolean);
    const stockUnits = Math.max(1, Number(stockPerVariant) || 5);

    const generatedVariants = sizeArray.flatMap((sz) =>
      colorArray.map((col) => ({
        size: sz,
        color: col,
        colorName: col,
        colorHex: getColorHex(col),
        regularPrice: regP,
        salePrice: sP,
        costPrice: cP,
        offerPrice: oP,
        stockQuantity: stockUnits,
        sku: `${name.slice(0, 3).toUpperCase()}-${sz}-${col.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-3)}`,
        lowStockThreshold: 5,
        isActive: true,
        attributes: [
          { attributeName: "Size", value: sz, slug: sz.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          { attributeName: "Color", value: col, slug: col.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        ],
      }))
    );

    const selectedCat = categories.find((c) => c.id === categoryId);

    const input: CreateProductInput = {
      name: name.trim(),
      brand: brand.trim() || "Maison De Élégance",
      description: description.trim(),
      shortDescription: `Handcrafted ${selectedCat?.name || "garment"} silhouette.`,
      categoryId,
      categorySlug: selectedCat?.slug,
      categoryName: selectedCat?.name,
      regularPrice: regP,
      salePrice: sP,
      costPrice: cP,
      offerPrice: oP,
      isActive: true,
      isFeatured: false,
      tags: [selectedCat?.name || "Garment", "Luxury", "Handcrafted"],
      gender: "WOMEN",
      images: [
        {
          url: imageUrl.trim() || imagePreview || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
          altText: name.trim(),
          isThumbnail: true,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
      variants:
        generatedVariants.length > 0
          ? generatedVariants
          : [
              {
                size: "Free Size",
                color: "Midnight Navy",
                colorName: "Midnight Navy",
                colorHex: "#0b1b3d",
                regularPrice: regP,
                salePrice: sP,
                costPrice: cP,
                stockQuantity: stockUnits,
                sku: `${name.slice(0, 3).toUpperCase()}-OS-${Date.now().toString().slice(-3)}`,
                lowStockThreshold: 5,
                isActive: true,
              },
            ],
    };

    try {
      const res = await AdminService.createProduct(input);
      if (res.success) {
        setIsSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      } else {
        setIsSubmitting(false);
        setErrorMessage(res.message || "Failed to create product");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Failed to create product");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/products"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                MODULE 03 • CREATION ENGINE
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Create Multi-Variant Garment</h1>
            <p className="text-xs text-slate-400">Atomic creation with S-XL curve, color swatches, and COGS ledger.</p>
          </div>
        </div>

        {success && (
          <div className="px-3.5 py-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Garment Published!</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Creation Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5 text-xs text-slate-300"
      >
        {/* Title & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-200 block mb-1.5">Garment Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Italian Virgin Wool Double-Breasted Blazer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1.5">Brand / Atelier *</label>
            <input
              type="text"
              required
              placeholder="Maison De Élégance"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Category & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-200 block mb-1.5">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1.5">Couture Description</label>
            <input
              type="text"
              placeholder="Tailored in Biella wool with horn buttons and peak lapels..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* 3-Tier Pricing Structure */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 block">
            Pricing Structure (Compare-At, Sale, COGS)
          </span>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Regular Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Sale Price (₹)</label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Cost Price (COGS ₹)</label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Multi-Variant Sizing & Swatches Matrix */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Variant Combination Generator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Sizes (comma separated)</label>
              <input
                type="text"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="38R, 40R, 42R"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-400 block mb-1">Color Swatches (comma separated)</label>
              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="Midnight Navy, Charcoal Grey"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-400 block mb-1">
              Stock Units per Variant Combination
            </label>
            <input
              type="number"
              min={1}
              value={stockPerVariant}
              onChange={(e) => setStockPerVariant(e.target.value)}
              className="w-36 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
            />
            <span className="text-[10px] text-slate-500 ml-2">
              Sum of variant stock automatically equals total stockQuantity.
            </span>
          </div>
        </div>

        {/* Cloud-Only Image Pipeline */}
        <div className="space-y-2">
          <label className="font-bold text-slate-200 block">Product Photography</label>
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
              <span>Upload from Device</span>
            </button>

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-14 object-cover rounded-xl border border-slate-700 bg-slate-900"
              />
            )}
          </div>

          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImagePreview(e.target.value || null);
            }}
            placeholder="Or paste high-resolution photo URL..."
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 text-slate-400 font-bold hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer disabled:opacity-40"
          >
            {isSubmitting ? "Publishing Garment..." : "Publish to Catalog"}
          </button>
        </div>
      </form>
    </div>
  );
}
