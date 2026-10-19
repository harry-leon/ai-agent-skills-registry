export const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'explore',
  'public',
  'favorites',
  'about',
  'settings',
  'login',
  'register',
  'dashboard',
  'import',
  'share',
  's',
  'www',
]);

const HANDLE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates whether a handle conforms to rules:
 * - 3 to 30 characters
 * - lowercase alphanumeric and hyphens [a-z0-9-]
 * - no leading or trailing hyphens
 * - not in reserved words list
 * @param {string} handle
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateHandle(handle) {
  if (typeof handle !== 'string') {
    return { valid: false, error: 'Handle is invalid.' };
  }

  const normalized = handle.toLowerCase().trim();

  if (normalized.length < 3 || normalized.length > 30) {
    return { valid: false, error: 'Handle must be between 3 and 30 characters.' };
  }

  if (!HANDLE_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Handle may only contain lowercase letters (a-z), numbers (0-9), and hyphens (-), without leading or trailing hyphens.',
    };
  }

  if (RESERVED_HANDLES.has(normalized)) {
    return {
      valid: false,
      error: 'This handle is reserved by the system. Please choose another.',
    };
  }

  return { valid: true };
}
