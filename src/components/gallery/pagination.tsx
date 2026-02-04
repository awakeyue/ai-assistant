"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryPaginationProps {
  currentPage: number;
  totalPages: number;
  template?: string;
}

export function GalleryPagination({
  currentPage,
  totalPages,
  template,
}: GalleryPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Build URL with pagination and filters
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (template && template !== "all") {
      params.set("template", template);
    }
    return `${pathname}?${params.toString()}`;
  };

  // Navigate to page with transition
  const navigateToPage = (page: number) => {
    startTransition(() => {
      router.push(buildUrl(page));
    });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn(
        "flex items-center gap-1 transition-opacity",
        isPending && "pointer-events-none opacity-60",
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Loading indicator */}
      {isPending && (
        <div className="mr-2 flex items-center gap-1 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">加载中</span>
        </div>
      )}

      {/* First Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1 || isPending}
        onClick={() => navigateToPage(1)}
      >
        <ChevronsLeft size={16} />
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1 || isPending}
        onClick={() => navigateToPage(currentPage - 1)}
      >
        <ChevronLeft size={16} />
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-9 items-center justify-center text-gray-400"
            >
              ···
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-9 w-9"
              disabled={currentPage === page || isPending}
              onClick={() => navigateToPage(page)}
            >
              {page}
            </Button>
          ),
        )}
      </div>

      {/* Next Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages || isPending}
        onClick={() => navigateToPage(currentPage + 1)}
      >
        <ChevronRight size={16} />
      </Button>

      {/* Last Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages || isPending}
        onClick={() => navigateToPage(totalPages)}
      >
        <ChevronsRight size={16} />
      </Button>
    </nav>
  );
}
