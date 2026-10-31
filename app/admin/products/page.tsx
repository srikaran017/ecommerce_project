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
  AdminModifierGroup,
  AdminModifierOption,
  AdminModifierType,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminProductsPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // Hierarchical category tree groups for clear parent -> subcategory entitlement
  const categoryTreeGroups = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    const categoryMap = new Map<string, AdminCategory>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    // Identify roots (categories without parentId or parent not found)
    const roots: AdminCategory[] = [];
    const childrenMap = new Map<string, AdminCategory[]>();

    categories.forEach((cat) => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const existing = childrenMap.get(cat.parentId) || [];
        existing.push(cat);
        childrenMap.set(cat.parentId, existing);
      } else {
        roots.push(cat);
      }
    });

    // Sort roots by sortOrder or name
    roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));

    return roots.map((root) => {
      const children = (childrenMap.get(root.id) || []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
      );

      const enrichedChildren = children.map((child) => ({
        ...child,
        children: (childrenMap.get(child.id) || []).sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
        ),
      }));

      return {
        root,
        children: enrichedChildren,
      };
    });
  }, [categories]);
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

  // In-Modal & In-Drawer Feedback States
  const [drawerFeedback, setDrawerFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);
  const [isDrawerUploading, setIsDrawerUploading] = useState(false);
  const [createModalFeedback, setCreateModalFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Add Product Form State
  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState(storeConfig.name);
  const [formCategory, setFormCategory] = useState("");
  const [formRegularPrice, setFormRegularPrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formOfferPrice, setFormOfferPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSizes, setFormSizes] = useState("S, M, L, XL");
  const [formColors, setFormColors] = useState("Midnight Navy, Emerald Green, Rose Pink");
  const [formStockPerVariant, setFormStockPerVariant] = useState("5");
  // Add Product Form State
  const [formImageMode, setFormImageMode] = useState<"upload" | "url">("upload");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Additional Image Upload for Viewing Product Drawer
  const [drawerImageMode, setDrawerImageMode] = useState<"upload" | "url">("upload");
  const [drawerImageFile, setDrawerImageFile] = useState<File | null>(null);
  const [drawerImagePreview, setDrawerImagePreview] = useState<string | null>(null);
  const [drawerImageUrl, setDrawerImageUrl] = useState("");
  const [drawerIsThumbnail, setDrawerIsThumbnail] = useState(false);
  const drawerFileInputRef = useRef<HTMLInputElement>(null);

  // Catalyst Modifiers Drawer State
  const [isAddingModifierGroup, setIsAddingModifierGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState<{
    name: string;
    displayName: string;
    type: AdminModifierType;
    isRequired: boolean;
    placeholder: string;
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
  }>({
    name: "",
    displayName: "",
    type: "RECTANGLE_LIST",
    isRequired: false,
    placeholder: "",
  });

  const [activeGroupIdForOption, setActiveGroupIdForOption] = useState<string | null>(null);
  const [newOptionData, setNewOptionData] = useState({
    name: "",
    priceDelta: "0",
    isDefault: false,
  });
  const [isSavingModifier, setIsSavingModifier] = useState(false);
  const [modifierFeedback, setModifierFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  // Auto-fetch product modifiers & full details when drawer is opened
  useEffect(() => {
    if (viewingProduct?.id) {
      const pId = viewingProduct.id;

      // 1. Fetch full product record from backend (which includes embedded modifierGroups)
      AdminService.getProductById(pId)
        .then((fullProd) => {
          if (fullProd && fullProd.modifierGroups && fullProd.modifierGroups.length > 0) {
            setViewingProduct((prev) => (prev && prev.id === pId ? { ...prev, modifierGroups: fullProd.modifierGroups } : prev));
            setProducts((prev) =>
              prev.map((p) => (p.id === pId ? { ...p, modifierGroups: fullProd.modifierGroups } : p))
            );
          }
        })
        .catch((err) => console.warn("Could not load full product:", err));

      // 2. Fetch from dedicated modifiers endpoint if available
      AdminService.getProductModifiers(pId)
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setViewingProduct((prev) =>
              prev && prev.id === pId ? { ...prev, modifierGroups: res.data } : prev
            );
            setProducts((prev) =>
              prev.map((p) => (p.id === pId ? { ...p, modifierGroups: res.data } : p))
            );
          }
        })
        .catch((err) => console.warn("Could not load modifiers for product:", err));
    }
  }, [viewingProduct?.id]);

  const handleCreateModifierGroup = async () => {
    if (!viewingProduct || !newGroupData.name.trim()) return;
    setIsSavingModifier(true);
    try {
      const config: any = {};
      if (newGroupData.placeholder.trim()) config.placeholder = newGroupData.placeholder.trim();
      if (newGroupData.minLength !== undefined && !isNaN(newGroupData.minLength)) config.minLength = Number(newGroupData.minLength);
      if (newGroupData.maxLength !== undefined && !isNaN(newGroupData.maxLength)) config.maxLength = Number(newGroupData.maxLength);
      if (newGroupData.minValue !== undefined && !isNaN(newGroupData.minValue)) config.minValue = Number(newGroupData.minValue);
      if (newGroupData.maxValue !== undefined && !isNaN(newGroupData.maxValue)) config.maxValue = Number(newGroupData.maxValue);

      const res = await AdminService.createModifierGroup(viewingProduct.id, {
        name: newGroupData.name.trim(),
        displayName: newGroupData.displayName.trim() || newGroupData.name.trim(),
        type: newGroupData.type,
        isRequired: newGroupData.isRequired,
        config: Object.keys(config).length > 0 ? config : null,
      });

      if (res.success && res.data) {
        const createdGroup = res.data;
        const currentGroups = viewingProduct.modifierGroups || [];
        const updatedGroups = [...currentGroups, createdGroup];

        // 1. Persist updated inline modifierGroups onto the product in the backend
        await AdminService.updateProduct(viewingProduct.id, {
          modifierGroups: updatedGroups,
        });

        // 2. Update viewing product state
        setViewingProduct((prev) => (prev ? { ...prev, modifierGroups: updatedGroups } : null));

        // 3. Update main products table list so when drawer is closed and reopened, it is retained
        setProducts((prev) =>
          prev.map((p) => (p.id === viewingProduct.id ? { ...p, modifierGroups: updatedGroups } : p))
        );

        setIsAddingModifierGroup(false);
        setNewGroupData({
          name: "",
          displayName: "",
          type: "RECTANGLE_LIST",
          isRequired: false,
          placeholder: "",
        });

        const isOptionBased = ["RECTANGLE_LIST", "DROPDOWN", "RADIO_BUTTONS", "CHECKBOX"].includes(
          createdGroup.type
        );
        if (isOptionBased && createdGroup.id) {
          setActiveGroupIdForOption(createdGroup.id);
          setModifierFeedback({
            type: "success",
            message: `Modifier group "${createdGroup.name}" created! Add your first option choice below.`,
          });
        } else {
          setModifierFeedback({
            type: "success",
            message: `Modifier group "${createdGroup.name}" created successfully!`,
          });
        }
        setTimeout(() => setModifierFeedback(null), 4000);
      } else {
        setModifierFeedback({ type: "error", message: res.message || "Failed to create modifier group" });
        setTimeout(() => setModifierFeedback(null), 4000);
      }
    } catch (err: any) {
      setModifierFeedback({ type: "error", message: err.message || "Error creating modifier group" });
      setTimeout(() => setModifierFeedback(null), 4000);
    } finally {
      setIsSavingModifier(false);
    }
  };

  const handleDeleteModifierGroup = async (group: AdminModifierGroup, groupIdx: number) => {
    if (!viewingProduct) return;
    setIsSavingModifier(true);
    try {
      const gId = group.id || (group as any)._id || "";
      const remainingGroups = (viewingProduct.modifierGroups || []).filter(
        (g, idx) => (gId ? (g.id !== gId && (g as any)._id !== gId) : idx !== groupIdx)
      );

      // 1. Try granular delete if valid server id exists
      if (gId && !gId.startsWith("modgrp_") && gId !== "undefined" && gId !== "null") {
        await AdminService.deleteModifierGroup(viewingProduct.id, gId);
      }

      // 2. Also persist updated inline modifierGroups onto the product
      await AdminService.updateProduct(viewingProduct.id, {
        modifierGroups: remainingGroups,
      });

      // 3. Update viewing state and main products table list
      setViewingProduct((prev) => (prev ? { ...prev, modifierGroups: remainingGroups } : null));
      setProducts((prev) =>
        prev.map((p) => (p.id === viewingProduct.id ? { ...p, modifierGroups: remainingGroups } : p))
      );
      setModifierFeedback({ type: "success", message: `Modifier group "${group.name}" deleted successfully.` });
      setTimeout(() => setModifierFeedback(null), 4000);
    } catch (err: any) {
      setModifierFeedback({ type: "error", message: err.message || "Error deleting modifier group" });
      setTimeout(() => setModifierFeedback(null), 4000);
    } finally {
      setIsSavingModifier(false);
    }
  };

  const handleCreateModifierOption = async (group: AdminModifierGroup, groupIdx: number) => {
    if (!viewingProduct || !newOptionData.name.trim()) return;
    setIsSavingModifier(true);
    try {
      const gId = group.id || (group as any)._id || "";
      let newOpt: AdminModifierOption = {
        id: `modopt_${Date.now()}`,
        modifierGroupId: gId || `modgrp_${groupIdx}`,
        name: newOptionData.name.trim(),
        priceDelta: Number(newOptionData.priceDelta || 0),
        isDefault: newOptionData.isDefault,
        sortOrder: group.options?.length || 0,
      };

      if (gId && !gId.startsWith("modgrp_") && gId !== "undefined" && gId !== "null") {
        const res = await AdminService.createModifierOption(viewingProduct.id, gId, {
          name: newOptionData.name.trim(),
          priceDelta: Number(newOptionData.priceDelta || 0),
          isDefault: newOptionData.isDefault,
        });
        if (res.success && res.data) {
          newOpt = res.data;
        }
      }

      const updatedGroups = (viewingProduct.modifierGroups || []).map((g, idx) => {
        const matches = gId ? (g.id === gId || (g as any)._id === gId) : idx === groupIdx;
        if (!matches) return g;
        return {
          ...g,
          options: [...(g.options || []), newOpt],
        };
      });

      await AdminService.updateProduct(viewingProduct.id, {
        modifierGroups: updatedGroups,
      });

      setViewingProduct((prev) => (prev ? { ...prev, modifierGroups: updatedGroups } : null));
      setProducts((prev) =>
        prev.map((p) => (p.id === viewingProduct.id ? { ...p, modifierGroups: updatedGroups } : p))
      );
      setActiveGroupIdForOption(null);
      setNewOptionData({ name: "", priceDelta: "0", isDefault: false });
      setModifierFeedback({ type: "success", message: `Option "${newOpt.name}" added successfully!` });
      setTimeout(() => setModifierFeedback(null), 4000);
    } catch (err: any) {
      setModifierFeedback({ type: "error", message: err.message || "Error adding modifier option" });
      setTimeout(() => setModifierFeedback(null), 4000);
    } finally {
      setIsSavingModifier(false);
    }
  };

  const handleDeleteModifierOption = async (
    group: AdminModifierGroup,
    groupIdx: number,
    option: AdminModifierOption,
    optIdx: number
  ) => {
    if (!viewingProduct) return;
    setIsSavingModifier(true);
    try {
      const gId = group.id || (group as any)._id || "";
      const oId = option.id || (option as any)._id || "";

      const updatedGroups = (viewingProduct.modifierGroups || []).map((g, idx) => {
        const matches = gId ? (g.id === gId || (g as any)._id === gId) : idx === groupIdx;
        if (!matches) return g;
        return {
          ...g,
          options: (g.options || []).filter(
            (o, oIdx) => (oId ? (o.id !== oId && (o as any)._id !== oId) : oIdx !== optIdx)
          ),
        };
      });

      if (
        gId &&
        oId &&
        !gId.startsWith("modgrp_") &&
        !oId.startsWith("modopt_") &&
        gId !== "undefined" &&
        oId !== "undefined"
      ) {
        await AdminService.deleteModifierOption(viewingProduct.id, gId, oId);
      }

      await AdminService.updateProduct(viewingProduct.id, {
        modifierGroups: updatedGroups,
      });

      setViewingProduct((prev) => (prev ? { ...prev, modifierGroups: updatedGroups } : null));
      setProducts((prev) =>
        prev.map((p) => (p.id === viewingProduct.id ? { ...p, modifierGroups: updatedGroups } : p))
      );
      setModifierFeedback({ type: "success", message: `Option "${option.name}" removed successfully.` });
      setTimeout(() => setModifierFeedback(null), 4000);
    } catch (err: any) {
      setModifierFeedback({ type: "error", message: err.message || "Error deleting option" });
      setTimeout(() => setModifierFeedback(null), 4000);
    } finally {
      setIsSavingModifier(false);
    }
  };

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
    if (categoryTreeGroups.length > 0 && !formCategory) {
      setFormCategory(categoryTreeGroups[0].root.id);
    }
  }, [categoryTreeGroups, formCategory]);

  // Load Products with Faceted Filters & Pagination
  const loadProducts = async () => {
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

    try {
      const res = await AdminService.getProductsWithPagination(queryParams);
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.pagination) {
          setPaginationMeta({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          });
        }
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setFeedback({ type: "error", message: "Failed to load products. Using local fallback cache." });
    } finally {
      setIsLoading(false);
    }
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

    const nextActive = field === "active" ? !currentActive : currentActive;
    const nextFeatured = field === "featured" ? !currentFeatured : currentFeatured;

    // 1. OPTIMISTIC UPDATE: Update UI state immediately with 0ms delay!
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              isActive: nextActive,
              isFeatured: nextFeatured,
              status: nextActive ? "ACTIVE" : "ARCHIVED",
            }
          : p
      )
    );
    if (viewingProduct && viewingProduct.id === productId) {
      setViewingProduct((prev) =>
        prev
          ? {
              ...prev,
              isActive: nextActive,
              isFeatured: nextFeatured,
            }
          : null
      );
    }

    const payload =
      field === "active"
        ? { isActive: nextActive, status: nextActive ? "ACTIVE" : "ARCHIVED" }
        : { isFeatured: nextFeatured };

    try {
      const res = await AdminService.updateProductStatus(productId, payload);
      if (res && (res.success || (res as any).data || (res as any).id)) {
        setFeedback({
          type: "success",
          message: `Product ${field === "active" ? (nextActive ? "activated" : "deactivated") : (nextFeatured ? "starred as featured" : "unstarred")}.`,
        });
        setTimeout(() => setFeedback(null), 3000);
        // Background synchronization
        await loadProducts();
      } else {
        // Revert optimistic update on failure
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  isActive: currentActive,
                  isFeatured: currentFeatured,
                  status: currentActive ? "ACTIVE" : "ARCHIVED",
                }
              : p
          )
        );
        if (viewingProduct && viewingProduct.id === productId) {
          setViewingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  isActive: currentActive,
                  isFeatured: currentFeatured,
                }
              : null
          );
        }
        setFeedback({ type: "error", message: res?.message || "Failed to update product status" });
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                isActive: currentActive,
                isFeatured: currentFeatured,
                status: currentActive ? "ACTIVE" : "ARCHIVED",
              }
            : p
        )
      );
      if (viewingProduct && viewingProduct.id === productId) {
        setViewingProduct((prev) =>
          prev
            ? {
                ...prev,
                isActive: currentActive,
                isFeatured: currentFeatured,
              }
            : null
        );
      }
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
        // Optimistically remove from state immediately
        setProducts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
        setFeedback({
          type: res.data.action === "ARCHIVED" ? "warning" : "success",
          message: res.message,
        });
        const deletedId = deleteCandidate.id;
        setDeleteCandidate(null);
        setForceDelete(false);
        if (viewingProduct && viewingProduct.id === deletedId) {
          setViewingProduct(null);
        }
        setTimeout(() => setFeedback(null), 4500);
        await loadProducts();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete product." });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Image Upload Handler (Mutual Exclusivity: selecting file clears URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "drawer") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image file size should be less than 10MB (Cloudinary limits).");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      if (target === "create") {
        setFormImageFile(file);
        setFormImagePreview(previewUrl);
        setFormImageUrl(""); // Clear URL input to prevent conflict
      } else if (target === "drawer") {
        setDrawerImageFile(file);
        setDrawerImagePreview(previewUrl);
        setDrawerImageUrl(""); // Clear URL input to prevent conflict
      }
    }
  };

  // Upload Additional Gallery Image (Mutual Exclusivity: FormData file OR JSON URL)
  const handleUploadDrawerImage = async () => {
    if (!viewingProduct || !viewingProduct.id || viewingProduct.id === "undefined") {
      setDrawerFeedback({ type: "warning", message: "Cannot upload image: Product reference is missing or invalid." });
      return;
    }

    try {
      setIsDrawerUploading(true);
      setDrawerFeedback(null);
      let res;
      if (drawerImageMode === "upload") {
        if (!drawerImageFile) {
          setDrawerFeedback({ type: "warning", message: "Please select an image file to upload." });
          setIsDrawerUploading(false);
          return;
        }
        // Mode A: File Upload (multipart/form-data)
        const formData = new FormData();
        formData.append("images", drawerImageFile);
        formData.append("altText", viewingProduct.name);
        formData.append("isThumbnail", String(drawerIsThumbnail));
        formData.append("sortOrder", String((viewingProduct.images || []).length));
        res = await AdminService.uploadProductImages(viewingProduct.id, formData);
      } else {
        const url = drawerImageUrl.trim();
        if (!url) {
          setDrawerFeedback({ type: "warning", message: "Please provide a valid image URL." });
          setIsDrawerUploading(false);
          return;
        }
        // Mode B: Direct Image URL (JSON)
        res = await AdminService.uploadProductImages(viewingProduct.id, {
          url,
          altText: viewingProduct.name,
          isThumbnail: drawerIsThumbnail,
          sortOrder: (viewingProduct.images || []).length,
        });
      }

      if (res && res.success) {
        // 1. Immediately re-fetch updated product with new image
        const updated = await AdminService.getProductById(viewingProduct.id);
        const uploadedImages = res.data?.images || [];
        const currentImages = viewingProduct.images || [];
        const mergedImages = updated?.images?.length ? updated.images : [...currentImages, ...uploadedImages];
        const newThumb = drawerIsThumbnail
          ? (updated?.thumbnail || drawerImagePreview || drawerImageUrl || mergedImages[0]?.url)
          : (viewingProduct.thumbnail || mergedImages[0]?.url);

        // Update drawer view
        if (updated) {
          setViewingProduct(updated);
        } else {
          setViewingProduct((prev) =>
            prev ? { ...prev, images: mergedImages, thumbnail: newThumb } : null
          );
        }

        // IMMEDIATELY update table state in place so changes reflect without manual refresh!
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === viewingProduct.id) {
              return {
                ...p,
                images: updated?.images || mergedImages,
                thumbnail: updated?.thumbnail || newThumb,
                ...(updated ? updated : {}),
              };
            }
            return p;
          })
        );

        setDrawerImageFile(null);
        setDrawerImagePreview(null);
        setDrawerImageUrl("");
        setDrawerIsThumbnail(false);
        if (drawerFileInputRef.current) drawerFileInputRef.current.value = "";
        setDrawerFeedback({
          type: "success",
          message: "Image uploaded and streamed to Cloudinary successfully! Gallery and catalog refreshed.",
        });
        setFeedback({ type: "success", message: "Gallery image uploaded successfully." });
        setTimeout(() => setDrawerFeedback(null), 4500);
        setTimeout(() => setFeedback(null), 3000);

        // Synchronize in background
        await loadProducts();
      } else {
        setDrawerFeedback({
          type: "error",
          message: res?.message || "Failed to upload image. Please verify image file format.",
        });
      }
    } catch (err: any) {
      setDrawerFeedback({ type: "error", message: err.message || "Failed to upload image." });
    } finally {
      setIsDrawerUploading(false);
    }
  };

  // Delete Image from Existing Product
  const handleDeleteDrawerImage = async (imageId: string) => {
    if (!viewingProduct) return;
    if ((viewingProduct.images || []).length <= 1) {
      setDrawerFeedback({ type: "warning", message: "A garment must have at least one product photograph." });
      return;
    }
    if (confirm("Delete this photo from the product gallery?")) {
      try {
        const res = await AdminService.deleteProductImage(viewingProduct.id, imageId);
        if (res.success) {
          const updated = await AdminService.getProductById(viewingProduct.id);
          const remainingImages = (viewingProduct.images || []).filter(
            (img) => img.id !== imageId && (img as any).url !== imageId
          );
          if (updated) {
            setViewingProduct(updated);
            setProducts((prev) => prev.map((p) => (p.id === viewingProduct.id ? updated : p)));
          } else {
            setViewingProduct((prev) =>
              prev ? { ...prev, images: remainingImages, thumbnail: remainingImages[0]?.url || prev.thumbnail } : null
            );
            setProducts((prev) =>
              prev.map((p) =>
                p.id === viewingProduct.id
                  ? { ...p, images: remainingImages, thumbnail: remainingImages[0]?.url || p.thumbnail }
                  : p
              )
            );
          }
          setDrawerFeedback({ type: "success", message: "Photo removed from gallery. Catalog refreshed." });
          setFeedback({ type: "success", message: "Image removed from gallery." });
          setTimeout(() => setDrawerFeedback(null), 3500);
          setTimeout(() => setFeedback(null), 3000);

          await loadProducts();
        }
      } catch (err: any) {
        setDrawerFeedback({ type: "error", message: err.message || "Failed to delete image." });
      }
    }
  };

  // Atomic Product Creation with Multi-Variant Matrix & Mutually Exclusive Image Pipe
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

    const variantsToUse =
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
          ];

    const selectedCatObj = categories.find((c) => c.id === formCategory);

    try {
      let res;
      if (formImageMode === "upload" && formImageFile) {
        // MODE A: File Upload (multipart/form-data) -> Never send images URL array
        const formData = new FormData();
        formData.append("name", formName.trim());
        formData.append("brand", formBrand.trim() || storeConfig.name);
        formData.append(
          "description",
          formDescription.trim() || `${formName.trim()} crafted with exquisite pure fabric and signature couture tailoring.`
        );
        formData.append("shortDescription", `Handcrafted ${selectedCatObj?.name || "garment"} silhouette.`);
        formData.append("categoryId", formCategory);
        if (selectedCatObj?.slug) formData.append("categorySlug", selectedCatObj.slug);
        if (selectedCatObj?.name) formData.append("categoryName", selectedCatObj.name);
        formData.append("regularPrice", String(regularP));
        if (saleP !== null) formData.append("salePrice", String(saleP));
        if (costP !== null) formData.append("costPrice", String(costP));
        if (offerP !== null) formData.append("offerPrice", String(offerP));
        formData.append("isActive", "true");
        formData.append("isFeatured", "false");
        formData.append("gender", "WOMEN");
        formData.append("variants", JSON.stringify(variantsToUse));
        formData.append("images", formImageFile); // Direct file attachment for Cloudinary streaming

        res = await AdminService.createProduct(formData);
      } else {
        // MODE B: Direct Image URL Array (application/json) -> Never send image file
        const finalUrl =
          formImageUrl.trim() || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800";
        const input: CreateProductInput = {
          name: formName.trim(),
          brand: formBrand.trim() || storeConfig.name,
          description:
            formDescription.trim() || `${formName.trim()} crafted with exquisite pure fabric and signature couture tailoring.`,
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
              url: finalUrl,
              altText: formName.trim(),
              isThumbnail: true,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
          variants: variantsToUse,
        };

        res = await AdminService.createProduct(input);
      }

      if (res && res.success) {
        if (res.product) {
          setProducts((prev) => [res.product!, ...prev]);
        }
        setCreateModalFeedback({
          type: "success",
          message: `Garment "${formName.trim()}" published successfully! Refreshing catalog...`,
        });
        await loadProducts(); // Auto-refresh products table immediately!

        setTimeout(() => {
          setIsAddModalOpen(false);
          setCreateModalFeedback(null);
          // Reset form
          setFormName("");
          setFormRegularPrice("");
          setFormSalePrice("");
          setFormCostPrice("");
          setFormOfferPrice("");
          setFormDescription("");
          setFormImageFile(null);
          setFormImagePreview(null);
          setFormImageUrl("");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setFeedback({ type: "success", message: `Garment "${formName.trim()}" published with variants!` });
          setTimeout(() => setFeedback(null), 3500);
        }, 1300);
      } else {
        setCreateModalFeedback({
          type: "error",
          message: res?.message || "Failed to create product. Please verify required fields.",
        });
      }
    } catch (err: any) {
      setCreateModalFeedback({ type: "error", message: err.message || "Failed to create product." });
      setFeedback({ type: "error", message: err.message || "Failed to create product." });
    } finally {
      setIsCreatingProduct(false);
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
              {categoryTreeGroups.map(({ root, children }) => (
                <optgroup key={root.id} label={`📁 ${root.name.toUpperCase()}`}>
                  <option value={root.id}>● {root.name} (All Silhouettes)</option>
                  {children.map((sub) => (
                    <React.Fragment key={sub.id}>
                      <option value={sub.id}>&nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}</option>
                      {sub.children?.map((leaf) => (
                        <option key={leaf.id} value={leaf.id}>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ ↳ {leaf.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </optgroup>
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
                            src={p.thumbnail || p.images?.[0]?.url || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"}
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
                            {(p.variants || []).slice(0, 4).map((v) => (
                              <div
                                key={v.id}
                                title={`${v.colorName || v.color} (${v.size})`}
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                                style={{ backgroundColor: v.colorHex || "#0b1b3d" }}
                              />
                            ))}
                            {(p.variants || []).length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{(p.variants || []).length - 4}
                              </span>
                            )}
                            {(!p.variants || p.variants.length === 0) && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {p.variantsCount ? `${p.variantsCount} variants` : "Standard"}
                              </span>
                            )}
                          </div>

                          {/* Sizing Tags */}
                          {(p.variants && p.variants.length > 0) ? (
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
                          ) : null}
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
                  onClick={() => {
                    setViewingProduct(null);
                    setModifierFeedback(null);
                    setDrawerFeedback(null);
                  }}
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
                    <span>Variant Matrix ({(viewingProduct.variants || []).length} combinations)</span>
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
                      {(viewingProduct.variants || []).map((v) => (
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

              {/* BigCommerce Catalyst Modifiers & Customization Section */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Product Modifiers & Personalization</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Catalyst Dynamic Variant Pricing Engine (9 UI Control Types)
                    </p>
                  </div>

                  {rbac.canWriteProducts(user?.role) && !isAddingModifierGroup && (
                    <button
                      type="button"
                      onClick={() => setIsAddingModifierGroup(true)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Modifier Group</span>
                    </button>
                  )}
                </div>

                {/* Modifier-Specific Feedback Banner */}
                {modifierFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
                      modifierFeedback.type === "success"
                        ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                        : modifierFeedback.type === "warning"
                        ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                        : "bg-rose-950/80 border-rose-500/50 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {modifierFeedback.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {modifierFeedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      {modifierFeedback.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{modifierFeedback.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModifierFeedback(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Add Modifier Group Inline Form */}
                {isAddingModifierGroup && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-xs">Create New Modifier Group</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingModifierGroup(false)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Matching Dupatta Style"
                          value={newGroupData.name}
                          onChange={(e) => setNewGroupData((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                          Display Label (Customer Facing)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Select Matching Dupatta Style"
                          value={newGroupData.displayName}
                          onChange={(e) => setNewGroupData((p) => ({ ...p, displayName: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                          Control Type (9 Catalyst Types)
                        </label>
                        <select
                          value={newGroupData.type}
                          onChange={(e) => setNewGroupData((p) => ({ ...p, type: e.target.value as AdminModifierType }))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                        >
                          <option value="RECTANGLE_LIST">RECTANGLE_LIST (Swatch / Pill Tiles)</option>
                          <option value="DROPDOWN">DROPDOWN (Selection Dropdown)</option>
                          <option value="RADIO_BUTTONS">RADIO_BUTTONS (Radio Group)</option>
                          <option value="CHECKBOX">CHECKBOX (Single Checkbox Toggle)</option>
                          <option value="SHORT_TEXT">SHORT_TEXT (Monogram / Embroidery Initials)</option>
                          <option value="MULTI_LINE_TEXT">MULTI_LINE_TEXT (Custom Tailoring Notes)</option>
                          <option value="NUMBERS_ONLY_TEXT">NUMBERS_ONLY_TEXT (Numeric Measurements cm/in)</option>
                          <option value="DATE">DATE (Event / Wedding Date Picker)</option>
                          <option value="FILE_UPLOAD">FILE_UPLOAD (Embroidery Pattern / Reference Photo)</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={newGroupData.isRequired}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, isRequired: e.target.checked }))}
                            className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                          />
                          <span className="font-semibold text-xs">Required Selection for Customer</span>
                        </label>
                      </div>
                    </div>

                    {/* Type-Specific Configurations */}
                    {(newGroupData.type === "SHORT_TEXT" || newGroupData.type === "MULTI_LINE_TEXT") && (
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Placeholder</label>
                          <input
                            type="text"
                            placeholder="e.g. Priya or P&R"
                            value={newGroupData.placeholder}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, placeholder: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Min Length</label>
                          <input
                            type="number"
                            placeholder="2"
                            value={newGroupData.minLength ?? ""}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, minLength: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Max Length</label>
                          <input
                            type="number"
                            placeholder="12"
                            value={newGroupData.maxLength ?? ""}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, maxLength: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {newGroupData.type === "NUMBERS_ONLY_TEXT" && (
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Placeholder</label>
                          <input
                            type="text"
                            placeholder="e.g. 135"
                            value={newGroupData.placeholder}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, placeholder: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Min Value</label>
                          <input
                            type="number"
                            placeholder="100"
                            value={newGroupData.minValue ?? ""}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, minValue: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Max Value</label>
                          <input
                            type="number"
                            placeholder="160"
                            value={newGroupData.maxValue ?? ""}
                            onChange={(e) => setNewGroupData((p) => ({ ...p, maxValue: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingModifierGroup(false)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!newGroupData.name.trim() || isSavingModifier}
                        onClick={handleCreateModifierGroup}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      >
                        {isSavingModifier && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Modifier Group</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Modifier Groups List */}
                {(!viewingProduct.modifierGroups || viewingProduct.modifierGroups.length === 0) ? (
                  <div className="p-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    No customization modifiers configured for this garment yet. Click &quot;Add Modifier Group&quot; to define dupatta styles, custom sizing, embroidery notes, or monogram options.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingProduct.modifierGroups.map((group, groupIdx) => {
                      const isOptionBased = ["RECTANGLE_LIST", "DROPDOWN", "RADIO_BUTTONS", "CHECKBOX"].includes(
                        group.type
                      );
                      const groupKey = group.id ? `modgrp-${group.id}` : `modgrp-idx-${groupIdx}-${group.name || "group"}`;
                      const groupId = group.id || `modgrp_${groupIdx}`;

                      return (
                        <div
                          key={groupKey}
                          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{group.name}</span>
                                <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                                  {group.type}
                                </span>
                                {group.isRequired ? (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/30">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    Optional
                                  </span>
                                )}
                              </div>
                              {group.displayName && group.displayName !== group.name && (
                                <p className="text-[11px] text-slate-400 italic">&quot;{group.displayName}&quot;</p>
                              )}
                              {group.config?.placeholder && (
                                <p className="text-[10px] text-slate-500">Placeholder: {group.config.placeholder}</p>
                              )}
                            </div>

                            {rbac.canDeleteProducts(user?.role) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteModifierGroup(group, groupIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Delete Modifier Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Options Table for Option-Based Groups */}
                          {isOptionBased && (
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-semibold">
                                  Options ({group.options?.length || 0})
                                </span>
                                {rbac.canWriteProducts(user?.role) && activeGroupIdForOption !== groupId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveGroupIdForOption(groupId);
                                      setNewOptionData({ name: "", priceDelta: "0", isDefault: false });
                                    }}
                                    className="text-amber-400 hover:underline font-semibold text-[10px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Option</span>
                                  </button>
                                )}
                              </div>

                              {/* Inline Add Option Form */}
                              {activeGroupIdForOption === groupId && (
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-in fade-in">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <input
                                        type="text"
                                        placeholder="Option Name (e.g. Heavy Zari Organza)"
                                        value={newOptionData.name}
                                        onChange={(e) => setNewOptionData((p) => ({ ...p, name: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="Price Delta (₹)"
                                        value={newOptionData.priceDelta}
                                        onChange={(e) => setNewOptionData((p) => ({ ...p, priceDelta: e.target.value }))}
                                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={newOptionData.isDefault}
                                        onChange={(e) => setNewOptionData((p) => ({ ...p, isDefault: e.target.checked }))}
                                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                                      />
                                      <span>Selected by Default</span>
                                    </label>
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setActiveGroupIdForOption(null)}
                                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[10px] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!newOptionData.name.trim() || isSavingModifier}
                                        onClick={() => handleCreateModifierOption(group, groupIdx)}
                                        className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[10px] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                      >
                                        {isSavingModifier && <RefreshCw className="w-3 h-3 animate-spin" />}
                                        <span>Add Option</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Options List */}
                              {group.options && group.options.length > 0 ? (
                                <div className="divide-y border border-slate-800/60 rounded-xl overflow-hidden bg-slate-950/40">
                                  {group.options.map((opt, optIdx) => {
                                    const optKey = opt.id ? `modopt-${opt.id}` : `modopt-idx-${groupIdx}-${optIdx}-${opt.name || "opt"}`;
                                    return (
                                      <div
                                        key={optKey}
                                        className="px-3 py-2 flex items-center justify-between text-[11px] hover:bg-slate-900/30"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-slate-200">{opt.name}</span>
                                          {opt.isDefault && (
                                            <span className="px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 text-[9px] font-bold border border-amber-400/20">
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-mono text-amber-400 font-bold">
                                            {opt.priceDelta > 0
                                              ? `+${storeConfig.currency.symbol}${Number(opt.priceDelta).toLocaleString()}`
                                              : "₹0"}
                                          </span>
                                          {rbac.canWriteProducts(user?.role) && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteModifierOption(group, groupIdx, opt, optIdx)}
                                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                              title="Delete option"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
                                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>No choices added to &quot;{group.name}&quot; yet</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    Click &quot;Add Option&quot; above to add selectable choices (e.g., choice name, price delta). Option-based groups need at least one choice before customers can select them on the product page.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cloud-Only Image Gallery Pipeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Cloud Image Gallery ({(viewingProduct.images || []).length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(viewingProduct.images || []).map((img, i) => (
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

                {/* Upload Additional Image Field (Cloudinary Integration: Mutual Exclusivity Policy) */}
                {rbac.canWriteProducts(user?.role) && (
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    {/* In-Drawer Feedback Alert */}
                    {drawerFeedback && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
                          drawerFeedback.type === "success"
                            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                            : drawerFeedback.type === "warning"
                            ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                            : "bg-rose-950/80 border-rose-500/50 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {drawerFeedback.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {drawerFeedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                          {drawerFeedback.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                          <span>{drawerFeedback.message}</span>
                        </div>
                        <button type="button" onClick={() => setDrawerFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add Gallery Image</span>
                      </span>
                      {/* Mode Toggle Switcher */}
                      <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerImageMode("upload");
                            setDrawerImageUrl("");
                          }}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            drawerImageMode === "upload"
                              ? "bg-amber-400 text-slate-950 shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          📁 File Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerImageMode("url");
                            setDrawerImageFile(null);
                            setDrawerImagePreview(null);
                            if (drawerFileInputRef.current) drawerFileInputRef.current.value = "";
                          }}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            drawerImageMode === "url"
                              ? "bg-amber-400 text-slate-950 shadow"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          🔗 Image URL
                        </button>
                      </div>
                    </div>

                    {drawerImageMode === "upload" ? (
                      <div key="drawer-upload-mode" className="flex items-center gap-2.5">
                        <input
                          key="drawer-file-input"
                          type="file"
                          ref={drawerFileInputRef}
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, "drawer")}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => drawerFileInputRef.current?.click()}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-400 rounded-xl text-slate-300 flex items-center justify-center gap-2 cursor-pointer text-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>{drawerImageFile ? drawerImageFile.name : "Select Image File (Max 10MB)"}</span>
                        </button>

                        {drawerImagePreview && (
                          <img
                            src={drawerImagePreview}
                            alt="Preview"
                            className="w-9 h-9 object-cover rounded-lg border border-slate-700 bg-slate-950 flex-shrink-0"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleUploadDrawerImage()}
                          disabled={!drawerImageFile || isDrawerUploading}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-40 cursor-pointer text-xs flex items-center gap-1.5"
                        >
                          {isDrawerUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isDrawerUploading ? "Uploading..." : "Upload"}</span>
                        </button>
                      </div>
                    ) : (
                      <div key="drawer-url-mode" className="flex items-center gap-2">
                        <input
                          key="drawer-url-input"
                          type="url"
                          placeholder="https://images.unsplash.com/... or Cloudinary URL"
                          value={drawerImageUrl || ""}
                          onChange={(e) => setDrawerImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUploadDrawerImage()}
                          disabled={!drawerImageUrl.trim() || isDrawerUploading}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-40 cursor-pointer text-xs flex items-center gap-1.5"
                        >
                          {isDrawerUploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isDrawerUploading ? "Attaching..." : "Attach"}</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={drawerIsThumbnail}
                          onChange={(e) => setDrawerIsThumbnail(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                        />
                        <span>Set as primary thumbnail for this garment</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Mutual Exclusivity: File OR URL
                      </span>
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
                    placeholder={storeConfig.name}
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
                    {categoryTreeGroups.map(({ root, children }) => (
                      <optgroup key={root.id} label={`📁 ${root.name.toUpperCase()}`}>
                        <option value={root.id} className="font-semibold text-amber-300">
                          ● {root.name} (Entire Department)
                        </option>
                        {children.map((sub) => (
                          <React.Fragment key={sub.id}>
                            <option value={sub.id} className="text-slate-200">
                              &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                            </option>
                            {sub.children?.map((leaf) => (
                              <option key={leaf.id} value={leaf.id} className="text-slate-400">
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↳ ↳ {leaf.name}
                              </option>
                            ))}
                          </React.Fragment>
                        ))}
                      </optgroup>
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

              {/* Cloudinary Integration: Mutually Exclusive Image Input (File Upload OR Image URL) */}
              <div className="space-y-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300 text-xs">
                    Garment Photography (Cloudinary Streaming / URL)
                  </label>
                  {/* Mode Switcher */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setFormImageMode("upload");
                        setFormImageUrl("");
                      }}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        formImageMode === "upload"
                          ? "bg-amber-400 text-slate-950 shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📁 File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormImageMode("url");
                        setFormImageFile(null);
                        setFormImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        formImageMode === "url"
                          ? "bg-amber-400 text-slate-950 shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🔗 Image URL
                    </button>
                  </div>
                </div>

                {formImageMode === "upload" ? (
                  <div key="product-form-upload-mode" className="flex items-center gap-3">
                    <input
                      key="product-form-file-input"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, "create")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 px-4 bg-slate-950 border border-slate-800 border-dashed hover:border-amber-400 rounded-xl text-slate-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{formImageFile ? formImageFile.name : "Select Image from Laptop / Device (Max 10MB)"}</span>
                    </button>

                    {formImagePreview && (
                      <div className="relative group">
                        <img
                          src={formImagePreview}
                          alt="Preview"
                          className="w-12 h-14 object-cover rounded-xl border border-slate-700 bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormImageFile(null);
                            setFormImagePreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer shadow"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key="product-form-url-mode" className="space-y-2">
                    <input
                      key="product-form-url-input"
                      type="url"
                      placeholder="https://images.unsplash.com/... or Cloudinary HTTPS URL"
                      value={formImageUrl || ""}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setFormImagePreview(e.target.value || null);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
                    />
                    {formImageUrl && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <img
                          src={formImageUrl}
                          alt="URL preview"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-slate-900"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="truncate">{formImageUrl}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 font-mono">
                  Enforces strict mutual exclusivity: upload binary file OR provide direct URL, never both.
                </p>
              </div>

              {/* In-Modal Feedback Alert */}
              {createModalFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
                    createModalFeedback.type === "success"
                      ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                      : "bg-rose-950/80 border-rose-500/50 text-rose-300"
                  }`}
                >
                  {createModalFeedback.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{createModalFeedback.message}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isCreatingProduct}
                  className="px-4 py-2.5 text-slate-400 hover:text-white cursor-pointer font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="px-7 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingProduct && <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />}
                  <span>{isCreatingProduct ? "Publishing..." : "Publish Garment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
