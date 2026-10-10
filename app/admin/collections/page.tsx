"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Layers,
  ShoppingBag,
  CheckCircle2,
  Info,
  Sliders,
  ChevronRight,
  Eye,
  GripVertical,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AdminService } from "@/services/admin.service";
import {
  AdminCollection,
  AdminCollectionProduct,
  AdminProduct,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/types/admin.types";
import { rbac } from "@/lib/rbac";
import { storeConfig } from "@/config/store.config";

export default function AdminCollectionsPage() {
  const { user: currentUser } = useAuthStore();
  const currentRole = currentUser?.role || "SUPER_ADMIN";
  const canManage = rbac.canManageCollections(currentRole);

  // Collections Data State
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<string>("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<AdminCollection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCollection | null>(null);

  // Product Sequencing Drawer
  const [activeCollectionForProducts, setActiveCollectionForProducts] = useState<AdminCollection | null>(null);
  const [sequencedProducts, setSequencedProducts] = useState<AdminCollectionProduct[]>([]);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSavingSequence, setIsSavingSequence] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isFeatured: true,
    sortOrder: 0,
    isActive: true,
    productIds: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Toast
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlert({ type, title, message });
    setTimeout(() => {
      setAlert((prev) => (prev?.title === title ? null : prev));
    }, 5000);
  };

  // Load Collections and Store Products
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch Collections
      const colsRes = await AdminService.getCollections();
      if (colsRes.success) {
        setCollections(colsRes.data);
      }

      // 2. Fetch Store Products for Garment Sync
      const prods = await AdminService.getProducts();
      setAvailableProducts(prods);
    } catch (err: any) {
      showAlert("error", "Failed to Load Collections", err.message || "Error fetching collections.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      if (statusFilter === "ACTIVE" && !col.isActive) return false;
      if (statusFilter === "INACTIVE" && col.isActive) return false;
      if (featuredFilter === "FEATURED" && !col.isFeatured) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = col.name.toLowerCase().includes(q);
        const matchesSlug = col.slug.toLowerCase().includes(q);
        const matchesDesc = Boolean(col.description && col.description.toLowerCase().includes(q));
        if (!matchesName && !matchesSlug && !matchesDesc) return false;
      }

      return true;
    });
  }, [collections, statusFilter, featuredFilter, searchQuery]);

  // --------------------------------------------------------------------------
  // CREATE & EDIT MODAL
  // --------------------------------------------------------------------------
  const openCreateModal = () => {
    setEditingCollection(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      isFeatured: true,
      sortOrder: collections.length,
      isActive: true,
      productIds: [],
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (col: AdminCollection) => {
    setEditingCollection(col);
    setForm({
      name: col.name || col.title || "",
      slug: col.slug,
      description: col.description || "",
      imageUrl: col.imageUrl || "",
      isFeatured: Boolean(col.isFeatured),
      sortOrder: col.sortOrder || 0,
      isActive: Boolean(col.isActive),
      productIds: col.productIds || [],
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      setFormErrors({ name: "Collection name must be at least 2 characters." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCollection) {
        const res = await AdminService.updateCollection(editingCollection.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || null,
          isFeatured: form.isFeatured,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        });

        if (!res.success) {
          showAlert("error", "Update Failed", res.message || "Could not update collection.");
          return;
        }

        showAlert("success", "Collection Updated", `"${form.name}" updated successfully.`);
      } else {
        const res = await AdminService.createCollection({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || null,
          isFeatured: form.isFeatured,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
          productIds: form.productIds,
        });

        if (!res.success) {
          showAlert("error", "Creation Failed", res.message || "Could not create collection.");
          return;
        }

        showAlert("success", "Collection Created", `"${form.name}" has been launched.`);
      }

      setIsCreateModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // PRODUCT SEQUENCING & REORDERING DRAWER (3.5 & 3.6 & 3.7)
  // --------------------------------------------------------------------------
  const openProductDrawer = async (col: AdminCollection) => {
    setActiveCollectionForProducts(col);
    setIsProductDrawerOpen(true);
    setProductSearchQuery("");

    // Load detailed collection with products
    const detail = await AdminService.getCollectionById(col.id);
    if (detail.success && detail.data?.collection) {
      setSequencedProducts(detail.data.collection.products || []);
    }
  };

  const moveProductOrder = (index: number, direction: "UP" | "DOWN") => {
    const newIdx = direction === "UP" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sequencedProducts.length) return;

    const updated = [...sequencedProducts];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIdx, 0, moved);
    setSequencedProducts(updated);
  };

  const handleSaveProductSequence = async () => {
    if (!activeCollectionForProducts) return;
    setIsSavingSequence(true);

    try {
      const productIds = sequencedProducts.map((p) => p.id);
      const res = await AdminService.reorderCollectionProducts(activeCollectionForProducts.id, productIds);

      if (!res.success) {
        showAlert("error", "Reorder Failed", res.message || "Failed to update sequence.");
        return;
      }

      showAlert(
        "success",
        "Sequence Synchronized",
        `Garments sequenced in order for "${activeCollectionForProducts.name}".`
      );
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Error", err.message || "Sequence save failed.");
    } finally {
      setIsSavingSequence(false);
    }
  };

  const handleAddProductToCollection = async (product: AdminProduct) => {
    if (!activeCollectionForProducts) return;

    try {
      const res = await AdminService.addProductsToCollection(activeCollectionForProducts.id, [product.id]);
      if (res.success) {
        // Refresh drawer
        const detail = await AdminService.getCollectionById(activeCollectionForProducts.id);
        if (detail.success && detail.data?.collection) {
          setSequencedProducts(detail.data.collection.products || []);
        }
        showAlert("success", "Garment Added", `"${product.name}" attached to collection.`);
        await loadData(true);
      }
    } catch (err: any) {
      showAlert("error", "Error", err.message || "Failed to add garment.");
    }
  };

  const handleRemoveProductFromCollection = async (productId: string, productName: string) => {
    if (!activeCollectionForProducts) return;

    try {
      const res = await AdminService.removeProductFromCollection(activeCollectionForProducts.id, productId);
      if (res.success) {
        setSequencedProducts((prev) => prev.filter((p) => p.id !== productId));
        showAlert("info", "Garment Removed", `"${productName}" was detached from collection.`);
        await loadData(true);
      }
    } catch (err: any) {
      showAlert("error", "Error", err.message || "Failed to remove garment.");
    }
  };

  // --------------------------------------------------------------------------
  // DELETE COLLECTION (3.8)
  // --------------------------------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await AdminService.deleteCollection(deleteTarget.id);
      if (!res.success) {
        showAlert("error", "Deletion Failed", res.message || "Could not delete collection.");
        return;
      }

      showAlert("success", "Collection Deleted", `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Delete Failed", err.message || "An error occurred.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
            alert.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : alert.type === "error"
              ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
              : "bg-slate-900/90 border-slate-700 text-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : alert.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">{alert.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              MODULE 02: EDITORIALS
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Curated Capsules, Lookbooks & Sequencing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <span>Curated Collections Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sequence garment lineups, publish seasonal lookbooks, and curate couture edits with one-click product syncing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Collections"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {canManage && (
            <button
              id="btn-create-collection"
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collections by title, slug, or capsule description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Edits</option>
              <option value="INACTIVE">Archived / Hidden</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Features</option>
              <option value="FEATURED">Featured Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-slate-950/80 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading curated lookbooks...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-slate-950/80 border border-slate-800 rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Collections Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create seasonal capsule edits or lookbooks to showcase curated garments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((col) => (
            <div
              key={col.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl transition-all group"
            >
              {/* Cover Image & Badges */}
              <div className="relative h-56 bg-slate-900 overflow-hidden">
                {col.imageUrl ? (
                  <img
                    src={col.imageUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {col.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/90 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        col.isActive
                          ? "bg-emerald-500/80 text-white"
                          : "bg-rose-500/80 text-white"
                      }`}
                    >
                      {col.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-bold text-amber-300 font-mono backdrop-blur-md">
                    {col.productsCount || col.productIds?.length || 0} Garments
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="font-mono text-[10px] text-slate-400">Handle: /{col.slug}</span>
                  <h3 className="font-extrabold text-lg text-white tracking-tight line-clamp-1">{col.name}</h3>
                </div>
              </div>

              {/* Description & Metadata */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {col.description || "Curated editorial lookbook."}
                </p>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Sequence Products Button */}
                  <button
                    onClick={() => openProductDrawer(col)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sequence Garments</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(col)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                      title="Edit Collection Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {canManage && (
                      <button
                        onClick={() => setDeleteTarget(col)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.5 & 3.6. GARMENT SEQUENCING & SYNC DRAWER                               */}
      {/* ========================================================================= */}
      {isProductDrawerOpen && activeCollectionForProducts && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col justify-between shadow-2xl p-6 sm:p-8 overflow-hidden">
            {/* Drawer Header */}
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  SEQUENCE ENGINE
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  {activeCollectionForProducts.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reorder garments within this lookbook or attach new silhouettes from the catalogue.
                </p>
              </div>
              <button
                onClick={() => setIsProductDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Center: Attached Garments & Catalogue Picker */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Sequenced Garments List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <GripVertical className="w-4 h-4" />
                    Garments in Sequence ({sequencedProducts.length})
                  </h3>
                  <button
                    onClick={handleSaveProductSequence}
                    disabled={isSavingSequence}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold uppercase tracking-wider shadow disabled:opacity-60"
                  >
                    {isSavingSequence ? "Saving..." : "Save Order"}
                  </button>
                </div>

                {sequencedProducts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
                    No garments attached to this collection yet. Choose from the catalogue below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sequencedProducts.map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Order index badge */}
                          <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-amber-400 flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>

                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                            {prod.thumbnail ? (
                              <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-slate-600 m-2.5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {storeConfig.currency.symbol}{prod.regularPrice} • SKU: {prod.sku || prod.id}
                            </div>
                          </div>
                        </div>

                        {/* Sequence Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => moveProductOrder(idx, "UP")}
                            disabled={idx === 0}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveProductOrder(idx, "DOWN")}
                            disabled={idx === sequencedProducts.length - 1}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveProductFromCollection(prod.id, prod.name)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800"
                            title="Remove from Collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attach More Garments from Catalogue */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-400" />
                    Attach from Store Catalogue
                  </h3>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search product name or SKU..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  {availableProducts
                    .filter((p) => {
                      // Exclude products already in collection
                      if (sequencedProducts.some((sp) => sp.id === p.id)) return false;
                      if (!productSearchQuery.trim()) return true;
                      const q = productSearchQuery.toLowerCase().trim();
                      return p.name.toLowerCase().includes(q) || (p.variants[0]?.sku && p.variants[0].sku.toLowerCase().includes(q));
                    })
                    .slice(0, 10)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.images[0]?.url}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-900 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {storeConfig.currency.symbol}{p.basePrice}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddProductToCollection(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase transition-colors"
                        >
                          Attach
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsProductDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.3 & 3.4. CREATE / EDIT COLLECTION MODAL                                 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  COLLECTION ENGINE
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {editingCollection ? `Edit: ${editingCollection.name}` : "Create Curated Collection"}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Collection Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    setForm({
                      ...form,
                      name,
                      slug: editingCollection ? form.slug : autoSlug,
                    });
                  }}
                  placeholder="e.g. Royal Festive Edit 2026"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 ${
                    formErrors.name ? "border-rose-500" : "border-slate-800"
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Handle (Slug)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    /collections/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="royal-festive-edit-2026"
                    className="w-full pl-28 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Editorial Capsule Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Story, inspiration, and styling notes behind this curated lookbook..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Cover / Banner Image URL
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... (or Cloudinary URL)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Feature in Storefront Carousel</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Visible Online</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : editingCollection ? "Update Collection" : "Launch Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.8. DELETE COLLECTION CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Collection?</h3>
                <p className="text-xs text-slate-400">Action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <p className="text-slate-300">
                Are you sure you want to delete <strong className="text-white font-bold">"{deleteTarget.name}"</strong>? Attached garments will remain in your product catalogue.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
