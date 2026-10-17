import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { env } from '../env.js';

export class LocalStorageDriver {
  /**
   * @param {string} [baseDir]
   */
  constructor(baseDir = env.STORAGE_LOCAL_DIR) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Ensures base storage directory exists.
   */
  async init() {
    await fsp.mkdir(this.baseDir, { recursive: true });
  }

  /**
   * Resolves the absolute file path for a given sha256 blob.
   * @param {string} sha256
   * @returns {string}
   */
  getBlobPath(sha256) {
    // Sanity check sha256 hex string
    if (!/^[0-9a-f]{64}$/i.test(sha256)) {
      throw new Error(`Invalid sha256 hash: ${sha256}`);
    }
    return path.join(this.baseDir, sha256);
  }

  /**
   * Checks if blob exists.
   * @param {string} sha256
   * @returns {Promise<boolean>}
   */
  async hasBlob(sha256) {
    try {
      const filePath = this.getBlobPath(sha256);
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stores a blob under blobs/<sha256> if not already present.
   * @param {string} sha256
   * @param {Buffer|Uint8Array|Readable} content
   * @returns {Promise<{ sha256: string, size: number }>}
   */
  async putBlob(sha256, content) {
    await this.init();
    const filePath = this.getBlobPath(sha256);

    if (await this.hasBlob(sha256)) {
      const stat = await fsp.stat(filePath);
      return { sha256, size: stat.size };
    }

    // Write to a temporary file in the same directory, then atomic rename
    const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

    try {
      if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
        await fsp.writeFile(tmpPath, content);
      } else if (content instanceof Readable) {
        const writeStream = fs.createWriteStream(tmpPath);
        await pipeline(content, writeStream);
      } else {
        throw new Error('Unsupported content type for putBlob: expected Buffer or Readable');
      }

      await fsp.rename(tmpPath, filePath);
      const stat = await fsp.stat(filePath);
      return { sha256, size: stat.size };
    } catch (err) {
      try {
        await fsp.unlink(tmpPath);
      } catch {
        // Ignored
      }
      throw err;
    }
  }

  /**
   * Retrieves blob as a Readable stream.
   * @param {string} sha256
   * @returns {Promise<Readable|null>}
   */
  async getBlobStream(sha256) {
    if (!(await this.hasBlob(sha256))) {
      return null;
    }
    const filePath = this.getBlobPath(sha256);
    return fs.createReadStream(filePath);
  }

  /**
   * Retrieves blob as a Buffer.
   * @param {string} sha256
   * @returns {Promise<Buffer|null>}
   */
  async getBlobBuffer(sha256) {
    if (!(await this.hasBlob(sha256))) {
      return null;
    }
    const filePath = this.getBlobPath(sha256);
    return fsp.readFile(filePath);
  }

  /**
   * Deletes a blob if present.
   * @param {string} sha256
   * @returns {Promise<boolean>}
   */
  async deleteBlob(sha256) {
    try {
      const filePath = this.getBlobPath(sha256);
      await fsp.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
