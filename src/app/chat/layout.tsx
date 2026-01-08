import { getCurrentUser } from "@/actions/auth";
import Sidebar from "./components/sidebar";
import ModelInitializer from "./components/model-initializer";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <ModelInitializer />
      {user && <Sidebar user={user} />}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
