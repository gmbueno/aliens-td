import { models } from './models.js';
import { assets } from './assets.js';
const originalArt={handgun:assets.slots.weapons.handgun,assault_rifle:assets.slots.weapons.assaultRifle,machine_pistol:assets.slots.weapons.machinePistol,magnum:assets.slots.weapons.magnum,shotgun:assets.slots.weapons.shotgun,sniper:assets.slots.weapons.sniper};
export const loadoutSlots = ['handgun', 'assault_rifle', 'machine_pistol', 'magnum', 'shotgun', 'heavy'];
export const rarityTiers = [
  { key: 'common', name: 'Common', level: 1, sockets: 1, color: '#a9bac1' },
  { key: 'rare', name: 'Rare', level: 3, sockets: 1, color: '#7dbef5' },
  { key: 'epic', name: 'Epic', level: 6, sockets: 2, color: '#c49bff' },
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
  { cost:40, key: 'incendiary', name: 'Incendiary', level: 3, icon: '♨', description: 'Direct hits burn for 12% damage per second, for 2 seconds.' },
  { cost:60, key: 'cryo', name: 'Cryo rounds', level: 4, icon: '❄', description: 'Direct hits slow by 16% for 1 second. Stronger slows take priority.' },
  { cost:80, key: 'concussive', name: 'Concussive', level: 6, icon: '✦', description: 'Every 5th shot stuns its target for 0.35s. Bosses resist most of the stun.' },
  { cost:100, key: 'blast', name: 'Blast rounds', level: 8, icon: '◉', description: 'Hits deal 20% damage to nearby aliens in a small area. RPG: +12 blast radius instead.' },
];
export const classMilestones = {handgun:0,assault_rifle:0,machine_pistol:1,shotgun:2,magnum:3,sniper:4,rocket_launcher:6,flamethrower:8,laser:10};
export const campaignClears = profile => Object.values(profile.missions || {}).filter(m => m.clears > 0).length;
export function classUnlocked(profile,key) { return key in classMilestones && campaignClears(profile) >= classMilestones[key]; }
export function classRequirement(key) { const n=classMilestones[key];return n===1?'Complete your first mission':n?`Complete ${n} different missions`:'Starter weapon'; }
export function nextClassUnlock(profile) { const cleared=campaignClears(profile);return Object.entries(classMilestones).filter(([,n])=>n>cleared).sort((a,b)=>a[1]-b[1])[0] || null; }
export function blueprintsFor(key) {
  return rarityTiers.map((tier, i) => ({ ...tier, ...models[key]?.[i], art: i===0 && originalArt[key] ? originalArt[key] : `assets/frontier/weapons/${key}-${tier.key}.png` }));
}
export function defaultArsenal() {
  return { heavy: 'sniper', support: 'machine_pistol', blueprints: {}, attachments: {}, unlocked: [], unlockedAttachments: [], spSpent: 0 };
}
export function normalizeArsenal(raw = {}, profile) {
  const result = defaultArsenal();
  result.heavy = ['rocket_launcher','laser'].includes(raw?.heavy) && classUnlocked(profile, raw.heavy) ? raw.heavy : 'sniper';
  result.support=raw?.support==='flamethrower'&&classUnlocked(profile,'flamethrower')?'flamethrower':'machine_pistol';
  const legacy=profile.schemaVersion<4;
  const valid=new Set(Object.keys(models).flatMap(key=>rarityTiers.map(t=>`${key}:${t.key}`)));
  result.unlocked=[...new Set((Array.isArray(raw?.unlocked)?raw.unlocked:[]).filter(k=>valid.has(k)))];
  result.unlockedAttachments=[...new Set((Array.isArray(raw?.unlockedAttachments)?raw.unlockedAttachments:[]).filter(k=>attachments.some(a=>a.key===k)))];
  result.spSpent=Number.isFinite(raw?.spSpent)?Math.max(0,Math.floor(raw.spSpent)):0;
  if(legacy){
   result.unlocked=[...new Set([...result.unlocked,...Object.keys(models).flatMap(key=>rarityTiers.filter(t=>profile.level>=t.level).map(t=>`${key}:${t.key}`))])];
   result.unlockedAttachments=attachments.filter(a=>profile.level>=a.level).map(a=>a.key);
  }
  for (const key of Object.keys(models)) {
    const tier = rarityTiers.find(t => t.key === raw?.blueprints?.[key] && (t.key==='common' || result.unlocked.includes(`${key}:${t.key}`))) || rarityTiers[0];
    result.blueprints[key] = tier.key;
    result.attachments[key] = [...new Set(Array.isArray(raw?.attachments?.[key]) ? raw.attachments[key] : [])]
      .filter(value => attachments.some(item => item.key === value && result.unlockedAttachments.includes(value))).slice(0, tier.sockets);
  }
  return result;
}
export function arsenalChoice(profile, key) {
  const blueprint = blueprintsFor(key).find(t => t.key === profile.arsenal?.blueprints?.[key]) || blueprintsFor(key)[0];
  return { blueprint, attachments: (profile.arsenal?.attachments?.[key] || []).slice(0, blueprint.sockets) };
}
export function equipBlueprint(profile, key, tierKey) {
  const tier = blueprintsFor(key).find(t => t.key === tierKey);
  if (!tier || !classUnlocked(profile,key) || !blueprintOwned(profile,key,tierKey)) return false;
  profile.arsenal.blueprints[key] = tier.key;
  profile.arsenal.attachments[key] = (profile.arsenal.attachments[key] || []).slice(0,tier.sockets);
  return true;
}
export function equipAttachment(profile, key, attachmentKey) {
  const item = attachments.find(t => t.key === attachmentKey);
  const choice = arsenalChoice(profile,key);
  if (!item || !profile.arsenal.unlockedAttachments.includes(item.key) || !choice.blueprint.sockets) return false;
  const equipped = [...choice.attachments];
  if (equipped.includes(attachmentKey)) profile.arsenal.attachments[key] = equipped.filter(t => t !== attachmentKey);
  else if (equipped.length < choice.blueprint.sockets) profile.arsenal.attachments[key] = [...equipped,attachmentKey];
  else return false;
  return true;
}
export function applyArsenal(weapon, profile) {
  const { blueprint, attachments: mods } = arsenalChoice(profile, weapon.key);
  const next = { ...weapon, ...blueprint.stats, blueprint: blueprint.name, rarity: blueprint.key, attachments: mods,
    critChance:.05,critDamage:1.6,fireMode: blueprint.mode, modelDescription: blueprint.description, modelArt: true,
    asset: blueprint.art, placedAsset: blueprint.art, hudAsset: blueprint.art };
  next.soundPitch=Math.max(.85,Math.min(1.12,Math.pow(weapon.directDamage/next.directDamage,.12)));
  next.soundGain=Math.max(.8,Math.min(1.1,Math.pow(next.directDamage/weapon.directDamage,.1)));
  next.directDamage = Math.round(next.directDamage); next.range = Math.round(next.range);
  next.atkSpeed = Number(next.atkSpeed.toFixed(2)); next.reloadSpeed = Number(next.reloadSpeed.toFixed(2));
  return next;
}
export function equippedWeapons(weapons, profile) {
  return loadoutSlots.map(slot => weapons.find(w => w.key === (slot === 'heavy' ? profile.arsenal?.heavy || 'sniper' : slot === 'machine_pistol' ? profile.arsenal?.support || 'machine_pistol' : slot))).filter(Boolean);
}

export function blueprintOwned(profile,key,tier) {
 return tier==='common' || Boolean(profile.arsenal?.unlocked?.includes(`${key}:${tier}`));
}
export function unlockBlueprint(profile,key,tier) {
 if(!models[key] || !rarityTiers.some(t=>t.key===tier))return false;
 if(blueprintOwned(profile,key,tier))return false;
 profile.arsenal.unlocked.push(`${key}:${tier}`);return true;
}
export function purchaseBlueprint(profile,key,tier) {
 if(tier!=='rare' || !classUnlocked(profile,key) || blueprintOwned(profile,key,tier) || profile.skillPoints<8)return false;
 profile.skillPoints-=8;profile.arsenal.spSpent+=8;unlockBlueprint(profile,key,tier);equipBlueprint(profile,key,tier);return true;
}
export function purchaseAttachment(profile,key) {
 const item=attachments.find(a=>a.key===key);
 if(!item || profile.arsenal.unlockedAttachments.includes(key) || profile.salvage<item.cost)return false;
 profile.salvage-=item.cost;profile.arsenal.unlockedAttachments.push(key);return true;
}
export function cacheReward(profile,level) {
 if(profile.caches[level.id])return null;
 profile.caches[level.id]=true;profile.salvage+=30;
 const attachment=attachments.find(a=>!profile.arsenal.unlockedAttachments.includes(a.key));
 if(attachment){profile.arsenal.unlockedAttachments.push(attachment.key);return {name:attachment.name,attachment:attachment.key,salvage:30};}
 const keys=Object.keys(models).filter(key=>classUnlocked(profile,key)),index=(Number(level.id.split('_')[1])-1)%keys.length;
 const tier=level.stage===6?'legendary':'epic';
 const candidates=[keys[index],...keys.filter(k=>k!==keys[index])];
 const key=candidates.find(k=>!blueprintOwned(profile,k,tier));
 if(key){unlockBlueprint(profile,key,tier);return {name:blueprintsFor(key).find(t=>t.key===tier).name,tier,weapon:key,salvage:30};}
 profile.salvage+=20;return {name:'50 Salvage',tier:null,salvage:50};
}
export function eliteDrop(profile,enemy,randomValue) {
 const elite=['alien_boss','alien_saucer','alien_steadfast','alien_broodmother'].includes(enemy.key);
 if(!elite)return null;
 profile.lootRolls++;profile.lootMisses++;
 const roll=randomValue ?? Math.random();
 if(roll>=(enemy.key==='alien_boss'||enemy.key==='alien_saucer'?.18:.04) && profile.lootMisses<20)return null;
 profile.lootMisses=0;profile.salvage+=8;
 const remaining=Object.keys(models).filter(k=>classUnlocked(profile,k)&&!blueprintOwned(profile,k,'legendary'));
 if(!remaining.length)return {name:'8 Salvage',salvage:8};
 const key=remaining[profile.lootRolls%remaining.length];unlockBlueprint(profile,key,'legendary');
 return {name:blueprintsFor(key)[3].name,weapon:key,tier:'legendary',salvage:8};
}
