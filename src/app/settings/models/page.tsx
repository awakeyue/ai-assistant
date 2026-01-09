"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Settings2, Sparkles } from "lucide-react";
import { useModelStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { UserModelConfig } from "@/types/chat";
import ModelList from "./components/model-list";
import ModelForm from "./components/model-form";

type ViewMode = "list" | "add" | "edit";

export default function ModelsSettingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingModel, setEditingModel] = useState<UserModelConfig | null>(
    null,
  );

  const {
    modelList,
    isLoading,
    fetchModels,
    addModel,
    updateModel,
    removeModel,
    setDefaultModel,
  } = useModelStore();

  const user = useUserStore((state) => state.user);

  // Fetch models on page load
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleAdd = () => {
    setEditingModel(null);
    setViewMode("add");
  };

  const handleEdit = (model: UserModelConfig) => {
    // Only allow editing if user owns the model
    if (user && model.userId === user.id) {
      setEditingModel(model);
      setViewMode("edit");
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setEditingModel(null);
  };

  const handleFormSuccess = (model: UserModelConfig) => {
    if (viewMode === "add") {
      addModel(model);
    } else {
      updateModel(model.id, model);
    }
    setViewMode("list");
    setEditingModel(null);
  };

  const handleDelete = (id: string) => {
    removeModel(id);
    // If we were editing this model, go back to list
    if (editingModel?.id === id) {
      setViewMode("list");
      setEditingModel(null);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultModel(id);
  };

  const getFormTitle = () => {
    switch (viewMode) {
      case "add":
        return "添加新模型";
      case "edit":
        return `编辑模型`;
      default:
        return "模型详情";
    }
  };

  const getFormSubtitle = () => {
    switch (viewMode) {
      case "add":
        return "配置您的 AI 模型连接信息";
      case "edit":
        return editingModel?.name || "";
      default:
        return "";
    }
  };

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <header className="bg-background/95 supports-backdrop-filter:bg-background/60 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
            title="返回聊天"
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="from-primary/20 to-primary/5 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br">
              <Sparkles className="text-primary h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base leading-none font-semibold">模型管理</h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                配置和管理您的 AI 模型
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex min-h-0 flex-1">
        {/* Left Panel - Model List */}
        <div className="bg-muted/20 flex w-80 flex-col border-r lg:w-96">
          <div className="bg-background/50 flex h-14 items-center justify-between border-b px-4">
            <div>
              <h2 className="text-sm font-medium">模型列表</h2>
              <p className="text-muted-foreground text-xs">
                {isLoading ? "加载中..." : `共 ${modelList.length} 个模型`}
              </p>
            </div>
            <Button
              onClick={handleAdd}
              size="sm"
              className="h-8 gap-1 text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              添加
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ModelList
              models={modelList}
              currentUserId={user?.id ?? null}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              onAdd={handleAdd}
              isLoading={isLoading}
              selectedId={editingModel?.id}
            />
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-background flex flex-1 flex-col">
          <div className="bg-background/50 flex h-14 items-center border-b px-6">
            <div>
              <h2 className="text-sm font-medium">{getFormTitle()}</h2>
              {getFormSubtitle() && (
                <p className="text-muted-foreground text-xs">
                  {getFormSubtitle()}
                </p>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === "list" ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="from-primary/20 absolute inset-0 rounded-full bg-linear-to-br to-transparent blur-2xl" />
                  <div className="from-muted to-muted/50 relative flex h-20 w-20 items-center justify-center rounded-full border bg-linear-to-br">
                    <Settings2 className="text-muted-foreground/50 h-10 w-10" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium">选择一个模型</h3>
                <p className="text-muted-foreground mb-1 max-w-xs text-sm">
                  从左侧列表选择一个模型进行查看或编辑
                </p>
                <p className="text-muted-foreground/70 text-xs">
                  或点击&ldquo;添加&rdquo;按钮创建新的模型配置
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-xl">
                <ModelForm
                  model={editingModel || undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleBack}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
