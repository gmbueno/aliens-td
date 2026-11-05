export const SP_PER_LEVEL = 10;
export const DEFAULT_EQUIPPED_ACTIVE_KEY = null;

const ACTIVE_MAX_RANK = 10;
const PASSIVE_MAX_RANK = 5;

export const activeSkillTree = [
  {
    key: "chronoBreak",
    type: "active",
    name: "Chrono Break",
    description: "Stops alien movement. Cooldown 50s to 30s, duration 3s to 5s.",
    maxRank: ACTIVE_MAX_RANK,
    cost: 5,
    active: "chronoBreak",
  },
  {
    key: "artillery",
    type: "active",
    name: "Artillery Strike",
    description: "Bombards a marked area for 5 seconds. Ten shells; each deals 1.8k to 3.6k damage.",
    maxRank: ACTIVE_MAX_RANK,
    cost: 5,
    active: "artillery",
  },
  {
    key: "napalm",
    type: "active",
    name: "Napalm",
    description: "Burns all visible aliens. Cooldown 50s to 30s, duration 6s to 10s, damage 1000 to 1500/s.",
    maxRank: ACTIVE_MAX_RANK,
    cost: 5,
    active: "napalm",
  },
];

export const passiveSkillTree = [
  {
    key: "damage",
    type: "passive",
    name: "Weapons Training",
    description: "+8% tower damage per rank.",
    maxRank: PASSIVE_MAX_RANK,
    cost: 5,
    weaponEffect: { stat: "directDamage", perRank: 0.08 },
  },
  {
    key: "range",
    type: "passive",
    name: "Sensor Sweep",
    description: "+6% tower range per rank.",
    maxRank: PASSIVE_MAX_RANK,
    cost: 5,
    weaponEffect: { stat: "range", perRank: 0.06 },
  },
  {
    key: "fireRate",
    type: "passive",
    name: "Trigger Discipline",
    description: "+5% attack speed per rank.",
    maxRank: PASSIVE_MAX_RANK,
    cost: 5,
    weaponEffect: { stat: "atkSpeed", perRank: 0.05, decimals: 2 },
  },
  {
    key: "reload",
    type: "passive",
    name: "Rapid Reload",
    description: "-6% reload time per rank.",
    maxRank: PASSIVE_MAX_RANK,
    cost: 5,
    weaponEffect: { stat: "reloadSpeed", perRank: -0.06, decimals: 2, min: 0.35 },
  },
];

export const utilitySkillTree = [
  {key:'salvage',type:'utility',name:'Clearance Crew',description:'Clearing obstacles costs 15% less per rank (up to 45%).',maxRank:3,cost:4},
  {key:'supplies',type:'utility',name:'Supply Lines',description:'Start every deployment with 25 extra credits per rank.',maxRank:3,cost:5},
  {key:'pontoons',type:'utility',name:'Pontoon Engineering',description:'Build any weapon on water. A raft costs 35 extra credits.',maxRank:1,cost:6},
  {key:'mines',type:'utility',name:'Last Line',description:'Automatically deploy 5 / 10 mines near the exit. Each deals 1,100 area damage. One stock per mission.',maxRank:2,cost:6},
  {key:'drone',type:'utility',name:'Patrol Drone',description:'An automatic UAV patrols the route. Ranks improve its damage and coverage. No extra controls.',maxRank:3,cost:8},
];
const layout = {
 damage:['armament',190,105,null],reload:['armament',65,105,null],
 fireRate:['armament',250,215,'damage'],range:['armament',65,215,'reload'],
 chronoBreak:['armament',65,325,'range'],artillery:['armament',250,325,'fireRate'],
 salvage:['logistics',450,105,null],supplies:['logistics',450,215,'salvage'],pontoons:['logistics',450,325,'supplies'],
 mines:['support',730,105,null],drone:['support',640,215,'mines'],napalm:['support',820,215,'mines'],
};
export const skillTree = [...activeSkillTree, ...passiveSkillTree, ...utilitySkillTree].map(skill=>{
 const [branch,x,y,parent]=layout[skill.key];
 return {...skill,branch,x,y,requires:parent?{key:parent,rank:1}:null};
});
export function prerequisiteMet(profile,skill) {
 return !skill.requires || skillRank(profile,skill.requires.key)>=skill.requires.rank;
}
export function activeUnlocked(profile,key) {
 return Boolean(key && (skillRank(profile,key)>0 || profile.legacyActives?.includes(key)));
}

export const activeAbilities = [
  {
    key: "chronoBreak",
    skillKey: "chronoBreak",
    name: "Chrono Break",
    shortName: "Chrono",
    targeting: "instant",
    cooldown: { base: 50, perRank: -2 },
    duration: { base: 3, perRank: 0.2 },
  },
  {
    key: "artillery",
    skillKey: "artillery",
    name: "Artillery Strike",
    shortName: "Artillery",
    targeting: "map",
    cooldown: { base: 45, perRank: -1.5 },
    duration: { base: 5, perRank: 0 },
    damage: { base: 1800, perRank: 180 },
    area: { base: 130, perRank: 4 },
  },
  {
    key: "napalm",
    skillKey: "napalm",
    name: "Napalm",
    shortName: "Napalm",
    targeting: "instant",
    cooldown: { base: 50, perRank: -2 },
    duration: { base: 6, perRank: 0.4 },
    damage: { base: 1000, perRank: 50 },
  },
];

export function isActiveAbilityKey(key) {
  return activeAbilities.some((ability) => ability.key === key);
}

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
  return skillRank(profile, skill.key) < skill.maxRank && profile.skillPoints >= skill.cost && (skillRank(profile,skill.key)>0 || prerequisiteMet(profile,skill));
}

export function buySkill(profile, skillKey) {
  const skill = skillTree.find((item) => item.key === skillKey);
  if (!skill || !canBuySkill(profile, skill)) return false;
  profile.skills[skill.key] = skillRank(profile, skill.key) + 1;
  profile.skillPoints -= skill.cost;
  if(skill.active && !profile.equippedActiveKey)profile.equippedActiveKey=skill.active;
  return true;
}

function scaleRankedValue(config, rank) {
  return Number((config.base + config.perRank * rank).toFixed(2));
}

export function activeAbilityStats(ability, profile) {
  const rank = skillRank(profile, ability.skillKey);
  return {
    rank,
    cooldown: scaleRankedValue(ability.cooldown, rank),
    duration: ability.duration ? scaleRankedValue(ability.duration, rank) : 0,
    damage: ability.damage ? Math.round(scaleRankedValue(ability.damage, rank)) : 0,
    area: ability.area ? Math.round(scaleRankedValue(ability.area, rank)) : 0,
  };
}
