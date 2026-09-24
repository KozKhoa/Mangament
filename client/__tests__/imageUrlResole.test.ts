import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { imageUrlResole, cleanDuplicateSlashes, getBaseUrlByProvider } from "@/utils/imageUrlResole";

describe("imageUrlResole", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_LOCAL_CDN_URL: "http://localhost:5000",
      NEXT_PUBLIC_R2_CDN_URL: "https://pub-r2.dev",
      NEXT_PUBLIC_S3_CDN_URL: "https://s3.amazonaws.com/my-bucket",
      NEXT_PUBLIC_CDN_URL: "http://localhost:5000",
      NEXT_PUBLIC_API_URL: "http://localhost:5000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("cleanDuplicateSlashes", () => {
    it("should remove duplicate slashes while preserving protocol", () => {
      expect(cleanDuplicateSlashes("http://localhost:5000//uploads//story//cover.jpg")).toBe("http://localhost:5000/uploads/story/cover.jpg");
      expect(cleanDuplicateSlashes("https://pub-r2.dev///manga///chapter-1.png")).toBe("https://pub-r2.dev/manga/chapter-1.png");
    });

    it("should clean root-relative and relative duplicate slashes", () => {
      expect(cleanDuplicateSlashes("//blur-image.png")).toBe("/blur-image.png");
      expect(cleanDuplicateSlashes("/uploads//images//1.png")).toBe("/uploads/images/1.png");
      expect(cleanDuplicateSlashes("uploads//images//1.png")).toBe("uploads/images/1.png");
    });

    it("should preserve query string and hash", () => {
      expect(cleanDuplicateSlashes("http://localhost:5000//uploads//image.jpg?url=http://abc.com//test#hash//1")).toBe(
        "http://localhost:5000/uploads/image.jpg?url=http://abc.com//test#hash//1",
      );
    });

    it("should preserve blob and data URLs", () => {
      expect(cleanDuplicateSlashes("blob:http://localhost:3000/some-guid")).toBe("blob:http://localhost:3000/some-guid");
      expect(cleanDuplicateSlashes("data:image/png;base64,iVBORw0KGgo=")).toBe("data:image/png;base64,iVBORw0KGgo=");
    });
  });

  describe("Provider resolution", () => {
    it("should use NEXT_PUBLIC_LOCAL_CDN_URL for local provider", () => {
      const img = { path: "/uploads/cover.jpg", provider: "local" };
      expect(imageUrlResole(img)).toBe("http://localhost:5000/uploads/cover.jpg");
    });

    it("should use NEXT_PUBLIC_R2_CDN_URL for r2 provider", () => {
      const img = { path: "manga/10/cover.jpg", provider: "r2" };
      expect(imageUrlResole(img)).toBe("https://pub-r2.dev/manga/10/cover.jpg");
    });

    it("should use NEXT_PUBLIC_S3_CDN_URL for s3 provider", () => {
      const img = { path: "/images/banner.webp", provider: "s3" };
      expect(imageUrlResole(img)).toBe("https://s3.amazonaws.com/my-bucket/images/banner.webp");
    });

    it("should fallback to CDN_URL or API_URL when provider is missing or unknown", () => {
      const img = { path: "/uploads/avatar.png" };
      expect(imageUrlResole(img)).toBe("http://localhost:5000/uploads/avatar.png");
    });
  });

  describe("Fallback and edge cases", () => {
    it("should return fallback when image is null or undefined", () => {
      expect(imageUrlResole(null, "/blur-image.png")).toBe("/blur-image.png");
      expect(imageUrlResole(undefined, "/avatar.png")).toBe("/avatar.png");
      expect(imageUrlResole(null)).toBe("");
    });

    it("should return fallback when path is empty", () => {
      expect(imageUrlResole({ path: "" }, "/blur-image.png")).toBe("/blur-image.png");
    });

    it("should return full URL unchanged if path is already absolute", () => {
      expect(imageUrlResole("https://images.unsplash.com//photo-123.jpg")).toBe("https://images.unsplash.com/photo-123.jpg");
      expect(imageUrlResole({ path: "http://example.com//test.png", provider: "r2" })).toBe("http://example.com/test.png");
    });

    it("should preserve static client assets without prepending CDN", () => {
      expect(imageUrlResole("/blur-image.png")).toBe("/blur-image.png");
      expect(imageUrlResole("/avatar.png")).toBe("/avatar.png");
    });
  });
});
