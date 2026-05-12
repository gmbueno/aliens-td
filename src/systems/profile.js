import { PLAYER_PROFILE_KEY, createDefaultProfile, xpNeeded } from "../data/player.js";
import { SP_PER_LEVEL, createDefaultSkills, skillTree, spentSkillPoints } from "../data/skills.js";

export function normalizeProfile(rawProfile = {}) {
  const base = createDefaultProfile();
  const skills = { ...createDefaultSkills(), ...(rawProfile.skills || {}) };
  for (const skill of skillTree) {
    skills[skill.key] = Math.min(skill.maxRank, Math.max(0, Number(skills[skill.key]) || 0));
  }
  const profile = {
    ...base,
    ...rawProfile,
    level: Math.max(1, Number(rawProfile.level) || base.level),
    xp: Math.max(0, Number(rawProfile.xp) || 0),
    skills,
  };
  const earned = Math.max(0, profile.level - 1) * SP_PER_LEVEL;
  const available = Math.max(Number(rawProfile.skillPoints) || 0, earned - spentSkillPoints(profile));
  profile.skillPoints = Math.max(0, available);
  return profile;
}

export function loadProfile(storage = localStorage) {
  try {
    return normalizeProfile(JSON.parse(storage.getItem(PLAYER_PROFILE_KEY)) || {});
  } catch {
    return normalizeProfile();
  }
}

export function saveProfile(profile, storage = localStorage) {
  storage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
}

export function addXp(profile, amount) {
  profile.xp += amount;
  let needed = xpNeeded(profile.level);
  while (profile.xp >= needed) {
    profile.xp -= needed;
    profile.level += 1;
    profile.skillPoints += SP_PER_LEVEL;
    needed = xpNeeded(profile.level);
  }
}
