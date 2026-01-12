import Sidebar from "./components/sidebar";
import ModelInitializer from "./components/model-initializer";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("ChatLayout");
  return (
    <div className="bg-background flex h-full overflow-hidden">
      <ModelInitializer />
      <Sidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
