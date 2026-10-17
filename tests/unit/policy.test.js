import { describe, it, expect } from 'vitest';
import { can, ACTIONS } from '@/lib/auth/policy.js';

describe('Authorization Policy: can(actor, action, resource)', () => {
  const owner = { id: 'user-1', status: 'ACTIVE' };
  const otherUser = { id: 'user-2', status: 'ACTIVE' };
  const disabledOwner = { id: 'user-1', status: 'DISABLED' };
  const anonymous = null;

  const publicSkill = { id: 'skill-1', ownerId: 'user-1', visibility: 'PUBLIC', deletedAt: null };
  const privateSkill = { id: 'skill-2', ownerId: 'user-1', visibility: 'PRIVATE', deletedAt: null };
  const unlistedSkillNoToken = {
    id: 'skill-3',
    ownerId: 'user-1',
    visibility: 'UNLISTED',
    deletedAt: null,
    _accessViaShareToken: false,
  };
  const unlistedSkillWithToken = {
    id: 'skill-3',
    ownerId: 'user-1',
    visibility: 'UNLISTED',
    deletedAt: null,
    _accessViaShareToken: true,
  };
  const deletedSkill = {
    id: 'skill-4',
    ownerId: 'user-1',
    visibility: 'PUBLIC',
    deletedAt: new Date(),
  };

  describe('Owner permissions', () => {
    it('owner can read, write, delete, fork, and set visibility on private skills', () => {
      expect(can(owner, ACTIONS.SKILL_READ, privateSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_WRITE, privateSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_DELETE, privateSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_FORK, privateSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_SET_VISIBILITY, privateSkill)).toBe(true);
    });

    it('owner can read, write, delete, fork, and set visibility on public skills', () => {
      expect(can(owner, ACTIONS.SKILL_READ, publicSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_WRITE, publicSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_DELETE, publicSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_FORK, publicSkill)).toBe(true);
      expect(can(owner, ACTIONS.SKILL_SET_VISIBILITY, publicSkill)).toBe(true);
    });

    it('owner cannot perform any action on soft-deleted skills', () => {
      expect(can(owner, ACTIONS.SKILL_READ, deletedSkill)).toBe(false);
      expect(can(owner, ACTIONS.SKILL_WRITE, deletedSkill)).toBe(false);
      expect(can(owner, ACTIONS.SKILL_DELETE, deletedSkill)).toBe(false);
      expect(can(owner, ACTIONS.SKILL_FORK, deletedSkill)).toBe(false);
      expect(can(owner, ACTIONS.SKILL_SET_VISIBILITY, deletedSkill)).toBe(false);
    });

    it('disabled owner is rejected for all actions', () => {
      expect(can(disabledOwner, ACTIONS.SKILL_READ, privateSkill)).toBe(false);
      expect(can(disabledOwner, ACTIONS.SKILL_WRITE, privateSkill)).toBe(false);
      expect(can(disabledOwner, ACTIONS.SKILL_DELETE, privateSkill)).toBe(false);
      expect(can(disabledOwner, ACTIONS.SKILL_FORK, privateSkill)).toBe(false);
    });
  });

  describe('Other user permissions', () => {
    it('other user cannot read, write, delete, or fork private skills', () => {
      expect(can(otherUser, ACTIONS.SKILL_READ, privateSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_WRITE, privateSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_DELETE, privateSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_FORK, privateSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_SET_VISIBILITY, privateSkill)).toBe(false);
    });

    it('other user can read and fork public skills, but cannot write or delete them', () => {
      expect(can(otherUser, ACTIONS.SKILL_READ, publicSkill)).toBe(true);
      expect(can(otherUser, ACTIONS.SKILL_FORK, publicSkill)).toBe(true);
      expect(can(otherUser, ACTIONS.SKILL_WRITE, publicSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_DELETE, publicSkill)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_SET_VISIBILITY, publicSkill)).toBe(false);
    });

    it('other user cannot access unlisted skills without share token', () => {
      expect(can(otherUser, ACTIONS.SKILL_READ, unlistedSkillNoToken)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_FORK, unlistedSkillNoToken)).toBe(false);
    });

    it('other user can read and fork unlisted skills when accessed via valid share token', () => {
      expect(can(otherUser, ACTIONS.SKILL_READ, unlistedSkillWithToken)).toBe(true);
      expect(can(otherUser, ACTIONS.SKILL_FORK, unlistedSkillWithToken)).toBe(true);
      expect(can(otherUser, ACTIONS.SKILL_WRITE, unlistedSkillWithToken)).toBe(false);
      expect(can(otherUser, ACTIONS.SKILL_DELETE, unlistedSkillWithToken)).toBe(false);
    });
  });

  describe('Anonymous permissions', () => {
    it('anonymous user can read public skills only, and cannot fork or mutate anything', () => {
      expect(can(anonymous, ACTIONS.SKILL_READ, publicSkill)).toBe(true);
      expect(can(anonymous, ACTIONS.SKILL_FORK, publicSkill)).toBe(false);
      expect(can(anonymous, ACTIONS.SKILL_WRITE, publicSkill)).toBe(false);
      expect(can(anonymous, ACTIONS.SKILL_DELETE, publicSkill)).toBe(false);
      expect(can(anonymous, ACTIONS.SKILL_READ, privateSkill)).toBe(false);
    });

    it('anonymous user can read unlisted skill via share token but cannot fork', () => {
      expect(can(anonymous, ACTIONS.SKILL_READ, unlistedSkillWithToken)).toBe(true);
      expect(can(anonymous, ACTIONS.SKILL_FORK, unlistedSkillWithToken)).toBe(false);
    });
  });
});
