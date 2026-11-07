import { assets } from './assets.js';
import { skillRank } from './skills.js';

export const MAX_LOADOUT_SLOTS = 6;
export const STARTING_SLOTS = 3;
export const SLOT_REWARD_LEVELS = ['level_4', 'level_10'];
export const classMilestones = {handgun:0,assault_rifle:0,machine_pistol:0,shotgun:1,beacon:2,magnum:3,sniper:4,rocket_launcher:6,flamethrower:8,laser:10,factory:2,missile:5,minelayer:4,gas:7};
const originalArt={handgun:assets.slots.weapons.handgun,assault_rifle:assets.slots.weapons.assaultRifle,machine_pistol:assets.slots.weapons.machinePistol,magnum:assets.slots.weapons.magnum,shotgun:assets.slots.weapons.shotgun,sniper:assets.slots.weapons.sniper};
export const weaponArt = key => ['factory','missile','minelayer','gas','rocket_launcher','flamethrower','laser'].includes(key)?`assets/tactics/${key}.png`:key==='beacon'?'assets/command/beacon-common.png':originalArt[key] || `assets/frontier/weapons/${key}-common.png`;
export const campaignClears = profile => Object.values(profile.missions || {}).filter(m => m.clears > 0).length;
export function classUnlocked(profile,key) { return key in classMilestones && campaignClears(profile) >= classMilestones[key]; }
export function classRequirement(key) { const n=classMilestones[key];return n===1?'Complete your first mission':n?`Complete ${n} different missions`:'Starter weapon'; }
export function nextClassUnlock(profile) { const cleared=campaignClears(profile);return Object.entries(classMilestones).filter(([,n])=>n>cleared).sort((a,b)=>a[1]-b[1])[0] || null; }
export function missionSlots(profile) { return SLOT_REWARD_LEVELS.filter(key=>(profile.slotRewards?.[key] || profile.caches?.[key])).length; }
export function loadoutCapacity(profile) { return Math.min(MAX_LOADOUT_SLOTS, STARTING_SLOTS + skillRank(profile,'loadoutSlots') + missionSlots(profile)); }
export function placementLimit(profile) { return 2 + Math.min(3,skillRank(profile,'duplicates')); }
export function defaultArsenal() { return { loadout: [] }; }
export function loadoutKeys(profile) {
  const keys=[...new Set((profile.arsenal?.loadout || []).filter(key=>classUnlocked(profile,key)))];
  for(const key of Object.keys(classMilestones)) if(classUnlocked(profile,key)&&!keys.includes(key))keys.push(key);
  return keys.slice(0,loadoutCapacity(profile));
}
export function normalizeArsenal(raw={},profile) {
  const loadout=Array.isArray(raw?.loadout)?raw.loadout:['handgun','assault_rifle',raw?.support||'machine_pistol','magnum','shotgun',raw?.heavy||'sniper'];
  return {loadout:loadoutKeys({...profile,arsenal:{loadout}})};
}
export function equipCategory(profile,index,key) {
  if(!Number.isInteger(index)||index<0||index>=loadoutCapacity(profile)||!classUnlocked(profile,key))return false;
  const keys=loadoutKeys(profile),other=keys.indexOf(key);
  if(other===index || other>=0&&!keys[index])return false;
  if(other>=0) [keys[other],keys[index]]=[keys[index],key]; else keys[index]=key;
  profile.arsenal={loadout:keys.filter(Boolean)};
  return true;
}
export function applyArsenal(weapon) {
  const art=weaponArt(weapon.key);
  return {...weapon,critChance:.05,critDamage:1.6,asset:art,placedAsset:art,hudAsset:art,
    fireMode:weapon.economic?'Production':weapon.fixedAim?'Fixed point':weapon.minelayer?'Path traps':weapon.gas?'Radial gas':weapon.support?'Support aura':weapon.continuous==='laser'?'Continuous beam':weapon.continuous==='flame'?'Flame cone':weapon.pelletCount?'Pellet spread':weapon.pierce?'Piercing shot':weapon.atkSpeed>=5?'Automatic':'Single shot'};
}
export function equippedWeapons(weapons,profile) { return loadoutKeys(profile).map(key=>weapons.find(w=>w.key===key)).filter(Boolean); }
// Mission slots replace redundant slot training at the six-slot cap, with a full SP refund.
export function refundExcessSlots(profile) {
  const excess=Math.max(0,STARTING_SLOTS+missionSlots(profile)+skillRank(profile,'loadoutSlots')-MAX_LOADOUT_SLOTS);
  if(excess){profile.skills.loadoutSlots-=excess;profile.skillPoints+=excess*8;}
  return excess*8;
}
export function missionSlotReward(profile,level) {
  if(!SLOT_REWARD_LEVELS.includes(level.id)||profile.slotRewards?.[level.id]||profile.caches?.[level.id])return null;
  profile.slotRewards ||= {};
  profile.slotRewards[level.id]=true;
  const refund=refundExcessSlots(profile);
  profile.arsenal={loadout:loadoutKeys(profile)};
  return {slot:true,refund};
}
