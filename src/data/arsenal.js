export const loadoutSlots = ['handgun', 'assault_rifle', 'machine_pistol', 'magnum', 'shotgun', 'heavy'];
export const rarityTiers = [
  { key: 'common', name: 'Common', level: 1, sockets: 0, color: '#a9bac1' },
  { key: 'rare', name: 'Rare', level: 3, sockets: 1, color: '#7dbef5' },
  { key: 'epic', name: 'Epic', level: 6, sockets: 1, color: '#c49bff' },
  { key: 'legendary', name: 'Legendary', level: 10, sockets: 2, color: '#f0c16c' },
];
const names = {
  handgun: ['Service', 'Lynx', 'Hammer', 'Sentinel'],
  assault_rifle: ['Patrol', 'Viper', 'Bastion', 'Vanguard'],
  machine_pistol: ['Vector', 'Wasp', 'Lockdown', 'Spectre'],
  magnum: ['Iron', 'Outlaw', 'Anvil', 'Judgment'],
  shotgun: ['Breacher', 'Scatter', 'Bulldog', 'Tempest'],
  sniper: ['Ranger', 'Longbow', 'Deadeye', 'Horizon'],
  rocket_launcher: ['RPG', 'Javelin', 'Siegebreaker', 'Atlas'],
};
export const attachments = [
  { key: 'incendiary', name: 'Incendiary', level: 3, icon: '♨', description: 'Direct hits burn for 12% damage per second, for 2 seconds.' },
  { key: 'cryo', name: 'Cryo rounds', level: 4, icon: '❄', description: 'Direct hits slow by 16% for 1 second. Stronger slows take priority.' },
  { key: 'concussive', name: 'Concussive', level: 6, icon: '✦', description: 'Every 5th shot stuns its target for 0.35s. Bosses resist most of the stun.' },
  { key: 'blast', name: 'Blast rounds', level: 8, icon: '◉', description: 'Hits deal 20% damage to nearby aliens in a small area. RPG: +12 blast radius instead.' },
];
export function classUnlocked(profile, key) { return key !== 'rocket_launcher' || profile.level >= 4; }
export function blueprintsFor(key) {
  return rarityTiers.map((tier, i) => ({ ...tier, name: names[key]?.[i] || tier.name }));
}
export function defaultArsenal() {
  return { heavy: 'sniper', blueprints: {}, attachments: {} };
}
export function normalizeArsenal(raw = {}, profile) {
  const result = defaultArsenal();
  result.heavy = raw?.heavy === 'rocket_launcher' && classUnlocked(profile, 'rocket_launcher') ? 'rocket_launcher' : 'sniper';
  for (const key of Object.keys(names)) {
    const tier = rarityTiers.find(t => t.key === raw?.blueprints?.[key] && profile.level >= t.level) || rarityTiers[0];
    result.blueprints[key] = tier.key;
    result.attachments[key] = [...new Set(Array.isArray(raw?.attachments?.[key]) ? raw.attachments[key] : [])]
      .filter(value => attachments.some(item => item.key === value && profile.level >= item.level)).slice(0, tier.sockets);
  }
  return result;
}
export function arsenalChoice(profile, key) {
  const blueprint = blueprintsFor(key).find(t => t.key === profile.arsenal?.blueprints?.[key]) || blueprintsFor(key)[0];
  return { blueprint, attachments: (profile.arsenal?.attachments?.[key] || []).slice(0, blueprint.sockets) };
}
export function equipBlueprint(profile, key, tierKey) {
  const tier = blueprintsFor(key).find(t => t.key === tierKey);
  if (!tier || !classUnlocked(profile,key) || profile.level < tier.level) return false;
  profile.arsenal.blueprints[key] = tier.key;
  profile.arsenal.attachments[key] = (profile.arsenal.attachments[key] || []).slice(0,tier.sockets);
  return true;
}
export function equipAttachment(profile, key, attachmentKey) {
  const item = attachments.find(t => t.key === attachmentKey);
  const choice = arsenalChoice(profile,key);
  if (!item || profile.level < item.level || !choice.blueprint.sockets) return false;
  const equipped = [...choice.attachments];
  if (equipped.includes(attachmentKey)) profile.arsenal.attachments[key] = equipped.filter(t => t !== attachmentKey);
  else if (equipped.length < choice.blueprint.sockets) profile.arsenal.attachments[key] = [...equipped,attachmentKey];
  else return false;
  return true;
}
export function applyArsenal(weapon, profile) {
  const { blueprint, attachments: mods } = arsenalChoice(profile, weapon.key);
  const next = { ...weapon, blueprint: blueprint.name, rarity: blueprint.key, attachments: mods };
  if (blueprint.key === 'rare') { next.atkSpeed *= 1.16; next.directDamage *= .94; next.reloadSpeed *= .92; }
  if (blueprint.key === 'epic') { next.directDamage *= 1.22; next.atkSpeed *= .94; }
  if (blueprint.key === 'legendary') { next.directDamage *= 1.1; next.range *= 1.1; next.reloadSpeed *= .92; }
  next.directDamage = Math.round(next.directDamage); next.range = Math.round(next.range);
  next.atkSpeed = Number(next.atkSpeed.toFixed(2)); next.reloadSpeed = Number(next.reloadSpeed.toFixed(2));
  return next;
}
export function equippedWeapons(weapons, profile) {
  return loadoutSlots.map(slot => weapons.find(w => w.key === (slot === 'heavy' ? profile.arsenal?.heavy || 'sniper' : slot))).filter(Boolean);
}
