import { db } from '../db.js';
import { logger } from '../logger.js';

/**
 * Append-only audit logger.
 * Note: There are deliberately NO update or delete functions in this module.
 * @param {Object} entry
 * @param {string|null} [entry.actorId]
 * @param {string} entry.action
 * @param {string} entry.targetType
 * @param {string|null} [entry.targetId]
 * @param {string|null} [entry.ip]
 * @param {string|null} [entry.userAgent]
 * @param {Object|null} [entry.metadata]
 * @returns {Promise<Object>}
 */
export async function createAuditLog({
  actorId = null,
  action,
  targetType,
  targetId = null,
  ip = null,
  userAgent = null,
  metadata = null,
}) {
  try {
    const log = await db.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        ip,
        userAgent,
        metadata: metadata || undefined,
      },
    });
    return log;
  } catch (err) {
    // Audit logging failure should not break critical paths, but must be logged
    logger.error({ err: err.message, action, targetType, targetId }, 'Failed to record audit log');
    return null;
  }
}
