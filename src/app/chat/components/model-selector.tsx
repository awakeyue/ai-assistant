"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModelStore } from "@/store/chat";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ModelLogo } from "./model-logo";

export default function ModelSelector() {
  const { currentModelId, modelList, setCurrentModelId, isLoading } =
    useModelStore();
  const router = useRouter();
  const currentModel =
    modelList.find((model) => model.id === currentModelId) || modelList[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          title="选择模型"
          size="sm"
          variant="ghost"
          className="max-w-40 gap-1.5 outline-none"
        >
          <ModelLogo
            model={
              !isLoading && modelList.length > 0 ? currentModel : undefined
            }
            size="sm"
          />
          <span className="truncate text-xs">
            {isLoading
              ? "加载中..."
              : modelList.length === 0
                ? "请配置模型"
                : currentModel?.name || "选择模型"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {modelList.length === 0 ? (
          <DropdownMenuItem
            onSelect={() => router.push("/settings/models")}
            className="text-muted-foreground"
          >
            暂无模型，点击配置
          </DropdownMenuItem>
        ) : (
          <>
            {modelList.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => setCurrentModelId(model.id)}
                className={cn(
                  "hover:bg-accent/20 flex cursor-pointer items-center gap-2 p-2",
                  model.id === currentModelId
                    ? "bg-accent text-accent-foreground"
                    : "",
                )}
              >
                <ModelLogo model={model} size="md" />
                <span className="text-xs">{model.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
