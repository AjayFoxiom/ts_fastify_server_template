import { StorageDriver } from "./storage.interface.js";
import { LocalStorageDriver } from "./localStorageDriver.js";

// Default storage driver is local disk.
// Can be swapped with S3StorageDriver or GCSStorageDriver seamlessly.
export const storage: StorageDriver = new LocalStorageDriver();

export * from "./storage.interface.js";
export * from "./localStorageDriver.js";
export default storage;
