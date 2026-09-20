import BaseStorageProvider from "./BaseStorageProvider.js";
import LocalStorageProvider from "./LocalStorageProvider.js";
import R2StorageProvider from "./R2StorageProvider.js";

const providers = new Map();

// Initialize standard providers (lazy singletons)
function initDefaultProviders() {
  if (!providers.has("local")) {
    providers.set("local", new LocalStorageProvider());
  }
  if (!providers.has("r2")) {
    providers.set("r2", new R2StorageProvider());
  }
}

/**
 * Register a custom storage provider in the factory
 * @param {string} name - Provider identifier ("s3", "googledrive", etc.)
 * @param {BaseStorageProvider} providerInstance - Instance implementing BaseStorageProvider
 */
export function registerStorageProvider(name, providerInstance) {
  if (!(providerInstance instanceof BaseStorageProvider)) {
    throw new Error(`Provider for '${name}' must inherit from BaseStorageProvider`);
  }
  providers.set(name.toLowerCase(), providerInstance);
}

/**
 * Get the active or a specific storage provider
 * @param {string} [name] - Optional provider name ("local", "r2", "s3", etc.). Defaults to process.env.STORAGE_PROVIDER or "local"
 * @returns {BaseStorageProvider}
 */
export function getStorageProvider(name) {
  initDefaultProviders();

  let providerName = (name || process.env.STORAGE_PROVIDER || "local").toLowerCase().trim();
  if (!providerName || providerName === "undefined" || providerName === "null") {
    providerName = "local";
  }

  const provider = providers.get(providerName);
  if (!provider) {
    const available = Array.from(providers.keys()).join(", ");
    throw new Error(`Unsupported STORAGE_PROVIDER: '${providerName}'. Available providers are: [${available}]. Please check your .env configuration.`);
  }

  return provider;
}

export { BaseStorageProvider, LocalStorageProvider, R2StorageProvider };
export default getStorageProvider;
