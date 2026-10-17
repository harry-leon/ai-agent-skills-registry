import { db } from '../db.js';

/**
 * Checks database connectivity for readiness probes.
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  await db.$queryRaw`SELECT 1`;
  return true;
}
