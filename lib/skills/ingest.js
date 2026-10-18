import { env } from '../env.js';
import { storage } from '../storage/index.js';
import { computeSha256, computeVersionContentHash } from './hash.js';
import {
  isIgnoredPath,
  normalizeAndValidatePath,
  stripCommonTopLevelFolder,
  validateNoCollisions,
} from './paths.js';
import { validateFileContent } from './file-types.js';
import { validateSkillMarkdown } from './validate.js';
import { extractZipEntries } from './zip.js';

export class IngestionError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Array<any>} [details]
   */
  constructor(code, message, details = []) {
    super(message);
    this.name = 'IngestionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Universal Ingestion Pipeline per Section S6.
 *
 * @param {Object} options
 * @param {Buffer} [options.zipBuffer] - ZIP file buffer if uploading zip
 * @param {Array<{ rawPath: string, buffer: Buffer }>} [options.entries] - Array of file entries
 * @param {boolean} [options.persistBlobs] - Whether to write blobs to storage driver (default: true)
 * @returns {Promise<{
 *   valid: boolean,
 *   files: Array<{ path: string, size: number, sha256: string, isText: boolean, buffer?: Buffer }>,
 *   skillMd: { raw: string, name: string, description: string, body: string, frontmatter: Object },
 *   contentHash: string,
 *   warnings: Array<{ code: string, message: string }>,
 *   totalBytes: number,
 *   fileCount: number
 * }>}
 */
export async function ingestSkill({ zipBuffer, entries = [], persistBlobs = true }) {
  let rawEntries = [];

  // 1. If zipBuffer provided, decompress with streaming security checks
  if (zipBuffer) {
    rawEntries = await extractZipEntries(zipBuffer);
  } else if (entries && Array.isArray(entries)) {
    rawEntries = entries;
  } else {
    throw new IngestionError(
      'SKILL_EMPTY',
      'No files or archive found to ingest.',
    );
  }

  // 2. Filter out ignored entries (macOS metadata, git, Thumbs.db)
  const nonIgnored = rawEntries.filter((e) => !isIgnoredPath(e.rawPath));

  if (nonIgnored.length === 0) {
    throw new IngestionError(
      'SKILL_EMPTY',
      'Upload package contains no valid files after filtering system metadata.',
    );
  }

  // 3. Normalize individual paths and check individual path security rules
  const normalizedEntries = nonIgnored.map((entry) => {
    const norm = normalizeAndValidatePath(entry.rawPath);
    return {
      path: norm,
      buffer: entry.buffer,
    };
  });

  // 4. Strip ONE wrapping top-level folder ONLY IF every entry shares it
  const allPaths = normalizedEntries.map((e) => e.path);
  const { paths: strippedPaths } = stripCommonTopLevelFolder(allPaths);
  for (let i = 0; i < normalizedEntries.length; i++) {
    normalizedEntries[i].path = strippedPaths[i];
  }

  // 5. Check duplicate paths and case-insensitive collisions
  validateNoCollisions(normalizedEntries.map((e) => e.path));

  // 6. Max files limit (default 500)
  const maxFiles = env.MAX_SKILL_FILES || 500;
  if (normalizedEntries.length > maxFiles) {
    throw new IngestionError(
      'TOO_MANY_FILES',
      `Number of files in skill (${normalizedEntries.length}) exceeds maximum limit of ${maxFiles} files.`,
    );
  }

  // 7. Check SKILL.md presence (Rule S6.7)
  const skillMdEntries = normalizedEntries.filter((e) => e.path === 'SKILL.md');
  const allSkillMdNamed = normalizedEntries.filter(
    (e) => e.path.endsWith('/SKILL.md') || e.path === 'SKILL.md',
  );

  if (allSkillMdNamed.length > 1) {
    throw new IngestionError(
      'MULTIPLE_SKILLS_USE_BULK_IMPORT',
      'Multiple SKILL.md files detected in upload package. Please upload each skill separately.',
    );
  }

  if (skillMdEntries.length === 0) {
    throw new IngestionError(
      'SKILL_MD_MISSING',
      'Skill must contain a SKILL.md file at root level.',
    );
  }

  const rootSkillMd = skillMdEntries[0];

  // 8. Total skill size check (default 50MB)
  const maxSkillBytes = env.MAX_SKILL_TOTAL_BYTES || 50 * 1024 * 1024;
  const maxFileBytes = env.MAX_FILE_BYTES || 10 * 1024 * 1024;
  let totalBytes = 0;

  for (const entry of normalizedEntries) {
    if (entry.buffer.length > maxFileBytes) {
      const entrySizeStr =
        entry.buffer.length >= 1024 * 1024
          ? `${(entry.buffer.length / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(entry.buffer.length / 1024)} KB`;
      const maxLimitStr =
        maxFileBytes >= 1024 * 1024
          ? `${(maxFileBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(maxFileBytes / 1024)} KB`;
      throw new IngestionError(
        'FILE_TOO_LARGE',
        `File ${entry.path} size (${entrySizeStr}) exceeds maximum limit of ${maxLimitStr}.`,
      );
    }
    totalBytes += entry.buffer.length;
  }

  if (totalBytes > maxSkillBytes) {
    const totalSizeStr =
      totalBytes >= 1024 * 1024
        ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(totalBytes / 1024)} KB`;
    const maxSkillStr =
      maxSkillBytes >= 1024 * 1024
        ? `${(maxSkillBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(maxSkillBytes / 1024)} KB`;
    throw new IngestionError(
      'SKILL_TOO_LARGE',
      `Total skill size (${totalSizeStr}) exceeds maximum limit of ${maxSkillStr}.`,
    );
  }

  // 9. Validate each file's content (secret filenames, extension allowlist, UTF-8 text, magic bytes)
  const processedFiles = [];
  for (const entry of normalizedEntries) {
    const { isText } = validateFileContent(entry.path, entry.buffer);
    const sha256 = await computeSha256(entry.buffer);

    processedFiles.push({
      path: entry.path,
      size: entry.buffer.length,
      sha256,
      isText,
      buffer: entry.buffer,
    });
  }

  // 10. Validate SKILL.md frontmatter (Rule S6.8)
  const skillMdText = rootSkillMd.buffer.toString('utf8');
  const skillMdReport = validateSkillMarkdown(skillMdText);

  if (!skillMdReport.valid) {
    throw new IngestionError(
      skillMdReport.errors[0]?.code || 'YAML_INVALID',
      skillMdReport.errors[0]?.message || 'Invalid SKILL.md contents.',
      skillMdReport.errors,
    );
  }

  // 11. Compute version contentHash (Rule S6.9)
  const contentHash = computeVersionContentHash(
    processedFiles.map((f) => ({ path: f.path, sha256: f.sha256 })),
  );

  // 12. If persistBlobs is enabled, store blobs in content-addressed storage (Rule S6.9)
  if (persistBlobs) {
    const storedBlobHashes = [];
    try {
      for (const file of processedFiles) {
        await storage.putBlob(file.sha256, file.buffer);
        storedBlobHashes.push(file.sha256);
      }
    } catch (storageErr) {
      // In case of catastrophic storage write error, fail closed
      throw new IngestionError(
        'STORAGE_ERROR',
        `Error writing file to storage: ${storageErr.message}`,
      );
    }
  }

  return {
    valid: true,
    files: processedFiles,
    skillMd: {
      raw: skillMdText,
      name: skillMdReport.metadata.name,
      description: skillMdReport.metadata.description,
      body: skillMdReport.metadata.body,
      frontmatter: skillMdReport.metadata,
    },
    contentHash,
    warnings: skillMdReport.warnings,
    totalBytes,
    fileCount: processedFiles.length,
  };
}
