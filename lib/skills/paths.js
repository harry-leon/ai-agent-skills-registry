import { env } from '../env.js';

export class PathValidationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {string} [path]
   */
  constructor(code, message, path) {
    super(message);
    this.name = 'PathValidationError';
    this.code = code;
    this.path = path;
  }
}

/**
 * Checks if an entry path should be silently ignored (macOS/Windows metadata, git).
 * @param {string} rawPath
 * @returns {boolean}
 */
export function isIgnoredPath(rawPath) {
  const normalized = rawPath.normalize('NFC').replace(/\\/g, '/');
  const basename = normalized.split('/').filter(Boolean).pop() || '';

  if (normalized.startsWith('__MACOSX/') || normalized === '__MACOSX') {
    return true;
  }
  if (normalized.startsWith('.git/') || normalized === '.git') {
    return true;
  }
  if (basename === '.DS_Store' || basename === 'Thumbs.db') {
    return true;
  }
  return false;
}

/**
 * Normalizes and validates an individual relative path according to S6.3.
 * @param {string} rawPath
 * @returns {string} Normalized path
 */
export function normalizeAndValidatePath(rawPath) {
  if (typeof rawPath !== 'string') {
    throw new PathValidationError('INVALID_PATH', 'File path must be a string.');
  }

  // 1. Unicode NFC
  let p = rawPath.normalize('NFC');

  // 2. Check for NUL or control characters
  if (/[\x00-\x1F\x7F]/.test(p)) {
    throw new PathValidationError(
      'INVALID_PATH_CHARACTERS',
      'Path contains control characters or invalid NUL byte.',
      rawPath,
    );
  }

  // 3. Backslash to slash
  p = p.replace(/\\/g, '/');

  // 4. Reject drive letters (e.g. C:/)
  if (/^[a-zA-Z]:/.test(p)) {
    throw new PathValidationError(
      'ABSOLUTE_PATH_FORBIDDEN',
      'Drive letter paths are forbidden.',
      rawPath,
    );
  }

  // 5. Reject absolute paths
  if (p.startsWith('/')) {
    throw new PathValidationError(
      'ABSOLUTE_PATH_FORBIDDEN',
      'Absolute paths are forbidden.',
      rawPath,
    );
  }

  // Split into segments
  const segments = p.split('/');

  // 6. Reject empty segments (e.g. a//b, or trailing slash for files)
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === '') {
      throw new PathValidationError('EMPTY_PATH_SEGMENT', 'Path contains empty segments.', rawPath);
    }
    // 7. Reject .. or .
    if (seg === '.' || seg === '..') {
      throw new PathValidationError(
        'PATH_TRAVERSAL_FORBIDDEN',
        'Path traversal components (. or ..) are forbidden.',
        rawPath,
      );
    }
  }

  const normalized = segments.join('/');

  // 8. Max length limit (default 255)
  const maxLength = env.MAX_PATH_LENGTH || 255;
  if (normalized.length > maxLength) {
    throw new PathValidationError(
      'PATH_TOO_LONG',
      `Path exceeds maximum allowed length of ${maxLength} characters.`,
      rawPath,
    );
  }

  // 9. Max path depth (default 10)
  const maxDepth = env.MAX_PATH_DEPTH || 10;
  if (segments.length > maxDepth) {
    throw new PathValidationError(
      'PATH_TOO_DEEP',
      `Path depth exceeds maximum allowed limit of ${maxDepth} levels.`,
      rawPath,
    );
  }

  return normalized;
}

/**
 * Strips ONE wrapping top-level folder if and only if EVERY entry shares it.
 * E.g. ["my-skill/SKILL.md", "my-skill/docs/a.txt"] -> ["SKILL.md", "docs/a.txt"]
 * @param {string[]} paths
 * @returns {{ paths: string[], strippedPrefix: string|null }}
 */
export function stripCommonTopLevelFolder(paths) {
  if (!paths || paths.length === 0) {
    return { paths: [], strippedPrefix: null };
  }

  // Check if every path has at least one directory separator
  const firstSlashIdx = paths[0].indexOf('/');
  if (firstSlashIdx === -1) {
    return { paths, strippedPrefix: null };
  }

  const potentialPrefix = paths[0].slice(0, firstSlashIdx + 1);

  const allSharePrefix = paths.every(
    (p) => p.startsWith(potentialPrefix) && p.length > potentialPrefix.length,
  );

  if (!allSharePrefix) {
    return { paths, strippedPrefix: null };
  }

  const stripped = paths.map((p) => p.slice(potentialPrefix.length));
  return { paths: stripped, strippedPrefix: potentialPrefix };
}

/**
 * Validates a list of paths for case-insensitive collisions and duplicate entries.
 * @param {string[]} paths
 */
export function validateNoCollisions(paths) {
  const seenExact = new Set();
  const seenLower = new Map();

  for (const p of paths) {
    if (seenExact.has(p)) {
      throw new PathValidationError('DUPLICATE_FILE_PATH', `Duplicate file path detected: ${p}`, p);
    }
    seenExact.add(p);

    const lower = p.toLowerCase();
    if (seenLower.has(lower)) {
      throw new PathValidationError(
        'CASE_COLLISION_PATH',
        `Case collision detected: '${p}' and '${seenLower.get(lower)}'`,
        p,
      );
    }
    seenLower.set(lower, p);
  }
}
