import { db, Prisma } from '../db.js';
import { AppError, ERROR_CODES } from '../api/errors.js';

/**
 * Searches and lists PUBLIC skills with weighted full-text search, unaccent, tag filter, and cursor pagination.
 * Rule S2: Only PUBLIC and non-deleted skills are returned.
 *
 * @param {Object} options
 * @param {string} [options.q] - Search query string
 * @param {string} [options.tag] - Filter by tag
 * @param {'updated'|'name'|'relevance'} [options.sort]
 * @param {'asc'|'desc'} [options.order]
 * @param {string} [options.cursor] - Skill ID cursor for pagination
 * @param {number} [options.limit] - Page size (1-50, default 20)
 * @returns {Promise<{ skills: Array<Object>, nextCursor: string|null, total: number }>}
 */
export async function searchPublicSkills({
  q = '',
  tag = '',
  sort = 'updated',
  order = 'desc',
  cursor = null,
  limit = 20,
  userId = null,
} = {}) {
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const cleanQ = typeof q === 'string' ? q.trim() : '';
  const cleanTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  const cleanSort = ['updated', 'name', 'relevance'].includes(sort) ? sort : 'updated';
  const cleanOrder = order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  // Base visibility and soft-deletion condition (Section S2)
  const whereClauses = [
    Prisma.sql`s."deletedAt" IS NULL`,
    Prisma.sql`s.visibility = 'PUBLIC'::"SkillVisibility"`,
  ];

  if (cleanTag) {
    whereClauses.push(Prisma.sql`${cleanTag} = ANY(s.tags)`);
  }

  if (cleanQ) {
    // Weighted full-text search vector + unaccent + trigram ILIKE
    whereClauses.push(Prisma.sql`(
      (
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.name, ''))), 'A') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.description, ''))), 'B') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(immutable_array_to_string(s.tags, ' '), ''))), 'B') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s."searchText", ''))), 'C')
      ) @@ websearch_to_tsquery('simple', immutable_unaccent(${cleanQ}))
      OR immutable_unaccent(s.name) ILIKE '%' || immutable_unaccent(${cleanQ}) || '%'
      OR immutable_unaccent(s.description) ILIKE '%' || immutable_unaccent(${cleanQ}) || '%'
    )`);
  }

  // Count total matching items
  const countWhere = Prisma.join(whereClauses, ' AND ');
  const countResult = await db.$queryRaw`
    SELECT COUNT(*)::int as total
    FROM "Skill" s
    WHERE ${countWhere}
  `;
  const total = countResult[0]?.total || 0;

  // Keyset cursor pagination tie-breaking
  if (cursor) {
    const cursorSkill = await db.skill.findUnique({
      where: { id: cursor },
      select: { id: true, name: true, updatedAt: true },
    });

    if (cursorSkill) {
      const cursorUuid = Prisma.sql`${cursorSkill.id}::uuid`;
      if (cleanSort === 'name') {
        if (cleanOrder === 'asc') {
          whereClauses.push(
            Prisma.sql`((s.name > ${cursorSkill.name}) OR (s.name = ${cursorSkill.name} AND s.id > ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        } else {
          whereClauses.push(
            Prisma.sql`((s.name < ${cursorSkill.name}) OR (s.name = ${cursorSkill.name} AND s.id < ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        }
      } else {
        // default: sort by updated
        const cursorTs = Prisma.sql`(${cursorSkill.updatedAt.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
        if (cleanOrder === 'asc') {
          whereClauses.push(
            Prisma.sql`((s."updatedAt" > ${cursorTs}) OR (s."updatedAt" = ${cursorTs} AND s.id > ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        } else {
          whereClauses.push(
            Prisma.sql`((s."updatedAt" < ${cursorTs}) OR (s."updatedAt" = ${cursorTs} AND s.id < ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        }
      }
    }
  }

  // Order clause
  let orderSql = Prisma.sql`ORDER BY s."updatedAt" DESC, s.id DESC`;
  if (cleanSort === 'name') {
    orderSql =
      cleanOrder === 'asc'
        ? Prisma.sql`ORDER BY s.name ASC, s.id ASC`
        : Prisma.sql`ORDER BY s.name DESC, s.id DESC`;
  } else if (cleanSort === 'relevance' && cleanQ) {
    orderSql = Prisma.sql`
      ORDER BY ts_rank(
        (
          setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.name, ''))), 'A') ||
          setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.description, ''))), 'B') ||
          setweight(to_tsvector('simple', immutable_unaccent(coalesce(immutable_array_to_string(s.tags, ' '), ''))), 'B') ||
          setweight(to_tsvector('simple', immutable_unaccent(coalesce(s."searchText", ''))), 'C')
        ),
        websearch_to_tsquery('simple', immutable_unaccent(${cleanQ}))
      ) DESC, s."updatedAt" DESC, s.id DESC
    `;
  } else if (cleanOrder === 'asc') {
    orderSql = Prisma.sql`ORDER BY s."updatedAt" ASC, s.id ASC`;
  }

  const finalWhere = Prisma.join(whereClauses, ' AND ');
  const fetchLimit = pageSize + 1;

  const rawSkills = await db.$queryRaw`
    SELECT 
      s.id,
      s."ownerId",
      s.slug,
      s.name,
      s.description,
      s.tags,
      s.visibility,
      s."shareToken",
      s."currentVersionId",
      s."forkedFromId",
      s."forkedFromVersionId",
      s."forkedFromSnapshot",
      s."sourceUrl",
      s."sourceCommit",
      s."createdAt",
      s."updatedAt",
      json_build_object(
        'id', u.id,
        'name', u.name,
        'handle', u.handle,
        'image', u.image
      ) AS owner,
      CASE WHEN v.id IS NOT NULL THEN
        json_build_object(
          'id', v.id,
          'number', v.number,
          'message', v.message,
          'contentHash', v."contentHash",
          'createdAt', v."createdAt",
          '_count', json_build_object('files', coalesce((SELECT count(*)::int FROM "SkillFile" sf WHERE sf."versionId" = v.id), 0))
        )
      ELSE NULL END AS "currentVersion",
      coalesce((SELECT count(*)::int FROM "FavoriteSkill" fs WHERE fs."skillId" = s.id), 0) AS "favoritesCount",
      ${userId ? Prisma.sql`EXISTS(SELECT 1 FROM "FavoriteSkill" fs WHERE fs."skillId" = s.id AND fs."userId" = ${userId}::uuid)` : Prisma.sql`false`} AS "isFavorited"
    FROM "Skill" s
    JOIN "User" u ON s."ownerId" = u.id
    LEFT JOIN "SkillVersion" v ON s."currentVersionId" = v.id
    WHERE ${finalWhere}
    ${orderSql}
    LIMIT ${fetchLimit}
  `;

  const hasMore = rawSkills.length > pageSize;
  const skills = hasMore ? rawSkills.slice(0, pageSize) : rawSkills;
  const nextCursor = hasMore ? skills[skills.length - 1].id : null;

  return {
    skills,
    nextCursor,
    total,
  };
}

/**
 * Searches and lists skills owned by the caller with tag/visibility filters and cursor pagination.
 *
 * @param {Object} actor - Authenticated user
 * @param {Object} options
 * @param {string} [options.q]
 * @param {string} [options.tag]
 * @param {'PRIVATE'|'UNLISTED'|'PUBLIC'} [options.visibility]
 * @param {'updated'|'name'} [options.sort]
 * @param {'asc'|'desc'} [options.order]
 * @param {string} [options.cursor]
 * @param {number} [options.limit]
 * @returns {Promise<{ skills: Array<Object>, nextCursor: string|null, total: number }>}
 */
export async function searchOwnerSkills(
  actor,
  {
    q = '',
    tag = '',
    visibility = '',
    sort = 'updated',
    order = 'desc',
    cursor = null,
    limit = 20,
  } = {},
) {
  if (!actor || !actor.id) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Authentication required.', 401);
  }

  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const cleanQ = typeof q === 'string' ? q.trim() : '';
  const cleanTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  const cleanVis = ['PRIVATE', 'UNLISTED', 'PUBLIC'].includes(visibility) ? visibility : '';
  const cleanSort = ['updated', 'name'].includes(sort) ? sort : 'updated';
  const cleanOrder = order?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const whereClauses = [
    Prisma.sql`s."deletedAt" IS NULL`,
    Prisma.sql`s."ownerId" = ${actor.id}::uuid`,
  ];

  if (cleanVis) {
    whereClauses.push(Prisma.sql`s.visibility = ${cleanVis}::"SkillVisibility"`);
  }

  if (cleanTag) {
    whereClauses.push(Prisma.sql`${cleanTag} = ANY(s.tags)`);
  }

  if (cleanQ) {
    whereClauses.push(Prisma.sql`(
      (
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.name, ''))), 'A') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s.description, ''))), 'B') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(immutable_array_to_string(s.tags, ' '), ''))), 'B') ||
        setweight(to_tsvector('simple', immutable_unaccent(coalesce(s."searchText", ''))), 'C')
      ) @@ websearch_to_tsquery('simple', immutable_unaccent(${cleanQ}))
      OR immutable_unaccent(s.name) ILIKE '%' || immutable_unaccent(${cleanQ}) || '%'
      OR immutable_unaccent(s.description) ILIKE '%' || immutable_unaccent(${cleanQ}) || '%'
    )`);
  }

  const countWhere = Prisma.join(whereClauses, ' AND ');
  const countResult = await db.$queryRaw`
    SELECT COUNT(*)::int as total
    FROM "Skill" s
    WHERE ${countWhere}
  `;
  const total = countResult[0]?.total || 0;

  if (total === 0) {
    return { skills: [], nextCursor: null, total: 0 };
  }

  if (cursor) {
    const cursorSkill = await db.skill.findUnique({
      where: { id: cursor },
      select: { id: true, name: true, updatedAt: true },
    });

    if (cursorSkill) {
      const cursorUuid = Prisma.sql`${cursorSkill.id}::uuid`;
      if (cleanSort === 'name') {
        if (cleanOrder === 'asc') {
          whereClauses.push(
            Prisma.sql`((s.name > ${cursorSkill.name}) OR (s.name = ${cursorSkill.name} AND s.id > ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        } else {
          whereClauses.push(
            Prisma.sql`((s.name < ${cursorSkill.name}) OR (s.name = ${cursorSkill.name} AND s.id < ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        }
      } else {
        const cursorTs = Prisma.sql`(${cursorSkill.updatedAt.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
        if (cleanOrder === 'asc') {
          whereClauses.push(
            Prisma.sql`((s."updatedAt" > ${cursorTs}) OR (s."updatedAt" = ${cursorTs} AND s.id > ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        } else {
          whereClauses.push(
            Prisma.sql`((s."updatedAt" < ${cursorTs}) OR (s."updatedAt" = ${cursorTs} AND s.id < ${cursorUuid})) AND s.id != ${cursorUuid}`,
          );
        }
      }
    }
  }

  let orderSql = Prisma.sql`ORDER BY s."updatedAt" DESC, s.id DESC`;
  if (cleanSort === 'name') {
    orderSql =
      cleanOrder === 'asc'
        ? Prisma.sql`ORDER BY s.name ASC, s.id ASC`
        : Prisma.sql`ORDER BY s.name DESC, s.id DESC`;
  } else if (cleanOrder === 'asc') {
    orderSql = Prisma.sql`ORDER BY s."updatedAt" ASC, s.id ASC`;
  }

  const finalWhere = Prisma.join(whereClauses, ' AND ');
  const fetchLimit = pageSize + 1;

  const rawSkills = await db.$queryRaw`
    SELECT 
      s.id,
      s."ownerId",
      s.slug,
      s.name,
      s.description,
      s.tags,
      s.visibility,
      s."shareToken",
      s."currentVersionId",
      s."forkedFromId",
      s."forkedFromVersionId",
      s."forkedFromSnapshot",
      s."sourceUrl",
      s."sourceCommit",
      s."createdAt",
      s."updatedAt",
      json_build_object(
        'id', u.id,
        'name', u.name,
        'handle', u.handle,
        'image', u.image
      ) AS owner,
      CASE WHEN v.id IS NOT NULL THEN
        json_build_object(
          'id', v.id,
          'number', v.number,
          'message', v.message,
          'contentHash', v."contentHash",
          'createdAt', v."createdAt",
          '_count', json_build_object('files', coalesce((SELECT count(*)::int FROM "SkillFile" sf WHERE sf."versionId" = v.id), 0))
        )
      ELSE NULL END AS "currentVersion"
    FROM "Skill" s
    JOIN "User" u ON s."ownerId" = u.id
    LEFT JOIN "SkillVersion" v ON s."currentVersionId" = v.id
    WHERE ${finalWhere}
    ${orderSql}
    LIMIT ${fetchLimit}
  `;

  const hasMore = rawSkills.length > pageSize;
  const skills = hasMore ? rawSkills.slice(0, pageSize) : rawSkills;
  const nextCursor = hasMore ? skills[skills.length - 1].id : null;

  return {
    skills,
    nextCursor,
    total,
  };
}
