"use client";

import { memo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, ImageIcon, FileText, Video, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserModelConfig } from "@/types/chat";
import { toast } from "sonner";

// Attachment type definitions for extensibility
export type AttachmentType = "image" | "pdf" | "video" | "document";

export interface AttachmentConfig {
  type: AttachmentType;
  icon: LucideIcon;
  label: string;
  accept: string;
  modelCapability: keyof Pick<UserModelConfig, "supportsVision"> | null;
  enabled: boolean; // Whether this type is currently implemented
  tooltip?: string;
}

// Define all possible attachment types (easily extensible)
const ATTACHMENT_CONFIGS: AttachmentConfig[] = [
  {
    type: "image",
    icon: ImageIcon,
    label: "上传图片",
    accept: "image/*",
    modelCapability: "supportsVision",
    enabled: true,
    tooltip: "支持 JPG、PNG、GIF、WebP 格式",
  },
  {
    type: "pdf",
    icon: FileText,
    label: "上传 PDF",
    accept: "application/pdf",
    modelCapability: null, // Not tied to specific capability yet
    enabled: false, // Not implemented yet
    tooltip: "即将支持",
  },
  {
    type: "video",
    icon: Video,
    label: "上传视频",
    accept: "video/*",
    modelCapability: null,
    enabled: false, // Not implemented yet
    tooltip: "即将支持",
  },
];

interface InputAttachmentsProps {
  currentModel: UserModelConfig | undefined;
  onFilesSelect: (files: File[], type: AttachmentType) => void;
  disabled?: boolean;
}

// Single attachment type menu item
const AttachmentMenuItem = memo(function AttachmentMenuItem({
  config,
  onClick,
  disabled,
}: {
  config: AttachmentConfig;
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = config.icon;
  const isDisabled = disabled || !config.enabled;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuItem
          onClick={onClick}
          disabled={isDisabled}
          className={cn(
            "flex cursor-pointer items-center gap-2",
            isDisabled && "cursor-not-allowed opacity-50",
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{config.label}</span>
          {!config.enabled && (
            <span className="text-muted-foreground ml-auto text-xs">
              即将支持
            </span>
          )}
        </DropdownMenuItem>
      </TooltipTrigger>
      {config.tooltip && (
        <TooltipContent side="right" className="text-xs">
          {config.tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  );
});
AttachmentMenuItem.displayName = "AttachmentMenuItem";

// Input attachments component - handles file uploads based on model capabilities
function InputAttachments({
  currentModel,
  onFilesSelect,
  disabled = false,
}: InputAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAttachmentType = useRef<AttachmentType>("image");

  // Filter attachment types based on model capabilities
  const availableAttachments = ATTACHMENT_CONFIGS.filter((config) => {
    // If no capability is required, show it (but might be disabled)
    if (!config.modelCapability) {
      return config.enabled; // Only show if implemented
    }
    // Check if model supports this capability
    return currentModel?.[config.modelCapability] ?? false;
  });

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        onFilesSelect(Array.from(selectedFiles), currentAttachmentType.current);
      }
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFilesSelect],
  );

  // Handle attachment type selection
  const handleSelectAttachment = useCallback((config: AttachmentConfig) => {
    if (!config.enabled) {
      toast.info(`${config.label}功能即将推出`);
      return;
    }
    currentAttachmentType.current = config.type;
    if (fileInputRef.current) {
      fileInputRef.current.accept = config.accept;
      fileInputRef.current.click();
    }
  }, []);

  // Don't render if no attachment types are available
  if (availableAttachments.length === 0) {
    return null;
  }

  // If only one attachment type available, render simple button
  if (availableAttachments.length === 1) {
    const config = availableAttachments[0];
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={config.accept}
          multiple
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              title={config.tooltip || config.label}
              size="sm"
              variant="ghost"
              onClick={() => handleSelectAttachment(config)}
              disabled={disabled}
            >
              <Plus className="opacity-80" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {config.label}，支持拖拽粘贴
          </TooltipContent>
        </Tooltip>
      </>
    );
  }

  // Multiple attachment types - render dropdown menu
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                title="添加附件"
                size="sm"
                variant="ghost"
                disabled={disabled}
              >
                <Plus className="opacity-80" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            添加附件
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-40">
          {availableAttachments.map((config) => (
            <AttachmentMenuItem
              key={config.type}
              config={config}
              onClick={() => handleSelectAttachment(config)}
              disabled={disabled}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default memo(InputAttachments);
