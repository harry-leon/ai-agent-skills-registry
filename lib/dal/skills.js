import crypto from 'node:crypto';
import { db } from '../db.js';
import { generateUniqueSlug } from '../skills/slug.js';
import { createAuditLog } from './audit.js';
import { AppError, ERROR_CODES } from '../api/errors.js';
import { can, ACTIONS } from '../auth/policy.js';
import { fetchAndIngestGitHubRepo } from '../skills/github.js';

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
  searchText = null,
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

    // 2b. Extract searchText from SKILL.md body (Section 5: first 50k chars)
    let searchBody = searchText;
    if (!searchBody && files) {
      const skillMd = files.find((f) => f.path === 'SKILL.md');
      if (skillMd) {
        let raw = '';
        if (skillMd.buffer) raw = skillMd.buffer.toString('utf-8');
        else if (typeof skillMd.content === 'string') raw = skillMd.content;
        if (raw) {
          const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
          searchBody = (match ? match[1] : raw).slice(0, 50000);
        }
      }
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
        searchText: searchBody || null,
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
export async function getSkillById(actor, id, shareToken = null) {
  const orConditions = [{ visibility: 'PUBLIC' }];
  if (actor) {
    orConditions.push({ ownerId: actor.id });
  }
  if (shareToken) {
    orConditions.push({ visibility: 'UNLISTED', shareToken });
  }

  const skill = await db.skill.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: orConditions,
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

  if (skill && shareToken && skill.shareToken === shareToken) {
    skill._accessViaShareToken = true;
  }

  return skill;
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

  const skill = await db.skill.findFirst({
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

  if (skill) {
    skill._accessViaShareToken = true;
  }

  return skill;
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

/**
 * Forks a skill into the acting user's library.
 *
 * @param {Object} params
 * @param {Object} params.actor - Authenticated user
 * @param {string} params.skillId - ID of skill to fork
 * @param {string} [params.shareToken] - Optional share token if source is UNLISTED
 * @param {Object} [params.auditMeta] - Audit metadata
 * @returns {Promise<Object>} The newly created forked skill
 */
export async function forkSkill({ actor, skillId, shareToken = null, auditMeta = {} }) {
  if (!actor || !actor.id) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Yêu cầu đăng nhập để nhân bản kỹ năng.', 401);
  }

  // 1. Fetch source skill with owner and current version
  const source = await db.skill.findFirst({
    where: { id: skillId, deletedAt: null },
    include: {
      owner: { select: { id: true, handle: true, name: true } },
      currentVersion: {
        include: { files: true },
      },
    },
  });

  if (!source) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
  }

  // Check if accessed via share token
  const sourceWithContext = {
    ...source,
    _accessViaShareToken: Boolean(
      shareToken && source.visibility === 'UNLISTED' && source.shareToken === shareToken,
    ),
  };

  // Response rule S2: If actor cannot read, return 404 (do not reveal existence)
  if (!can(actor, ACTIONS.SKILL_READ, sourceWithContext)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
  }

  // If actor can read but cannot fork, return 403
  if (!can(actor, ACTIONS.SKILL_FORK, sourceWithContext)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, 'Bạn không có quyền nhân bản kỹ năng này.', 403);
  }

  if (!source.currentVersion) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      'Kỹ năng nguồn không có phiên bản nào để sao chép.',
      422,
    );
  }

  const snapshot = {
    ownerHandle: source.owner.handle,
    slug: source.slug,
    name: source.name,
    versionNumber: source.currentVersion.number,
  };

  const forkedSkill = await db.$transaction(async (tx) => {
    // Generate unique slug under the fork recipient
    const slug = await generateUniqueSlug(tx, source.name || source.slug, actor.id);

    // Create the forked Skill row (PRIVATE by default per prompt)
    const newSkill = await tx.skill.create({
      data: {
        ownerId: actor.id,
        slug,
        name: source.name,
        description: source.description,
        tags: source.tags || [],
        visibility: 'PRIVATE',
        shareToken: null,
        forkedFromId: source.id,
        forkedFromVersionId: source.currentVersion.id,
        forkedFromSnapshot: snapshot,
        searchText: source.searchText,
      },
    });

    // Create initial version for the fork (v1)
    const newVersion = await tx.skillVersion.create({
      data: {
        skillId: newSkill.id,
        number: 1,
        message: `Forked from @${source.owner.handle}/${source.slug} (v${source.currentVersion.number})`,
        contentHash: source.currentVersion.contentHash,
        createdById: actor.id,
      },
    });

    // Point SkillFile rows directly to existing blob SHA-256 hashes (zero blob duplication)
    for (const file of source.currentVersion.files) {
      await tx.skillFile.create({
        data: {
          versionId: newVersion.id,
          path: file.path,
          blobSha256: file.blobSha256,
          size: file.size,
          mimeType: file.mimeType,
          isText: file.isText,
        },
      });
    }

    // Set currentVersionId
    const updated = await tx.skill.update({
      where: { id: newSkill.id },
      data: { currentVersionId: newVersion.id },
      include: {
        owner: { select: { id: true, name: true, handle: true } },
        currentVersion: {
          include: { files: true },
        },
      },
    });

    return updated;
  });

  await createAuditLog({
    actorId: actor.id,
    action: 'SKILL_FORK',
    targetType: 'SKILL',
    targetId: forkedSkill.id,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: {
      sourceSkillId: source.id,
      sourceVersionId: source.currentVersion.id,
      sourceOwnerHandle: source.owner.handle,
      sourceSlug: source.slug,
    },
  });

  return forkedSkill;
}

/**
 * Imports a skill from GitHub into the user's library.
 *
 * @param {Object} params
 * @param {Object} params.actor - Authenticated user
 * @param {string} params.url - GitHub URL
 * @param {string} [params.ref] - Branch/tag/commit override
 * @param {string} [params.subpath] - Subpath override
 * @param {string[]} [params.tags]
 * @param {'PRIVATE'|'UNLISTED'|'PUBLIC'} [params.visibility]
 * @param {Object} [params.auditMeta]
 * @param {typeof fetch} [params.fetchFn]
 * @returns {Promise<{ skill: Object, validation: { warnings: Array<Object> } }>}
 */
export async function importSkillFromGitHub({
  actor,
  url,
  ref,
  subpath,
  tags = [],
  visibility = 'PRIVATE',
  auditMeta = {},
  fetchFn = fetch,
}) {
  if (!actor || !actor.id) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Yêu cầu đăng nhập để nhập kỹ năng.', 401);
  }

  const { ingestResult, sourceUrl, sourceCommit } = await fetchAndIngestGitHubRepo({
    url,
    ref,
    subpath,
    fetchFn,
  });

  const skill = await createSkillWithVersion({
    ownerId: actor.id,
    name: ingestResult.skillMd.name,
    description: ingestResult.skillMd.description,
    tags,
    visibility,
    message: `Nhập từ GitHub (${sourceUrl})`,
    files: ingestResult.files,
    contentHash: ingestResult.contentHash,
    sourceUrl,
    sourceCommit,
    auditMeta,
  });

  await createAuditLog({
    actorId: actor.id,
    action: 'SKILL_IMPORT_GITHUB',
    targetType: 'SKILL',
    targetId: skill.id,
    ip: auditMeta.ip || null,
    userAgent: auditMeta.userAgent || null,
    metadata: {
      sourceUrl,
      sourceCommit,
    },
  });

  return {
    skill,
    validation: {
      warnings: ingestResult.warnings || [],
    },
  };
}
