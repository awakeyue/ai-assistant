import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getGallerySandboxes } from "@/actions/gallery";
import { SandboxCard } from "@/components/gallery/sandbox-card";
import { GalleryPagination } from "@/components/gallery/pagination";
import { GalleryEmptyState } from "@/components/gallery/empty-state";
import { TemplateFilter } from "@/components/gallery/template-filter";
import { LayoutGrid } from "lucide-react";
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
    <div className="flex h-lvh flex-col bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  沙盒广场
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isAdmin ? "管理所有用户的代码沙盒" : "浏览我的代码沙盒作品"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TemplateFilter currentTemplate={template} />
              {isAdmin && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
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
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              共 {pagination.total} 个沙盒 · 第 {pagination.page} /{" "}
              {pagination.totalPages} 页
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
