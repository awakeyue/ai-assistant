import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getGallerySandboxes } from "@/actions/gallery";
import { SandboxCard } from "@/components/gallery/sandbox-card";
import { GalleryPagination } from "@/components/gallery/pagination";
import { GalleryEmptyState } from "@/components/gallery/empty-state";
import { TemplateFilter } from "@/components/gallery/template-filter";
import { ChevronRight } from "lucide-react";
import type { SupportedTemplate } from "@/components/tools/sandbox-preview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "沙盒广场 - AI Assistant",
  description: "浏览和分享代码沙盒作品",
};

interface GalleryPageProps {
  searchParams: Promise<{
    page?: string;
    template?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/gallery");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const template = (params.template as SupportedTemplate | "all") || "all";

  const result = await getGallerySandboxes(page, 6, template);

  if ("error" in result) {
    return (
      <div className="flex h-lvh items-center justify-center">
        <p className="text-red-500">{result.error}</p>
      </div>
    );
  }

  const { items, pagination, isAdmin } = result;

  return (
    <div className="bg-background flex h-lvh flex-col">
      {/* Header */}
      <header className="bg-background/80 shrink-0 border-b backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-1.5 text-sm">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  首页
                </Link>
                <ChevronRight className="text-muted-foreground/50 h-4 w-4" />
                <span className="text-foreground font-medium">沙盒广场</span>
              </nav>
              <p className="text-muted-foreground text-sm">
                {isAdmin ? "管理所有用户的代码沙盒" : "浏览我的代码沙盒作品"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TemplateFilter currentTemplate={template} />
              {isAdmin && (
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                  管理员
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full flex-1 overflow-y-auto px-4 py-6">
        {items.length === 0 ? (
          <GalleryEmptyState isAdmin={isAdmin} />
        ) : (
          <div className="mx-auto max-w-7xl">
            {/* Grid Layout */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <SandboxCard key={item.id} item={item} showCreator={isAdmin} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <GalleryPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  template={template}
                />
              </div>
            )}

            {/* Stats */}
            <div className="text-muted-foreground mt-6 text-center text-sm">
              共 {pagination.total} 个沙盒 · 第 {pagination.page} /{" "}
              {pagination.totalPages} 页
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
