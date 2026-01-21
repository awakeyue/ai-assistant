import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileUIPart } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadedFile {
  url: string;
  path: string;
  filename: string;
  mediaType: string;
}

interface UploadResponse {
  files: UploadedFile[];
  error?: string;
}

/**
 * Upload files to server and get public URLs
 * @param files - Array of files to upload
 * @returns Array of uploaded file info with URLs
 */
export const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("/api/upload/chat-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload files");
  }

  const data: UploadResponse = await response.json();
  return data.files;
};

/**
 * Convert a File to FileUIPart by uploading to server first
 * This replaces the old base64 approach with URL-based approach
 * @param file - File to convert
 * @returns FileUIPart with URL pointing to uploaded file
 */
export const convertFileToUIPart = async (file: File): Promise<FileUIPart> => {
  const [uploaded] = await uploadFiles([file]);

  return {
    type: "file",
    mediaType: uploaded.mediaType,
    url: uploaded.url,
    filename: uploaded.filename,
  };
};

/**
 * Convert multiple Files to FileUIParts by batch uploading
 * More efficient than calling convertFileToUIPart multiple times
 * @param files - Files to convert
 * @returns Array of FileUIParts with URLs
 */
export const convertFilesToUIParts = async (
  files: File[],
): Promise<FileUIPart[]> => {
  if (files.length === 0) return [];

  const uploaded = await uploadFiles(files);

  return uploaded.map((file) => ({
    type: "file" as const,
    mediaType: file.mediaType,
    url: file.url,
    filename: file.filename,
  }));
};
