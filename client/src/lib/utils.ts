import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function optimizeCloudinaryUrl(url: string | null | undefined, width = 500): string {
  if (!url) return "https://via.placeholder.com/300";
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}
