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
    tower.weapon = applyTowerUpgrades(nextWeapon, tower);
    tower.range = tower.weapon.range;
    tower.ammo = Math.min(tower.ammo, nextWeapon.capacity);
  });
}

export const towerUpgradePaths = [
  { key: "power", name: "Firepower", detail: "+40% damage per rank", multiplier: 0.75 },
  { key: "tactical", name: "Control", detail: "+12% range · +15% fire rate per rank", multiplier: 0.65 },
];

export function towerUpgradeCost(tower, key) {
  const path = towerUpgradePaths.find((item) => item.key === key);
  return path ? Math.round(tower.weapon.price * path.multiplier * (1 + (tower.upgrades?.[key] || 0) * 0.9)) : Infinity;
}

export function applyTowerUpgrades(weapon, tower) {
  const power = tower.upgrades?.power || 0;
  const tactical = tower.upgrades?.tactical || 0;
  return {
    ...weapon,
    directDamage: Math.round(weapon.directDamage * (1 + power * 0.4) * (tower.pad === "power" ? 1.15 : 1)),
    range: Math.round(weapon.range * (1 + tactical * 0.12) * (tower.pad === "range" ? 1.18 : 1)),
    atkSpeed: Number((weapon.atkSpeed * (1 + tactical * 0.15)).toFixed(2)),
  };
}
