import { DEFAULT_EQUIPPED_ACTIVE_KEY, createDefaultSkills } from "./skills.js";

export const PLAYER_PROFILE_KEY = "aliens-tower-defense-profile";

export function createDefaultProfile() {
  return {
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: createDefaultSkills(),
    equippedActiveKey: DEFAULT_EQUIPPED_ACTIVE_KEY,
    missions: {},
    settings: { muted: false, autoWave: false },
  };
}

export function xpNeeded(level) {
  return 90 + (level * 30);
}
