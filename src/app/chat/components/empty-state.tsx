export default function EmptyState() {
  return (
    <div className="flex w-full flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <span className="text-3xl">✨</span>
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">
        开始新的对话
      </h2>
      <p className="text-gray-600">有什么问题尽管问，我会尽力帮助你。</p>
    </div>
  );
}
