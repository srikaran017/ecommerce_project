"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Star,
  SlidersHorizontal,
  Eye,
  RefreshCw,
  Layers,
  Tag,
  DollarSign,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  AdminProduct,
  AdminProductVariant,
  AdminProductImage,
  CreateProductInput,
  AdminCategory,
  ProductListQueryParams,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  // Faceted Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [stockStatus, setStockStatus] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [activeStatus, setActiveStatus] = useState<"ALL" | "true" | "false">("ALL");
  const [featuredStatus, setFeaturedStatus] = useState<"ALL" | "true" | "false">("ALL");
  const [sortOption, setSortOption] = useState<
    "newest" | "oldest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "name_asc" | "bestselling"
  >("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });

  // Modal & Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminProduct | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  // Add Product Form State
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("Maison De Élégance");
  const [formCategory, setFormCategory] = useState("");
  const [formRegularPrice, setFormRegularPrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formOfferPrice, setFormOfferPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSizes, setFormSizes] = useState("S, M, L, XL");
  const [formColors, setFormColors] = useState("Midnight Navy, Emerald Green, Rose Pink");
  const [formStockPerVariant, setFormStockPerVariant] = useState("5");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Additional Image Upload for Viewing Product Drawer
  const [drawerImageUrl, setDrawerImageUrl] = useState("");
  const [drawerIsThumbnail, setDrawerIsThumbnail] = useState(false);
  const drawerFileInputRef = useRef<HTMLInputElement>(null);

  // Load Categories for Filter Dropdown & Category Selector
  useEffect(() => {
    AdminService.getCategories({ view: "flat" })
      .then((res) => {
        if (res.data) setCategories(res.data);
      })
      .catch((err) => console.warn("Could not load categories:", err));
  }, []);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formCategory) {
      setFormCategory(categories[0].id);
    }
  }, [categories, formCategory]);

  // Load Products with Faceted Filters & Pagination
  const loadProducts = () => {
    setIsLoading(true);
    const queryParams: ProductListQueryParams = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm.trim() || undefined,
      categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
      brand: selectedBrand !== "ALL" ? selectedBrand : undefined,
      stockStatus: stockStatus !== "ALL" ? stockStatus : undefined,
      isActive: activeStatus !== "ALL" ? activeStatus : undefined,
      isFeatured: featuredStatus !== "ALL" ? featuredStatus : undefined,
      sort: sortOption,
    };

    AdminService.getProductsWithPagination(queryParams)
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
          if (res.pagination) {
            setPaginationMeta({
              total: res.pagination.total,
              totalPages: res.pagination.totalPages,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Error loading products:", err);
        setFeedback({ type: "error", message: "Failed to load products. Using local fallback cache." });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedCategory,
    selectedBrand,
    stockStatus,
    activeStatus,
    featuredStatus,
    sortOption,
  ]);

  // Distinct Brands for Brand Filter
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
    });
    return Array.from(brandsSet);
  }, [products]);

  // Quick Status Toggle (PATCH /api/v1/admin/products/:id/status)
  const handleToggleStatus = async (productId: string, currentActive: boolean, currentFeatured: boolean, field: "active" | "featured") => {
    if (!rbac.canWriteProducts(user?.role)) {
      setFeedback({ type: "warning", message: "Permission required (products:write) to update garments." });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const payload =
      field === "active"
        ? { isActive: !currentActive }
        : { isFeatured: !currentFeatured };

    try {
      const res = await AdminService.updateProductStatus(productId, payload);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  isActive: field === "active" ? !currentActive : p.isActive,
                  isFeatured: field === "featured" ? !currentFeatured : p.isFeatured,
                  status: field === "active" ? (!currentActive ? "ACTIVE" : "ARCHIVED") : p.status,
                }
              : p
          )
        );
        if (viewingProduct && viewingProduct.id === productId) {
          setViewingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  isActive: field === "active" ? !currentActive : prev.isActive,
                  isFeatured: field === "featured" ? !currentFeatured : prev.isFeatured,
                }
              : null
          );
        }
        setFeedback({
          type: "success",
          message: `Product ${field === "active" ? (payload.isActive ? "activated" : "deactivated") : (payload.isFeatured ? "starred as featured" : "unstarred")}.`,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update product status" });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Safe Archiving & Delete (DELETE /api/v1/admin/products/:id?force=true|false)
  const handleExecuteDelete = async () => {
    if (!deleteCandidate) return;

    if (!rbac.canDeleteProducts(user?.role)) {
      setFeedback({ type: "warning", message: "Permission required (products:delete) to remove garments." });
      setDeleteCandidate(null);
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    try {
      const res = await AdminService.deleteProduct(deleteCandidate.id, forceDelete);
      if (res.success) {
        setFeedback({
          type: res.data.action === "ARCHIVED" ? "warning" : "success",
          message: res.message,
        });
        setDeleteCandidate(null);
        setForceDelete(false);
        loadProducts();
        if (viewingProduct && viewingProduct.id === deleteCandidate.id) {
          setViewingProduct(null);
        }
        setTimeout(() => setFeedback(null), 4500);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete product." });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Image Upload via Cloud-Ready Pipeline (FileReader / Cloudinary ready)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "drawer") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === "create") {
          setFormImagePreview(result);
          setFormImageUrl(result);
        } else if (target === "drawer" && viewingProduct) {
          handleUploadDrawerImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Additional Image to Existing Product
  const handleUploadDrawerImage = async (imgUrlToUpload?: string) => {
    if (!viewingProduct) return;
    const url = imgUrlToUpload || drawerImageUrl.trim();
    if (!url) return;

    try {
      const res = await AdminService.uploadProductImages(viewingProduct.id, [
        {
          url,
          altText: viewingProduct.name,
          isThumbnail: drawerIsThumbnail,
          sortOrder: viewingProduct.images.length,
        },
      ]);
      if (res.success && res.data.images) {
        const updated = await AdminService.getProductById(viewingProduct.id);
        if (updated) {
          setViewingProduct(updated);
          loadProducts();
        }
        setDrawerImageUrl("");
        setDrawerIsThumbnail(false);
        setFeedback({ type: "success", message: "Gallery image uploaded successfully." });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to upload image." });
    }
  };

  // Delete Image from Existing Product
  const handleDeleteDrawerImage = async (imageId: string) => {
    if (!viewingProduct) return;
    if (viewingProduct.images.length <= 1) {
      alert("A garment must have at least one product photograph.");
      return;
    }
    if (confirm("Delete this photo from the product gallery?")) {
      try {
        const res = await AdminService.deleteProductImage(viewingProduct.id, imageId);
        if (res.success) {
          const updated = await AdminService.getProductById(viewingProduct.id);
          if (updated) {
            setViewingProduct(updated);
            loadProducts();
          }
          setFeedback({ type: "success", message: "Image removed from gallery." });
          setTimeout(() => setFeedback(null), 3000);
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to delete image." });
      }
    }
  };

  // Atomic Product Creation with Multi-Variant Matrix
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRegularPrice) return;

    if (!rbac.canWriteProducts(user?.role)) {
      setFeedback({ type: "warning", message: "Permission required (products:write) to publish garments." });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const regularP = Number(formRegularPrice);
    const saleP = formSalePrice ? Number(formSalePrice) : null;
    const costP = formCostPrice ? Number(formCostPrice) : Math.round(regularP * 0.45);
    const offerP = formOfferPrice ? Number(formOfferPrice) : null;

    if (saleP !== null && saleP > regularP) {
      alert("Sale price cannot be greater than Regular / Compare-at Price.");
      return;
    }

    const sizeArray = formSizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colorArray = formColors.split(",").map((c) => c.trim()).filter(Boolean);
    const stockUnits = Math.max(1, Number(formStockPerVariant) || 5);

    // Color swatches mapping
    const getColorHex = (cName: string) => {
      const lower = cName.toLowerCase();
      if (lower.includes("navy")) return "#0b1b3d";
      if (lower.includes("emerald") || lower.includes("green")) return "#046307";
      if (lower.includes("pink") || lower.includes("rose")) return "#e05297";
      if (lower.includes("red") || lower.includes("ruby")) return "#990000";
      if (lower.includes("gold") || lower.includes("yellow")) return "#d4af37";
      if (lower.includes("black")) return "#111111";
      if (lower.includes("white") || lower.includes("ivory")) return "#f8f9fa";
      if (lower.includes("purple") || lower.includes("plum")) return "#581845";
      return "#334155";
    };

    // Auto-generate variants matrix (Size x Color)
    const generatedVariants = sizeArray.flatMap((sz) =>
      colorArray.map((col) => ({
        size: sz,
        color: col,
        colorName: col,
        colorHex: getColorHex(col),
        regularPrice: regularP,
        salePrice: saleP,
        costPrice: costP,
        offerPrice: offerP,
        stockQuantity: stockUnits,
        sku: `${formName.slice(0, 3).toUpperCase()}-${sz}-${col.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-3)}`,
        lowStockThreshold: 5,
        isActive: true,
        attributes: [
          { attributeName: "Size", value: sz, slug: sz.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          { attributeName: "Color", value: col, slug: col.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        ],
      }))
    );

    const selectedCatObj = categories.find((c) => c.id === formCategory);

    const input: CreateProductInput = {
      name: formName.trim(),
      brand: formBrand.trim() || "Maison De Élégance",
      description: formDescription.trim() || `${formName.trim()} crafted with exquisite pure fabric and signature couture tailoring.`,
      shortDescription: `Handcrafted ${selectedCatObj?.name || "garment"} silhouette.`,
      categoryId: formCategory,
      categorySlug: selectedCatObj?.slug,
      categoryName: selectedCatObj?.name,
      regularPrice: regularP,
      salePrice: saleP,
      costPrice: costP,
      offerPrice: offerP,
      isActive: true,
      isFeatured: false,
      tags: [selectedCatObj?.name || "Garment", "Luxury", "Handcrafted"],
      gender: "WOMEN",
      images: [
        {
          url:
            formImageUrl.trim() ||
            formImagePreview ||
            "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
          altText: formName.trim(),
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
                regularPrice: regularP,
                salePrice: saleP,
                costPrice: costP,
                stockQuantity: stockUnits,
                sku: `${formName.slice(0, 3).toUpperCase()}-OS-${Date.now().toString().slice(-3)}`,
                lowStockThreshold: 5,
                isActive: true,
              },
            ],
    };

    try {
      const res = await AdminService.createProduct(input);
      if (res.success) {
        setIsAddModalOpen(false);
        // Reset form
        setFormName("");
        setFormRegularPrice("");
        setFormSalePrice("");
        setFormCostPrice("");
        setFormOfferPrice("");
        setFormDescription("");
        setFormImageUrl("");
        setFormImagePreview(null);
        setFeedback({ type: "success", message: `Garment "${input.name}" published with variants!` });
        loadProducts();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to create product." });
    }
  };

  // Profit Margin Calculator Helper
  const calculateMargin = (regular: string | number, cost?: string | number | null) => {
    const reg = Number(regular) || 0;
    const cst = Number(cost) || 0;
    if (reg <= 0 || cst <= 0) return null;
    const profit = reg - cst;
    const margin = Math.round((profit / reg) * 100);
    return margin;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              MODULE 03 • CATALOG ENGINE
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-xs text-slate-400 font-medium">Multi-Variant Sizing & Swatches</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Product & Multi-Variant Catalog</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage luxury garments, size curves (S–XL), color swatches, 3-tier compare-at pricing, image pipelines, and safe order archiving.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts()}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {rbac.canCreateProduct(user?.role) && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Garment</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Notification Toast / Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-950/70 border-emerald-800/80 text-emerald-300"
              : feedback.type === "warning"
              ? "bg-amber-950/70 border-amber-800/80 text-amber-300"
              : "bg-rose-950/70 border-rose-800/80 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            {feedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {feedback.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Faceted Filter & Search Control Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search across garment title, SKU, brand, or slug..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter (includes all subcategories automatically) */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories & Depths</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `↳ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="w-full sm:w-48">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Brands</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Selector */}
          <div className="w-full sm:w-52">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="bestselling">Sort: Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="name_asc">Name: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Faceted Stock & Status Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Stock Status:
            </span>
            <button
              onClick={() => {
                setStockStatus("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                stockStatus === "ALL"
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStockStatus("IN_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stockStatus === "IN_STOCK"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>In Stock (&gt;0)</span>
            </button>
            <button
              onClick={() => {
                setStockStatus("LOW_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stockStatus === "LOW_STOCK"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Low Stock (1–5)</span>
            </button>
            <button
              onClick={() => {
                setStockStatus("OUT_OF_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stockStatus === "OUT_OF_STOCK"
                  ? "bg-rose-500 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Out of Stock (0)</span>
            </button>
          </div>

          {/* Quick Active & Featured Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveStatus(activeStatus === "ALL" ? "true" : activeStatus === "true" ? "false" : "ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors ${
                activeStatus === "true"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                  : activeStatus === "false"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              State: {activeStatus === "true" ? "Active" : activeStatus === "false" ? "Archived" : "All"}
            </button>

            <button
              onClick={() => {
                setFeaturedStatus(featuredStatus === "ALL" ? "true" : "ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors flex items-center gap-1 ${
                featuredStatus === "true"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              <Star className="w-3 h-3 text-amber-400" />
              <span>Featured Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Products Data Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Garment & SKU</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Pricing Structure</th>
                <th className="py-4 px-6">Inventory Stock</th>
                <th className="py-4 px-6">Sizing & Swatches</th>
                <th className="py-4 px-6">Status Toggles</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-xs">Loading multi-variant apparel catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isArchived = !p.isActive || p.status === "ARCHIVED";
                  const margin = calculateMargin(p.regularPrice, p.costPrice);
                  const isLow = p.stockQuantity >= 1 && p.stockQuantity <= 5;
                  const isOut = p.stockQuantity === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isArchived ? "opacity-60 bg-slate-950/40" : ""
                      }`}
                    >
                      {/* Product & SKU */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.thumbnail || p.images[0]?.url || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"}
                            alt={p.name}
                            className="w-12 h-14 object-cover rounded-xl border border-slate-800 bg-slate-900 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span
                              onClick={() => setViewingProduct(p)}
                              className="font-bold text-white text-xs block hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
                            >
                              {p.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                                {p.sku}
                              </span>
                              <span className="text-slate-500 font-medium">{p.brand}</span>
                            </div>
                            {p.collections && p.collections.length > 0 && (
                              <div className="flex items-center gap-1 pt-0.5">
                                <span className="text-[9px] text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded-full">
                                  {p.collections[0].name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium inline-block">
                          {p.category?.name || p.categoryName || "Evening Gowns"}
                        </span>
                      </td>

                      {/* Pricing: Regular, Sale, Cost & Margin */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-white text-xs">
                              {storeConfig.currency.symbol}
                              {Number(p.salePrice || p.regularPrice).toLocaleString()}
                            </span>
                            {p.salePrice && (
                              <span className="text-[10px] text-slate-500 line-through">
                                {storeConfig.currency.symbol}
                                {Number(p.regularPrice).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px]">
                            {p.costPrice && (
                              <span className="text-slate-500">
                                COGS: {storeConfig.currency.symbol}
                                {Number(p.costPrice).toLocaleString()}
                              </span>
                            )}
                            {margin !== null && (
                              <span className="text-emerald-400 font-bold font-mono">
                                +{margin}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Stock & Urgency Indicator */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {p.stockQuantity} units
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold block w-fit border ${
                              isOut
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : isLow
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                          </span>
                        </div>
                      </td>

                      {/* Variants Sizing & Color Swatches Preview */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          {/* Color Hex Swatches */}
                          <div className="flex items-center gap-1">
                            {p.variants.slice(0, 4).map((v) => (
                              <div
                                key={v.id}
                                title={`${v.colorName || v.color} (${v.size})`}
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                                style={{ backgroundColor: v.colorHex || "#0b1b3d" }}
                              />
                            ))}
                            {p.variants.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{p.variants.length - 4}
                              </span>
                            )}
                          </div>

                          {/* Sizing Tags */}
                          <div className="flex items-center gap-1">
                            {Array.from(new Set(p.variants.map((v) => v.size)))
                              .slice(0, 4)
                              .map((sz) => (
                                <span
                                  key={sz}
                                  className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-mono"
                                >
                                  {sz}
                                </span>
                              ))}
                          </div>
                        </div>
                      </td>

                      {/* Quick Status Toggles (Active & Featured) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {/* Active Toggle Switch */}
                          <button
                            onClick={() => handleToggleStatus(p.id, p.isActive, p.isFeatured, "active")}
                            title={p.isActive ? "Deactivate Garment" : "Activate Garment"}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                              p.isActive ? "bg-emerald-500" : "bg-slate-800"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                p.isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          {/* Featured Star Toggle */}
                          <button
                            onClick={() => handleToggleStatus(p.id, p.isActive, p.isFeatured, "featured")}
                            title={p.isFeatured ? "Unfeature" : "Feature on Storefront"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              p.isFeatured
                                ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                                : "text-slate-600 hover:text-slate-400 border-transparent"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${p.isFeatured ? "fill-amber-400" : ""}`} />
                          </button>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details & Variant Drawer */}
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                            title="View Full Garment Matrix"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* View on Storefront */}
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
                            title="View on Storefront"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Safe Archiving & Delete Button */}
                          {rbac.canDeleteProducts(user?.role) && (
                            <button
                              onClick={() => {
                                setDeleteCandidate(p);
                                setForceDelete(false);
                              }}
                              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Delete or Archive Garment"
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
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <span>No garments found matching the selected filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400 text-[11px]">
            Showing <span className="font-bold text-white">{products.length}</span> of{" "}
            <span className="font-bold text-white">{paginationMeta.total}</span> garments
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-slate-300 font-mono text-[11px]">
                {currentPage} / {paginationMeta.totalPages}
              </span>
              <button
                disabled={currentPage >= paginationMeta.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Product Detail & Multi-Variant Matrix Drawer (Slide-Over) */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-2xl h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
                      {viewingProduct.sku}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-slate-400 text-xs">{viewingProduct.brand}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{viewingProduct.name}</h2>
                </div>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pricing & Profit Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Compare-At Price</span>
                  <span className="text-white font-bold text-sm">
                    {storeConfig.currency.symbol}
                    {Number(viewingProduct.regularPrice).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Sale Price</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {viewingProduct.salePrice
                      ? `${storeConfig.currency.symbol}${Number(viewingProduct.salePrice).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Cost (COGS)</span>
                  <span className="text-slate-300 font-bold text-sm">
                    {viewingProduct.costPrice
                      ? `${storeConfig.currency.symbol}${Number(viewingProduct.costPrice).toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Margin</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    +{calculateMargin(viewingProduct.regularPrice, viewingProduct.costPrice) ?? 0}%
                  </span>
                </div>
              </div>

              {/* Variant Combination Matrix Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Variant Matrix ({viewingProduct.variants.length} combinations)</span>
                  </h3>
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    Total: {viewingProduct.stockQuantity} units
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                        <th className="py-2.5 px-4">Variant SKU</th>
                        <th className="py-2.5 px-4">Size</th>
                        <th className="py-2.5 px-4">Color Swatch</th>
                        <th className="py-2.5 px-4">Price</th>
                        <th className="py-2.5 px-4 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {viewingProduct.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-mono font-medium text-[11px] text-amber-400">
                            {v.sku}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono font-bold text-[10px]">
                              {v.size}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"
                                style={{ backgroundColor: v.colorHex || "#0b1b3d" }}
                              />
                              <span className="text-[11px]">{v.colorName || v.color}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {storeConfig.currency.symbol}
                            {Number(v.salePrice || v.regularPrice || v.price).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span
                              className={
                                v.stock === 0
                                ? "text-rose-400"
                                : v.stock <= (v.lowStockThreshold || 5)
                                ? "text-amber-400"
                                : "text-emerald-400"
                              }
                            >
                              {v.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cloud-Only Image Gallery Pipeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Cloud Image Gallery ({viewingProduct.images.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {viewingProduct.images.map((img, i) => (
                    <div
                      key={img.id || i}
                      className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[3/4]"
                    >
                      <img src={img.url} alt={img.altText || viewingProduct.name} className="w-full h-full object-cover" />
                      {img.isThumbnail && (
                        <span className="absolute top-2 left-2 bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          THUMBNAIL
                        </span>
                      )}
                      {rbac.canWriteProducts(user?.role) && (
                        <button
                          onClick={() => img.id && handleDeleteDrawerImage(img.id)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-950/80 text-rose-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload Additional Image Field */}
                {rbac.canWriteProducts(user?.role) && (
                  <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <span className="text-slate-400 font-semibold block text-[11px]">
                      Add Gallery Image (Cloud Stream / Device)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={drawerFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, "drawer")}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => drawerFileInputRef.current?.click()}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-xl text-slate-300 flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload File</span>
                      </button>

                      <input
                        type="url"
                        placeholder="Or paste image URL..."
                        value={drawerImageUrl}
                        onChange={(e) => setDrawerImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleUploadDrawerImage()}
                        disabled={!drawerImageUrl.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-40 cursor-pointer text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
              <Link
                href={`/products/${viewingProduct.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-xs text-amber-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View garment on storefront</span>
              </Link>

              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Safe Archiving & Delete Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Safe Archiving & Deletion
                </h3>
                <span className="text-[11px] text-slate-400">Module 03 Safeguard Engine</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="text-white font-bold">"{deleteCandidate.name}"</span>?
            </p>

            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Cart & Invoice Protection Policy:</span>
              </div>
              <p>
                If this garment is present in active customer shopping carts or historical orders, calling Delete will{" "}
                <span className="text-amber-300 font-bold">soft-archive</span> it (setting isActive: false) to preserve invoices and tax receipts.
              </p>
            </div>

            {rbac.canDeleteProducts(user?.role) && (
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px] text-rose-300">
                  Force Hard Delete (Bypass cart/order retention guard - SUPER_ADMIN)
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteCandidate(null);
                  setForceDelete(false);
                }}
                className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Product Modal with Multi-Variant Sizing & Swatch Builder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Create Luxury Garment
                  </h3>
                  <span className="text-[11px] text-slate-500">Atomic Multi-Variant Sizing & Swatch Engine</span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Garment Title & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Garment Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mulberry Silk Draped Evening Gown"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Brand / Atelier *</label>
                  <input
                    type="text"
                    required
                    placeholder="Maison De Élégance"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Taxonomy Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? `↳ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Couture Description</label>
                  <input
                    type="text"
                    placeholder="Tailored in Biella wool with horn buttons..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing Structure: Regular Price, Sale Price, COGS */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 block">
                  Pricing Matrix (Module 03 Specification)
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Regular Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="22999"
                      value={formRegularPrice}
                      onChange={(e) => setFormRegularPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Sale Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="18999"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Cost Price (COGS ₹)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="9500"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sizing & Color Swatch Combinations Builder */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Variant Curve & Swatches Generator</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400 text-[11px]">
                      Garment Sizes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formSizes}
                      onChange={(e) => setFormSizes(e.target.value)}
                      placeholder="S, M, L, XL"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400 text-[11px]">
                      Color Swatches (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formColors}
                      onChange={(e) => setFormColors(e.target.value)}
                      placeholder="Midnight Navy, Emerald Green, Rose Pink"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400 text-[11px]">
                    Stock Allocation per Variant Combination
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formStockPerVariant}
                    onChange={(e) => setFormStockPerVariant(e.target.value)}
                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 ml-2">
                    Total stockQuantity is computed as the sum of variant stock.
                  </span>
                </div>
              </div>

              {/* Cloud-Only Image Pipeline */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Product Photography (Cloud / Device Stream)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, "create")}
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

                  {formImagePreview && (
                    <img
                      src={formImagePreview}
                      alt="Preview"
                      className="w-12 h-14 object-cover rounded-xl border border-slate-700 bg-slate-900"
                    />
                  )}
                </div>

                <input
                  type="url"
                  placeholder="Or paste high-resolution photo URL..."
                  value={formImageUrl}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    setFormImagePreview(e.target.value || null);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  Publish Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
