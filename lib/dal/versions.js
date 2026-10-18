import { db } from '../db.js';
import { env } from '../env.js';
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
  return await db.$transaction(
    async (tx) => {
      // 1. Verify skill ownership and not deleted with Row-Level Lock (FOR UPDATE) to eliminate race conditions
      const skills = await tx.$queryRaw`
        SELECT id, "ownerId", visibility
        FROM "Skill"
        WHERE id = ${skillId}::uuid AND "deletedAt" IS NULL
        FOR UPDATE
      `;
      const skill = skills[0];

      if (!skill) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Skill not found.', 404);
      }

      if (skill.ownerId !== actor.id) {
        if (skill.visibility === 'PRIVATE' || skill.visibility === 'UNLISTED') {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Skill not found.', 404);
        }
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          'You do not have permission to publish a new version for this skill.',
          403,
        );
      }

      // 1b. Account Storage Quota Check (Rule: max 10MB per account)
      const maxAccountBytes = env.MAX_ACCOUNT_TOTAL_BYTES || 10 * 1024 * 1024;
      const currentStorageRes = await tx.$queryRaw`
        SELECT COALESCE(SUM(b.size), 0)::bigint as "totalSize"
        FROM (
          SELECT DISTINCT sf."blobSha256"
          FROM "SkillFile" sf
          INNER JOIN "SkillVersion" sv ON sv.id = sf."versionId"
          INNER JOIN "Skill" s ON s.id = sv."skillId"
          WHERE s."ownerId" = ${actor.id}::uuid AND s."deletedAt" IS NULL
        ) user_blobs
        INNER JOIN "Blob" b ON b.sha256 = user_blobs."blobSha256"
      `;
      const currentUsage = Number(currentStorageRes[0]?.totalSize || 0);
      const incomingSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

      if (currentUsage + incomingSize > maxAccountBytes) {
        const usedMb = (currentUsage / (1024 * 1024)).toFixed(2);
        const limitMb = (maxAccountBytes / (1024 * 1024)).toFixed(0);
        throw new AppError(
          ERROR_CODES.QUOTA_EXCEEDED || 'QUOTA_EXCEEDED',
          `Account storage quota exceeded (${usedMb} MB used of ${limitMb} MB limit). Please delete unused skills to free up storage.`,
          422,
        );
      }

      // 2. Determine next version number
      const latestVersion = await tx.skillVersion.findFirst({
        where: { skillId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      const nextNumber = latestVersion ? latestVersion.number + 1 : 1;

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

      // 5b. Extract searchText from SKILL.md body
      let searchBody = undefined;
      if (files) {
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

      // 6. Update Skill with new currentVersionId, and re-derived name & description from SKILL.md
      await tx.skill.update({
        where: { id: skillId },
        data: {
          currentVersionId: version.id,
          name: name || undefined,
          description: description || undefined,
          searchText: searchBody || undefined,
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
    },
    { maxWait: 10000, timeout: 30000 },
  );
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
