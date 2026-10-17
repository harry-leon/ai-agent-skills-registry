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

/**
 * Retrieves a file by ID strictly scoped to a skill.
 *
 * @param {string} fileId
 * @param {string} skillId
 * @returns {Promise<Object|null>}
 */
export async function getFileByIdAndSkill(fileId, skillId) {
  return await db.skillFile.findFirst({
    where: {
      id: fileId,
      version: {
        skillId,
      },
    },
    include: {
      blob: true,
    },
  });
}
