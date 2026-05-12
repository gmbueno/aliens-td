export const SP_PER_LEVEL = 10;

export const skillTree = [
  {
    key: "damage",
    name: "Weapons Training",
    description: "+8% tower damage per rank.",
    maxRank: 5,
    cost: 5,
    weaponEffect: { stat: "directDamage", perRank: 0.08 },
  },
  {
    key: "range",
    name: "Sensor Sweep",
    description: "+6% tower range per rank.",
    maxRank: 5,
    cost: 5,
    weaponEffect: { stat: "range", perRank: 0.06 },
  },
  {
    key: "fireRate",
    name: "Trigger Discipline",
    description: "+5% attack speed per rank.",
    maxRank: 5,
    cost: 5,
    weaponEffect: { stat: "atkSpeed", perRank: 0.05, decimals: 2 },
  },
  {
    key: "reload",
    name: "Rapid Reload",
    description: "-6% reload time per rank.",
    maxRank: 5,
    cost: 5,
    weaponEffect: { stat: "reloadSpeed", perRank: -0.06, decimals: 2, min: 0.35 },
  },
];

export function createDefaultSkills() {
  return Object.fromEntries(skillTree.map((skill) => [skill.key, 0]));
}

export function skillRank(profile, skillKey) {
  return Number(profile.skills?.[skillKey]) || 0;
}

export function spentSkillPoints(profile) {
  return skillTree.reduce((total, skill) => total + skillRank(profile, skill.key) * skill.cost, 0);
}

export function canBuySkill(profile, skill) {
  return skillRank(profile, skill.key) < skill.maxRank && profile.skillPoints >= skill.cost;
}

export function buySkill(profile, skillKey) {
  const skill = skillTree.find((item) => item.key === skillKey);
  if (!skill || !canBuySkill(profile, skill)) return false;
  profile.skills[skill.key] = skillRank(profile, skill.key) + 1;
  profile.skillPoints -= skill.cost;
  return true;
}
