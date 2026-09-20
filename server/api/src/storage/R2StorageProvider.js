import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../../configs/r2.js";
import BaseStorageProvider from "./BaseStorageProvider.js";

export default class R2StorageProvider extends BaseStorageProvider {
  constructor() {
    super("r2");
  }

  get bucket() {
    return process.env.CLOUDFLARE_R2_BUCKET;
  }

  get cdnUrl() {
    return (process.env.CDN_URL || "").replace(/\/+$/, "");
  }

  generatePath(category, filename) {
    const cleanCategory = category ? category.replace(/^\/+|\/+$/g, "") : "misc";
    return `${cleanCategory}/${filename}`;
  }

  getUrl(key) {
    const cleanKey = key ? key.replace(/^\/+/, "") : "";
    return `${this.cdnUrl}/${cleanKey}`;
  }

  async upload(key, buffer, contentType = "image/jpeg", options = {}) {
    const cleanKey = key.replace(/^\/+/, "");

    await r2.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        Body: buffer,
        CacheControl: options.cacheControl || "public, max-age=31536000, immutable",
        ContentType: contentType,
      }),
    );

    return {
      path: cleanKey,
      url: this.getUrl(cleanKey),
      size: buffer.length,
      contentType,
    };
  }

  async delete(key) {
    try {
      const cleanKey = key.replace(/^\/+/, "");
      await r2.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: cleanKey,
        }),
      );
      return true;
    } catch (error) {
      console.error(`[R2StorageProvider] Failed to delete ${key}:`, error);
      return false;
    }
  }

  async deleteMany(keys = []) {
    if (!keys || keys.length === 0) return true;
    try {
      const objects = keys.map((key) => ({ Key: key.replace(/^\/+/, "") }));
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: objects },
        }),
      );
      return true;
    } catch (error) {
      console.error("[R2StorageProvider] Failed to delete many objects:", error);
      return false;
    }
  }
}
