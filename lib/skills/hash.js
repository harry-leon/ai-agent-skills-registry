import crypto from 'node:crypto';
import { Readable } from 'node:stream';

/**
 * Computes SHA-256 hash from a Buffer, Uint8Array, string, or Readable stream.
 * @param {Buffer|Uint8Array|string|Readable} input
 * @returns {Promise<string>}
 */
export async function computeSha256(input) {
  const hash = crypto.createHash('sha256');

  if (Buffer.isBuffer(input) || input instanceof Uint8Array || typeof input === 'string') {
    hash.update(input);
    return hash.digest('hex');
  }

  if (input instanceof Readable) {
    for await (const chunk of input) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  }

  throw new Error('Unsupported input type for computeSha256');
}

/**
 * Computes a combined contentHash for a skill version manifest.
 * Sorts all file paths alphabetically, hashing path + sha256 of each file.
 * @param {Array<{ path: string, sha256: string }>} files
 * @returns {string}
 */
export function computeVersionContentHash(files) {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const hash = crypto.createHash('sha256');
  for (const f of sorted) {
    hash.update(`${f.path}:${f.sha256}\n`);
  }
  return hash.digest('hex');
}
