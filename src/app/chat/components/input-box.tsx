"use client";

import { Button } from "@/components/ui/button";
import { ChatStatus } from "ai";
import { ArrowUp, CircleStop, X } from "lucide-react";
import {
  useRef,
  useState,
  useCallback,
  memo,
  useEffect,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModelStore } from "@/store/chat";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { UserModelConfig } from "@/types/chat";
import InputAttachments, { AttachmentType } from "./input-attachments";

interface InputBoxProps {
  onSubmit: (text: string, attachments: File[]) => void;
  status: ChatStatus;
  stop?: () => void;
  currentChatId?: string | null;
  disabled?: boolean;
}

export default function InputBox({
  onSubmit,
  status,
  stop,
  currentChatId,
  disabled: externalDisabled = false,
}: InputBoxProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use useSyncExternalStore to safely detect client-side mounting (avoids hydration mismatch)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { currentModelId, modelList, setCurrentModelId, isLoading } =
    useModelStore();
  const router = useRouter();
  const currentModel =
    modelList.find((model) => model.id === currentModelId) || modelList[0];

  const disabled = status !== "ready" || externalDisabled;

  // Check if model supports vision for drag/paste
  const supportsVision = currentModel?.supportsVision ?? false;

  useEffect(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [currentChatId]);

  // Handle files selected from InputAttachments component
  const handleFilesSelect = useCallback(
    (selectedFiles: File[], type: AttachmentType) => {
      if (type === "image") {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
      // Future: handle other file types
    },
    [],
  );

  // Handle paste - only allow images if model supports vision
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!supportsVision) return;

      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];

      for (const item of items) {
        if (item.type.indexOf("image") === 0) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
          e.preventDefault();
        }
      }

      if (pastedFiles.length > 0) {
        setFiles((prev) => [...prev, ...pastedFiles]);
      }
    },
    [supportsVision],
  );

  // Handle drag over - only allow if model supports vision
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (supportsVision && e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    },
    [supportsVision],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Handle drop - only allow images if model supports vision
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!supportsVision) {
        toast.warning("当前模型不支持图片上传");
        return;
      }

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (droppedFiles.length < e.dataTransfer.files.length) {
        toast.warning("仅支持接收图片文件");
      }

      if (droppedFiles.length > 0) {
        setFiles((prev) => [...prev, ...droppedFiles]);
      }
    },
    [supportsVision],
  );

  const removeFile = useCallback((indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;

    if (!currentModelId || modelList.length === 0) {
      toast.error("请先配置模型");
      return;
    }

    const message = input.trim();
    onSubmit(message, files);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background py-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-input bg-card focus-within:ring-ring space-y-2 rounded-2xl border p-4 pb-2 text-sm shadow transition-all focus-within:border-transparent focus-within:ring-2 ${
          isDragging ? "border-primary ring-primary ring-2" : ""
        }`}
      >
        <FilesPreview files={files} removeFile={removeFile} />

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={externalDisabled}
          placeholder={
            externalDisabled
              ? "加载中..."
              : files.length > 0
                ? "添加描述..."
                : "请输入内容，按 Enter 发送..."
          }
          rows={files.length > 0 ? 1 : 2}
          className={cn(
            "text-foreground placeholder:text-muted-foreground max-h-32 w-full resize-none bg-transparent font-sans focus:outline-none",
            externalDisabled && "cursor-not-allowed opacity-50",
          )}
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  title="选择模型"
                  size="sm"
                  variant="ghost"
                  className="max-w-30 gap-1.5 outline-none"
                >
                  {mounted &&
                    !isLoading &&
                    modelList.length > 0 &&
                    currentModel && (
                      <ModelLogo model={currentModel} size="sm" />
                    )}
                  <span className="truncate text-xs">
                    {!mounted || isLoading
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
                        <span className="text-sm">{model.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <InputAttachments
              currentModel={currentModel}
              onFilesSelect={handleFilesSelect}
              disabled={externalDisabled}
            />
          </div>

          {status === "streaming" ? (
            <Button size="sm" onClick={() => stop && stop()}>
              <CircleStop size={20} />
              stop
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={disabled || (!input.trim() && files.length === 0)}
              size="sm"
              className="disabled:bg-white-400 dark:bg-black-400 rounded-lg px-3 py-2 disabled:text-white"
            >
              <ArrowUp size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const FilesPreview = memo(function ({
  files,
  removeFile,
}: {
  files: File[];
  removeFile: (indexToRemove: number) => void;
}) {
  return (
    files.length > 0 && (
      <div className="flex flex-wrap gap-2 pb-2">
        {files.map((file, index) => (
          <div
            key={index}
            className="group bg-muted relative size-16 overflow-hidden rounded-md border"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  fill
                  className="size-full object-cover"
                />
              </TooltipTrigger>
              <TooltipContent side="top">{file.name}</TooltipContent>
            </Tooltip>
            <button
              onClick={() => removeFile(index)}
              className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    )
  );
});
FilesPreview.displayName = "FilesPreview";

const ModelLogo = memo(function ({
  model,
  size = "sm",
}: {
  model: UserModelConfig | undefined;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-4" : "size-5";

  if (!model?.logoUrl) {
    return null;
  }

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded", sizeClass)}>
      <Image
        src={model.logoUrl}
        alt={model.name}
        width={size === "sm" ? 16 : 20}
        height={size === "sm" ? 16 : 20}
        className="size-full object-cover"
      />
    </div>
  );
});
ModelLogo.displayName = "ModelLogo";
