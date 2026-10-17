import YAML from 'yaml';

/**
 * Validates SKILL.md frontmatter and structure according to S6.8.
 * @param {string} content
 * @returns {{
 *   valid: boolean,
 *   errors: Array<{ code: string, message: string }>,
 *   warnings: Array<{ code: string, message: string }>,
 *   metadata: { name: string, description: string, body: string, [key: string]: any } | null
 * }}
 */
export function validateSkillMarkdown(content) {
  const errors = [];
  const warnings = [];

  if (typeof content !== 'string' || content.trim().length === 0) {
    return {
      valid: false,
      errors: [
        {
          code: 'SKILL_MD_EMPTY',
          message: 'Tệp SKILL.md không có nội dung.',
        },
      ],
      warnings: [],
      metadata: null,
    };
  }

  // 1. Check for YAML frontmatter fences at the top
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      valid: false,
      errors: [
        {
          code: 'YAML_INVALID',
          message: 'Tệp SKILL.md thiếu khối frontmatter YAML giữa hai dòng "---" ở đầu tệp.',
        },
      ],
      warnings: [],
      metadata: null,
    };
  }

  const rawYaml = match[1];
  const body = match[2] || '';

  // 2. Parse YAML safely with core schema (Rule R8: NEVER evaluate code)
  let parsed = null;
  try {
    parsed = YAML.parse(rawYaml, { schema: 'core', maxAliasCount: 100 });
  } catch (err) {
    return {
      valid: false,
      errors: [
        {
          code: 'YAML_INVALID',
          message: `Cú pháp YAML trong frontmatter không hợp lệ: ${err.message}`,
        },
      ],
      warnings: [],
      metadata: null,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      errors: [
        {
          code: 'YAML_INVALID',
          message: 'Khối frontmatter YAML phải là một đối tượng chứa các thuộc tính (key-value).',
        },
      ],
      warnings: [],
      metadata: null,
    };
  }

  // 3. Validate 'name' (Blocking)
  const name = parsed.name;
  const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!name || typeof name !== 'string' || !nameRegex.test(name) || name.length > 64) {
    errors.push({
      code: 'NAME_INVALID',
      message:
        "Trường 'name' trong frontmatter phải khớp với định dạng '^[a-z0-9]+(-[a-z0-9]+)*$' và dài tối đa 64 ký tự.",
    });
  }

  // 4. Validate 'description' (Blocking)
  const description = parsed.description;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push({
      code: 'DESCRIPTION_INVALID',
      message: "Trường 'description' trong frontmatter là bắt buộc và không được để trống.",
    });
  } else if (description.length > 1024) {
    errors.push({
      code: 'DESCRIPTION_INVALID',
      message: "Trường 'description' trong frontmatter không được vượt quá 1024 ký tự.",
    });
  }

  // If there are blocking errors, return immediately
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      metadata: null,
    };
  }

  // 5. Warnings (Non-blocking)
  if (description && description.trim().length < 20) {
    warnings.push({
      code: 'DESCRIPTION_SHORT',
      message: 'Mô tả kỹ năng ngắn hơn 20 ký tự, nên bổ sung chi tiết hơn cho người dùng.',
    });
  }

  if (!body || body.trim().length === 0) {
    warnings.push({
      code: 'BODY_EMPTY',
      message: 'Phần thân tài liệu SKILL.md đang để trống.',
    });
  }

  const lineCount = content.split(/\r?\n/).length;
  if (lineCount > 500) {
    warnings.push({
      code: 'SKILL_MD_TOO_LONG',
      message: `Tệp SKILL.md dài ${lineCount} dòng (khuyến nghị tối đa 500 dòng, nên chia nhỏ thành thư mục references/ hoặc scripts/).`,
    });
  }

  return {
    valid: true,
    errors: [],
    warnings,
    metadata: {
      ...parsed,
      name,
      description: description.trim(),
      body: body.trim(),
    },
  };
}
