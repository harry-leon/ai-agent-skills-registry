import { db } from '../db.js';

/**
 * Retrieves all files belonging to a specific version.
 *
 * @param {string} versionId
 * @returns {Promise<Array<Object>>}
 */
export async function getVersionFiles(versionId) {
  return await db.skillFile.findMany({
    where: { versionId },
    orderBy: { path: 'asc' },
    include: {
      blob: true,
    },
  });
}

/**
 * Retrieves a single file from a version by relative path.
 *
 * @param {string} versionId
 * @param {string} path
 * @returns {Promise<Object|null>}
 */
export async function getFileByVersionAndPath(versionId, path) {
  return await db.skillFile.findUnique({
    where: {
      versionId_path: {
        versionId,
        path,
      },
    },
    include: {
      blob: true,
    },
  });
}
