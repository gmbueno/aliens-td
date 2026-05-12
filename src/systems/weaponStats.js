import { skillRank, skillTree } from "../data/skills.js";

function applyNumericEffect(value, effect, rank) {
  const min = effect.min ?? -Infinity;
  const scaled = Math.max(min, value * (1 + effect.perRank * rank));
  return typeof effect.decimals === "number"
    ? Number(scaled.toFixed(effect.decimals))
    : Math.round(scaled);
}

export function applySkillBonuses(weapon, profile) {
  const nextWeapon = { ...weapon };
  for (const skill of skillTree) {
    const rank = skillRank(profile, skill.key);
    if (!rank || !skill.weaponEffect) continue;
    const { stat } = skill.weaponEffect;
    nextWeapon[stat] = applyNumericEffect(weapon[stat], skill.weaponEffect, rank);
  }
  return nextWeapon;
}

export function effectiveWeaponByKey(weapons, key, profile) {
  const weapon = weapons.find((item) => item.key === key);
  return weapon ? applySkillBonuses(weapon, profile) : null;
}

export function refreshTowerSkillBonuses(towers, weapons, profile) {
  towers.forEach((tower) => {
    const nextWeapon = effectiveWeaponByKey(weapons, tower.weapon.key, profile);
    if (!nextWeapon) return;
    tower.weapon = nextWeapon;
    tower.range = nextWeapon.range;
    tower.ammo = Math.min(tower.ammo, nextWeapon.capacity);
  });
}
