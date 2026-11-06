import { assets } from './assets.js';
import { skillRank } from './skills.js';

export const MAX_LOADOUT_SLOTS = 6;
export const STARTING_SLOTS = 3;
export const SLOT_CACHE_LEVELS = ['level_4', 'level_10'];
export const classMilestones = {handgun:0,assault_rifle:0,machine_pistol:1,shotgun:2,magnum:3,sniper:4,rocket_launcher:6,flamethrower:8,laser:10};
const originalArt={handgun:assets.slots.weapons.handgun,assault_rifle:assets.slots.weapons.assaultRifle,machine_pistol:assets.slots.weapons.machinePistol,magnum:assets.slots.weapons.magnum,shotgun:assets.slots.weapons.shotgun,sniper:assets.slots.weapons.sniper};
export const weaponArt = key => originalArt[key] || `assets/frontier/weapons/${key}-common.png`;
export const campaignClears = profile => Object.values(profile.missions || {}).filter(m => m.clears > 0).length;
export function classUnlocked(profile,key) { return key in classMilestones && campaignClears(profile) >= classMilestones[key]; }
export function classRequirement(key) { const n=classMilestones[key];return n===1?'Complete your first mission':n?`Complete ${n} different missions`:'Starter weapon'; }
export function nextClassUnlock(profile) { const cleared=campaignClears(profile);return Object.entries(classMilestones).filter(([,n])=>n>cleared).sort((a,b)=>a[1]-b[1])[0] || null; }
export function cacheSlots(profile) { return SLOT_CACHE_LEVELS.filter(key=>profile.caches?.[key]).length; }
export function loadoutCapacity(profile) { return Math.min(MAX_LOADOUT_SLOTS, STARTING_SLOTS + skillRank(profile,'loadoutSlots') + cacheSlots(profile)); }
export function placementLimit(profile) { return 1 + Math.min(1,skillRank(profile,'duplicates')); }
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
    fireMode:weapon.continuous==='laser'?'Continuous beam':weapon.continuous==='flame'?'Flame cone':weapon.pelletCount?'Pellet spread':weapon.pierce?'Piercing shot':weapon.atkSpeed>=5?'Automatic':'Single shot'};
}
export function equippedWeapons(weapons,profile) { return loadoutKeys(profile).map(key=>weapons.find(w=>w.key===key)).filter(Boolean); }
// Cache slots replace redundant slot training at the six-slot cap, with a full SP refund.
export function refundExcessSlots(profile) {
  const excess=Math.max(0,STARTING_SLOTS+cacheSlots(profile)+skillRank(profile,'loadoutSlots')-MAX_LOADOUT_SLOTS);
  if(excess){profile.skills.loadoutSlots-=excess;profile.skillPoints+=excess*8;}
  return excess*8;
}
export function cacheReward(profile,level) {
  if(profile.caches[level.id])return null;
  profile.caches[level.id]=true;
  const slot=SLOT_CACHE_LEVELS.includes(level.id),refund=refundExcessSlots(profile);
  return {name:slot?'Permanent loadout slot':'Field supplies',slot,refund,credits:slot?0:60};
}
