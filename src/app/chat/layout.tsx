import Sidebar from "./components/sidebar";
import ModelInitializer from "./components/model-initializer";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("ChatLayout");
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <ModelInitializer />
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
