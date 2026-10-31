"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Ruler,
  Truck,
  RotateCcw,
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck,
  Star,
  MessageSquarePlus,
  AlertTriangle,
  Layers,
  Sparkle,
  X,
  ArrowRight,
  ThumbsUp,
  Camera,
  UploadCloud,
  BadgeCheck,
  SlidersHorizontal,
  Filter,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ChevronDown,
  Calendar,
  FileText,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductData, ProductVariantData } from "@/data/products.data";
import {
  ReviewService,
  ReviewItem,
  ReviewSummary,
  FitFeedback,
} from "@/services/review.service";
import {
  getProductFallbackImage,
  isBrandLogoImage,
  isFallbackImageUrl,
  DEFAULT_BRAND_LOGO,
} from "@/utils/image.utils";

interface ProductDetailClientProps {
  product: ProductData;
  relatedProducts: ProductData[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const validImages = (product.images || [])
    .map((img) => img?.url)
    .filter(
      (url): url is string =>
        Boolean(
          url &&
            typeof url === "string" &&
            url.trim().length > 0 &&
            url !== "null" &&
            url !== "undefined" &&
            !isFallbackImageUrl(url)
        )
    );

  const fallbackImg = getProductFallbackImage(product) || DEFAULT_BRAND_LOGO;
  const cleanThumb =
    product.thumbnail &&
    product.thumbnail.trim().length > 0 &&
    product.thumbnail !== "null" &&
    product.thumbnail !== "undefined" &&
    !isFallbackImageUrl(product.thumbnail)
      ? product.thumbnail.trim()
      : null;

  const images = validImages.length > 0
    ? validImages
    : cleanThumb
    ? [cleanThumb]
    : [fallbackImg];

  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData>(
    product.variants?.[0] || {
      id: "default",
      sku: `${product.slug}-default`,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      lowStockThreshold: 5,
      size: "M",
      colorName: "Standard",
      colorHex: "#000000",
      isActive: true,
    }
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const { isWishlisted: checkWishlist, toggleWishlist: storeToggleWishlist } = useWishlistStore();
  const isWishlisted = isMounted ? checkWishlist(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    await storeToggleWishlist(product.id);
  };
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [unitSystem, setUnitSystem] = useState<"inches" | "cm">("inches");
  const [activeTab, setActiveTab] = useState<"fabric" | "care" | "shipping">("fabric");
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cartToast, setCartToast] = useState<{
    show: boolean;
    message: string;
    image?: string;
    size?: string;
    color?: string;
  } | null>(null);

  // Reviews & Ratings state - backed by ReviewService
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: `rev_init_1`,
      productId: product.id,
      rating: Math.round((product as any).rating || 5),
      title: `Exquisite tailoring on ${product.name}`,
      comment: `The atelier craftsmanship and silhouette of this ${product.name} are exceptional. Fits true to size with magnificent finish and fabric drape.`,
      fitFeedback: "TRUE_TO_SIZE",
      isVerifiedPurchase: true,
      status: "APPROVED",
      helpfulCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: "init_user_1",
        name: "Verified Client",
      },
    },
  ]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(1);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(null);
  const [reviewFitFilter, setReviewFitFilter] = useState<FitFeedback | null>(null);
  const [reviewHasImages, setReviewHasImages] = useState(false);
  const [reviewSortBy, setReviewSortBy] = useState<
    "newest" | "oldest" | "highest_rating" | "lowest_rating" | "most_helpful"
  >("most_helpful");
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    authorName?: string;
    rating?: number;
    title?: string;
  } | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<Record<string, boolean>>({});

  // Write a Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newFitFeedback, setNewFitFeedback] = useState<FitFeedback>("TRUE_TO_SIZE");
  const [selectedReviewFiles, setSelectedReviewFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"files" | "urls">("files");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState<string | null>(null);

  // BigCommerce Catalyst Product Modifiers State
  // Supports all 9 types: DROPDOWN, RADIO_BUTTONS, RECTANGLE_LIST, CHECKBOX, SHORT_TEXT, MULTI_LINE_TEXT, NUMBERS_ONLY_TEXT, DATE, FILE_UPLOAD
  interface ModifierSelectionValue {
    optionId?: string;
    textValue?: string;
    fileUrl?: string;
    fileName?: string;
  }

  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierSelectionValue>>(() => {
    const initial: Record<string, ModifierSelectionValue> = {};
    if (product.modifierGroups) {
      product.modifierGroups.forEach((g) => {
        const type = (g.type || "RECTANGLE_LIST").toUpperCase();
        if (type === "SHORT_TEXT" || type === "MULTI_LINE_TEXT" || type === "NUMBERS_ONLY_TEXT" || type === "DATE") {
          if (g.defaultValue) {
            initial[g.id] = { textValue: String(g.defaultValue) };
          }
        } else if (type === "CHECKBOX") {
          const defaultOpt = g.options?.find((o) => o.isDefault);
          if (defaultOpt) {
            initial[g.id] = { optionId: defaultOpt.id };
          }
        } else {
          // DROPDOWN, RADIO_BUTTONS, RECTANGLE_LIST
          const defaultOpt = g.options?.find((o) => o.isDefault) || (g.isRequired ? g.options?.[0] : undefined);
          if (defaultOpt) {
            initial[g.id] = { optionId: defaultOpt.id };
          }
        }
      });
    }
    return initial;
  });

  const [modifierErrors, setModifierErrors] = useState<Record<string, string>>({});

  // 1. Base Item Price: activeVariant overrides product
  const basePrice = useMemo(() => {
    if (selectedVariant) {
      return Number(
        selectedVariant.priceObject?.effective ??
        selectedVariant.price ??
        product.priceObject?.effective ??
        product.price
      );
    }
    return Number(product.priceObject?.effective ?? product.price);
  }, [selectedVariant, product]);

  // Active valid modifier groups (filters out option-based groups where no options have been configured yet)
  const activeModifierGroups = useMemo(() => {
    if (!product.modifierGroups) return [];
    return product.modifierGroups.filter((g) => {
      const type = (g.type || "RECTANGLE_LIST").toUpperCase();
      const isOptionBased = ["DROPDOWN", "RADIO_BUTTONS", "RECTANGLE_LIST", "CHECKBOX"].includes(type);
      if (isOptionBased && (!g.options || g.options.length === 0)) {
        return false;
      }
      return true;
    });
  }, [product.modifierGroups]);

  // 2. Modifiers Delta: Sum of selectedModifierOption.priceDelta
  const modifierDelta = useMemo(() => {
    let delta = 0;
    if (!activeModifierGroups) return 0;
    for (const group of activeModifierGroups) {
      const selection = selectedModifiers[group.id];
      if (selection?.optionId) {
        const opt = group.options?.find((o) => o.id === selection.optionId);
        if (opt) delta += Number(opt.priceDelta || 0);
      }
    }
    return delta;
  }, [activeModifierGroups, selectedModifiers]);

  // 3. Effective Unit Price: Base Price + Modifier Total
  const finalDisplayPrice = basePrice + modifierDelta;

  const handleSelectOption = (groupId: string, optionId: string | null) => {
    setSelectedModifiers((prev) => {
      const next = { ...prev };
      if (!optionId) {
        delete next[groupId];
      } else {
        next[groupId] = { ...next[groupId], optionId };
      }
      return next;
    });
    setModifierErrors((prev) => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleToggleCheckbox = (groupId: string, optionId: string) => {
    setSelectedModifiers((prev) => {
      const next = { ...prev };
      if (next[groupId]?.optionId === optionId) {
        delete next[groupId];
      } else {
        next[groupId] = { optionId };
      }
      return next;
    });
    setModifierErrors((prev) => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleTextChange = (groupId: string, textValue: string) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], textValue },
    }));
    setModifierErrors((prev) => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const handleFileUpload = (groupId: string, file: File | null) => {
    if (!file) {
      setSelectedModifiers((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      return;
    }
    const fakeUrl = URL.createObjectURL(file);
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        fileUrl: fakeUrl,
        fileName: file.name,
        textValue: file.name,
      },
    }));
    setModifierErrors((prev) => {
      if (!prev[groupId]) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  };

  const validateModifiers = (): boolean => {
    const errors: Record<string, string> = {};
    if (!activeModifierGroups || activeModifierGroups.length === 0) return true;

    for (const group of activeModifierGroups) {
      const groupId = group.id || "";
      const selection = selectedModifiers[groupId];
      const type = (group.type || "RECTANGLE_LIST").toUpperCase();
      const groupName = group.displayName || group.name;

      if (group.isRequired) {
        if (type === "SHORT_TEXT" || type === "MULTI_LINE_TEXT" || type === "DATE") {
          if (!selection?.textValue || !selection.textValue.trim()) {
            errors[groupId] = `Please enter required customization for "${groupName}".`;
          }
        } else if (type === "NUMBERS_ONLY_TEXT") {
          if (!selection?.textValue || isNaN(Number(selection.textValue))) {
            errors[groupId] = `Please enter a valid numeric value for "${groupName}".`;
          }
        } else if (type === "FILE_UPLOAD") {
          if (!selection?.fileUrl && !selection?.textValue) {
            errors[groupId] = `Please upload or attach reference for "${groupName}".`;
          }
        } else {
          // DROPDOWN, RADIO_BUTTONS, RECTANGLE_LIST, CHECKBOX
          const hasOptions = Boolean(group.options && group.options.length > 0);
          if (hasOptions && !selection?.optionId) {
            errors[groupId] = `Please select an option for "${groupName}".`;
          }
        }
      }

      // Text length validations
      if (selection?.textValue && (type === "SHORT_TEXT" || type === "MULTI_LINE_TEXT")) {
        const valLen = selection.textValue.trim().length;
        if (group.config?.minLength && valLen < group.config.minLength) {
          errors[groupId] = `"${groupName}" must be at least ${group.config.minLength} characters.`;
        } else if (group.config?.maxLength && valLen > group.config.maxLength) {
          errors[groupId] = `"${groupName}" cannot exceed ${group.config.maxLength} characters.`;
        }
      }

      // Numeric bounds validation
      if (selection?.textValue && type === "NUMBERS_ONLY_TEXT") {
        const valNum = Number(selection.textValue);
        if (isNaN(valNum)) {
          errors[groupId] = `Please enter a valid number for "${groupName}".`;
        } else if (group.config?.minValue !== undefined && valNum < group.config.minValue) {
          errors[groupId] = `"${groupName}" cannot be less than ${group.config.minValue}.`;
        } else if (group.config?.maxValue !== undefined && valNum > group.config.maxValue) {
          errors[groupId] = `"${groupName}" cannot exceed ${group.config.maxValue}.`;
        }
      }
    }

    setModifierErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildModifierPayloads = () => {
    const chosenModifiers: any[] = [];
    const payloadModifiers: any[] = [];
    const optionIds: string[] = [];

    if (activeModifierGroups) {
      for (const group of activeModifierGroups) {
        const selection = selectedModifiers[group.id];
        if (!selection) continue;

        const groupType = (group.type || "RECTANGLE_LIST").toUpperCase();
        const groupName = group.displayName || group.name;

        if (selection.optionId) {
          const opt = group.options?.find((o) => o.id === selection.optionId);
          if (opt) {
            optionIds.push(opt.id);
            payloadModifiers.push({
              modifierGroupId: group.id,
              modifierOptionId: opt.id,
            });
            chosenModifiers.push({
              id: opt.id,
              modifierGroupId: group.id,
              groupName: group.name,
              groupDisplayName: groupName,
              type: groupType,
              modifierOptionId: opt.id,
              name: opt.name,
              textValue: null,
              priceDelta: opt.priceDelta || 0,
            });
          }
        } else if (selection.textValue || selection.fileUrl) {
          const val = selection.textValue || selection.fileUrl || "";
          payloadModifiers.push({
            modifierGroupId: group.id,
            textValue: selection.textValue || undefined,
            fileUrl: selection.fileUrl || undefined,
          });
          chosenModifiers.push({
            id: `${group.id}_val`,
            modifierGroupId: group.id,
            groupName: group.name,
            groupDisplayName: groupName,
            type: groupType,
            modifierOptionId: null,
            name: groupName,
            textValue: val,
            priceDelta: 0,
          });
        }
      }
    }

    return { chosenModifiers, payloadModifiers, optionIds };
  };

  // Group unique colors & sizes
  const uniqueColors = Array.from(
    new Map(product.variants?.map((v) => [v.colorName, v])).values()
  );

  const uniqueSizes = Array.from(
    new Set(product.variants?.map((v) => v.size) || ["S", "M", "L", "XL"])
  );

  // 3-Tier Active Pricing
  const activePrice = selectedVariant.priceObject || {
    regular: selectedVariant.compareAtPrice || selectedVariant.price,
    sale: selectedVariant.price,
    offer: null,
    effective: selectedVariant.price,
    discountPercentage:
      selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price
        ? Math.round(((selectedVariant.compareAtPrice - selectedVariant.price) / selectedVariant.compareAtPrice) * 100)
        : 0,
  };

  const hasOffer = activePrice.offer !== null && activePrice.offer !== undefined;

  // Update active image when variant color changes
  const handleColorSelect = (colorVariant: ProductVariantData) => {
    // Find matching variant with current size and this color, or default to first of that color
    const matchingVariant =
      product.variants.find(
        (v) => v.colorName === colorVariant.colorName && v.size === selectedVariant.size
      ) || colorVariant;

    setSelectedVariant(matchingVariant);
    if (matchingVariant.imageUrl) {
      setActiveImage(matchingVariant.imageUrl);
    }
  };

  const handleSizeSelect = (size: string) => {
    const matchingVariant =
      product.variants.find(
        (v) => v.size === size && v.colorName === selectedVariant.colorName
      ) || product.variants.find((v) => v.size === size);

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  };

  const handleAddToCart = async () => {
    if (selectedVariant.stock <= 0 || isAdding) return;
    if (!validateModifiers()) return;

    const { chosenModifiers, payloadModifiers, optionIds } = buildModifierPayloads();

    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price: finalDisplayPrice,
        compareAtPrice: activePrice.regular > finalDisplayPrice ? activePrice.regular : undefined,
        size: selectedVariant.size,
        colorName: selectedVariant.colorName,
        colorHex: selectedVariant.colorHex,
        imageUrl: activeImage,
        sku: selectedVariant.sku,
        quantity,
        maxStock: selectedVariant.stock,
        modifiers: payloadModifiers,
        modifierOptionIds: optionIds,
        selectedModifiers: chosenModifiers,
      });

      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2500);
      setCartToast({
        show: true,
        message: `"${product.name}" added to your shopping bag!`,
        image: activeImage,
        size: selectedVariant.size,
        color: selectedVariant.colorName,
      });
      setTimeout(() => setCartToast(null), 4000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (selectedVariant.stock <= 0 || isAdding) return;
    if (!validateModifiers()) return;

    const { chosenModifiers, payloadModifiers, optionIds } = buildModifierPayloads();

    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price: finalDisplayPrice,
        compareAtPrice: activePrice.regular > finalDisplayPrice ? activePrice.regular : undefined,
        size: selectedVariant.size,
        colorName: selectedVariant.colorName,
        colorHex: selectedVariant.colorHex,
        imageUrl: activeImage,
        sku: selectedVariant.sku,
        quantity,
        maxStock: selectedVariant.stock,
        modifiers: payloadModifiers,
        modifierOptionIds: optionIds,
        selectedModifiers: chosenModifiers,
      });

      router.push("/cart");
    } finally {
      setIsAdding(false);
    }
  };

  // Load reviews from ReviewService
  const loadProductReviews = async (page = 1) => {
    setIsReviewsLoading(true);
    try {
      const res = await ReviewService.getProductReviews(product.slug || product.id, {
        page,
        limit: 10,
        rating: reviewRatingFilter || undefined,
        fitFeedback: reviewFitFilter || undefined,
        hasImages: reviewHasImages ? true : undefined,
        sortBy: reviewSortBy,
      });

      if (res) {
        if (Array.isArray(res.reviews)) {
          setReviews(res.reviews);
        }
        if (res.summary) {
          setReviewSummary(res.summary);
        }
        if (res.pagination) {
          setReviewsPage(res.pagination.page);
          setReviewsTotalPages(res.pagination.totalPages);
          setReviewsTotalCount(res.pagination.totalCount);
        }
      }
    } catch (err) {
      console.warn("Could not load backend reviews:", err);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadProductReviews(1);
    }
  }, [isMounted, product.id, product.slug, reviewRatingFilter, reviewFitFilter, reviewHasImages, reviewSortBy]);

  // Handle helpful upvote toggle
  const handleToggleVote = async (reviewId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    if (votingInProgress[reviewId]) return;

    // Optimistic toggle
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextVoted = !r.hasVoted;
          return {
            ...r,
            hasVoted: nextVoted,
            helpfulCount: Math.max(0, (r.helpfulCount || 0) + (nextVoted ? 1 : -1)),
          };
        }
        return r;
      })
    );

    setVotingInProgress((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await ReviewService.voteReviewHelpful(reviewId);
      if (res && typeof res.hasVoted === "boolean") {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, hasVoted: res.hasVoted, helpfulCount: res.helpfulCount }
              : r
          )
        );
      }
    } catch (err: any) {
      // Revert optimistic toggle on failure
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            const revertedVoted = !r.hasVoted;
            return {
              ...r,
              hasVoted: revertedVoted,
              helpfulCount: Math.max(0, (r.helpfulCount || 0) + (revertedVoted ? 1 : -1)),
            };
          }
          return r;
        })
      );
      alert(err.message || "Failed to register helpful vote");
    } finally {
      setVotingInProgress((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  // Image files selection handler (up to 10 photos)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incomingFiles = Array.from(e.target.files);
    if (selectedReviewFiles.length + incomingFiles.length > 10) {
      setSubmitReviewError("Maximum 10 images allowed per review");
      return;
    }
    const combinedFiles = [...selectedReviewFiles, ...incomingFiles].slice(0, 10);
    setSelectedReviewFiles(combinedFiles);

    const previews = combinedFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
    setSubmitReviewError(null);
  };

  const handleRemoveSelectedFile = (idx: number) => {
    const updated = selectedReviewFiles.filter((_, i) => i !== idx);
    setSelectedReviewFiles(updated);
    const previews = updated.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const handleOpenWriteReview = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    setSubmitReviewError(null);
    setSubmitReviewSuccess(null);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || newComment.trim().length < 3) {
      setSubmitReviewError("Please provide at least 3 characters of fit and styling feedback.");
      return;
    }

    setIsSubmittingReview(true);
    setSubmitReviewError(null);
    setSubmitReviewSuccess(null);

    try {
      const payload: any = {
        rating: newRating,
        title: newTitle.trim() || undefined,
        comment: newComment.trim(),
        fitFeedback: newFitFeedback,
      };

      if (imageInputMode === "files" && selectedReviewFiles.length > 0) {
        payload.files = selectedReviewFiles;
      } else if (imageInputMode === "urls" && imageUrlInput.trim()) {
        payload.images = imageUrlInput
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
      }

      await ReviewService.submitReview(product.id, payload);
      setSubmitReviewSuccess("Your review has been successfully submitted and approved!");

      // Reset form
      setNewRating(5);
      setNewTitle("");
      setNewComment("");
      setSelectedReviewFiles([]);
      setFilePreviews([]);
      setImageUrlInput("");

      // Reload reviews
      setTimeout(async () => {
        await loadProductReviews(1);
        setIsReviewModalOpen(false);
        setSubmitReviewSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSubmitReviewError(err.message || "Failed to submit review. You may have already reviewed this product.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isLowStock =
    selectedVariant.stock > 0 &&
    selectedVariant.stock <= (selectedVariant.lowStockThreshold || 5);
  const isOutOfStock = selectedVariant.stock <= 0;

  return (
    <div className="py-10 bg-[var(--background)]">
      {/* Floating Add-to-Bag Toast Notification */}
      {cartToast && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 max-w-sm w-full bg-neutral-950 text-white p-4 rounded-2xl shadow-2xl border border-neutral-800 animate-in fade-in slide-in-from-top-4 flex items-start gap-3.5">
          {cartToast.image && (
            <img
              src={cartToast.image}
              alt=""
              className="w-12 h-16 object-cover rounded-lg shrink-0 border border-neutral-800"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <Check className="w-3.5 h-3.5" />
              <span>Added to Bag</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{product.name}</p>
            {(cartToast.size || cartToast.color) && (
              <p className="text-[11px] text-neutral-400">
                {cartToast.size && `Size: ${cartToast.size}`}
                {cartToast.color && ` • ${cartToast.color}`}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Link
                href="/cart"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
              >
                <span>View Shopping Bag</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCartToast(null)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation with Hierarchy */}
        <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[var(--foreground)]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-[var(--foreground)]">Collections</Link>
          {product.categoryData?.parent?.parent && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/products?category=${product.categoryData.parent.parent.slug}`} className="hover:text-[var(--foreground)]">
                {product.categoryData.parent.parent.name}
              </Link>
            </>
          )}
          {product.categoryData?.parent && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/products?category=${product.categoryData.parent.slug}`} className="hover:text-[var(--foreground)]">
                {product.categoryData.parent.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <Link href={`/products?category=${product.categorySlug}`} className="hover:text-[var(--foreground)]">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[var(--foreground)] truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 md:w-20 md:h-28 flex-shrink-0 rounded-[var(--radius)] overflow-hidden border transition-all cursor-pointer ${
                      activeImage === img
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]"
                        : "border-[var(--border)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImg;
                      }}
                      className={
                        isBrandLogoImage(img)
                          ? "w-full h-full object-contain p-2 bg-neutral-50"
                          : "w-full h-full object-cover"
                      }
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 aspect-[3/4] bg-[var(--muted)] rounded-[var(--radius)] overflow-hidden border border-[var(--border)] relative group flex items-center justify-center">
              {/* Brand logo background shown before and while API image loads */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-neutral-50 to-neutral-100/90 pointer-events-none select-none">
                <img
                  src={DEFAULT_BRAND_LOGO}
                  alt=""
                  className="max-h-[50%] max-w-[70%] object-contain opacity-35"
                />
              </div>

              <img
                src={activeImage}
                alt={product.name}
                onError={() => {
                  if (activeImage !== fallbackImg) {
                    setActiveImage(fallbackImg);
                  }
                }}
                className={
                  isBrandLogoImage(activeImage)
                    ? "w-full h-full object-contain p-12 relative z-[1]"
                    : "w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 relative z-[1]"
                }
              />
              {activePrice.discountPercentage > 0 && (
                <div className="absolute top-4 left-4">
                  <Badge variant="sale">
                    SAVE {activePrice.discountPercentage}%
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Purchasing Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)] block mb-1">
                  {product.brand || storeConfig.name} • {product.gender}
                </span>
                {/* Rating Badge */}
                <a
                  href="#customer-reviews"
                  className="flex items-center gap-1.5 text-amber-500 text-xs font-bold hover:underline cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>
                      {(reviewSummary?.averageRating ?? (product as any).rating ?? 4.9).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[var(--muted-foreground)] font-normal">
                    ({reviewSummary?.totalReviews ?? reviewsTotalCount ?? reviews.length} reviews)
                  </span>
                </a>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                {product.name}
              </h1>

              {/* 3-Tier Dynamic Price Display */}
              <div className="flex items-baseline gap-3 mt-3 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                  {storeConfig.currency.symbol}{finalDisplayPrice.toLocaleString()}
                </span>
                {activePrice.regular > activePrice.effective && (
                  <span className="text-sm text-[var(--muted-foreground)] line-through">
                    {storeConfig.currency.symbol}{(activePrice.regular + modifierDelta).toLocaleString()}
                  </span>
                )}
                {activePrice.discountPercentage > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">
                    -{activePrice.discountPercentage}% OFF
                  </span>
                )}
                {modifierDelta > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-900 border border-amber-300 shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Includes +{storeConfig.currency.symbol}{modifierDelta.toLocaleString()} customizations
                  </span>
                )}
                {hasOffer && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-sm uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Special Deal
                  </span>
                )}
                <span className="text-[11px] text-[var(--muted-foreground)] ml-auto">
                  SKU: <strong className="font-mono text-[var(--foreground)]">{selectedVariant.sku}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
              {product.shortDescription || product.description}
            </p>

            {/* Color Swatches */}
            {uniqueColors.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[var(--foreground)]">
                    Color: <span className="font-normal text-[var(--muted-foreground)]">{selectedVariant.colorName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {uniqueColors.map((colorV) => (
                    <button
                      key={colorV.id}
                      onClick={() => handleColorSelect(colorV)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius)] border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        selectedVariant.colorName === colorV.colorName
                          ? "border-[var(--foreground)] bg-[var(--muted)] text-[var(--foreground)] ring-1 ring-[var(--foreground)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-black/20"
                        style={{ backgroundColor: colorV.colorHex || "#000000" }}
                      />
                      <span>{colorV.colorName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector & Size Chart Trigger */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Select Size: <span className="font-normal text-[var(--muted-foreground)]">{selectedVariant.size}</span>
                </span>
                {featureConfig.sizeChart && (
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--secondary)] hover:underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {uniqueSizes.map((size) => {
                  const variantForSize = product.variants?.find(
                    (v) => v.size === size && v.colorName === selectedVariant.colorName
                  ) || product.variants?.find((v) => v.size === size);

                  const isSelected = selectedVariant.size === size;
                  const isSoldOut = variantForSize ? variantForSize.stock <= 0 : false;

                  return (
                    <button
                      key={size}
                      disabled={isSoldOut}
                      onClick={() => handleSizeSelect(size)}
                      className={`py-3 text-xs font-bold uppercase tracking-wider rounded-[var(--radius)] border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm"
                          : isSoldOut
                          ? "border-dashed border-[var(--border)] text-[var(--muted-foreground)] opacity-40 cursor-not-allowed line-through"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] bg-[var(--background)]"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalyst Product Modifiers Engine — 9 Control Types */}
            {activeModifierGroups && activeModifierGroups.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                      Bespoke Customizations
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                    Catalyst Engine
                  </span>
                </div>

                {activeModifierGroups.map((group, groupIdx) => {
                  const type = (group.type || "RECTANGLE_LIST").toUpperCase();
                  const groupKey = group.id ? `modgrp-${group.id}` : `modgrp-idx-${groupIdx}-${group.name || "group"}`;
                  const groupId = group.id || `modgrp_${groupIdx}`;
                  const selection = selectedModifiers[groupId];
                  const hasError = Boolean(modifierErrors[groupId]);

                  return (
                    <div
                      key={groupKey}
                      className={`p-3.5 rounded-[var(--radius)] border bg-[var(--background)] space-y-2.5 transition-all ${
                        hasError
                          ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/20"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                          <span>{group.displayName || group.name}</span>
                          {group.isRequired ? (
                            <span className="text-rose-500 font-semibold text-[10px]">*Required</span>
                          ) : (
                            <span className="text-[var(--muted-foreground)] font-normal text-[10px]">(Optional)</span>
                          )}
                        </label>
                      </div>

                      {/* 1. DROPDOWN */}
                      {type === "DROPDOWN" && (
                        <div className="relative">
                          <select
                            value={selection?.optionId || ""}
                            onChange={(e) => handleSelectOption(groupId, e.target.value || null)}
                            className="w-full appearance-none bg-[var(--background)] border border-[var(--border)] focus:border-[var(--foreground)] focus:ring-1 focus:ring-[var(--foreground)] rounded-[var(--radius)] px-3.5 py-2.5 text-xs text-[var(--foreground)] pr-9 cursor-pointer transition-colors"
                          >
                            <option value="">
                              {group.isRequired
                                ? `-- Select ${group.displayName || group.name} * --`
                                : `-- Select Optional ${group.displayName || group.name} --`}
                            </option>
                            {group.options.map((opt, optIdx) => (
                              <option key={opt.id ? `opt-${opt.id}` : `opt-${groupIdx}-${optIdx}`} value={opt.id}>
                                {opt.name}{" "}
                                {opt.priceDelta > 0
                                  ? `(+${storeConfig.currency.symbol}${opt.priceDelta.toLocaleString()})`
                                  : "(Included)"}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      {/* 2. RADIO_BUTTONS */}
                      {type === "RADIO_BUTTONS" && (
                        <div className="space-y-2">
                          {group.options.map((opt, optIdx) => {
                            const isSelected = selection?.optionId === opt.id;
                            const optKey = opt.id ? `radio-${opt.id}` : `radio-${groupIdx}-${optIdx}`;
                            return (
                              <div
                                key={optKey}
                                onClick={() =>
                                  handleSelectOption(
                                    groupId,
                                    isSelected && !group.isRequired ? null : opt.id
                                  )
                                }
                                className={`flex items-center justify-between p-3 rounded-[var(--radius)] border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-[var(--foreground)] bg-[var(--muted)]/50 ring-1 ring-[var(--foreground)] shadow-xs"
                                    : "border-[var(--border)] hover:border-[var(--foreground)]/60 bg-[var(--background)]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected
                                        ? "border-[var(--foreground)] bg-[var(--foreground)]"
                                        : "border-neutral-400"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--background)]" />
                                    )}
                                  </div>
                                  <span className="font-medium text-[var(--foreground)]">{opt.name}</span>
                                </div>
                                <span
                                  className={`text-[11px] font-bold ${
                                    opt.priceDelta > 0 ? "text-amber-700" : "text-neutral-500"
                                  }`}
                                >
                                  {opt.priceDelta > 0
                                    ? `+${storeConfig.currency.symbol}${opt.priceDelta.toLocaleString()}`
                                    : "Included"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. RECTANGLE_LIST / SWATCH TILES */}
                      {type === "RECTANGLE_LIST" && (
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt, optIdx) => {
                            const isSelected = selection?.optionId === opt.id;
                            const optKey = opt.id ? `swatch-${opt.id}` : `swatch-${groupIdx}-${optIdx}`;
                            return (
                              <button
                                key={optKey}
                                type="button"
                                onClick={() =>
                                  handleSelectOption(
                                    groupId,
                                    isSelected && !group.isRequired ? null : opt.id
                                  )
                                }
                                className={`px-3.5 py-2.5 rounded-[var(--radius)] border text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                                  isSelected
                                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                                    : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                                }`}
                              >
                                <span>{opt.name}</span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    isSelected ? "opacity-80" : "text-amber-700"
                                  }`}
                                >
                                  {opt.priceDelta > 0
                                    ? `+${storeConfig.currency.symbol}${opt.priceDelta.toLocaleString()}`
                                    : "Included"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. CHECKBOX */}
                      {type === "CHECKBOX" && (
                        <div className="space-y-2">
                          {group.options.map((opt, optIdx) => {
                            const isChecked = selection?.optionId === opt.id;
                            const optKey = opt.id ? `chk-${opt.id}` : `chk-${groupIdx}-${optIdx}`;
                            return (
                              <div
                                key={optKey}
                                onClick={() => handleToggleCheckbox(groupId, opt.id)}
                                className={`flex items-center justify-between p-3 rounded-[var(--radius)] border text-xs cursor-pointer transition-all select-none ${
                                  isChecked
                                    ? "border-[var(--foreground)] bg-amber-500/5 ring-1 ring-[var(--foreground)] shadow-xs"
                                    : "border-[var(--border)] hover:border-[var(--foreground)] bg-[var(--background)]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      isChecked
                                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                                        : "border-neutral-400"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="font-medium text-[var(--foreground)]">{opt.name}</span>
                                </div>
                                <span
                                  className={`text-[11px] font-bold ${
                                    opt.priceDelta > 0 ? "text-amber-700" : "text-neutral-500"
                                  }`}
                                >
                                  {opt.priceDelta > 0
                                    ? `+${storeConfig.currency.symbol}${opt.priceDelta.toLocaleString()}`
                                    : "Free"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. SHORT_TEXT (e.g. Monogram Embroidery) */}
                      {type === "SHORT_TEXT" && (
                        <div className="space-y-1">
                          <div className="relative">
                            <input
                              type="text"
                              value={selection?.textValue || ""}
                              onChange={(e) => handleTextChange(group.id, e.target.value)}
                              maxLength={group.config?.maxLength || 30}
                              placeholder={group.config?.placeholder || "e.g. Priya or P&R"}
                              className="w-full bg-[var(--background)] border border-[var(--border)] focus:border-[var(--foreground)] focus:ring-1 focus:ring-[var(--foreground)] rounded-[var(--radius)] px-3.5 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 transition-colors uppercase tracking-wider font-mono"
                            />
                            {group.config?.maxLength && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)] font-mono pointer-events-none">
                                {(selection?.textValue || "").length}/{group.config.maxLength}
                              </span>
                            )}
                          </div>
                          {group.config?.minLength && (
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              Minimum {group.config.minLength} characters required.
                            </p>
                          )}
                        </div>
                      )}

                      {/* 6. MULTI_LINE_TEXT (e.g. Custom Tailoring Notes) */}
                      {type === "MULTI_LINE_TEXT" && (
                        <div className="space-y-1">
                          <div className="relative">
                            <textarea
                              rows={3}
                              value={selection?.textValue || ""}
                              onChange={(e) => handleTextChange(group.id, e.target.value)}
                              maxLength={group.config?.maxLength || 300}
                              placeholder={
                                group.config?.placeholder ||
                                "Enter tailoring specifications, blouse neckline notes, or measurements..."
                              }
                              className="w-full bg-[var(--background)] border border-[var(--border)] focus:border-[var(--foreground)] focus:ring-1 focus:ring-[var(--foreground)] rounded-[var(--radius)] p-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 transition-colors"
                            />
                            {group.config?.maxLength && (
                              <span className="absolute right-3 bottom-2 text-[10px] text-[var(--muted-foreground)] font-mono pointer-events-none">
                                {(selection?.textValue || "").length}/{group.config.maxLength}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 7. NUMBERS_ONLY_TEXT (e.g. Custom Length in cm) */}
                      {type === "NUMBERS_ONLY_TEXT" && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={selection?.textValue ?? ""}
                              onChange={(e) => handleTextChange(group.id, e.target.value)}
                              min={group.config?.minValue}
                              max={group.config?.maxValue}
                              placeholder={
                                group.config?.placeholder ||
                                (group.config?.minValue !== undefined && group.config?.maxValue !== undefined
                                  ? `${group.config.minValue} - ${group.config.maxValue}`
                                  : "Enter value")
                              }
                              className="w-36 bg-[var(--background)] border border-[var(--border)] focus:border-[var(--foreground)] focus:ring-1 focus:ring-[var(--foreground)] rounded-[var(--radius)] px-3.5 py-2 text-xs text-[var(--foreground)] font-mono"
                            />
                            {(group.config?.minValue !== undefined || group.config?.maxValue !== undefined) && (
                              <span className="text-[11px] text-[var(--muted-foreground)]">
                                (Allowed range: {group.config.minValue ?? 0} to {group.config.maxValue ?? "∞"})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 8. DATE (Target Event / Wedding Date) */}
                      {type === "DATE" && (
                        <div className="space-y-1">
                          <div className="relative max-w-xs">
                            <input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              value={selection?.textValue || ""}
                              onChange={(e) => handleTextChange(group.id, e.target.value)}
                              className="w-full bg-[var(--background)] border border-[var(--border)] focus:border-[var(--foreground)] focus:ring-1 focus:ring-[var(--foreground)] rounded-[var(--radius)] px-3.5 py-2 text-xs text-[var(--foreground)] cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            Event/wedding date for scheduled atelier dispatch.
                          </p>
                        </div>
                      )}

                      {/* 9. FILE_UPLOAD (Pattern / Sketch Reference) */}
                      {type === "FILE_UPLOAD" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)] text-xs font-medium cursor-pointer text-[var(--foreground)] transition-colors">
                              <UploadCloud className="w-4 h-4 text-amber-600" />
                              <span>{selection?.fileName ? "Change Attachment" : "Upload Reference Image"}</span>
                              <input
                                type="file"
                                accept={
                                  group.config?.allowedExtensions?.map((ext) => `.${ext}`).join(",") ||
                                  "image/*,.pdf"
                                }
                                onChange={(e) => handleFileUpload(group.id, e.target.files?.[0] || null)}
                                className="hidden"
                              />
                            </label>
                            {selection?.fileName && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                <Check className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[180px] font-mono">{selection?.fileName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleFileUpload(group.id, null)}
                                  className="text-neutral-400 hover:text-neutral-700 ml-1 p-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            Attach reference pattern or fit photo (PNG, JPG, PDF up to 10MB).
                          </p>
                        </div>
                      )}

                      {/* Inline Error */}
                      {hasError && (
                        <div className="text-[11px] text-rose-600 flex items-center gap-1 font-medium pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{modifierErrors[group.id]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dynamic Product Attributes (Fabric, Occasion, Material, etc.) */}
            {product.dynamicAttributes && product.dynamicAttributes.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block mb-2.5">
                  Garment Attributes
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {product.dynamicAttributes.map((attr, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] block">
                        {attr.attribute}
                      </span>
                      <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Stock Notification Banner */}
            {isLowStock && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius)] flex items-center gap-2.5 text-amber-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Low Stock Alert: Only {selectedVariant.stock} pieces remaining in Size {selectedVariant.size}!</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] flex items-center gap-2.5 text-red-900 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>Out of Stock in Size {selectedVariant.size}. Select another size or color.</span>
              </div>
            )}

            {/* Validation Feedback Banner */}
            {Object.keys(modifierErrors).length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[var(--radius)] flex items-start gap-2.5 text-rose-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Please complete required customizations:</span>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                    {Object.entries(modifierErrors).map(([gid, err]) => (
                      <li key={gid}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isOutOfStock || isAdding}
                  isLoading={isAdding}
                  onClick={handleAddToCart}
                  className="flex-1"
                  leftIcon={
                    addedAnimation ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )
                  }
                >
                  {isAdding
                    ? "ADDING TO BAG..."
                    : addedAnimation
                    ? "ADDED TO BAG"
                    : isOutOfStock
                    ? "OUT OF STOCK"
                    : `ADD TO BAG — ${storeConfig.currency.symbol}${finalDisplayPrice.toLocaleString()}`}
                </Button>

                {/* Wishlist Button */}
                {featureConfig.wishlist && (
                  <button
                    onClick={handleToggleWishlist}
                    aria-label="Toggle Wishlist"
                    className="p-3.5 rounded-[var(--radius)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
                  </button>
                )}
              </div>

              {/* Buy Now Button */}
              {!isOutOfStock && (
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={isAdding}
                  isLoading={isAdding}
                  onClick={handleBuyNow}
                  className="w-full"
                >
                  BUY IT NOW — {storeConfig.currency.symbol}{finalDisplayPrice.toLocaleString()}
                </Button>
              )}
            </div>

            {/* Key Atelier Assurances */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--foreground)]" />
                <span>Complimentary Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[var(--foreground)]" />
                <span>7-Day Return Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--foreground)]" />
                <span>Silk Mark Authenticity</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--foreground)]" />
                <span>Bespoke Tailoring Available</span>
              </div>
            </div>

            {/* Garment Details Accordion Tabs */}
            <div className="pt-6 border-t border-[var(--border)]">
              <div className="flex border-b border-[var(--border)] text-xs font-bold uppercase tracking-wider">
                <button
                  onClick={() => setActiveTab("fabric")}
                  className={`pb-3 pr-4 transition-colors cursor-pointer ${
                    activeTab === "fabric"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Fabric & Fit
                </button>
                <button
                  onClick={() => setActiveTab("care")}
                  className={`pb-3 px-4 transition-colors cursor-pointer ${
                    activeTab === "care"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Care Guide
                </button>
                <button
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-3 pl-4 transition-colors cursor-pointer ${
                    activeTab === "shipping"
                      ? "text-[var(--foreground)] border-b-2 border-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Delivery
                </button>
              </div>

              <div className="py-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
                {activeTab === "fabric" && (
                  <div className="space-y-2">
                    <p><strong className="text-[var(--foreground)]">Fabric Composition:</strong> {product.fabricInfo || "100% Organic Natural Fibers"}</p>
                    <p><strong className="text-[var(--foreground)]">Fit & Cut:</strong> {product.fitInfo || "Contemporary tailored fit."}</p>
                    {product.modelInfo && <p><strong className="text-[var(--foreground)]">Model Note:</strong> {product.modelInfo}</p>}
                  </div>
                )}
                {activeTab === "care" && (
                  <p>{product.careInstructions || "Specialist dry clean recommended. Store on padded hangers."}</p>
                )}
                {activeTab === "shipping" && (
                  <p>{product.shippingInfo || `Dispatched via express insured courier within ${storeConfig.shipping.estimatedDeliveryDays}.`}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Customer Reviews Section */}
        {featureConfig.reviews && (
          <section id="customer-reviews" className="mt-20 pt-16 border-t border-[var(--border)] scroll-mt-24">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
                  CLIENT EXPERIENCES & ATELIER FEEDBACK
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[var(--foreground)] mt-1 flex items-center gap-3">
                  <span>CUSTOMER REVIEWS</span>
                  <span className="text-base sm:text-lg font-normal text-[var(--muted-foreground)]">
                    ({reviewSummary?.totalReviews ?? reviewsTotalCount ?? reviews.length})
                  </span>
                </h2>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenWriteReview}
                leftIcon={<MessageSquarePlus className="w-4 h-4" />}
                className="self-start sm:self-auto"
              >
                WRITE A REVIEW
              </Button>
            </div>

            {/* Rating Overview, 5-Star Distribution & Fit Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 p-6 sm:p-8 rounded-2xl bg-[var(--muted)] border border-[var(--border)]">
              {/* Overall Score */}
              <div className="lg:col-span-3 flex flex-col justify-center items-center text-center lg:border-r border-[var(--border)] lg:pr-8">
                <span className="text-5xl font-extrabold text-[var(--foreground)] tracking-tight font-heading">
                  {(reviewSummary?.averageRating ?? (product as any).rating ?? 4.9).toFixed(1)}
                </span>
                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = reviewSummary?.averageRating ?? (product as any).rating ?? 4.9;
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(currentRating)
                            ? "fill-amber-500 text-amber-500"
                            : "text-[var(--border)]"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">
                  Based on {reviewSummary?.totalReviews ?? reviewsTotalCount ?? reviews.length} verified client reviews
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>100% Verified Purchases</span>
                </div>
              </div>

              {/* 5-Star Distribution Bars */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-2 lg:px-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-1 block">
                  Rating Breakdown
                </span>
                {[5, 4, 3, 2, 1].map((star) => {
                  const item = reviewSummary?.ratingBreakdown?.[star.toString()] || {
                    count: star === 5 ? reviews.filter((r) => r.rating === 5).length : 0,
                    percentage: star === 5 ? (reviews.length > 0 ? 100 : 0) : 0,
                  };
                  const isSelected = reviewRatingFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRatingFilter(isSelected ? null : star)}
                      className={`group flex items-center gap-3 text-xs w-full py-0.5 rounded-lg transition-colors cursor-pointer text-left ${
                        isSelected ? "font-bold text-amber-600" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      <span className="w-8 flex items-center gap-0.5 font-medium shrink-0">
                        {star} <Star className="w-3 h-3 fill-amber-500 text-amber-500 inline" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--background)] border border-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? "bg-amber-600" : "bg-amber-400 group-hover:bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-mono text-[11px] shrink-0">
                        {item.percentage}% ({item.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sizing & Fit Feedback Meter */}
              <div className="lg:col-span-4 flex flex-col justify-center lg:border-l border-[var(--border)] lg:pl-8 space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] block">
                    Apparel Fit & Silhouette
                  </span>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Real client measurements and fit consensus
                  </p>
                </div>

                {/* Fit meter calculation */}
                {(() => {
                  const runsSmall = reviewSummary?.fitBreakdown?.RUNS_SMALL ?? 0;
                  const trueToSize = reviewSummary?.fitBreakdown?.TRUE_TO_SIZE ?? reviews.length;
                  const runsLarge = reviewSummary?.fitBreakdown?.RUNS_LARGE ?? 0;
                  const totalFit = runsSmall + trueToSize + runsLarge || 1;
                  const ttsPercentage = Math.round((trueToSize / totalFit) * 100);

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{ttsPercentage}% True to Size</span>
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                          {totalFit} responses
                        </span>
                      </div>

                      {/* 3-Part Fit Progress Bar */}
                      <div className="h-2.5 w-full rounded-full bg-[var(--background)] border border-[var(--border)] flex overflow-hidden">
                        <div
                          style={{ width: `${(runsSmall / totalFit) * 100}%` }}
                          className="bg-amber-400"
                          title={`Runs Small: ${runsSmall}`}
                        />
                        <div
                          style={{ width: `${(trueToSize / totalFit) * 100}%` }}
                          className="bg-emerald-500"
                          title={`True to Size: ${trueToSize}`}
                        />
                        <div
                          style={{ width: `${(runsLarge / totalFit) * 100}%` }}
                          className="bg-indigo-400"
                          title={`Runs Large: ${runsLarge}`}
                        />
                      </div>

                      {/* Fit Legend Pill Badges */}
                      <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center">
                        <button
                          type="button"
                          onClick={() => setReviewFitFilter(reviewFitFilter === "RUNS_SMALL" ? null : "RUNS_SMALL")}
                          className={`p-1.5 rounded border transition-colors cursor-pointer ${
                            reviewFitFilter === "RUNS_SMALL"
                              ? "border-amber-500 bg-amber-500/10 font-bold text-amber-700 dark:text-amber-300"
                              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                          }`}
                        >
                          <span className="block font-semibold">Runs Small</span>
                          <span className="text-[9px] font-mono opacity-80">{runsSmall}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFitFilter(reviewFitFilter === "TRUE_TO_SIZE" ? null : "TRUE_TO_SIZE")}
                          className={`p-1.5 rounded border transition-colors cursor-pointer ${
                            reviewFitFilter === "TRUE_TO_SIZE"
                              ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300"
                              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                          }`}
                        >
                          <span className="block font-semibold">True to Size</span>
                          <span className="text-[9px] font-mono opacity-80">{trueToSize}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFitFilter(reviewFitFilter === "RUNS_LARGE" ? null : "RUNS_LARGE")}
                          className={`p-1.5 rounded border transition-colors cursor-pointer ${
                            reviewFitFilter === "RUNS_LARGE"
                              ? "border-indigo-500 bg-indigo-500/10 font-bold text-indigo-700 dark:text-indigo-300"
                              : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                          }`}
                        >
                          <span className="block font-semibold">Runs Large</span>
                          <span className="text-[9px] font-mono opacity-80">{runsLarge}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Customer Photo Gallery Strip (if any reviews have images) */}
            {(() => {
              const allCustomerPhotos = reviews.flatMap((r) =>
                (r.images || []).map((imgUrl) => ({
                  url: imgUrl,
                  authorName: r.user?.name || "Client",
                  rating: r.rating,
                  title: r.title,
                }))
              );

              if (allCustomerPhotos.length === 0) return null;

              return (
                <div className="mb-10 p-5 rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                        Customer Photo Gallery ({allCustomerPhotos.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      Click any photograph to view details
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {allCustomerPhotos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setPreviewPhoto(photo)}
                        className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0 group cursor-pointer hover:ring-2 hover:ring-[var(--foreground)] transition-all"
                      >
                        <img
                          src={photo.url}
                          alt={`Customer photo ${pIdx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>

                <button
                  onClick={() => {
                    setReviewRatingFilter(null);
                    setReviewFitFilter(null);
                    setReviewHasImages(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    !reviewRatingFilter && !reviewFitFilter && !reviewHasImages
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  All
                </button>

                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRatingFilter(reviewRatingFilter === star ? null : star)}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      reviewRatingFilter === star
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                ))}

                <button
                  onClick={() => setReviewHasImages(!reviewHasImages)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    reviewHasImages
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>With Photos</span>
                </button>

                {(reviewRatingFilter !== null || reviewFitFilter !== null || reviewHasImages) && (
                  <button
                    onClick={() => {
                      setReviewRatingFilter(null);
                      setReviewFitFilter(null);
                      setReviewHasImages(false);
                    }}
                    className="text-xs text-rose-500 hover:underline font-semibold ml-2 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 text-xs self-end lg:self-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span className="font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Sort:
                </span>
                <select
                  value={reviewSortBy}
                  onChange={(e) => setReviewSortBy(e.target.value as any)}
                  className="bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider focus:outline-none cursor-pointer"
                >
                  <option value="most_helpful">Most Helpful</option>
                  <option value="newest">Newest First</option>
                  <option value="highest_rating">Highest Rating</option>
                  <option value="lowest_rating">Lowest Rating</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Reviews Listing */}
            {isReviewsLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                <p className="text-xs font-medium text-[var(--muted-foreground)]">
                  Retrieving verified client feedback...
                </p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[var(--muted)]/50 border border-[var(--border)] space-y-4">
                <div className="w-12 h-12 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--muted-foreground)]">
                  <Star className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-[var(--foreground)]">
                    No Reviews Found
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                    {reviewRatingFilter || reviewFitFilter || reviewHasImages
                      ? "There are no reviews matching your currently selected filters."
                      : "Be the first verified customer to share impressions of this garment."}
                  </p>
                </div>
                {(reviewRatingFilter || reviewFitFilter || reviewHasImages) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReviewRatingFilter(null);
                      setReviewFitFilter(null);
                      setReviewHasImages(false);
                    }}
                  >
                    CLEAR FILTERS
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleOpenWriteReview}>
                    WRITE FIRST REVIEW
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => {
                  const authorName = rev.user?.name || "Verified Client";
                  const formattedDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recently verified";

                  return (
                    <article
                      key={rev.id}
                      className="p-6 rounded-[var(--radius)] bg-[var(--muted)] border border-[var(--border)] space-y-4 flex flex-col justify-between hover:border-[var(--foreground)]/30 transition-all shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Reviewer Header & Stars */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)] shrink-0 overflow-hidden">
                              {rev.user?.avatarUrl ? (
                                <img
                                  src={rev.user.avatarUrl}
                                  alt={authorName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                authorName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[var(--foreground)]">
                                  {authorName}
                                </span>
                                {rev.isVerifiedPurchase && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                    <BadgeCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Verified Buyer</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                                {formattedDate}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-[var(--border)]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Sizing Fit Badge */}
                        {rev.fitFeedback && (
                          <div className="inline-block">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--muted-foreground)]">
                              Fit:{" "}
                              <strong className="text-[var(--foreground)]">
                                {rev.fitFeedback === "RUNS_SMALL"
                                  ? "Runs Small"
                                  : rev.fitFeedback === "RUNS_LARGE"
                                  ? "Runs Large"
                                  : "True to Size"}
                              </strong>
                            </span>
                          </div>
                        )}

                        {/* Review Headline & Comment */}
                        <div className="space-y-1.5">
                          {rev.title && (
                            <h4 className="text-xs font-bold uppercase tracking-wide text-[var(--foreground)]">
                              {rev.title}
                            </h4>
                          )}
                          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                            {rev.comment}
                          </p>
                        </div>

                        {/* Attached Photos */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {rev.images.map((imgUrl, imgIdx) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() =>
                                  setPreviewPhoto({
                                    url: imgUrl,
                                    authorName,
                                    rating: rev.rating,
                                    title: rev.title,
                                  })
                                }
                                className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden border border-[var(--border)] relative group cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all shrink-0"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Review attachment ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Official Atelier Merchant Reply (if any) */}
                      {rev.adminReply && (
                        <div className="mt-3 p-3.5 rounded-xl bg-[var(--background)] border border-amber-500/20 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Official Atelier Response
                            </span>
                            {rev.adminReplyAt && (
                              <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                                {new Date(rev.adminReplyAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed italic">
                            "{rev.adminReply}"
                          </p>
                        </div>
                      )}

                      {/* Helpful Upvote Button */}
                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          Was this review helpful?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleVote(rev.id)}
                          disabled={votingInProgress[rev.id]}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            rev.hasVoted
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--foreground)]"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${rev.hasVoted ? "fill-white" : ""}`} />
                          <span>{rev.hasVoted ? "Helpful" : "Helpful"}</span>
                          <span className="font-mono">({rev.helpfulCount || 0})</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {reviewsTotalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewsPage <= 1 || isReviewsLoading}
                  onClick={() => loadProductReviews(reviewsPage - 1)}
                >
                  PREVIOUS
                </Button>
                <span className="text-xs font-mono font-medium text-[var(--muted-foreground)]">
                  Page {reviewsPage} of {reviewsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewsPage >= reviewsTotalPages || isReviewsLoading}
                  onClick={() => loadProductReviews(reviewsPage + 1)}
                >
                  NEXT
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Related Product Recommendations */}
        {featureConfig.recommendations && relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-[var(--border)]">
            <div className="text-center mb-12 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--secondary)]">
                COMPLETE THE LOOK
              </span>
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-[var(--foreground)]">
                PAIR WITH THESE SILHOUETTES
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct as any} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Interactive Size Guide Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--background)] max-w-xl w-full p-6 sm:p-8 rounded-[var(--radius)] border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[var(--foreground)]" />
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--foreground)]">
                  ATELIER SIZE & FIT GUIDE
                </h3>
              </div>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="text-xs font-bold uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            {/* Units toggle */}
            <div className="flex justify-end gap-2 mb-4 text-xs font-bold uppercase">
              <button
                onClick={() => setUnitSystem("inches")}
                className={`px-3 py-1 rounded border ${
                  unitSystem === "inches" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnitSystem("cm")}
                className={`px-3 py-1 rounded border ${
                  unitSystem === "cm" ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                Centimeters
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--foreground)] font-bold uppercase">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Bust / Chest</th>
                    <th className="py-2.5">Waist</th>
                    <th className="py-2.5">Hip</th>
                    <th className="py-2.5">Garment Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--muted-foreground)]">
                  {unitSystem === "inches" ? (
                    <>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XS (34)</td><td>34" - 36"</td><td>26" - 28"</td><td>36" - 38"</td><td>27.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">S (36)</td><td>36" - 38"</td><td>28" - 30"</td><td>38" - 40"</td><td>28.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">M (38)</td><td>38" - 40"</td><td>30" - 32"</td><td>40" - 42"</td><td>29.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">L (40)</td><td>40" - 42"</td><td>32" - 34"</td><td>42" - 44"</td><td>30.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XL (42)</td><td>42" - 44"</td><td>34" - 36"</td><td>44" - 46"</td><td>31.5"</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XXL (44)</td><td>44" - 46"</td><td>36" - 38"</td><td>46" - 48"</td><td>32.5"</td></tr>
                    </>
                  ) : (
                    <>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XS (34)</td><td>86 - 91 cm</td><td>66 - 71 cm</td><td>91 - 96 cm</td><td>70 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">S (36)</td><td>91 - 96 cm</td><td>71 - 76 cm</td><td>96 - 101 cm</td><td>72 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">M (38)</td><td>96 - 101 cm</td><td>76 - 81 cm</td><td>101 - 106 cm</td><td>75 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">L (40)</td><td>101 - 106 cm</td><td>81 - 86 cm</td><td>106 - 111 cm</td><td>77 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XL (42)</td><td>106 - 111 cm</td><td>86 - 91 cm</td><td>111 - 116 cm</td><td>80 cm</td></tr>
                      <tr><td className="py-2.5 font-bold text-[var(--foreground)]">XXL (44)</td><td>111 - 116 cm</td><td>91 - 96 cm</td><td>116 - 121 cm</td><td>82 cm</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              * Dimensions represent standard tailored body measurements. For a relaxed or oversized drape, our stylists recommend selecting one size larger.
            </p>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--background)] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-[var(--border)] shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block">
                  Verified Client Feedback
                </span>
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--foreground)] mt-0.5">
                  Write a Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-xs font-bold uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success notification */}
            {submitReviewSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitReviewSuccess}</span>
              </div>
            )}

            {/* Error notification */}
            {submitReviewError && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitReviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Product Info Preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                <img
                  src={images[0]}
                  alt={product.name}
                  className="w-12 h-14 object-cover rounded-lg shrink-0 border border-[var(--border)]"
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-[var(--foreground)] truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Purchases with delivered orders receive an automatic Verified Buyer trust badge.
                  </p>
                </div>
              </div>

              {/* Rating Star Picker */}
              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110 p-0.5"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= newRating ? "fill-amber-500 text-amber-500" : "text-[var(--border)]"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-semibold text-[var(--foreground)]">
                    {newRating === 5
                      ? "Flawless (5/5)"
                      : newRating === 4
                      ? "Great (4/5)"
                      : newRating === 3
                      ? "Average (3/5)"
                      : newRating === 2
                      ? "Disappointing (2/5)"
                      : "Poor (1/5)"}
                  </span>
                </div>
              </div>

              {/* Apparel Fit & Silhouette Feedback */}
              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1.5">
                  Sizing & Fit Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "RUNS_SMALL", label: "Runs Small", sub: "Order 1 size up" },
                      { id: "TRUE_TO_SIZE", label: "True to Size", sub: "Exact tailored fit" },
                      { id: "RUNS_LARGE", label: "Runs Large", sub: "Generous drape" },
                    ] as const
                  ).map((fitOpt) => (
                    <button
                      key={fitOpt.id}
                      type="button"
                      onClick={() => setNewFitFeedback(fitOpt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        newFitFeedback === fitOpt.id
                          ? "border-amber-500 bg-amber-500/10 text-[var(--foreground)] ring-1 ring-amber-500"
                          : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]"
                      }`}
                    >
                      <span className="block font-bold text-xs">{fitOpt.label}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{fitOpt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  placeholder="e.g. Stunning fabric, perfect fit for evening gala"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Detailed Feedback */}
              <div>
                <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block mb-1">
                  Detailed Experience <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={3}
                  maxLength={3000}
                  placeholder="Share details regarding the fabric texture, drape, occasion, and sizing recommendations..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
                <span className="text-[10px] text-[var(--muted-foreground)] text-right block mt-1">
                  {newComment.length} / 3000 characters
                </span>
              </div>

              {/* Dual Image Input (Direct Upload or Pre-hosted URLs) */}
              <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-[var(--foreground)] block">
                    Customer Photographs (Optional)
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("files")}
                      className={`font-semibold cursor-pointer ${
                        imageInputMode === "files" ? "text-amber-500 underline" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      Upload Files
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("urls")}
                      className={`font-semibold cursor-pointer ${
                        imageInputMode === "urls" ? "text-amber-500 underline" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      Image URLs
                    </button>
                  </div>
                </div>

                {imageInputMode === "files" ? (
                  <div>
                    {/* File Dropzone */}
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[var(--border)] rounded-xl hover:border-amber-500/50 bg-[var(--muted)]/40 cursor-pointer transition-colors">
                      <UploadCloud className="w-6 h-6 text-amber-500 mb-1" />
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        Click to upload garment photos
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        PNG, JPG, WEBP up to 10 files (Direct to Cloudinary)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {/* Thumbnails of selected files */}
                    {filePreviews.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {filePreviews.map((previewUrl, fIdx) => (
                          <div
                            key={fIdx}
                            className="relative w-14 h-16 rounded-lg overflow-hidden border border-[var(--border)] group"
                          >
                            <img
                              src={previewUrl}
                              alt="Upload preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedFile(fIdx)}
                              className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-0.5 rounded-full transition-colors"
                              title="Remove photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Paste image URLs (one URL per line)..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] rounded-[var(--radius)] text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  CANCEL
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmittingReview}
                  leftIcon={
                    isSubmittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : undefined
                  }
                >
                  {isSubmittingReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-h-[75vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center bg-black">
              <img
                src={previewPhoto.url}
                alt="Enlarged customer photo"
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>
            <div className="text-center text-white space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {previewPhoto.authorName || "Verified Customer"}
                </span>
                {previewPhoto.rating && (
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: previewPhoto.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                )}
              </div>
              {previewPhoto.title && (
                <p className="text-xs text-white/80 italic">"{previewPhoto.title}"</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
