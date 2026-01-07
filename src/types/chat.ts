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

export interface DbMessage {
  id: string;
  role: string;
  content: string;
  parts: any;
  createdAt: Date;
}
