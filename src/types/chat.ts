import { UIMessage } from "ai";

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
  name: string;
  modelId: string;
  baseURL: string;
  apiKey: string; // Will be masked for display
  description?: string;
  logoUrl?: string; // Model logo URL from Supabase Storage
  systemPrompt?: string; // System prompt for the model
  isDefault: boolean;
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
}

export interface DbMessage {
  id: string;
  role: string;
  content: string;
  parts: any;
  createdAt: Date;
}
