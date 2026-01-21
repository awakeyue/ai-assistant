"use client";

import { Button } from "@/components/ui/button";
import { ChatStatus, FileUIPart } from "ai";
import { ArrowUp, X, Loader2 } from "lucide-react";
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
import { cn, uploadFiles } from "@/lib/utils";
import { toast } from "sonner";
import { UserModelConfig } from "@/types/chat";
import InputAttachments, { AttachmentType } from "./input-attachments";

// Represents a file being uploaded or already uploaded
interface UploadingFile {
  id: string; // Unique identifier for React key and tracking
  file: File; // Original file for preview
  status: "uploading" | "success" | "error";
  // After successful upload
  url?: string;
  mediaType?: string;
  filename?: string;
  // Error message if failed
  error?: string;
}

interface InputBoxProps {
  onSubmit: (text: string, attachments: FileUIPart[]) => void;
  status: ChatStatus;
  stop?: () => void;
  currentChatId?: string | null;
  disabled?: boolean;
}

// Generate unique ID for each file upload
let fileIdCounter = 0;
const generateFileId = () => `file-${Date.now()}-${++fileIdCounter}`;

export default function InputBox({
  onSubmit,
  status,
  stop,
  currentChatId,
  disabled: externalDisabled = false,
}: InputBoxProps) {
  const [input, setInput] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
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

  // Check if any files are still uploading
  const isUploading = uploadingFiles.some((f) => f.status === "uploading");
  const disabled = status !== "ready" || externalDisabled || isUploading;

  // Check if model supports vision for drag/paste
  const supportsVision = currentModel?.supportsVision ?? false;

  useEffect(() => {
    if (location.pathname === "/chat") {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [currentChatId]);

  // Upload files immediately when selected/pasted/dropped
  const handleUploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Create uploading file entries with unique IDs
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: generateFileId(),
      file,
      status: "uploading" as const,
    }));

    // Add to state immediately to show preview with loading
    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload files in parallel
    const uploadPromises = newUploadingFiles.map(async (uploadingFile) => {
      try {
        const [uploaded] = await uploadFiles([uploadingFile.file]);
        // Update state with success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "success" as const,
                  url: uploaded.url,
                  mediaType: uploaded.mediaType,
                  filename: uploaded.filename,
                }
              : f,
          ),
        );
      } catch (error) {
        // Update state with error
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "上传失败",
                }
              : f,
          ),
        );
        toast.error(`图片 ${uploadingFile.file.name} 上传失败`);
      }
    });

    await Promise.all(uploadPromises);
  }, []);

  // Handle files selected from InputAttachments component
  const handleFilesSelect = useCallback(
    (selectedFiles: File[], type: AttachmentType) => {
      if (type === "image") {
        handleUploadFiles(selectedFiles);
      }
      // Future: handle other file types
    },
    [handleUploadFiles],
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
        handleUploadFiles(pastedFiles);
      }
    },
    [supportsVision, handleUploadFiles],
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
        handleUploadFiles(droppedFiles);
      }
    },
    [supportsVision, handleUploadFiles],
  );

  const removeFile = useCallback((idToRemove: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== idToRemove));
  }, []);

  const handleSend = () => {
    // Get successfully uploaded files
    const successfulFiles = uploadingFiles.filter(
      (f) => f.status === "success",
    );

    if (!input.trim() && successfulFiles.length === 0) return;

    if (!currentModelId || modelList.length === 0) {
      toast.error("请先配置模型");
      return;
    }

    // Convert to FileUIPart format
    const fileUIParts: FileUIPart[] = successfulFiles.map((f) => ({
      type: "file" as const,
      mediaType: f.mediaType!,
      url: f.url!,
      filename: f.filename,
    }));

    const message = input.trim();
    onSubmit(message, fileUIParts);
    setInput("");
    setUploadingFiles([]);
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
        <FilesPreview files={uploadingFiles} removeFile={removeFile} />

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
              : uploadingFiles.length > 0
                ? "添加描述..."
                : "请输入内容，按 Enter 发送..."
          }
          rows={uploadingFiles.length > 0 ? 1 : 2}
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
                  className="max-w-40 gap-1.5 outline-none"
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
                        <span className="text-xs">{model.name}</span>
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

          {status === "streaming" || status === "submitted" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => stop && stop()}
                >
                  <span className="bg-primary inline-flex h-3 w-3 rounded-xs"></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">取消</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSend}
                  disabled={
                    disabled ||
                    (!input.trim() &&
                      uploadingFiles.filter((f) => f.status === "success")
                        .length === 0)
                  }
                  size="sm"
                  className="disabled:bg-white-400 dark:bg-black-400 rounded-lg px-3 py-2 disabled:text-white"
                >
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <ArrowUp size={20} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isUploading ? "上传中..." : "发送"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

const FilesPreview = memo(function FilesPreview({
  files,
  removeFile,
}: {
  files: UploadingFile[];
  removeFile: (id: string) => void;
}) {
  return (
    files.length > 0 && (
      <div className="flex flex-wrap gap-2 pb-2">
        {files.map((uploadingFile) => (
          <div
            key={uploadingFile.id}
            className={cn(
              "group bg-muted relative size-16 overflow-hidden rounded-md border",
              uploadingFile.status === "error" && "border-destructive",
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  src={URL.createObjectURL(uploadingFile.file)}
                  alt="preview"
                  fill
                  className={cn(
                    "size-full object-cover transition-opacity",
                    uploadingFile.status === "uploading" && "opacity-50",
                    uploadingFile.status === "error" && "opacity-30",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {uploadingFile.status === "error"
                  ? `上传失败: ${uploadingFile.error}`
                  : uploadingFile.file.name}
              </TooltipContent>
            </Tooltip>

            {/* Loading overlay */}
            {uploadingFile.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}

            {/* Error indicator */}
            {uploadingFile.status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-destructive text-xs font-medium">
                  失败
                </span>
              </div>
            )}

            <button
              onClick={() => removeFile(uploadingFile.id)}
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

const ModelLogo = memo(function ModelLogo({
  model,
  size = "sm",
}: {
  model: UserModelConfig | undefined;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-4" : "size-5";

  if (!model?.logoUrl) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center rounded border",
          sizeClass,
        )}
      >
        <span className="text-muted-foreground font-medium">
          {model?.name?.charAt(0)?.toUpperCase() || "M"}
        </span>
      </div>
    );
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
