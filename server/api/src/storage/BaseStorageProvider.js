/**
 * BaseStorageProvider - Abstract base class for storage providers
 * Implements the Strategy / Provider pattern for file storage
 */
export default class BaseStorageProvider {
  /**
   * @param {string} name - Provider identifier ("local", "r2", "s3", etc.)
   */
  constructor(name) {
    if (this.constructor === BaseStorageProvider) {
      throw new Error("BaseStorageProvider is an abstract class and cannot be instantiated directly.");
    }
    this.name = name;
  }

  /**
   * Generate relative storage path or key for a file
   * @param {string} category - Category/folder name (e.g. "stories", "avatars", "story-nodes")
   * @param {string} filename - Unique filename
   * @returns {string} - Storage path or key
   */
  // eslint-disable-next-line no-unused-vars
  generatePath(category, filename) {
    throw new Error("Method 'generatePath()' must be implemented.");
  }

  /**
   * Get publicly accessible URL for a storage path
   * @param {string} path - Storage path or key
   * @returns {string} - Full public URL
   */
  // eslint-disable-next-line no-unused-vars
  getUrl(path) {
    throw new Error("Method 'getUrl()' must be implemented.");
  }

  /**
   * Upload / save file buffer to storage
   * @param {string} path - Storage path or key
   * @param {Buffer} buffer - File buffer
   * @param {string} contentType - MIME type (e.g. "image/jpeg")
   * @param {object} [options] - Additional provider-specific options
   * @returns {Promise<{ path: string, url: string, size: number }>}
   */
  // eslint-disable-next-line no-unused-vars
  async upload(path, buffer, contentType, options = {}) {
    throw new Error("Method 'upload()' must be implemented.");
  }

  /**
   * Delete single file from storage
   * @param {string} path - Storage path or key
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(path) {
    throw new Error("Method 'delete()' must be implemented.");
  }

  /**
   * Delete multiple files from storage
   * @param {string[]} paths - Array of storage paths or keys
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteMany(paths) {
    throw new Error("Method 'deleteMany()' must be implemented.");
  }
}
