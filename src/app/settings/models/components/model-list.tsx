"use client";

import { UserModelConfig } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Star, Plus, Bot, Lock } from "lucide-react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelListProps {
  models: UserModelConfig[];
  currentUserId: number | null;
  onEdit: (model: UserModelConfig) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
  selectedId?: string;
}

// Skeleton loading component for model cards
function ModelCardSkeleton() {
  return (
    <div className="bg-card flex items-center justify-between rounded-xl border p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="ml-2 flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

function ModelListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <ModelCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function ModelList({
  models,
  currentUserId,
  onEdit,
  onDelete,
  onSetDefault,
  onAdd,
  isLoading,
  selectedId,
}: ModelListProps) {
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/models/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete model");
      }

      onDelete(id);
      toast.success("模型已删除");
    } catch (error) {
      toast.error("删除模型失败");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/models/${id}/default`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to set default model");
      }

      onSetDefault(id);
      toast.success("默认模型已设置");
    } catch (error) {
      toast.error("设置默认模型失败");
    }
  };

  // Check if user can edit/delete the model
  const canModifyModel = (model: UserModelConfig) => {
    return currentUserId !== null && model.userId === currentUserId;
  };

  if (isLoading) {
    return <ModelListSkeleton />;
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <Bot className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-1 font-medium">暂无模型</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          您还没有配置任何模型，开始添加第一个吧
        </p>
        <Button onClick={onAdd} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          添加模型
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {models.map((model) => {
          const canModify = canModifyModel(model);
          return (
            <div
              key={model.id}
              className={`group bg-card flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-200 hover:shadow-sm ${
                selectedId === model.id
                  ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                  : "hover:border-muted-foreground/20 hover:bg-accent/30"
              } ${!canModify ? "cursor-default" : ""}`}
              onClick={() => canModify && onEdit(model)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Model icon */}
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors ${
                    selectedId === model.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }`}
                >
                  {model.logoUrl ? (
                    <Image
                      src={model.logoUrl}
                      alt={model.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>

                {/* Model info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate font-medium">{model.name}</span>
                    {model.isDefault && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        默认
                      </Badge>
                    )}
                    {model.isPublic && !canModify && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="text-muted-foreground gap-1 px-1.5 text-xs"
                          >
                            <Lock className="h-3 w-3" />
                            公共
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>此模型由其他用户共享，无法编辑或删除</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate font-mono text-sm">
                    {model.modelId}
                  </div>
                  {model.description && (
                    <div className="text-muted-foreground/80 mt-1 truncate text-xs">
                      {model.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Only show for owner */}
              {canModify && (
                <div
                  className="ml-3 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSetDefault(model.id)}
                    disabled={model.isDefault}
                    title={model.isDefault ? "当前为默认模型" : "设为默认"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        model.isDefault
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          {`确定要删除模型 "${model.name}" 吗？此操作无法撤销。`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(model.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Lock icon for non-owner public models */}
              {!canModify && (
                <div className="text-muted-foreground/50 ml-3">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
