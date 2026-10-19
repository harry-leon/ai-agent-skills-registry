import yauzl from 'yauzl';
import { env } from '../env.js';

export class ZipSecurityError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {string} [entryPath]
   */
  constructor(code, message, entryPath) {
    super(message);
    this.name = 'ZipSecurityError';
    this.code = code;
    this.entryPath = entryPath;
  }
}

/**
 * Extracts and verifies entries from a ZIP buffer with strict streaming decompression checks.
 * Enforces S6.1, S6.2, and S6.4 limits.
 *
 * @param {Buffer} zipBuffer
 * @returns {Promise<Array<{ rawPath: string, buffer: Buffer }>>}
 */
export async function extractZipEntries(zipBuffer) {
  const maxCompressedBytes = env.MAX_ZIP_COMPRESSED_BYTES || 50 * 1024 * 1024;
  const maxUncompressedBytes = env.MAX_ZIP_UNCOMPRESSED_BYTES || 200 * 1024 * 1024;
  const maxFileBytes = env.MAX_FILE_BYTES || 10 * 1024 * 1024;
  const maxRatio = env.MAX_ZIP_COMPRESSION_RATIO || 100;
  const maxEntries = env.MAX_ZIP_ENTRIES || 5000;

  // 1. Check compressed archive size
  if (zipBuffer.length > maxCompressedBytes) {
    throw new ZipSecurityError(
      'ZIP_TOO_LARGE',
      `Compressed ZIP file (${Math.round(zipBuffer.length / (1024 * 1024))} MB) exceeds maximum limit of ${Math.round(maxCompressedBytes / (1024 * 1024))} MB.`,
    );
  }

  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(
          new ZipSecurityError('INVALID_ZIP', `Invalid or corrupted ZIP archive: ${err.message}`),
        );
      }

      const results = [];
      let entryCount = 0;
      let totalUncompressedBytes = 0;
      let closed = false;

      function cleanup(closeErr) {
        if (closed) return;
        closed = true;
        try {
          zipfile.close();
        } catch {
          // Ignored
        }
        if (closeErr) {
          reject(closeErr);
        } else {
          resolve(results);
        }
      }

      zipfile.on('error', (zipErr) => {
        cleanup(
          new ZipSecurityError('ZIP_READ_ERROR', `Error reading ZIP archive: ${zipErr.message}`),
        );
      });

      zipfile.on('end', () => {
        cleanup(null);
      });

      zipfile.on('entry', (entry) => {
        if (closed) return;

        entryCount++;
        // 2. Max ZIP entries limit
        if (entryCount > maxEntries) {
          return cleanup(
            new ZipSecurityError(
              'TOO_MANY_ZIP_ENTRIES',
              `ZIP archive contains too many entries (${entryCount} > ${maxEntries}).`,
              entry.fileName,
            ),
          );
        }

        // 3. Reject symlinks, hard links, devices (Unix file mode check)
        // External file attributes upper 16 bits contain standard Unix file mode
        const unixMode = (entry.externalFileAttributes >> 16) & 0o170000;
        const S_IFLNK = 0o120000;
        const S_IFCHR = 0o020000;
        const S_IFBLK = 0o060000;
        const S_IFIFO = 0o010000;
        const S_IFSOCK = 0o140000;

        if (
          unixMode === S_IFLNK ||
          unixMode === S_IFCHR ||
          unixMode === S_IFBLK ||
          unixMode === S_IFIFO ||
          unixMode === S_IFSOCK
        ) {
          return cleanup(
            new ZipSecurityError(
              'SYMLINK_OR_DEVICE_FORBIDDEN',
              `ZIP contains forbidden symlinks or device files: ${entry.fileName}`,
              entry.fileName,
            ),
          );
        }

        // 4. Skip directory entries
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }

        // 5. Open stream and enforce byte limits on ACTUAL decompressed bytes
        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr) {
            return cleanup(
              new ZipSecurityError(
                'ZIP_STREAM_ERROR',
                `Cannot read entry ${entry.fileName}: ${streamErr.message}`,
                entry.fileName,
              ),
            );
          }

          const chunks = [];
          let fileBytes = 0;

          readStream.on('data', (chunk) => {
            if (closed) return;

            fileBytes += chunk.length;
            totalUncompressedBytes += chunk.length;

            // Enforce max file size
            if (fileBytes > maxFileBytes) {
              readStream.destroy();
              return cleanup(
                new ZipSecurityError(
                  'FILE_TOO_LARGE',
                  `File ${entry.fileName} exceeds maximum size limit of ${Math.round(maxFileBytes / (1024 * 1024))} MB.`,
                  entry.fileName,
                ),
              );
            }

            // Enforce max total uncompressed size
            if (totalUncompressedBytes > maxUncompressedBytes) {
              readStream.destroy();
              return cleanup(
                new ZipSecurityError(
                  'ZIP_DECOMPRESSED_TOO_LARGE',
                  `Total uncompressed size (${Math.round(totalUncompressedBytes / (1024 * 1024))} MB) exceeds maximum limit of ${Math.round(maxUncompressedBytes / (1024 * 1024))} MB.`,
                  entry.fileName,
                ),
              );
            }

            // Enforce compression ratio (Zip bomb protection)
            if (
              entry.compressedSize > 0 &&
              fileBytes > 1024 * 1024 &&
              fileBytes / entry.compressedSize > maxRatio
            ) {
              readStream.destroy();
              return cleanup(
                new ZipSecurityError(
                  'ZIP_BOMB_DETECTED',
                  `Zip bomb detected in entry: ${entry.fileName}`,
                  entry.fileName,
                ),
              );
            }

            chunks.push(chunk);
          });

          readStream.on('end', () => {
            if (closed) return;
            results.push({
              rawPath: entry.fileName,
              buffer: Buffer.concat(chunks),
            });
            zipfile.readEntry();
          });

          readStream.on('error', (readErr) => {
            cleanup(
              new ZipSecurityError(
                'ZIP_READ_ERROR',
                `Error reading entry ${entry.fileName}: ${readErr.message}`,
                entry.fileName,
              ),
            );
          });
        });
      });

      // Start reading first entry
      zipfile.readEntry();
    });
  });
}
