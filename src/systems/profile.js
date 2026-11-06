import { normalizeArsenal, classMilestones, classUnlocked, refundExcessSlots } from "../data/arsenal.js";
import { PLAYER_PROFILE_KEY, createDefaultProfile, xpNeeded } from "../data/player.js";
import { DEFAULT_EQUIPPED_ACTIVE_KEY, SP_PER_LEVEL, createDefaultSkills, isActiveAbilityKey, skillTree, spentSkillPoints, activeUnlocked } from "../data/skills.js";

export function normalizeProfile(rawProfile = {}) {
  if (!rawProfile || typeof rawProfile !== "object") rawProfile = {};
  const integer = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback;
  rawProfile = { ...rawProfile, skills: { ...rawProfile.skills } };
  if (rawProfile.skills.artillery === undefined && rawProfile.skills.rocketLauncher !== undefined) rawProfile.skills.artillery = rawProfile.skills.rocketLauncher;
  delete rawProfile.skills.rocketLauncher;
  if (rawProfile.equippedActiveKey === 'rocketLauncher') rawProfile.equippedActiveKey = 'artillery';
  const base = createDefaultProfile();
  const skills = { ...createDefaultSkills(), ...(rawProfile.skills || {}) };
  for (const skill of skillTree) {
    skills[skill.key] = Math.min(skill.maxRank, integer(skills[skill.key]));
  }
  const profile = {
    ...base,
    ...rawProfile,
    level: Math.max(1, integer(rawProfile.level, 1)),
    xp: integer(rawProfile.xp),
    skills,
    missions: Object.fromEntries(Object.entries(rawProfile.missions || {}).filter(([key]) => /^level_\d+$/.test(key)).map(([key, value]) => [key, {
      stars: Math.min(3, integer(value?.stars)),
      clears: integer(value?.clears),
      bestLives: integer(value?.bestLives),
    }])),
    settings: { muted: Boolean(rawProfile.settings?.muted), autoWave: Boolean(rawProfile.settings?.autoWave) },
    equippedActiveKey: isActiveAbilityKey(rawProfile.equippedActiveKey)
      ? rawProfile.equippedActiveKey
      : DEFAULT_EQUIPPED_ACTIVE_KEY,
  };
  profile.schemaVersion = rawProfile.schemaVersion ?? (rawProfile.skills && Object.keys(rawProfile.skills).length || rawProfile.equippedActiveKey ? 3 : 5);
  profile.legacyActives = profile.schemaVersion<4 ? ['chronoBreak','artillery','napalm'] : (Array.isArray(rawProfile.legacyActives)?rawProfile.legacyActives.filter(isActiveAbilityKey):[]);
  if(profile.schemaVersion<4 && !profile.equippedActiveKey)profile.equippedActiveKey='chronoBreak';
  delete profile.salvage;delete profile.lootRolls;delete profile.lootMisses;
  profile.caches=Object.fromEntries(Object.entries(rawProfile.caches||{}).filter(([key,value])=>/^level_\d+$/.test(key)&&value).map(([key])=>[key,true]));
  profile.arsenal = normalizeArsenal(rawProfile.arsenal, profile);
  const previousSchema=profile.schemaVersion;
  profile.schemaVersion=5;
  profile.weaponKills=Object.fromEntries(Object.entries(rawProfile.weaponKills||{}).filter(([key])=>key in classMilestones || ['drone','mines','artillery','napalm'].includes(key)).map(([key,value])=>[key,integer(value)]));
  if(!activeUnlocked(profile,profile.equippedActiveKey))profile.equippedActiveKey=null;
  const earned = Math.max(0, profile.level - 1) * SP_PER_LEVEL;
  const available = Math.max(integer(rawProfile.skillPoints), earned - spentSkillPoints(profile));
  profile.skillPoints = Math.max(0, available);
  if(previousSchema<5){
    // Removed model licenses return their paid research; old active ranks keep damage,
    // and their previous cooldown/duration benefits migrate into separate nodes.
    let refund=integer(rawProfile.arsenal?.spSpent);
    for(const [key,cool,perRank,duration,durationPerRank] of [['artillery','artilleryCooldown',1.5,null,0],['napalm','napalmCooldown',2,'napalmDuration',.4]]){
      const rank=skills[key]||0;skills[cool]=Math.min(5,Math.floor(rank*perRank/4));
      if(duration)skills[duration]=Math.min(5,Math.floor(rank*durationPerRank));
    }
    // Recalculate from the old point balance so migration grants neither debt nor
    // a second refund on subsequent loads.
    const oldSpent=Object.entries(rawProfile.skills||{}).reduce((n,[key,r])=>n+(skillTree.find(s=>s.key===key)?.cost||0)*integer(r),0);
    profile.skillPoints=Math.max(integer(rawProfile.skillPoints)+refund+Math.max(0,oldSpent-spentSkillPoints(profile)),earned-spentSkillPoints(profile));
  }
  refundExcessSlots(profile);
  return profile;
}

export function loadProfile(storage = localStorage) {
  try {
    return normalizeProfile(JSON.parse(storage.getItem(PLAYER_PROFILE_KEY)) || {});
  } catch {
    return normalizeProfile();
  }
}

export function saveProfile(profile, storage = localStorage) {
  try {
    storage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function missionStars(lives, maxLives) {
  return lives <= 0 ? 0 : lives === maxLives ? 3 : lives >= maxLives * 0.6 ? 2 : 1;
}

export function recordVictory(profile, level, lives) {
  const known = new Set(Object.keys(classMilestones).filter(key=>classUnlocked(profile,key)));
  const previous = profile.missions[level.id] || { stars: 0, clears: 0, bestLives: 0 };
  const stars = missionStars(lives, level.lives);
  const firstClear = previous.clears === 0;
  const newStars = Math.max(0, stars - previous.stars);
  const xp = level.clearXp + (firstClear ? level.firstClearXp : 0) + newStars * 15;
  profile.missions[level.id] = { stars: Math.max(previous.stars, stars), clears: previous.clears + 1, bestLives: Math.max(previous.bestLives, lives) };
  addXp(profile, xp);
  const unlockedClasses=Object.keys(classMilestones).filter(key=>!known.has(key)&&classUnlocked(profile,key));
  return { stars, firstClear, newStars, xp, unlockedClasses };
}

export function resetSkills(profile) {
  profile.skillPoints += spentSkillPoints(profile);
  profile.skills = createDefaultSkills();
  if(!activeUnlocked(profile,profile.equippedActiveKey))profile.equippedActiveKey=null;
}

export function addXp(profile, amount) {
  profile.xp += amount;
  let needed = xpNeeded(profile.level);
  while (profile.xp >= needed) {
    profile.xp -= needed;
    profile.level += 1;
    profile.skillPoints += SP_PER_LEVEL;
    needed = xpNeeded(profile.level);
  }
}
