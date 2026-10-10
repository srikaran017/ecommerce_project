"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  ArrowUpDown,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
  Filter,
  RefreshCw,
  AlertTriangle,
  FolderPlus,
  Check,
  X,
  Info,
  SlidersHorizontal,
  Eye,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AdminService } from "@/services/admin.service";
import { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from "@/types/admin.types";
import { rbac } from "@/lib/rbac";

export default function AdminCategoriesPage() {
  const { user: currentUser } = useAuthStore();
  const currentRole = currentUser?.role || "SUPER_ADMIN";
  const canManage = rbac.canManageCategories(currentRole);

  // Data State
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View & Filters
  const [viewMode, setViewMode] = useState<"tree" | "flat">("tree");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<string>("ALL");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Pagination for Flat View
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [isForceDelete, setIsForceDelete] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    parentId: "" as string | null,
    sortOrder: 0,
    isFeatured: false,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts & Notifications
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

  // Load Categories
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Load Tree View
      const treeRes = await AdminService.getCategories({ view: "tree" });
      if (treeRes.success) {
        setCategories(treeRes.data);

        // Auto-expand all top-level categories by default
        const initialExpanded: Record<string, boolean> = {};
        treeRes.data.forEach((c) => {
          initialExpanded[c.id] = true;
        });
        setExpandedNodes((prev) => ({ ...initialExpanded, ...prev }));
      }

      // 2. Load Flat View for parent selectors
      const flatRes = await AdminService.getCategories({ view: "flat", limit: 100 });
      if (flatRes.success) {
        setFlatCategories(flatRes.data);
      }
    } catch (err: any) {
      showAlert("error", "Failed to Load Categories", err.message || "Error fetching directory.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle tree node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Circular Hierarchy Guard: find all descendant IDs for a category
  const getDescendantIds = (catId: string): Set<string> => {
    const descendants = new Set<string>();
    const findChildren = (parentId: string) => {
      flatCategories
        .filter((c) => c.parentId === parentId)
        .forEach((child) => {
          descendants.add(child.id);
          findChildren(child.id);
        });
    };
    findChildren(catId);
    return descendants;
  };

  // --------------------------------------------------------------------------
  // CREATE & EDIT MODAL HANDLERS
  // --------------------------------------------------------------------------
  const openCreateModal = (presetParentId: string | null = null) => {
    setEditingCategory(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      parentId: presetParentId,
      sortOrder: flatCategories.length,
      isFeatured: false,
      isActive: true,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      parentId: cat.parentId || null,
      sortOrder: cat.sortOrder || cat.displayOrder || 0,
      isFeatured: Boolean(cat.isFeatured),
      isActive: Boolean(cat.isActive),
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 2) {
      errs.name = "Category name must be between 2 and 100 characters.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update category
        const res = await AdminService.updateCategory(editingCategory.id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || null,
          parentId: form.parentId || null,
          sortOrder: Number(form.sortOrder),
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        });

        if (!res.success) {
          if (res.error === "CIRCULAR_HIERARCHY_SELF") {
            setFormErrors({ parentId: "You cannot select a category as its own parent." });
          } else if (res.error === "CIRCULAR_HIERARCHY_DESCENDANT") {
            setFormErrors({ parentId: "You cannot select a subcategory or descendant as a parent." });
          } else if (res.error === "DUPLICATE_CATEGORY_NAME") {
            setFormErrors({ name: "Another category under the same parent already has this name." });
          } else {
            showAlert("error", "Update Failed", res.message || "Could not update category.");
          }
          return;
        }

        showAlert("success", "Category Updated", `"${form.name}" has been updated successfully.`);
      } else {
        // Create category
        const res = await AdminService.createCategory({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || undefined,
          imageUrl: form.imageUrl.trim() || null,
          parentId: form.parentId || null,
          sortOrder: Number(form.sortOrder),
          isFeatured: form.isFeatured,
          isActive: form.isActive,
        });

        if (!res.success) {
          if (res.error === "DUPLICATE_CATEGORY_NAME") {
            setFormErrors({ name: "Another category under the same parent already has this name." });
          } else {
            showAlert("error", "Creation Failed", res.message || "Could not create category.");
          }
          return;
        }

        showAlert("success", "Category Created", `"${form.name}" was added to taxonomy.`);
      }

      setIsCreateModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Unexpected Error", err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // DELETE HANDLERS
  // --------------------------------------------------------------------------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await AdminService.deleteCategory(deleteTarget.id, isForceDelete);
      if (!res.success) {
        if (res.error === "CATEGORY_CONTAINS_PRODUCTS") {
          showAlert("error", "Active Products Detected", res.message || "Category has active products.");
        } else if (res.error === "CATEGORY_CONTAINS_CHILDREN") {
          showAlert("error", "Subcategories Detected", res.message || "Category has subcategories.");
        } else {
          showAlert("error", "Deletion Blocked", res.message || "Failed to delete category.");
        }
        return;
      }

      showAlert("success", "Category Deleted", `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      setIsForceDelete(false);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Delete Failed", err.message || "An error occurred.");
    }
  };

  // --------------------------------------------------------------------------
  // FLAT VIEW FILTERING & PAGINATION
  // --------------------------------------------------------------------------
  const filteredFlatCategories = useMemo(() => {
    return flatCategories.filter((c) => {
      if (statusFilter === "ACTIVE" && !c.isActive) return false;
      if (statusFilter === "INACTIVE" && c.isActive) return false;
      if (featuredFilter === "FEATURED" && !c.isFeatured) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesSlug = c.slug.toLowerCase().includes(q);
        const matchesDesc = Boolean(c.description && c.description.toLowerCase().includes(q));
        if (!matchesName && !matchesSlug && !matchesDesc) return false;
      }

      return true;
    });
  }, [flatCategories, statusFilter, featuredFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFlatCategories.length / itemsPerPage));
  const paginatedFlat = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFlatCategories.slice(start, start + itemsPerPage);
  }, [filteredFlatCategories, currentPage]);

  // Recursively render tree node
  const renderTreeNode = (node: AdminCategory, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            depth === 0
              ? "bg-slate-950/80 border-slate-800/80 hover:border-slate-700"
              : "bg-slate-900/50 border-slate-800/50 hover:border-slate-700 ml-6 sm:ml-10"
          }`}
        >
          {/* Left Info: expand toggle, thumbnail, name, slug */}
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>
            )}

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center">
              {node.imageUrl ? (
                <img src={node.imageUrl} alt={node.name} className="w-full h-full object-cover" />
              ) : (
                <FolderTree className="w-4 h-4 text-slate-600" />
              )}
            </div>

            {/* Title & metadata */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm truncate">{node.name}</span>
                {node.isFeatured && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold uppercase tracking-wider">
                    Featured
                  </span>
                )}
                {!node.isActive && (
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold uppercase tracking-wider">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                <span>/{node.slug}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{node.productCount} products</span>
                {hasChildren && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400">{node.children!.length} subcategories</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canManage && (
              <button
                onClick={() => openCreateModal(node.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors"
                title="Add Subcategory under this category"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Add Sub</span>
              </button>
            )}

            <button
              onClick={() => openEditModal(node)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Edit Category"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            {canManage && (
              <button
                onClick={() => {
                  setDeleteTarget(node);
                  setIsForceDelete(false);
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 pt-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
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
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
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
              MODULE 02: TAXONOMY
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Arbitrary Nested Hierarchy & Collision-Safe Slugs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FolderTree className="w-7 h-7 text-amber-400" />
            <span>Categories & Taxonomy</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Design hierarchical navigation menus, subcategories, and luxury garment departments with circular dependency guards.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Taxonomy"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === "tree"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === "flat"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Flat View
            </button>
          </div>

          {canManage && (
            <button
              id="btn-create-category"
              onClick={() => openCreateModal(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
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
              placeholder="Search category name, slug, or description..."
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
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Hidden / Inactive</option>
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

      {/* Main Content: Tree vs Flat */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-slate-950/80 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading store taxonomy...</p>
        </div>
      ) : viewMode === "tree" ? (
        /* ================= TREE VIEW ================= */
        <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-3 shadow-2xl">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No categories found in tree.</div>
          ) : (
            categories.map((cat) => renderTreeNode(cat))
          )}
        </div>
      ) : (
        /* ================= FLAT TABLE VIEW ================= */
        <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {filteredFlatCategories.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">No matching categories found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Slug & URL</th>
                    <th className="py-4 px-6">Parent Level</th>
                    <th className="py-4 px-6">Products</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {paginatedFlat.map((cat) => {
                    const parent = flatCategories.find((p) => p.id === cat.parentId);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {cat.imageUrl ? (
                                <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                              ) : (
                                <FolderTree className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{cat.name}</span>
                                {cat.isFeatured && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{cat.description || "No description"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px] text-slate-300">
                          /{cat.slug}
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs">
                          {parent ? (
                            <span className="text-amber-400 font-semibold">{parent.name}</span>
                          ) : (
                            <span className="text-slate-500 italic">Root Level</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">
                          {cat.productCount} garments
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {cat.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => {
                                  setDeleteTarget(cat);
                                  setIsForceDelete(false);
                                }}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Flat View Pagination */}
          {filteredFlatCategories.length > itemsPerPage && (
            <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredFlatCategories.length)} of{" "}
                {filteredFlatCategories.length} categories
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-[11px]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.3 & 2.4. CREATE / EDIT CATEGORY MODAL                                   */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  TAXONOMY ENGINE
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  {editingCategory ? `Edit: ${editingCategory.name}` : "Create New Category"}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category Name <span className="text-rose-400">*</span>
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
                      slug: editingCategory ? form.slug : autoSlug,
                    });
                  }}
                  placeholder="e.g. Bespoke Outerwear"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 ${
                    formErrors.name ? "border-rose-500" : "border-slate-800"
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              {/* URL Slug (Collision-Safe) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  URL Handle (Slug)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    /categories/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="auto-generated-from-name"
                    className="w-full pl-28 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Parent Category Selector (with Circular Hierarchy Guard) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Parent Category
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Circular Guard Active
                  </span>
                </div>
                <select
                  value={form.parentId || ""}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 ${
                    formErrors.parentId ? "border-rose-500" : "border-slate-800"
                  }`}
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {flatCategories.map((cat) => {
                    // Circular Hierarchy Guard:
                    // 1. Cannot select self
                    const isSelf = editingCategory && cat.id === editingCategory.id;
                    // 2. Cannot select own descendants
                    const isDescendant = editingCategory && getDescendantIds(editingCategory.id).has(cat.id);

                    if (isSelf || isDescendant) {
                      return (
                        <option key={cat.id} value={cat.id} disabled>
                          {cat.name} (Blocked - Circular Hierarchy)
                        </option>
                      );
                    }

                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? `└─ ${cat.name}` : cat.name}
                      </option>
                    );
                  })}
                </select>
                {formErrors.parentId && <p className="text-[11px] text-rose-400 mt-1">{formErrors.parentId}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Editorial summary or category styling notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/... or Cloudinary URL"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Toggles: isFeatured, isActive, sortOrder */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Feature in Store Header</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Visible to Shoppers</span>
                </label>
              </div>

              {/* Modal Buttons */}
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
                  {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2.5. SAFE DELETION GUARD MODAL                                            */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Category?</h3>
                <p className="text-xs text-slate-400">Safe Deletion Protocol Active</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <p className="text-white font-semibold">
                You are about to delete <strong className="text-rose-400">"{deleteTarget.name}"</strong>.
              </p>
              {deleteTarget.productCount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                  ⚠️ <strong>Warning:</strong> This category contains <strong>{deleteTarget.productCount}</strong> active products.
                </div>
              )}
              {deleteTarget.childrenCount > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] leading-relaxed">
                  ⚠️ <strong>Warning:</strong> This category has <strong>{deleteTarget.childrenCount}</strong> subcategories attached.
                </div>
              )}
            </div>

            {/* Force checkbox */}
            {(deleteTarget.productCount > 0 || deleteTarget.childrenCount > 0) && (
              <label className="flex items-center gap-2.5 text-xs text-rose-300 cursor-pointer p-3 rounded-xl bg-rose-950/30 border border-rose-900/50">
                <input
                  type="checkbox"
                  checked={isForceDelete}
                  onChange={(e) => setIsForceDelete(e.target.checked)}
                  className="rounded border-rose-700 text-rose-500 focus:ring-0"
                />
                <span>Confirm Force Delete (?force=true)</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setIsForceDelete(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={(deleteTarget.productCount > 0 || deleteTarget.childrenCount > 0) && !isForceDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
