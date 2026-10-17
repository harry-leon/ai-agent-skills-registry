export const ACTIONS = {
  SKILL_READ: 'SKILL_READ',
  SKILL_WRITE: 'SKILL_WRITE',
  SKILL_DELETE: 'SKILL_DELETE',
  SKILL_FORK: 'SKILL_FORK',
  SKILL_SET_VISIBILITY: 'SKILL_SET_VISIBILITY',
};

/**
 * Pure authorization policy function.
 * @param {Object|null} actor - The authenticated user or null for public/anonymous
 * @param {string} action - One of ACTIONS
 * @param {Object} resource - The target resource (e.g. Skill record)
 * @returns {boolean} Whether action is permitted
 */
export function can(actor, action, resource) {
  if (!resource) return false;

  // Disabled users cannot perform any authenticated actions
  if (actor && actor.status === 'DISABLED') {
    return false;
  }

  // Soft-deleted skills are invisible and immutable to everyone (Section S2)
  if (resource.deletedAt) {
    return false;
  }

  const isOwner = Boolean(actor && actor.id && resource.ownerId && actor.id === resource.ownerId);

  switch (action) {
    case ACTIONS.SKILL_READ: {
      // Owner can always read their skills
      if (isOwner) return true;

      // Public skills are readable by anyone
      if (resource.visibility === 'PUBLIC') return true;

      // Unlisted skills are readable ONLY via valid share token
      if (resource.visibility === 'UNLISTED' && resource._accessViaShareToken === true) {
        return true;
      }

      // Private skills are readable by owner only
      return false;
    }

    case ACTIONS.SKILL_WRITE: {
      // Only the owner can edit the skill
      return isOwner;
    }

    case ACTIONS.SKILL_DELETE: {
      // Only the owner can delete the skill
      return isOwner;
    }

    case ACTIONS.SKILL_FORK: {
      // Forking requires a logged-in user
      if (!actor) return false;

      // Owner can fork their own skill
      if (isOwner) return true;

      // Public skills can be forked by any logged-in user
      if (resource.visibility === 'PUBLIC') return true;

      // Unlisted skills can be forked only if accessed via valid share token
      if (resource.visibility === 'UNLISTED' && resource._accessViaShareToken === true) {
        return true;
      }

      return false;
    }

    case ACTIONS.SKILL_SET_VISIBILITY: {
      // Only the owner can change visibility or share token
      return isOwner;
    }

    default:
      return false;
  }
}
