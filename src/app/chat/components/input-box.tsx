"use client";

import { Button } from "@/components/ui/button";
import { ChatStatus } from "ai";
import { ArrowUp, CircleStop, Plus, X } from "lucide-react";
import { useRef, useState, useCallback, memo, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentModelId, modelList, setCurrentModelId } = useModelStore();
  const currentModel =
    modelList.find((model) => model.id === currentModelId) || modelList[0];

  const disabled = status !== "ready" || externalDisabled;

  useEffect(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [currentChatId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (droppedFiles.length < e.dataTransfer.files.length) {
      toast.warning("仅支持接收图片文件");
    }

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const removeFile = useCallback((indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;

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

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*"
          multiple
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              title="请上传图片，支持拖拽粘贴"
              size="sm"
              variant={"ghost"}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="opacity-80" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  title="Select model"
                  size="sm"
                  variant="ghost"
                  className="max-w-[120px]"
                >
                  <span className="truncate text-xs">
                    {currentModel?.name || "Select Model"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                {modelList.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => setCurrentModelId(model.id)}
                    className={cn(
                      "hover:bg-accent/20 flex cursor-pointer flex-col items-start p-2",
                      model.id === currentModelId
                        ? "bg-accent text-accent-foreground"
                        : "",
                    )}
                  >
                    <span className="text-sm">{model.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              className="disabled:bg-white-400 rounded-lg px-3 py-2 disabled:text-white"
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
