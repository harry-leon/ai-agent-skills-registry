import { db } from '../db.js';
import { createAuditLog } from './audit.js';
import { AppError, ERROR_CODES } from '../api/errors.js';

/**
 * Creates a new immutable SkillVersion and updates the skill's currentVersionId in ONE transaction.
 *
 * @param {Object} params
 * @param {Object} params.actor
 * @param {string} params.skillId
 * @param {string} [params.message]
 * @param {string} params.name - re-derived from SKILL.md
 * @param {string} params.description - re-derived from SKILL.md
 * @param {Array<{ path: string, size: number, sha256: string, isText: boolean }>} params.files
 * @param {string} params.contentHash
 * @param {Object} [params.auditMeta]
 * @returns {Promise<Object>} The newly created version
 */
export async function createNewSkillVersion({
  actor,
  skillId,
  message = null,
  name,
  description,
  files,
  contentHash,
  auditMeta = {},
}) {
  return await db.$transaction(async (tx) => {
    // 1. Verify skill ownership and not deleted
    const skill = await tx.skill.findFirst({
      where: { id: skillId, deletedAt: null },
      select: { id: true, ownerId: true },
    });

    if (!skill) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy kỹ năng yêu cầu.', 404);
    }

    if (skill.ownerId !== actor.id) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Bạn không có quyền tạo phiên bản mới cho kỹ năng này.',
        403,
      );
    }

    // 2. Determine next version number
    const latestVersion = await tx.skillVersion.findFirst({
      where: { skillId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    const nextNumber = (latestVersion?.number || 1) + 1;

    // 3. Ensure Blob records exist for all files
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

    // 4. Create SkillVersion
    const version = await tx.skillVersion.create({
      data: {
        skillId,
        number: nextNumber,
        message,
        contentHash,
        createdById: actor.id,
      },
    });

    // 5. Create SkillFile rows
    for (const file of files) {
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

    // 6. Update Skill with new currentVersionId, and re-derived name & description from SKILL.md
    await tx.skill.update({
      where: { id: skillId },
      data: {
        currentVersionId: version.id,
        name: name || undefined,
        description: description || undefined,
      },
    });

    // 7. Audit log (Section S10)
    await createAuditLog({
      actorId: actor.id,
      action: 'VERSION_CREATE',
      targetType: 'VERSION',
      targetId: version.id,
      ip: auditMeta.ip || null,
      userAgent: auditMeta.userAgent || null,
      metadata: {
        skillId,
        number: nextNumber,
        contentHash,
        fileCount: files.length,
      },
    });

    return await tx.skillVersion.findUnique({
      where: { id: version.id },
      include: {
        files: true,
      },
    });
  });
}

/**
 * Retrieves a specific version of a skill by version number.
 *
 * @param {string} skillId
 * @param {number} number
 * @returns {Promise<Object|null>}
 */
export async function getSkillVersionByNumber(skillId, number) {
  return await db.skillVersion.findUnique({
    where: {
      skillId_number: {
        skillId,
        number,
      },
    },
    include: {
      files: true,
      createdBy: {
        select: { id: true, name: true, handle: true },
      },
    },
  });
}

/**
 * Lists version history for a skill.
 *
 * @param {string} skillId
 * @returns {Promise<Array<Object>>}
 */
export async function listSkillVersions(skillId) {
  return await db.skillVersion.findMany({
    where: { skillId },
    orderBy: { number: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, handle: true },
      },
      _count: {
        select: { files: true },
      },
    },
  });
}
