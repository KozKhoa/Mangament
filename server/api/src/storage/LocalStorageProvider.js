import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import BaseStorageProvider from "./BaseStorageProvider.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class LocalStorageProvider extends BaseStorageProvider {
  constructor() {
    super("local");
    this.baseDir = this.#resolveBaseDir();
  }

  #resolveBaseDir() {
    if (process.env.PUBLIC_DIR) {
      return path.resolve(process.env.PUBLIC_DIR);
    }
    const serverPublic = path.resolve(__dirname, "../../../public");
    if (fs.existsSync(serverPublic)) {
      return serverPublic;
    }
    return path.resolve(process.cwd(), "public");
  }

  resolveDiskPath(relativePath) {
    // Strip leading /public/ or public/ if present, to join with baseDir
    const cleaned = relativePath.replace(/^\/?public\/?/, "");
    return path.join(this.baseDir, cleaned);
  }

  generatePath(category, filename) {
    const cleanCategory = category ? category.replace(/^\/+|\/+$/g, "") : "misc";
    return `/public/images/${cleanCategory}/${filename}`;
  }

  getUrl(relativePath) {
    const normalized = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
    const baseUrl = process.env.APP_URL || process.env.BACKEND_URL;
    if (baseUrl) {
      const cleanBase = baseUrl.replace(/\/+$/, "");
      return `${cleanBase}${normalized}`;
    }
    return `http://localhost:${process.env.APP_PORT || 5000}${normalized}`;
  }

  async upload(relativePath, buffer, contentType = "image/jpeg") {
    const fullPath = this.resolveDiskPath(relativePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);

    return {
      path: relativePath,
      url: this.getUrl(relativePath),
      size: buffer.length,
      contentType,
    };
  }

  async delete(relativePath) {
    try {
      const fullPath = this.resolveDiskPath(relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to delete ${relativePath}:`, error);
      return false;
    }
  }

  async deleteMany(relativePaths = []) {
    await Promise.all(relativePaths.map((p) => this.delete(p)));
    return true;
  }
}
