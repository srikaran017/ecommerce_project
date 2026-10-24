"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  BadgeCheck,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Camera,
  ExternalLink,
  Loader2,
  Sparkles,
  Flag,
  Check,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { storeConfig } from "@/config/store.config";
import {
  ReviewService,
  ReviewItem,
  ReviewAnalytics,
  ReviewStatus,
} from "@/services/review.service";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyReview, setReplyReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Load reviews list
  const loadReviews = async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const res = await ReviewService.getAdminReviews({
        page: targetPage,
        limit: 20,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        rating: ratingFilter || undefined,
        search: searchQuery.trim() || undefined,
        isVerifiedPurchase: isVerifiedOnly ? true : undefined,
      });

      if (res && res.reviews) {
        setReviews(res.reviews);
        if (res.pagination) {
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.totalCount);
        }
      }
    } catch (err) {
      console.warn("Could not load admin reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load analytics telemetry
  const loadAnalytics = async () => {
    try {
      const res = await ReviewService.getReviewAnalytics();
      if (res) {
        setAnalytics(res);
      }
    } catch (err) {
      console.warn("Could not load review analytics:", err);
    }
  };

  useEffect(() => {
    loadReviews(1);
    loadAnalytics();
  }, [statusFilter, ratingFilter, isVerifiedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviews(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadReviews(page), loadAnalytics()]);
    setIsRefreshing(false);
    showToast("Review data refreshed.");
  };

  // Quick 1-click status change
  const handleStatusChange = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      await ReviewService.moderateReviewStatus(reviewId, newStatus);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
        )
      );
      showToast(`Review status updated to ${newStatus}.`);
      loadAnalytics();
    } catch (err: any) {
      showToast(err.message || "Failed to update review status.");
    }
  };

  // Reply to review
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyReview) return;
    if (!replyText.trim()) {
      showToast("Please enter a reply message.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      await ReviewService.replyToReview(replyReview.id, replyText.trim());
      setReviews((prev) =>
        prev.map((r) =>
          r.id === replyReview.id
            ? {
                ...r,
                adminReply: replyText.trim(),
                adminReplyAt: new Date().toISOString(),
              }
            : r
        )
      );
      setReplyReview(null);
      setReplyText("");
      showToast("Merchant reply published successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to publish reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Remove reply
  const handleRemoveReply = async (reviewId: string) => {
    try {
      await ReviewService.removeReviewReply(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, adminReply: null, adminReplyAt: null, repliedById: null }
            : r
        )
      );
      setReplyReview(null);
      showToast("Merchant reply removed.");
    } catch (err: any) {
      showToast(err.message || "Failed to remove reply.");
    }
  };

  // Delete review
  const handleConfirmDelete = async () => {
    if (!deletingReviewId) return;
    setIsDeleting(true);
    try {
      await ReviewService.deleteAdminReview(deletingReviewId);
      setReviews((prev) => prev.filter((r) => r.id !== deletingReviewId));
      setDeletingReviewId(null);
      showToast("Review permanently deleted.");
      loadAnalytics();
    } catch (err: any) {
      showToast(err.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const overview = analytics?.overview || {
    totalReviews: totalCount,
    approvedReviews: reviews.filter((r) => r.status === "APPROVED").length,
    pendingReviews: reviews.filter((r) => r.status === "PENDING").length,
    rejectedReviews: reviews.filter((r) => r.status === "REJECTED").length,
    flaggedReviews: reviews.filter((r) => r.status === "FLAGGED").length,
    verifiedPurchases: reviews.filter((r) => r.isVerifiedPurchase).length,
    verifiedPurchasePercentage: 90,
    averageStoreRating: 4.8,
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>Customer Trust & Moderation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-heading">
            Reviews & Ratings Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Moderate client feedback, manage fit telemetries, and publish official store replies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />}
            className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            REFRESH
          </Button>
        </div>
      </div>

      {/* Analytics KPI Telemetry Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {overview.totalReviews}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {overview.approvedReviews} published
            </span>
          </div>
        </div>

        {/* Average Store Rating */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Avg Store Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {overview.averageStoreRating.toFixed(1)}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">/ 5.0 Stars</span>
          </div>
        </div>

        {/* Verified Purchase % */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Verified Buyers</span>
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {overview.verifiedPurchasePercentage}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({overview.verifiedPurchases})
            </span>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Moderation Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {overview.pendingReviews}
            </span>
            <span className="text-[11px] text-slate-400">awaiting check</span>
          </div>
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {(
            [
              { id: "ALL", label: "All Reviews", count: overview.totalReviews },
              { id: "PENDING", label: "Pending", count: overview.pendingReviews, color: "text-amber-400" },
              { id: "APPROVED", label: "Approved", count: overview.approvedReviews, color: "text-emerald-400" },
              { id: "FLAGGED", label: "Flagged", count: overview.flaggedReviews, color: "text-purple-400" },
              { id: "REJECTED", label: "Rejected", count: overview.rejectedReviews, color: "text-rose-400" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Rating Filter & Verified Checkbox */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by customer, email, product, or review text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs placeholder:text-slate-500"
            />
          </form>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Rating Filter */}
            <select
              value={ratingFilter ?? ""}
              onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Verified toggle */}
            <button
              type="button"
              onClick={() => setIsVerifiedOnly(!isVerifiedOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isVerifiedOnly
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Verified Buyers Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating & Fit</th>
                <th className="py-3 px-4">Feedback & Photos</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading reviews moderation queue...</span>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 space-y-2">
                    <Star className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-white">No reviews found</p>
                    <p className="text-xs text-slate-500">
                      No review matches the selected status or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const prodImg =
                    rev.product?.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400";
                  const prodName = rev.product?.name || "Garment";

                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-slate-900/40 transition-colors group align-top"
                    >
                      {/* Product */}
                      <td className="py-4 px-4 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={prodImg}
                            alt=""
                            className="w-10 h-12 rounded-lg object-cover border border-slate-800 bg-slate-900 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block max-w-[160px]">
                              {prodName}
                            </span>
                            {rev.product?.sku && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {rev.product.sku}
                              </span>
                            )}
                            {rev.product?.slug && (
                              <Link
                                href={`/products/${rev.product.slug}`}
                                target="_blank"
                                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                <span>View PDP</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">
                              {rev.user?.name || "Guest Customer"}
                            </span>
                            {rev.isVerifiedPurchase && (
                              <span
                                title="Verified Purchase"
                                className="inline-flex text-emerald-400"
                              >
                                <BadgeCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          {rev.user?.email && (
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {rev.user.email}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Rating & Fit */}
                      <td className="py-4 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= rev.rating ? "fill-current" : "text-slate-700"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-white ml-1">
                              {rev.rating}.0
                            </span>
                          </div>

                          {rev.fitFeedback && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 inline-block">
                              Fit:{" "}
                              {rev.fitFeedback === "RUNS_SMALL"
                                ? "Runs Small"
                                : rev.fitFeedback === "RUNS_LARGE"
                                ? "Runs Large"
                                : "True to Size"}
                            </span>
                          )}

                          <div className="text-[10px] text-slate-500">
                            {rev.helpfulCount || 0} helpful upvotes
                          </div>
                        </div>
                      </td>

                      {/* Feedback & Photos */}
                      <td className="py-4 px-4 min-w-[260px] max-w-[360px]">
                        <div className="space-y-1.5">
                          {rev.title && (
                            <h4 className="font-bold text-white text-xs">
                              {rev.title}
                            </h4>
                          )}
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                            {rev.comment}
                          </p>

                          {/* Photos */}
                          {rev.images && rev.images.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              {rev.images.map((imgUrl, iIdx) => (
                                <button
                                  key={iIdx}
                                  type="button"
                                  onClick={() => setLightboxImage(imgUrl)}
                                  className="w-10 h-12 rounded border border-slate-800 overflow-hidden shrink-0 hover:ring-2 hover:ring-amber-500 cursor-pointer"
                                >
                                  <img
                                    src={imgUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Store Reply indicator */}
                          {rev.adminReply && (
                            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 mt-1">
                              <span className="font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                Official Store Reply:
                              </span>
                              <p className="italic text-slate-300 mt-0.5 line-clamp-2">
                                "{rev.adminReply}"
                              </p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            rev.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : rev.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : rev.status === "FLAGGED"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {rev.status}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Approve */}
                          {rev.status !== "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Approve Review"
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject */}
                          {rev.status !== "REJECTED" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, "REJECTED")}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Reject Review"
                            >
                              Reject
                            </button>
                          )}

                          {/* Flag */}
                          {rev.status !== "FLAGGED" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(rev.id, "FLAGGED")}
                              className="p-1 rounded-lg bg-slate-900 hover:bg-purple-950 text-slate-400 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer"
                              title="Flag for review"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Official Reply */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyReview(rev);
                              setReplyText(rev.adminReply || "");
                            }}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors cursor-pointer"
                            title="Publish / Edit Merchant Reply"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={() => setSelectedReview(rev)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingReviewId(rev.id)}
                            className="p-1 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                            title="Permanently Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {reviews.length} of {totalCount} reviews
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => loadReviews(page - 1)}
                className="border-slate-800 bg-slate-900 text-slate-200"
              >
                PREVIOUS
              </Button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => loadReviews(page + 1)}
                className="border-slate-800 bg-slate-900 text-slate-200"
              >
                NEXT
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Official Merchant Reply Modal */}
      {replyReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 max-w-lg w-full p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Publish Official Merchant Reply</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyReview(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer review summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-white block">
                {replyReview.user?.name || "Client"} • {replyReview.rating} Stars
              </span>
              <p className="text-slate-300 italic">"{replyReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Atelier Response (Visible to all storefront shoppers)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Thank you so much! We are delighted that our handcrafted gown made your gala memorable..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {replyReview.adminReply ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveReply(replyReview.id)}
                    className="text-xs text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Remove Current Reply
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setReplyReview(null)}
                    className="border-slate-800 text-slate-300"
                  >
                    CANCEL
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmittingReply}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    {isSubmittingReply ? "PUBLISHING..." : "PUBLISH REPLY"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Details Drawer / Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                Review Details & Verification
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Product Info */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <img
                  src={
                    selectedReview.product?.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"
                  }
                  alt=""
                  className="w-12 h-14 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-semibold text-white">
                    {selectedReview.product?.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedReview.productId}
                  </p>
                </div>
              </div>

              {/* Customer and Verification */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Customer Name
                  </span>
                  <span className="font-semibold text-white">
                    {selectedReview.user?.name || "Anonymous Client"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    Verified Purchase
                  </span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>
                      {selectedReview.isVerifiedPurchase ? "Verified Order" : "Unverified"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Review Headline & Body */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: selectedReview.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Status: {selectedReview.status}
                  </span>
                </div>
                {selectedReview.title && (
                  <h5 className="font-bold text-white text-xs">{selectedReview.title}</h5>
                )}
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedReview.comment}
                </p>
              </div>

              {/* Attached Photos */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">
                    Uploaded Client Photographs ({selectedReview.images.length})
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedReview.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxImage(img)}
                        className="w-16 h-20 rounded-lg overflow-hidden border border-slate-800 hover:ring-2 hover:ring-amber-500 cursor-pointer"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReview(null)}
                className="border-slate-800 text-slate-300"
              >
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 max-w-sm w-full p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Permanently Delete Review?
              </h3>
              <p className="text-xs text-slate-400">
                This action is irreversible. The review will be permanently purged and product rating metrics automatically recalculated.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-800 text-slate-300"
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

      {/* Lightbox Image Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] p-2">
            <img
              src={lightboxImage}
              alt="Enlarged"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
