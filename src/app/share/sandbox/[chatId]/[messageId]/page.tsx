import { getSharedSandboxOutput } from "@/actions/share";
import { SandboxPreview } from "@/components/tools/sandbox-preview";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";
import type { Metadata } from "next";

interface ShareSandboxPageProps {
  params: Promise<{
    chatId: string;
    messageId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ShareSandboxPageProps): Promise<Metadata> {
  const { chatId, messageId } = await params;
  const output = await getSharedSandboxOutput(chatId, messageId);

  return {
    title: output?.title || "代码沙盒分享",
  };
}

export default async function ShareSandboxPage({
  params,
}: ShareSandboxPageProps) {
  const { chatId, messageId } = await params;

  // Fetch sandbox output
  const output = await getSharedSandboxOutput(chatId, messageId);

  if (!output) {
    notFound();
  }

  return (
    <div className="flex h-lvh flex-col bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Play size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold text-gray-900 dark:text-gray-100">
                {output.title}
              </h1>
              <p className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                代码沙盒分享
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium whitespace-nowrap text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              {output.template}
            </span>
            {Object.keys(output.files).filter(
              (path) => !output.files[path].hidden,
            ).length > 1 && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                {
                  Object.keys(output.files).filter(
                    (path) => !output.files[path].hidden,
                  ).length
                }{" "}
                files
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="mx-auto h-full max-w-7xl">
          <SandboxPreview
            output={output}
            showHeader={false}
            height="calc(100vh - 160px)"
          />
        </div>
      </main>
    </div>
  );
}
