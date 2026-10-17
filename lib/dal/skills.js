import crypto from 'node:crypto';
import { db } from '../db.js';
import { generateUniqueSlug } from '../skills/slug.js';
import { createAuditLog } from './audit.js';
import { AppError, ERROR_CODES } from '../api/errors.js';

/**
 * Creates a new Skill and its initial Version (v1) in ONE database transaction.
 *
 * @param {Object} params
 * @param {string} params.ownerId
 * @param {string} params.name
 * @param {string} params.description
 * @param {string[]} [params.tags]
 * @param {'PRIVATE'|'UNLISTED'|'PUBLIC'} [params.visibility]
 * @param {string} [params.message]
 * @param {Array<{ path: string, size: number, sha256: string, isText: boolean }>} params.files
 * @param {string} params.contentHash
 * @param {string} [params.sourceUrl]
 * @param {string} [params.sourceCommit]
 * @param {string} [params.forkedFromId]
 * @param {string} [params.forkedFromVersionId]
 * @param {Object} [params.forkedFromSnapshot]
 * @param {Object} [params.auditMeta]
 * @returns {Promise<Object>} Created skill with version details
 */
export async function createSkillWithVersion({
  ownerId,
  name,
  description,
  tags = [],
  visibility = 'PRIVATE',
  message = 'Initial version',
  files,
  contentHash,
  sourceUrl = null,
  sourceCommit = null,
  forkedFromId = null,
  forkedFromVersionId = null,
  forkedFromSnapshot = null,
  auditMeta = {},
}) {
  return await db.$transaction(async (tx) => {
    // 1. Generate unique slug under owner
    const slug = await generateUniqueSlug(tx, name, ownerId);

    // 2. Ensure Blob records exist for all files (deduplicated)
    for (const file of files) {
      await tx.blob.upsert({
        where: { sha256: file.sha256 },
        create: {
          sha256: file.sha256,
          size: file.size,
          storageKey: `blobs/${file.sha256}`,
        },
        update: {},
      });
    }

    // 3. Create Skill
    const skill = await tx.skill.create({
      data: {
        ownerId,
        slug,
        name,
        description,
        tags,
        visibility,
        sourceUrl,
        sourceCommit,
        forkedFromId,
        forkedFromVersionId,
        forkedFromSnapshot,
      },
    });

    // 4. Create SkillVersion (number 1)
    const version = await tx.skillVersion.create({
      data: {
        skillId: skill.id,
        number: 1,
        message,
        contentHash,
        createdById: ownerId,
      },
    });

    // 5. Create SkillFile rows
    for (const file of files) {
      const ext = file.path.split('.').pop() || '';
      const mimeType = file.isText ? 'text/plain' : 'application/octet-stream';

      await tx.skillFile.create({
        data: {
          versionId: version.id,
          path: file.path,
          blobSha256: file.sha256,
          size: file.size,
          mimeType,
          isText: file.isText,
        },
      });
    }

    // 6. Link currentVersionId
    const updatedSkill = await tx.skill.update({
      where: { id: skill.id },
      data: { currentVersionId: version.id },
      include: {
        owner: {
          select: { id: true, name: true, handle: true, image: true },
        },
        currentVersion: {
          include: { files: true },
        },
      },
    });

    // 7. Audit log (Section S10)
    await createAuditLog({
      actorId: ownerId,
      action: 'SKILL_CREATE',
      targetType: 'SKILL',
      targetId: skill.id,
      ip: auditMeta.ip || null,
      userAgent: auditMeta.userAgent || null,
      metadata: {
        slug,
        visibility,
        fileCount: files.length,
        contentHash,
      },
    });

    return updatedSkill;
  });
}

/**
 * Retrieves a skill by ID enforcing visibility rules inside the SQL query (Rule R4, S2).
 *
 * @param {Object|null} actor - Requesting user or null if anonymous
 * @param {string} id - Skill UUID
 * @returns {Promise<Object|null>}
 */
export async function getSkillById(actor, id) {
  // Authorization query scoping:
  // If actor is present: owner can view, or PUBLIC
  // If anonymous: only PUBLIC
  const visibilityCondition = actor
    ? {
        OR: [{ ownerId: actor.id }, { visibility: 'PUBLIC' }],
      }
    : { visibility: 'PUBLIC' };

  return await db.skill.findFirst({
    where: {
      id,
      deletedAt: null, // Rule S2: Soft-deleted skills are invisible
      ...visibilityCondition,
    },
    include: {
      owner: {
        select: { id: true, name: true, handle: true, image: true },
      },
      currentVersion: {
        include: { files: true },
      },
    },
  });
}

/**
 * Retrieves a skill by owner handle and slug.
 *
 * @param {Object|null} actor
 * @param {string} handle
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getSkillByHandleAndSlug(actor, handle, slug) {
  const owner = await db.user.findUnique({
    where: { handle },
    select: { id: true },
  });

  if (!owner) {
    return null;
  }

  const isOwner = actor && actor.id === owner.id;
  const visibilityCondition = isOwner ? {} : { visibility: 'PUBLIC' };

  return await db.skill.findFirst({
    where: {
      ownerId: owner.id,
      slug,
      deletedAt: null,
      ...visibilityCondition,
    },
    include: {
      owner: {
        select: { id: true, name: true, handle: true, image: true },
      },
      currentVersion: {
        include: { files: true },
      },
    },
  });
}

/**
 * Retrieves an UNLISTED skill by share token (Rule S2).
 *
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
export async function getSkillByShareToken(token) {
  if (!token) {
    return null;
  }

  return await db.skill.findFirst({
    where: {
      shareToken: token,
      visibility: 'UNLISTED',
      deletedAt: null,
    },
    include: {
      owner: {
        select: { id: true, name: true, handle: true, image: true },
      },
      currentVersion: {
        include: { files: true },
      },
    },
  });
}

/**
 * Updates metadata for a skill (tags and visibility only per S2, M1.4).
 * Enforces ownership and authorization inside query.
 *
 * @param {Object} actor - Authenticated user
 * @param {string} id - Skill ID
 * @param {Object} data
 * @param {string[]} [data.tags]
 * @param {'PRIVATE'|'UNLISTED'|'PUBLIC'} [data.visibility]
 * @param {Object} [auditMeta]
 * @returns {Promise<Object>}
 */
export async function updateSkillMetadata(actor, id, { tags, visibility }, auditMeta = {}) {
  // First check record existence for 404 vs 403 response rule (S2)
  const existing = await db.skill.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, ownerId: true, visibility: true },
  });

  if (!existing) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
  }

  if (existing.ownerId !== actor.id) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Bạn không có quyền chỉnh sửa kỹ năng này.', 403);
  }

  const updateData = {};
  if (tags !== undefined) updateData.tags = tags;
  if (visibility !== undefined) {
    updateData.visibility = visibility;
    // If setting to UNLISTED and no shareToken exists, generate one
    if (visibility === 'UNLISTED') {
      updateData.shareToken = crypto.randomBytes(24).toString('base64url');
    }
  }

  const updated = await db.skill.update({
    where: { id },
    data: updateData,
    include: {
      owner: {
        select: { id: true, name: true, handle: true },
      },
      currentVersion: true,
    },
  });

  await createAuditLog({
    actorId: actor.id,
    action: 'SKILL_UPDATE',
    targetType: 'SKILL',
    targetId: id,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: {
      tagsChanged: tags !== undefined,
      visibilityChanged: visibility !== undefined,
      newVisibility: visibility,
    },
  });

  return updated;
}

/**
 * Soft deletes a skill (Rule S2: Soft-deleted skills are invisible to everyone).
 *
 * @param {Object} actor
 * @param {string} id
 * @param {Object} [auditMeta]
 * @returns {Promise<boolean>}
 */
export async function softDeleteSkill(actor, id, auditMeta = {}) {
  const existing = await db.skill.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, ownerId: true },
  });

  if (!existing) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
  }

  if (existing.ownerId !== actor.id) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Bạn không có quyền xóa kỹ năng này.', 403);
  }

  await db.skill.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    actorId: actor.id,
    action: 'SKILL_DELETE',
    targetType: 'SKILL',
    targetId: id,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: {},
  });

  return true;
}

/**
 * Manages share token for an UNLISTED skill (enable, rotate, disable).
 *
 * @param {Object} actor
 * @param {string} id
 * @param {'enable'|'rotate'|'disable'} action
 * @param {Object} [auditMeta]
 * @returns {Promise<Object>}
 */
export async function manageShareToken(actor, id, action, auditMeta = {}) {
  const existing = await db.skill.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, ownerId: true, shareToken: true, visibility: true },
  });

  if (!existing) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
  }

  if (existing.ownerId !== actor.id) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      'Bạn không có quyền quản lý liên kết chia sẻ cho kỹ năng này.',
      403,
    );
  }

  let newShareToken = null;
  let newVisibility = existing.visibility;

  if (action === 'enable' || action === 'rotate') {
    newShareToken = crypto.randomBytes(24).toString('base64url');
    newVisibility = 'UNLISTED';
  } else if (action === 'disable') {
    newShareToken = null;
    newVisibility = 'PRIVATE';
  } else {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Hành động không hợp lệ.', 422);
  }

  const updated = await db.skill.update({
    where: { id },
    data: {
      shareToken: newShareToken,
      visibility: newVisibility,
    },
    select: {
      id: true,
      shareToken: true,
      visibility: true,
    },
  });

  await createAuditLog({
    actorId: actor.id,
    action: 'SKILL_SHARE_TOKEN_UPDATE',
    targetType: 'SKILL',
    targetId: id,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: { action, visibility: newVisibility },
  });

  return updated;
}

/**
 * Lists skills owned by a user (dashboard view).
 *
 * @param {string} ownerId
 * @param {Object} [options]
 * @param {number} [options.limit]
 * @param {number} [options.offset]
 * @returns {Promise<{ skills: Array<Object>, total: number }>}
 */
export async function listOwnerSkills(ownerId, { limit = 20, offset = 0 } = {}) {
  const where = {
    ownerId,
    deletedAt: null,
  };

  const [skills, total] = await Promise.all([
    db.skill.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        currentVersion: {
          select: {
            id: true,
            number: true,
            message: true,
            contentHash: true,
            createdAt: true,
            _count: { select: { files: true } },
          },
        },
      },
    }),
    db.skill.count({ where }),
  ]);

  return { skills, total };
}
