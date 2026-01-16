import { UIMessage } from "ai";

// Extra options for vendor-specific parameters
// This is a passthrough field - users can add any key-value pairs
// Common examples:
// - OpenAI/DeepSeek: { "reasoningEffort": "high", "maxTokens": 4096 }
// - Anthropic: { "thinking": { "type": "enabled", "budgetTokens": 10000 } }
// - Google: { "thinkingConfig": { "thinkingBudget": 10000 } }

export type ModelExtraOptions = Record<string, any>;

export interface Chatdata {
  id: string;
  title: string;
  timestamp: number;
  modelId: string;
  messages: UIMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  baseURL: string;
}

// User model configuration from database
export interface UserModelConfig {
  id: string;
  userId: number; // Model creator user ID
  name: string;
  modelId: string;
  baseURL: string;
  apiKey: string; // Will be masked for display
  description?: string;
  logoUrl?: string; // Model logo URL from Supabase Storage
  systemPrompt?: string; // System prompt for the model
  isDefault: boolean;
  isPublic: boolean;

  // Model Capabilities - 模型能力开关
  supportsVision: boolean; // Vision model support (image input)

  // Extra Options - 透传字段，用于供应商特定参数
  extraOptions?: ModelExtraOptions;

  createdAt: Date;
  updatedAt: Date;
}

// Form data for creating/updating user model
export interface UserModelFormData {
  name: string;
  modelId: string;
  baseURL: string;
  apiKey: string;
  description?: string;
  logoUrl?: string; // Model logo URL
  systemPrompt?: string; // System prompt
  isPublic?: boolean;

  // Model Capabilities
  supportsVision?: boolean;

  // Extra Options
  extraOptions?: ModelExtraOptions;
}

// Chat capabilities configuration for runtime
export interface ChatCapabilities {
  enableVision: boolean;
}

export interface DbMessage {
  id: string;
  role: string;
  content: string;
  parts: any;
  createdAt: Date;
}
