"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Function to build link href (only usable when Pagination is rendered from a Client Component) */
  hrefBuilder?: (page: number) => string;
  /** Base path for links when rendered from a Server Component (e.g. /categories/chiffon-satin-kaftans) */
  basePath?: string;
  /** Plain query params object passed from Server Component searchParams */
  queryParams?: Record<string, string | number | boolean | undefined | null>;
  /** Name of the query parameter for the page number, defaults to "page" */
  pageParamName?: string;
  className?: string;
  showItemCount?: boolean;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 12,
  onPageChange,
  hrefBuilder,
  basePath,
  queryParams,
  pageParamName = "page",
  className = "",
  showItemCount = true,
  itemLabel = "silhouettes",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  // Resolve link href either via custom builder or serializable basePath + queryParams
  const resolveHref = (p: number): string | undefined => {
    if (hrefBuilder) {
      return hrefBuilder(p);
    }
    if (basePath) {
      const q = new URLSearchParams();
      if (queryParams) {
        Object.entries(queryParams).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== "" && k !== pageParamName) {
            q.set(k, String(v));
          }
        });
      }
      if (p > 1) {
        q.set(pageParamName, String(p));
      }
      const qs = q.toString();
      return `${basePath}${qs ? `?${qs}` : ""}`;
    }
    return undefined;
  };

  // Generate page numbers with ellipses
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];

    // Always include page 1
    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    // Window around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const pages = getPageNumbers();

  // Item count range calculation
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  const renderPageItem = (p: number | "ellipsis", index: number) => {
    if (p === "ellipsis") {
      return (
        <span
          key={`ellipsis-${index}`}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-mono text-neutral-400 select-none"
        >
          •••
        </span>
      );
    }

    const isActive = p === currentPage;

    const baseClasses = `w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center select-none cursor-pointer ${
      isActive
        ? "bg-neutral-900 text-white shadow-xs scale-105 ring-2 ring-neutral-900/10"
        : "bg-white text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200/90 shadow-2xs"
    }`;

    const itemHref = resolveHref(p);

    if (itemHref) {
      return (
        <Link
          key={`page-${p}`}
          href={itemHref}
          onClick={(e) => {
            if (isActive) {
              e.preventDefault();
              return;
            }
            if (onPageChange) {
              onPageChange(p);
            }
          }}
          aria-current={isActive ? "page" : undefined}
          aria-label={`Go to page ${p}`}
          className={baseClasses}
        >
          {p}
        </Link>
      );
    }

    return (
      <button
        key={`page-${p}`}
        type="button"
        onClick={() => onPageChange && onPageChange(p)}
        disabled={isActive}
        aria-current={isActive ? "page" : undefined}
        aria-label={`Go to page ${p}`}
        className={baseClasses}
      >
        {p}
      </button>
    );
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const prevHref = !prevDisabled ? resolveHref(currentPage - 1) : undefined;
  const nextHref = !nextDisabled ? resolveHref(currentPage + 1) : undefined;

  const navButtonClasses = (disabled: boolean) =>
    `h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border select-none ${
      disabled
        ? "opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400 border-neutral-200"
        : "bg-white text-neutral-800 hover:text-neutral-900 hover:bg-neutral-50 hover:border-neutral-900 border-neutral-200/90 shadow-2xs cursor-pointer"
    }`;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-neutral-200/80 mt-12 ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Informative Counter */}
      {showItemCount && totalItems !== undefined && totalItems > 0 ? (
        <div className="text-xs text-neutral-500 font-medium order-2 sm:order-1 text-center sm:text-left">
          <span>Showing </span>
          <strong className="text-neutral-900 font-mono font-semibold">
            {startItem}–{endItem}
          </strong>
          <span> of </span>
          <strong className="text-neutral-900 font-mono font-semibold">
            {totalItems}
          </strong>
          <span> {itemLabel}</span>
          <span className="text-neutral-400 ml-1.5 font-mono text-[11px]">
            (Page {currentPage} of {totalPages})
          </span>
        </div>
      ) : (
        <div className="order-2 sm:order-1 text-xs text-neutral-500 font-mono">
          Page {currentPage} of {totalPages}
        </div>
      )}

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* Previous Button */}
        {prevHref ? (
          <Link
            href={prevHref}
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            className={navButtonClasses(false)}
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled={prevDisabled}
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            className={navButtonClasses(prevDisabled)}
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
        )}

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => renderPageItem(p, idx))}
        </div>

        {/* Next Button */}
        {nextHref ? (
          <Link
            href={nextHref}
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            className={navButtonClasses(false)}
            aria-label="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={nextDisabled}
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            className={navButtonClasses(nextDisabled)}
            aria-label="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
