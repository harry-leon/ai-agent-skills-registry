import { db } from '../db.js';
import { createAuditLog } from './audit.js';

/**
 * Finds user by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function findUserById(id) {
  return db.user.findUnique({
    where: { id },
  });
}

/**
 * Finds user by handle.
 * @param {string} handle
 * @returns {Promise<Object|null>}
 */
export async function findUserByHandle(handle) {
  return db.user.findUnique({
    where: { handle: handle.toLowerCase() },
  });
}

/**
 * Permanently deletes user account, cascading sessions, skills, and versions.
 * Blobs are retained as orphaned content-addressed files per S12.
 * @param {string} userId
 * @param {Object} context - { ip, userAgent }
 * @returns {Promise<boolean>}
 */
export async function deleteUserAccount(userId, { ip = null, userAgent = null } = {}) {
  await db.$transaction(async (tx) => {
    // 1. Delete all skills owned by user (which cascades versions and files)
    await tx.skill.deleteMany({
      where: { ownerId: userId },
    });

    // 2. Delete any skill versions authored by user
    await tx.skillVersion.deleteMany({
      where: { createdById: userId },
    });

    // 3. Delete user (cascades sessions, accounts)
    await tx.user.delete({
      where: { id: userId },
    });
  });

  await createAuditLog({
    actorId: userId,
    action: 'user.account_delete',
    targetType: 'User',
    targetId: userId,
    ip,
    userAgent,
  });

  return true;
}
