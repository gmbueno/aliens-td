import { defaultArsenal } from "./arsenal.js";
import { DEFAULT_EQUIPPED_ACTIVE_KEY, createDefaultSkills } from "./skills.js";

export const PLAYER_PROFILE_KEY = "aliens-tower-defense-profile";

export function createDefaultProfile() {
  return {
    schemaVersion: 7,
    weaponKills: {}, slotRewards: {}, onboarding: { researchSpent:false, towerUpgraded:false, powerUsed:false, seenWeapons:[] }, legacyActives: [],
    level: 1,
    xp: 0,
    skillPoints: 0,
    skills: createDefaultSkills(),
    equippedActiveKey: DEFAULT_EQUIPPED_ACTIVE_KEY,
    equippedSecondaryActiveKey: null,
    missions: {},
    arsenal: defaultArsenal(),
    settings: { muted: false },
  };
}

export function xpNeeded(level) {
  return 90 + (level * 30);
}
