export const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'explore',
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
    return { valid: false, error: 'Tên định danh (handle) không hợp lệ.' };
  }

  const normalized = handle.toLowerCase().trim();

  if (normalized.length < 3 || normalized.length > 30) {
    return { valid: false, error: 'Handle phải có độ dài từ 3 đến 30 ký tự.' };
  }

  if (!HANDLE_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Handle chỉ được chứa chữ cái thường (a-z), chữ số (0-9) và dấu gạch ngang (-), không bắt đầu hoặc kết thúc bằng gạch ngang.',
    };
  }

  if (RESERVED_HANDLES.has(normalized)) {
    return {
      valid: false,
      error: 'Handle này thuộc danh sách tên hệ thống dành riêng. Vui lòng chọn tên khác.',
    };
  }

  return { valid: true };
}
