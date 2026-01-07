import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { FileUIPart } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertFileToUIPart = (file: File): Promise<FileUIPart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve({
        type: "file",
        mediaType: file.type,
        url: reader.result as string, // 这里就是 Data URL
        filename: file.name,
      });
    };
    reader.onerror = (error) => reject(error);
  });
};
