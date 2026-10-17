/**
 * Strips Vietnamese diacritics and converts string to a safe URL slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') {
    return 'skill';
  }

  let str = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Vietnamese specific replacements (đ -> d)
  str = str.replace(/[đĐ]/g, 'd');

  str = str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/[\s_-]+/g, '-') // collapse spaces, underscores, dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dashes

  return str || 'skill';
}

/**
 * Generates a unique slug for a skill under a given owner.
 * Appends -2, -3 if a collision occurs.
 * @param {Object} prismaClient - Prisma client or transaction
 * @param {string} baseName
 * @param {string} ownerId
 * @param {string} [excludeSkillId]
 * @returns {Promise<string>}
 */
export async function generateUniqueSlug(prismaClient, baseName, ownerId, excludeSkillId = null) {
  const baseSlug = slugify(baseName).slice(0, 50) || 'skill';
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prismaClient.skill.findFirst({
      where: {
        ownerId,
        slug: candidate,
        deletedAt: null,
        ...(excludeSkillId ? { NOT: { id: excludeSkillId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}
