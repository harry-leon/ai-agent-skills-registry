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
          message: 'The SKILL.md file has no content.',
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
          message:
            'The SKILL.md file is missing a YAML frontmatter block between "---" markers at the beginning of the file.',
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
          message: `Invalid YAML syntax in frontmatter: ${err.message}`,
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
          message: 'The frontmatter YAML block must be a key-value object.',
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
        "The 'name' field in frontmatter must match '^[a-z0-9]+(-[a-z0-9]+)*$' and be at most 64 characters.",
    });
  }

  // 4. Validate 'description' (Blocking)
  const description = parsed.description;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push({
      code: 'DESCRIPTION_INVALID',
      message: "The 'description' field in frontmatter is required and cannot be empty.",
    });
  } else if (description.length > 1024) {
    errors.push({
      code: 'DESCRIPTION_INVALID',
      message: "The 'description' field in frontmatter cannot exceed 1024 characters.",
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
      message: 'Skill description is shorter than 20 characters; consider providing more details.',
    });
  }

  if (!body || body.trim().length === 0) {
    warnings.push({
      code: 'BODY_EMPTY',
      message: 'The SKILL.md body content is empty.',
    });
  }

  const lineCount = content.split(/\r?\n/).length;
  if (lineCount > 500) {
    warnings.push({
      code: 'SKILL_MD_TOO_LONG',
      message: `SKILL.md file is ${lineCount} lines long (recommended maximum 500 lines; consider splitting into references/ or scripts/).`,
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
