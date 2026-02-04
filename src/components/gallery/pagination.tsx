"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const pathname = usePathname();

  // Build URL with pagination and filters
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (template && template !== "all") {
      params.set("template", template);
    }
    return `${pathname}?${params.toString()}`;
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
      className="flex items-center gap-1"
      role="navigation"
      aria-label="Pagination"
    >
      {/* First Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1}
        asChild={currentPage !== 1}
      >
        {currentPage === 1 ? (
          <span>
            <ChevronsLeft size={16} />
          </span>
        ) : (
          <Link href={buildUrl(1)}>
            <ChevronsLeft size={16} />
          </Link>
        )}
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === 1}
        asChild={currentPage !== 1}
      >
        {currentPage === 1 ? (
          <span>
            <ChevronLeft size={16} />
          </span>
        ) : (
          <Link href={buildUrl(currentPage - 1)}>
            <ChevronLeft size={16} />
          </Link>
        )}
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
              asChild={currentPage !== page}
            >
              {currentPage === page ? (
                <span>{page}</span>
              ) : (
                <Link href={buildUrl(page)}>{page}</Link>
              )}
            </Button>
          ),
        )}
      </div>

      {/* Next Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages}
        asChild={currentPage !== totalPages}
      >
        {currentPage === totalPages ? (
          <span>
            <ChevronRight size={16} />
          </span>
        ) : (
          <Link href={buildUrl(currentPage + 1)}>
            <ChevronRight size={16} />
          </Link>
        )}
      </Button>

      {/* Last Page */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        disabled={currentPage === totalPages}
        asChild={currentPage !== totalPages}
      >
        {currentPage === totalPages ? (
          <span>
            <ChevronsRight size={16} />
          </span>
        ) : (
          <Link href={buildUrl(totalPages)}>
            <ChevronsRight size={16} />
          </Link>
        )}
      </Button>
    </nav>
  );
}
