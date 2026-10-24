"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  BadgeCheck,
  AlertTriangle,
  Trash2,
  Edit3,
  ExternalLink,
  Loader2,
  Clock,
  X,
  Camera,
  UploadCloud,
  ChevronRight,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { storeConfig } from "@/config/store.config";
import {
  ReviewService,
  ReviewItem,
  PendingReviewProduct,
  FitFeedback,
} from "@/services/review.service";

interface ReviewsTabProps {
  onShowToast: (message: string) => void;
  onRefreshCount?: (count: number) => void;
}

export function ReviewsTab({ onShowToast, onRefreshCount }: ReviewsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"my_reviews" | "pending">("my_reviews");

  // My reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Pending review products state
  const [pendingProducts, setPendingProducts] = useState<PendingReviewProduct[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);

  // Edit review state
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editFit, setEditFit] = useState<FitFeedback>("TRUE_TO_SIZE");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete review state
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Write new review for pending product
  const [reviewingPendingProduct, setReviewingPendingProduct] =
    useState<PendingReviewProduct | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newFit, setNewFit] = useState<FitFeedback>("TRUE_TO_SIZE");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load My Past Reviews
  const loadMyReviews = async (page = 1) => {
    setIsLoadingReviews(true);
    try {
      const res = await ReviewService.getMyReviews({ page, limit: 10 });
      if (res && res.reviews) {
        setReviews(res.reviews);
        if (res.pagination) {
          setReviewsPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.totalCount);
          if (onRefreshCount) onRefreshCount(res.pagination.totalCount);
        }
      }
    } catch (err) {
      console.warn("Could not fetch my reviews:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Load Delivered Products Pending Review
  const loadPendingProducts = async () => {
    setIsLoadingPending(true);
    try {
      const res = await ReviewService.getPendingReviewProducts();
      if (Array.isArray(res)) {
        setPendingProducts(res);
      }
    } catch (err) {
      console.warn("Could not fetch pending reviews:", err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    loadMyReviews(1);
    loadPendingProducts();
  }, []);

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (editComment.trim().length < 3) {
      onShowToast("Comment must be at least 3 characters.");
      return;
    }

    setIsUpdating(true);
    try {
      await ReviewService.updateReview(editingReview.id, {
        rating: editRating,
        title: editTitle.trim() || undefined,
        comment: editComment.trim(),
        fitFeedback: editFit,
      });

      // Update in local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                rating: editRating,
                title: editTitle.trim() || r.title,
                comment: editComment.trim(),
                fitFeedback: editFit,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );

      setEditingReview(null);
      onShowToast("Review updated successfully!");
    } catch (err: any) {
      onShowToast(err.message || "Failed to update review.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Review
  const handleConfirmDelete = async () => {
    if (!deletingReviewId) return;
    setIsDeleting(true);
    try {
      await ReviewService.deleteReview(deletingReviewId);
      setReviews((prev) => prev.filter((r) => r.id !== deletingReviewId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDeletingReviewId(null);
      onShowToast("Review deleted successfully.");
    } catch (err: any) {
      onShowToast(err.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Submit Review for Pending Product
  const handleSubmitPendingReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPendingProduct) return;
    if (newComment.trim().length < 3) {
      setSubmitError("Review comment must be at least 3 characters.");
      return;
    }

    setIsSubmittingNew(true);
    setSubmitError(null);
    try {
      const payload: any = {
        rating: newRating,
        title: newTitle.trim() || undefined,
        comment: newComment.trim(),
        fitFeedback: newFit,
        orderId: reviewingPendingProduct.orderId,
      };

      if (selectedFiles.length > 0) {
        payload.files = selectedFiles;
      }

      await ReviewService.submitReview(reviewingPendingProduct.id, payload);

      // Remove from pending products
      setPendingProducts((prev) =>
        prev.filter((p) => p.id !== reviewingPendingProduct.id)
      );

      // Reset
      setReviewingPendingProduct(null);
      setNewRating(5);
      setNewTitle("");
      setNewComment("");
      setSelectedFiles([]);
      setFilePreviews([]);

      // Reload reviews list
      await loadMyReviews(1);
      setActiveSubTab("my_reviews");
      onShowToast("Thank you! Review submitted and verified.");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handlePendingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    if (selectedFiles.length + incoming.length > 10) {
      setSubmitError("Maximum 10 images allowed per review");
      return;
    }
    const combined = [...selectedFiles, ...incoming].slice(0, 10);
    setSelectedFiles(combined);
    setFilePreviews(combined.map((f) => URL.createObjectURL(f)));
    setSubmitError(null);
  };

  const handleRemovePendingFile = (idx: number) => {
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    setFilePreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Reviews & Ratings
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your feedback, sizing notes, and review pending garment deliveries
          </p>
        </div>

        {/* Dual Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("my_reviews")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "my_reviews"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>My Reviews</span>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded-full font-mono">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pending")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "pending"
                ? "bg-white text-neutral-900 shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Awaiting Review</span>
            {pendingProducts.length > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {pendingProducts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subtab 1: My Past Reviews */}
      {activeSubTab === "my_reviews" && (
        <div className="space-y-4">
          {isLoadingReviews ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-500">Loading your past reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Star className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">
                  No Reviews Submitted Yet
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  You haven't reviewed any purchased garments yet. Share your feedback to help others find their ideal silhouette.
                </p>
              </div>
              {pendingProducts.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveSubTab("pending")}
                >
                  REVIEW DELIVERED PURCHASES ({pendingProducts.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => {
                const productImg =
                  rev.product?.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600";
                const productName = rev.product?.name || "Garment";
                const productSlug = rev.product?.slug || "";

                return (
                  <div
                    key={rev.id}
                    className="p-5 sm:p-6 bg-white rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col md:flex-row gap-5 items-start justify-between"
                  >
                    {/* Left: Product Media + Details */}
                    <div className="flex gap-4 min-w-0 flex-1">
                      <div className="w-20 h-26 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 relative group">
                        <img
                          src={productImg}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={productSlug ? `/products/${productSlug}` : "#"}
                            className="font-semibold text-xs sm:text-sm text-neutral-900 hover:text-amber-600 transition-colors truncate block"
                          >
                            {productName}
                          </Link>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              rev.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : rev.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : rev.status === "FLAGGED"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>

                        {/* Star Rating & Date */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= rev.rating ? "fill-current" : "text-neutral-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Fit Feedback */}
                        {rev.fitFeedback && (
                          <div className="pt-0.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                              Fit:{" "}
                              {rev.fitFeedback === "RUNS_SMALL"
                                ? "Runs Small"
                                : rev.fitFeedback === "RUNS_LARGE"
                                ? "Runs Large"
                                : "True to Size"}
                            </span>
                          </div>
                        )}

                        {/* Headline & Comment */}
                        <div className="pt-1 space-y-0.5">
                          {rev.title && (
                            <h4 className="text-xs font-bold text-neutral-900">
                              {rev.title}
                            </h4>
                          )}
                          <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                            {rev.comment}
                          </p>
                        </div>

                        {/* Customer Photos */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="flex items-center gap-2 pt-2">
                            {rev.images.map((img, i) => (
                              <a
                                key={i}
                                href={img}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-14 rounded-lg overflow-hidden border border-neutral-200 shrink-0 hover:ring-2 hover:ring-neutral-900 transition-all"
                              >
                                <img
                                  src={img}
                                  alt="Attachment"
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Merchant Reply if present */}
                        {rev.adminReply && (
                          <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
                            <span className="font-semibold text-amber-800 flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5" />
                              Atelier Store Reply
                            </span>
                            <p className="text-neutral-700 italic text-[11px]">
                              "{rev.adminReply}"
                            </p>
                          </div>
                        )}

                        {/* Helpful Counter */}
                        <div className="pt-2 text-[11px] text-neutral-400">
                          {rev.helpfulCount > 0 ? (
                            <span>{rev.helpfulCount} shoppers found your review helpful</span>
                          ) : (
                            <span>0 helpful votes so far</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex md:flex-col items-center gap-2 self-end md:self-start w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReview(rev);
                          setEditRating(rev.rating);
                          setEditTitle(rev.title || "");
                          setEditComment(rev.comment);
                          setEditFit(rev.fitFeedback || "TRUE_TO_SIZE");
                        }}
                        className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-900 text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingReviewId(rev.id)}
                        className="flex-1 md:flex-initial px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewsPage <= 1 || isLoadingReviews}
                    onClick={() => loadMyReviews(reviewsPage - 1)}
                  >
                    PREVIOUS
                  </Button>
                  <span className="text-xs font-mono text-neutral-500">
                    Page {reviewsPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reviewsPage >= totalPages || isLoadingReviews}
                    onClick={() => loadMyReviews(reviewsPage + 1)}
                  >
                    NEXT
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Delivered Items Awaiting Review */}
      {activeSubTab === "pending" && (
        <div className="space-y-4">
          {/* Post-Delivery Notification Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Earn 50 Atelier Loyalty Points Per Review</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your feedback regarding fit, drape, and sizing helps fellow shoppers choose with confidence.
              </p>
            </div>
          </div>

          {isLoadingPending ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-500">Checking delivered orders...</p>
            </div>
          ) : pendingProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                You're All Caught Up!
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                There are no delivered garments awaiting your review right now.
              </p>
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-amber-600 underline underline-offset-4"
                >
                  <span>Explore New Atelier Arrivals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingProducts.map((prod) => {
                const img =
                  prod.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600";

                return (
                  <div
                    key={prod.id}
                    className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-neutral-900/30 transition-all"
                  >
                    <div className="flex gap-3.5">
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0">
                        <img
                          src={img}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          Delivered • Order #{prod.orderId.slice(0, 8)}
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-900 truncate">
                          {prod.name}
                        </h4>
                        <p className="text-xs font-mono font-medium text-neutral-700">
                          {storeConfig.currency.symbol}
                          {Number(prod.salePrice || prod.regularPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
                      <Link
                        href={`/products/${prod.slug}`}
                        className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                      >
                        <span>View Product</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setReviewingPendingProduct(prod);
                          setNewRating(5);
                          setNewTitle("");
                          setNewComment("");
                          setNewFit("TRUE_TO_SIZE");
                          setSelectedFiles([]);
                          setFilePreviews([]);
                          setSubmitError(null);
                        }}
                        leftIcon={<Star className="w-3.5 h-3.5 fill-current" />}
                      >
                        WRITE REVIEW
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
              <h3 className="text-base font-semibold text-neutral-900">
                Edit Your Review
              </h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Product header */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <img
                  src={
                    editingReview.product?.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600"
                  }
                  alt=""
                  className="w-10 h-12 rounded-lg object-cover"
                />
                <span className="font-semibold text-neutral-900 truncate">
                  {editingReview.product?.name || "Garment"}
                </span>
              </div>

              {/* Star Rating */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEditRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editRating ? "fill-amber-500 text-amber-500" : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizing & Fit */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Sizing & Fit Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "RUNS_SMALL", label: "Runs Small" },
                      { id: "TRUE_TO_SIZE", label: "True to Size" },
                      { id: "RUNS_LARGE", label: "Runs Large" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditFit(opt.id)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        editFit === opt.id
                          ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Review Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={3}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setEditingReview(null)}
                >
                  CANCEL
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                  {isUpdating ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl border border-neutral-200 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-neutral-900">
                Delete Customer Review?
              </h3>
              <p className="text-xs text-neutral-500">
                Are you sure you want to delete this review? Product rating statistics will be automatically recalculated.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDeletingReviewId(null)}
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "DELETING..." : "DELETE"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review for Delivered Item Modal */}
      {reviewingPendingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block">
                  Delivered Order Verified
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-0.5">
                  Write Product Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPendingProduct(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPendingReview} className="space-y-4 text-xs">
              {/* Product Info */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <img
                  src={
                    reviewingPendingProduct.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600"
                  }
                  alt={reviewingPendingProduct.name}
                  className="w-12 h-14 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-neutral-900 truncate">
                    {reviewingPendingProduct.name}
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Order ID: {reviewingPendingProduct.orderId.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
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
                          star <= newRating ? "fill-amber-500 text-amber-500" : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fit Feedback */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1.5">
                  Sizing & Fit Feedback
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "RUNS_SMALL", label: "Runs Small" },
                      { id: "TRUE_TO_SIZE", label: "True to Size" },
                      { id: "RUNS_LARGE", label: "Runs Large" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewFit(opt.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        newFit === opt.id
                          ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flawless silk drape and tailored silhouette"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="font-bold uppercase tracking-wider text-neutral-800 block mb-1">
                  Detailed Experience <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={3}
                  placeholder="Share details regarding fit, garment quality, and styling..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 leading-relaxed"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <label className="font-bold uppercase tracking-wider text-neutral-800 block">
                  Add Photos (Up to 10)
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-200 rounded-xl hover:border-neutral-900 bg-neutral-50 cursor-pointer transition-colors">
                  <UploadCloud className="w-5 h-5 text-neutral-500 mb-1" />
                  <span className="font-semibold text-neutral-800 text-xs">
                    Choose photos from device
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePendingFileSelect}
                    className="hidden"
                  />
                </label>

                {filePreviews.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-2">
                    {filePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-14 h-16 rounded-lg overflow-hidden border border-neutral-200"
                      >
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePendingFile(idx)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isSubmittingNew}
                  onClick={() => setReviewingPendingProduct(null)}
                >
                  CANCEL
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmittingNew}
                >
                  {isSubmittingNew ? "SUBMITTING..." : "SUBMIT REVIEW"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
