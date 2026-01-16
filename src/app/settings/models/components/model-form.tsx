"use client";

import { useState, useEffect, useRef } from "react";
import { UserModelConfig, UserModelFormData } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JsonEditor } from "@/components/custom/json-editor";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Bot,
  Link,
  Key,
  FileText,
  Upload,
  X,
  Image as ImageIcon,
  MessageSquare,
  UserLock,
  Sparkles,
  Copy,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { useUserStore } from "@/store/user";

// JSON example templates for different providers
const EXTRA_OPTIONS_EXAMPLES = `// Examples for different providers:
// 禁用深度思考
{
  "thinking":{
    "type":"disabled"
  }
}`;

interface ModelFormProps {
  model?: UserModelConfig;
  onSuccess: (model: UserModelConfig) => void;
  onCancel: () => void;
  onCopy?: (model: UserModelConfig) => void;
  isCopyMode?: boolean;
}

export default function ModelForm({
  model,
  onSuccess,
  onCancel,
  onCopy,
  isCopyMode = false,
}: ModelFormProps) {
  const isEditing = !!model && !isCopyMode;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = useUserStore((state) => state.isAdmin());

  const [formData, setFormData] = useState<UserModelFormData>({
    name: "",
    modelId: "",
    baseURL: "",
    apiKey: "",
    description: "",
    logoUrl: "",
    systemPrompt: "",
    isPublic: false,
    supportsVision: false,
    extraOptions: {},
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<UserModelFormData>>({});
  const [extraOptionsJson, setExtraOptionsJson] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        modelId: model.modelId,
        baseURL: model.baseURL,
        apiKey: model.apiKey,
        description: model.description || "",
        logoUrl: model.logoUrl || "",
        systemPrompt: model.systemPrompt || "",
        isPublic: model.isPublic,
        supportsVision: model.supportsVision ?? false,
        extraOptions: model.extraOptions || {},
      });
      // Initialize JSON editor with formatted extraOptions
      const opts = model.extraOptions;
      if (opts && Object.keys(opts).length > 0) {
        setExtraOptionsJson(JSON.stringify(opts, null, 2));
      } else {
        setExtraOptionsJson("");
      }
    } else {
      setFormData({
        name: "",
        modelId: "",
        baseURL: "",
        apiKey: "",
        description: "",
        logoUrl: "",
        systemPrompt: "",
        isPublic: false,
        supportsVision: false,
        extraOptions: {},
      });
      setExtraOptionsJson("");
    }
    setJsonError(null);
  }, [model]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserModelFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "请输入模型名称";
    }
    if (!formData.modelId.trim()) {
      newErrors.modelId = "请输入模型ID";
    }
    if (!formData.baseURL.trim()) {
      newErrors.baseURL = "请输入API地址";
    } else {
      try {
        new URL(formData.baseURL);
      } catch {
        newErrors.baseURL = "请输入有效的URL地址";
      }
    }
    if (!isEditing && !formData.apiKey.trim()) {
      newErrors.apiKey = "请输入API密钥";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("请上传 JPG、PNG、GIF、WebP 或 SVG 格式的图片");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片大小不能超过 2MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/model-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const result = await response.json();
      setFormData((prev) => ({ ...prev, logoUrl: result.url }));
      toast.success("Logo 上传成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败，请重试");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/models/${model.id}` : "/api/models";
      const method = isEditing ? "PUT" : "POST";

      const submitData = { ...formData };
      if (isEditing && formData.apiKey.includes("****")) {
        delete (submitData as Partial<UserModelFormData>).apiKey;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "操作失败");
      }

      const result: UserModelConfig = await response.json();
      toast.success(isEditing ? "模型已更新" : "模型已添加");
      onSuccess(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof UserModelFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle JSON editor changes
  const handleExtraOptionsJsonChange = (value: string) => {
    setExtraOptionsJson(value);
    setJsonError(null);

    // Empty string is valid (means no extra options)
    if (!value.trim()) {
      setFormData((prev) => ({ ...prev, extraOptions: {} }));
      return;
    }

    // Try to parse JSON
    try {
      const parsed = JSON.parse(value);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setJsonError("必须是一个 JSON 对象");
        return;
      }
      setFormData((prev) => ({ ...prev, extraOptions: parsed }));
    } catch {
      setJsonError("JSON 格式无效");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Model Logo */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="text-muted-foreground h-4 w-4" />
          模型 Logo
          <span className="text-muted-foreground text-xs font-normal">
            （可选）
          </span>
        </Label>
        <div className="flex items-center gap-4">
          {formData.logoUrl ? (
            <div className="relative">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                <Image
                  src={formData.logoUrl}
                  alt="Model Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="bg-muted/50 hover:bg-muted flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              ) : (
                <Upload className="text-muted-foreground h-6 w-6" />
              )}
            </div>
          )}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isSubmitting || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {formData.logoUrl ? "更换图片" : "上传图片"}
                </>
              )}
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">
              支持 JPG、PNG、GIF、WebP、SVG，最大 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Model Name */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Bot className="text-muted-foreground h-4 w-4" />
          模型名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="例如: GPT-4"
          disabled={isSubmitting}
          className={`h-10 transition-colors ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {errors.name && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <span className="bg-destructive inline-block h-1 w-1 rounded-full" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Model ID */}
      <div className="space-y-2">
        <Label
          htmlFor="modelId"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <FileText className="text-muted-foreground h-4 w-4" />
          模型ID <span className="text-destructive">*</span>
        </Label>
        <Input
          id="modelId"
          name="modelId"
          value={formData.modelId}
          onChange={handleChange}
          placeholder="例如: gpt-4-turbo"
          disabled={isSubmitting}
          className={`h-10 font-mono text-sm transition-colors ${errors.modelId ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {errors.modelId && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <span className="bg-destructive inline-block h-1 w-1 rounded-full" />
            {errors.modelId}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          请填写 API 服务商提供的模型标识符
        </p>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label
          htmlFor="baseURL"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Link className="text-muted-foreground h-4 w-4" />
          API 地址 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="baseURL"
          name="baseURL"
          value={formData.baseURL}
          onChange={handleChange}
          placeholder="例如: https://api.openai.com/v1"
          disabled={isSubmitting}
          autoComplete="off"
          className={`h-10 font-mono text-sm transition-colors ${errors.baseURL ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {errors.baseURL && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <span className="bg-destructive inline-block h-1 w-1 rounded-full" />
            {errors.baseURL}
          </p>
        )}
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label
          htmlFor="apiKey"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Key className="text-muted-foreground h-4 w-4" />
          API 密钥 {!isEditing && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            id="apiKey"
            name="apiKey"
            type={showApiKey ? "text" : "password"}
            value={formData.apiKey}
            onChange={handleChange}
            placeholder={isEditing ? "留空保持原密钥不变" : "请输入 API 密钥"}
            disabled={isSubmitting}
            autoComplete="new-password"
            className={`h-10 pr-10 font-mono text-sm transition-colors ${errors.apiKey ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="text-muted-foreground h-4 w-4" />
            ) : (
              <Eye className="text-muted-foreground h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.apiKey && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <span className="bg-destructive inline-block h-1 w-1 rounded-full" />
            {errors.apiKey}
          </p>
        )}
        {isEditing && (
          <p className="text-muted-foreground text-xs">
            当前显示的是脱敏后的密钥，如需更换请输入新密钥
          </p>
        )}
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label
          htmlFor="systemPrompt"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <MessageSquare className="text-muted-foreground h-4 w-4" />
          系统提示词
          <span className="text-muted-foreground text-xs font-normal">
            （可选）
          </span>
        </Label>
        <Textarea
          id="systemPrompt"
          name="systemPrompt"
          value={formData.systemPrompt}
          onChange={handleChange}
          placeholder="输入系统提示词，用于设定 AI 的角色和行为..."
          rows={4}
          disabled={isSubmitting}
          className="resize-none transition-colors"
        />
        <p className="text-muted-foreground text-xs">
          系统提示词会在每次对话开始时自动发送给模型
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <FileText className="text-muted-foreground h-4 w-4" />
          描述
          <span className="text-muted-foreground text-xs font-normal">
            （可选）
          </span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="简要描述此模型的用途或特点..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none transition-colors"
        />
      </div>

      {/* Model Capabilities */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="text-muted-foreground h-4 w-4" />
          模型能力
          <span className="text-muted-foreground text-xs font-normal">
            （根据模型实际支持的能力开启）
          </span>
        </Label>
        <div className="space-y-3 rounded-lg border p-4">
          {/* Vision Support */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">视觉识别</p>
                <p className="text-muted-foreground text-xs">
                  支持图片输入和视觉理解
                </p>
              </div>
            </div>
            <Switch
              id="supportsVision"
              checked={formData.supportsVision}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, supportsVision: checked }))
              }
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Extra Options - JSON Editor */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Settings className="text-muted-foreground h-4 w-4" />
          高级参数
          <span className="text-muted-foreground text-xs font-normal">
            （JSON 格式，供应商特定参数）
          </span>
        </Label>
        <div className="space-y-2">
          <JsonEditor
            value={extraOptionsJson}
            onChange={handleExtraOptionsJsonChange}
            placeholder={EXTRA_OPTIONS_EXAMPLES}
            disabled={isSubmitting}
            error={jsonError}
            minHeight="100px"
          />
          <p className="text-muted-foreground text-xs">
            输入 JSON 格式的配置参数，留空则使用默认值。这些参数会直接透传给 AI
            SDK。
          </p>
        </div>
      </div>

      {/* isPublic */}
      {isAdmin && (
        <div className="space-y-2">
          <Label
            htmlFor="isPublic"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <UserLock className="text-muted-foreground h-4 w-4" />
            是否公开
          </Label>
          <Switch
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isPublic: checked }))
            }
            disabled={isSubmitting}
          />
          <p className="text-muted-foreground text-xs">
            如果选择公开，其他用户可以使用此模型，请谨慎打开
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between gap-3 border-t pt-4">
        <div>
          {/* Copy button - only show in edit mode (not in copy mode or add mode) */}
          {isEditing && onCopy && model && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onCopy(model)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              复制并新建
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-20"
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="min-w-20 shadow-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "保存更改" : "添加模型"}
          </Button>
        </div>
      </div>
    </form>
  );
}
