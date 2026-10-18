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
  X,
  Plus,
  Trash2,
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

  // Cloudinary Image Pipeline: Strict Mutual Exclusivity (Mode A: Upload vs Mode B: URL)
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
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

  // Mode A: File Upload Handler (Up to 10 files, max 10MB each)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 10) {
      alert("A product can have a maximum of 10 gallery images.");
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 10MB limit.`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);

    // Enforce exclusivity: Clear URL input
    setImageUrl("");
  };

  const removeFileAtIndex = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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

    // Validation based on Mutual Exclusivity Mode
    if (imageMode === "upload" && selectedFiles.length === 0) {
      setErrorMessage("Please select at least 1 image file to upload (or switch to 'Direct URL' mode).");
      setIsSubmitting(false);
      return;
    }

    if (imageMode === "url" && !imageUrl.trim()) {
      setErrorMessage("Please enter a valid HTTPS image URL (or switch to 'File Upload' mode).");
      setIsSubmitting(false);
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    const variantsPayload =
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
          ];

    try {
      let res: { success: boolean; product?: any; message?: string; error?: any };

      if (imageMode === "upload") {
        // MODE A — File Upload (Cloudinary stream)
        // Strict Mutual Exclusivity: Send multipart/form-data with binary files. DO NOT send images as URL array!
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("brand", brand.trim() || "Maison De Élégance");
        formData.append("description", description.trim());
        formData.append("shortDescription", `Handcrafted ${selectedCat?.name || "garment"} silhouette.`);
        formData.append("categoryId", categoryId);
        if (selectedCat?.slug) formData.append("categorySlug", selectedCat.slug);
        if (selectedCat?.name) formData.append("categoryName", selectedCat.name);
        formData.append("regularPrice", String(regP));
        if (sP !== null) formData.append("salePrice", String(sP));
        if (cP !== null) formData.append("costPrice", String(cP));
        if (oP !== null) formData.append("offerPrice", String(oP));
        formData.append("stockQuantity", String(stockUnits * Math.max(1, variantsPayload.length)));
        formData.append("variants", JSON.stringify(variantsPayload));

        // Attach up to 10 binary image files under field 'images'
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });

        res = await AdminService.createProduct(formData);
      } else {
        // MODE B — Direct Image URL (application/json)
        // Strict Mutual Exclusivity: Pass HTTPS image URL in JSON array. DO NOT send files!
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
              url: imageUrl.trim(),
              altText: name.trim(),
              isThumbnail: true,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          variants: variantsPayload,
        };

        res = await AdminService.createProduct(input);
      }

      if (res.success) {
        setIsSubmitting(false);
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/products");
        }, 1200);
      } else {
        setIsSubmitting(false);
        if (res.error?.code === "IMAGE_INPUT_CONFLICT" || res.error === "IMAGE_INPUT_CONFLICT") {
          setErrorMessage("Conflicting Image Input: Please supply either file uploads OR an image URL, never both simultaneously.");
        } else {
          setErrorMessage(res.message || "Failed to create product");
        }
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

        {/* Cloudinary Integration: Mutual Exclusivity Image Pipeline (Mode A: Upload vs Mode B: URL) */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <label className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
                Product Photography & Gallery
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cloudinary Storage Engine: Choose either direct file upload or HTTPS image URL.
              </p>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setImageMode("upload");
                  setImageUrl("");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  imageMode === "upload"
                    ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>📁 Upload Image File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageMode("url");
                  setSelectedFiles([]);
                  setFilePreviews([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  imageMode === "url"
                    ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>🔗 Direct Image URL</span>
              </button>
            </div>
          </div>

          {/* MODE A: Direct File Upload to Cloudinary */}
          {imageMode === "upload" && (
            <div key="new-product-upload-mode" className="space-y-3">
              <input
                key="new-product-file-input"
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-800 hover:border-amber-400/80 rounded-2xl bg-slate-950/50 hover:bg-slate-950 text-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block group-hover:text-amber-400 transition-colors">
                    Click to select product photos (Up to 10 images)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Supports JPG, PNG, WEBP, GIF (Max 10MB per file) • Streams directly to Cloudinary
                  </span>
                </div>
              </div>

              {/* Previews Grid */}
              {filePreviews.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selected Photos ({selectedFiles.length}/10)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {filePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-3/4 flex items-center justify-center"
                      >
                        <img
                          src={previewUrl}
                          alt={`Uploaded preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            PRIMARY
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFileAtIndex(idx);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 cursor-pointer shadow"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE B: Direct Image URL */}
          {imageMode === "url" && (
            <div key="new-product-url-mode" className="space-y-3">
              <div>
                <label className="font-semibold text-slate-300 block text-xs mb-1">
                  HTTPS Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    key="new-product-url-input"
                    type="url"
                    value={imageUrl || ""}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Must be an accessible, secure HTTPS image URL.
                </span>
              </div>

              {/* URL Preview */}
              {imageUrl.trim() && (
                <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="w-14 h-16 object-cover rounded-lg border border-slate-700 bg-slate-900 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">
                      Live URL Preview
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block truncate">
                      {imageUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
