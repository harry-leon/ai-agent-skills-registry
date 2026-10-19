import { db } from '../db.js';
import { AppError, ERROR_CODES } from '../api/errors.js';
import { createAuditLog } from './audit.js';

/**
 * Toggles a skill favorite for an authenticated user.
 *
 * @param {string} userId - User ID UUID
 * @param {string} skillId - Skill ID UUID
 * @param {Object} [auditMeta]
 * @returns {Promise<{ favorited: boolean, count: number }>}
 */
export async function toggleSkillFavorite(userId, skillId, auditMeta = {}) {
  if (!userId || !skillId) {
    throw new AppError(
      ERROR_CODES.UNAUTHENTICATED,
      'Authentication required to favorite skills.',
      401,
    );
  }

  // 1. Verify skill exists and is accessible
  const skill = await db.skill.findFirst({
    where: { id: skillId, deletedAt: null },
    select: { id: true, ownerId: true, visibility: true },
  });

  if (!skill) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Skill not found.', 404);
  }

  // If skill is PRIVATE, only the owner can favorite it
  if (skill.visibility === 'PRIVATE' && skill.ownerId !== userId) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Skill not found.', 404);
  }

  // 2. Check if favorite already exists
  const existing = await db.favoriteSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  let favorited = false;

  if (existing) {
    // Remove favorite
    await db.favoriteSkill.delete({
      where: { id: existing.id },
    });
    favorited = false;
  } else {
    // Add favorite
    await db.favoriteSkill.create({
      data: {
        userId,
        skillId,
      },
    });
    favorited = true;
  }

  // 3. Get updated count
  const count = await db.favoriteSkill.count({
    where: { skillId },
  });

  // 4. Audit log
  await createAuditLog({
    actorId: userId,
    action: favorited ? 'SKILL_FAVORITE' : 'SKILL_UNFAVORITE',
    targetType: 'SKILL',
    targetId: skillId,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: { favorited, count },
  });

  return { favorited, count };
}

/**
 * Checks if a user has favorited a specific skill.
 *
 * @param {string|null} userId
 * @param {string} skillId
 * @returns {Promise<boolean>}
 */
export async function isSkillFavorited(userId, skillId) {
  if (!userId || !skillId) return false;
  const fav = await db.favoriteSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
    select: { id: true },
  });
  return Boolean(fav);
}

/**
 * Retrieves total favorite count for a skill.
 *
 * @param {string} skillId
 * @returns {Promise<number>}
 */
export async function getSkillFavoriteCount(skillId) {
  if (!skillId) return 0;
  return await db.favoriteSkill.count({
    where: { skillId },
  });
}

/**
 * Retrieves paginated list of skills favorited by a user.
 *
 * @param {string} userId
 * @param {Object} options
 * @param {string} [options.cursor] - Favorite ID cursor
 * @param {number} [options.limit=20]
 * @returns {Promise<{ skills: Array<Object>, nextCursor: string|null, total: number }>}
 */
export async function getUserFavoriteSkills(userId, { cursor = null, limit = 20 } = {}) {
  if (!userId) {
    return { skills: [], nextCursor: null, total: 0 };
  }

  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const favorites = await db.favoriteSkill.findMany({
    where: {
      userId,
      skill: {
        deletedAt: null,
      },
    },
    take: pageSize + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      skill: {
        include: {
          owner: {
            select: { id: true, name: true, handle: true, image: true },
          },
          currentVersion: {
            include: {
              _count: {
                select: { files: true },
              },
            },
          },
          _count: {
            select: { favorites: true },
          },
        },
      },
    },
  });

  if (favorites.length === 0) {
    return { skills: [], nextCursor: null, total: 0 };
  }

  let total;
  if (!cursor && favorites.length <= pageSize) {
    total = favorites.length;
  } else {
    total = await db.favoriteSkill.count({
      where: {
        userId,
        skill: {
          deletedAt: null,
        },
      },
    });
  }

  const hasMore = favorites.length > pageSize;
  const items = hasMore ? favorites.slice(0, pageSize) : favorites;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const skills = items
    .filter((f) => f.skill && !f.skill.deletedAt)
    .map((f) => ({
      ...f.skill,
      isFavorited: true,
      favoritesCount: f.skill._count?.favorites || 0,
      favoritedAt: f.createdAt,
    }));

  return {
    skills,
    nextCursor,
    total,
  };
}
