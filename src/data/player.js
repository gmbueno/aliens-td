import { createDefaultSkills } from "./skills.js";

export const PLAYER_PROFILE_KEY = "aliens-tower-defense-profile";

export function createDefaultProfile() {
  return {
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: createDefaultSkills(),
  };
}

export function xpNeeded(level) {
  return 75 + (level * 25);
}
