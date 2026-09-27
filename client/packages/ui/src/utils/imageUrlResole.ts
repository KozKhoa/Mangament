import Image from "@/types/image";

export interface ImageUrlResolveOptions {
  fallback?: string;
  provider?: string;
}

export type ImageLike =
  | Image
  | {
      path?: string | null;
      provider?: string | null;
      url?: string | null;
      file?: File | null;
    }
  | string
  | null
  | undefined;

/**
 * Clean duplicate slashes in URL while preserving protocol (http://, https://)
 * and query parameters/hashes.
 */
export function cleanDuplicateSlashes(url: string): string {
  if (!url) return "";
  if (/^(blob:|data:)/i.test(url)) return url;

  const [beforeQuery, ...queryParts] = url.split("?");
  const queryString = queryParts.length > 0 ? "?" + queryParts.join("?") : "";
  const [beforeHash, ...hashParts] = beforeQuery.split("#");
  const hashString = hashParts.length > 0 ? "#" + hashParts.join("#") : "";

  let cleaned = beforeHash;
  if (/^https?:\/\//i.test(cleaned)) {
    cleaned = cleaned.replace(/^([a-zA-Z]+:\/\/)(.*)$/, (_, proto, rest) => {
      return proto + rest.replace(/\/+/g, "/");
    });
  } else {
    cleaned = cleaned.replace(/\/+/g, "/");
  }

  return cleaned + hashString + queryString;
}

export function getBaseUrlByProvider(provider?: string | null): string {
  const p = provider?.toLowerCase().trim();
  if (p === "r2") {
    return process.env.NEXT_PUBLIC_R2_CDN_URL || process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "";
  }
  if (p === "local") {
    return process.env.NEXT_PUBLIC_LOCAL_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "";
  }
  if (p === "s3") {
    return process.env.NEXT_PUBLIC_S3_CDN_URL || process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "";
  }
  return process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_LOCAL_CDN_URL || process.env.NEXT_PUBLIC_API_URL || "";
}

/**
 * Resolve an image (Image object, path string, file) to its full URL based on its provider.
 * Removes duplicate slashes and returns fallback if image is missing.
 */
export function imageUrlResole(image: ImageLike, fallbackOrOptions?: string | ImageUrlResolveOptions): string {
  const options: ImageUrlResolveOptions = typeof fallbackOrOptions === "string" ? { fallback: fallbackOrOptions } : fallbackOrOptions || {};

  const fallback = options.fallback ?? "";

  if (!image) return fallback;

  // Handle File / Blob
  if (typeof image === "object") {
    if (image.file instanceof File) {
      try {
        return URL.createObjectURL(image.file);
      } catch {
        // In SSR environment
      }
    }
    if ("url" in image && typeof image.url === "string" && image.url) {
      return cleanDuplicateSlashes(image.url);
    }
  }

  const path = typeof image === "string" ? image.trim() : image.path?.trim();
  if (!path) return fallback;

  // If already absolute / data / blob URL
  if (/^(https?:\/\/|blob:|data:)/i.test(path)) {
    return cleanDuplicateSlashes(path);
  }

  // If path is a known public static asset (e.g. /blur-image.png, /avatar.png, etc.)
  // and no specific upload provider is specified, keep it as local static asset
  const isStaticAsset =
    typeof image === "string" &&
    !options.provider &&
    !path.startsWith("/uploads") &&
    !path.startsWith("uploads/") &&
    (path.startsWith("/") || path.endsWith(".png") || path.endsWith(".svg") || path.endsWith(".jpg"));

  if (isStaticAsset) {
    return cleanDuplicateSlashes(path.startsWith("/") ? path : `/${path}`);
  }

  const provider = options.provider || (typeof image === "object" ? image.provider : null);
  const baseUrl = getBaseUrlByProvider(provider);

  if (!baseUrl) {
    return cleanDuplicateSlashes(path.startsWith("/") ? path : `/${path}`);
  }

  return cleanDuplicateSlashes(`${baseUrl}/${path}`);
}

// Aliases for convenience and standard spelling
export const imageUrlResolve = imageUrlResole;
export const resolveImageUrl = imageUrlResole;

export default imageUrlResole;
