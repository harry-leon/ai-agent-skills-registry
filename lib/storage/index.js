import { env } from '../env.js';
import { LocalStorageDriver } from './local.js';
import { S3StorageDriver } from './s3.js';

let storageInstance = null;

/**
 * Returns the configured storage driver instance.
 * @returns {LocalStorageDriver|S3StorageDriver}
 */
export function getStorageDriver() {
  if (!storageInstance) {
    if (env.STORAGE_DRIVER === 's3') {
      storageInstance = new S3StorageDriver();
    } else {
      storageInstance = new LocalStorageDriver();
    }
  }
  return storageInstance;
}

export const storage = getStorageDriver();
