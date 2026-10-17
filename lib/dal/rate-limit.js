import { db } from '../db.js';

/**
 * Increments and returns the hit count for a rate limit bucket in PostgreSQL.
 * @param {string} key
 * @param {Date} windowStart
 * @returns {Promise<number>} Current hit count in window
 */
export async function incrementBucket(key, windowStart) {
  const result = await db.$queryRaw`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
    RETURNING "count";
  `;
  return result[0]?.count || 1;
}

/**
 * Cleans up expired rate limit buckets older than retention cutoff.
 * @param {Date} cutoffDate
 * @returns {Promise<number>} Number of deleted rows
 */
export async function cleanupExpiredBuckets(cutoffDate) {
  const result = await db.rateLimitBucket.deleteMany({
    where: {
      windowStart: {
        lt: cutoffDate,
      },
    },
  });
  return result.count;
}
