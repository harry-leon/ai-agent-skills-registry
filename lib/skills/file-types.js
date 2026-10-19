export const TEXT_EXTENSIONS = new Set([
  'md',
  'markdown',
  'txt',
  'json',
  'yaml',
  'yml',
  'toml',
  'csv',
  'tsv',
  'xml',
  'html',
  'css',
  'js',
  'mjs',
  'cjs',
  'ts',
  'py',
  'sh',
  'bash',
  'ps1',
  'rb',
  'go',
  'rs',
  'sql',
  'ini',
  'cfg',
]);

export const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'pdf',
  'svg', // SVG is XML text, but listed under binary allowlist and treated as download-only
]);

export const FORBIDDEN_EXECUTABLE_EXTENSIONS = new Set([
  'exe',
  'dll',
  'so',
  'dylib',
  'bin',
  'jar',
  'msi',
  'dmg',
  'apk',
  'zip',
  'tar',
  'gz',
  '7z',
  'bz2',
  'rar',
  'iso',
  'com',
  'bat',
  'cmd',
  'scr',
  'vbs',
  'elf',
]);

export class FileValidationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {string} [path]
   */
  constructor(code, message, path) {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
    this.path = path;
  }
}

/**
 * Checks if a filename is a secret-bearing file per S6.6.
 * @param {string} filePath
 * @returns {boolean}
 */
export function isSecretFilename(filePath) {
  const basename = filePath.split('/').pop() || '';
  const lower = basename.toLowerCase();

  // .env and .env.* are forbidden EXCEPT .env.example
  if (lower === '.env.example') {
    return false;
  }
  if (lower === '.env' || lower.startsWith('.env.')) {
    return true;
  }

  // *.pem, *.key, *.p12
  if (lower.endsWith('.pem') || lower.endsWith('.key') || lower.endsWith('.p12')) {
    return true;
  }

  // id_rsa*
  if (lower.startsWith('id_rsa')) {
    return true;
  }

  // .npmrc, .netrc
  if (lower === '.npmrc' || lower === '.netrc') {
    return true;
  }

  return false;
}

/**
 * Verifies magic bytes for binary formats.
 * @param {string} ext
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export function matchesMagicBytes(ext, buffer) {
  if (!buffer || buffer.length === 0) {
    return false;
  }

  switch (ext) {
    case 'png':
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case 'jpg':
    case 'jpeg':
      // FF D8 FF
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case 'gif':
      // GIF87a or GIF89a
      if (buffer.length < 6) return false;
      const gifHeader = buffer.subarray(0, 6).toString('ascii');
      return gifHeader === 'GIF87a' || gifHeader === 'GIF89a';

    case 'webp':
      // RIFF....WEBP
      if (buffer.length < 12) return false;
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );

    case 'pdf':
      // %PDF
      return buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF';

    case 'svg': {
      // SVG is XML text containing <svg
      const head = buffer.subarray(0, 4096).toString('utf8');
      return /<svg[\s>]/i.test(head);
    }

    default:
      return false;
  }
}

/**
 * Validates a file entry according to S6.5 and S6.6.
 * @param {string} filePath
 * @param {Buffer} buffer
 * @returns {{ isText: boolean, isBinary: boolean }}
 */
export function validateFileContent(filePath, buffer) {
  // 1. Check secret filenames
  if (isSecretFilename(filePath)) {
    throw new FileValidationError(
      'FORBIDDEN_SECRET_FILE',
      `Secret or private key files are forbidden from upload: ${filePath}`,
      filePath,
    );
  }

  // Extract extension
  const basename = filePath.split('/').pop() || '';
  const isEnvExample = basename.toLowerCase() === '.env.example';
  const dotIdx = basename.lastIndexOf('.');
  const ext = dotIdx !== -1 ? basename.slice(dotIdx + 1).toLowerCase() : '';

  // 2. Reject executable / archive extensions
  if (FORBIDDEN_EXECUTABLE_EXTENSIONS.has(ext)) {
    throw new FileValidationError(
      'EXECUTABLE_ARCHIVE_FORBIDDEN',
      `Executable or archive file format forbidden: .${ext}`,
      filePath,
    );
  }

  // 3. Allowlist check (.env.example is treated as valid configuration text)
  const isText = TEXT_EXTENSIONS.has(ext) || isEnvExample;
  const isBinary = BINARY_EXTENSIONS.has(ext);

  if (!isText && !isBinary) {
    throw new FileValidationError(
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file format: ${ext ? `.${ext}` : basename}`,
      filePath,
    );
  }

  // 4. Validate Text files (Must be valid UTF-8 without NUL bytes)
  if (isText) {
    // Check for NUL byte
    if (buffer.includes(0x00)) {
      throw new FileValidationError(
        'TEXT_CONTAINS_NUL_BYTE',
        `Text file must not contain NUL bytes (0x00): ${filePath}`,
        filePath,
      );
    }

    // Check valid UTF-8
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      decoder.decode(buffer);
    } catch {
      throw new FileValidationError(
        'INVALID_UTF8_ENCODING',
        `Text file contains invalid UTF-8 encoding: ${filePath}`,
        filePath,
      );
    }

    return { isText: true, isBinary: false };
  }

  // 5. Validate Binary files (Must match magic bytes)
  if (!matchesMagicBytes(ext, buffer)) {
    throw new FileValidationError(
      'INVALID_MAGIC_BYTES',
      `Binary file magic bytes do not match declared extension: ${filePath}`,
      filePath,
    );
  }

  return { isText: false, isBinary: true };
}
