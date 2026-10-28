import { StorageDriver } from "./storage.interface.js";
import { LocalStorageDriver } from "./localStorageDriver.js";

export * from "./storage.interface.js";
export * from "./localStorageDriver.js";

/**
 * Create a storage driver from the given upload directory.
 * The upload dir should come from app.config.UPLOAD_DIR — passed in at runtime,
 * not imported from a global env singleton.
 *
 * @param uploadDir - Relative or absolute path to the upload directory.
 */
export const createLocalStorage = (uploadDir: string): StorageDriver =>
  new LocalStorageDriver(uploadDir);

/**
 * Default storage driver using the UPLOAD_DIR env variable.
 * Used by the uploads utility shim; prefer createLocalStorage() in new code.
 */
export const storage: StorageDriver = new LocalStorageDriver(
  process.env.UPLOAD_DIR ?? "uploads",
);

export default storage;
