export const SP_PER_LEVEL=10;
export const DEFAULT_EQUIPPED_ACTIVE_KEY='chronoBreak';
const node=(key,name,description,maxRank,cost,branch,x,y,parent=null,extra={})=>({key,name,description,maxRank,cost,branch,x,y,type:'utility',requires:parent?{key:parent,rank:1}:null,...extra});
export const skillTree=[
 node('damage','Weapons Training','+8% tower damage per rank.',5,5,'armament',110,145,null,{type:'passive',weaponEffect:{stat:'directDamage',perRank:.08}}),
 node('reload','Rapid Reload','-6% reload time per rank.',5,5,'armament',310,145,null,{type:'passive',weaponEffect:{stat:'reloadSpeed',perRank:-.06,decimals:2,min:.35}}),
 node('fireRate','Trigger Discipline','+5% attack speed per rank.',5,5,'armament',110,295,'damage',{type:'passive',weaponEffect:{stat:'atkSpeed',perRank:.05,decimals:2}}),
 node('range','Sensor Sweep','+6% tower range per rank.',5,5,'armament',310,295,'reload',{type:'passive',weaponEffect:{stat:'range',perRank:.06}}),
 node('weakest','Finish the Weak','Unlock Weakest targeting: aim at the alien with the least health and shields.',1,7,'armament',210,445,'fireRate'),
 node('loadoutSlots','Extra Loadout Slot','+1 weapon slot per rank, up to 6 total. Missions 1-4 and 2-4 also award a slot.',2,8,'logistics',110,145),
 node('duplicates','Extra Emplacements','Deploy 2, then 3 towers of each category.',2,10,'logistics',110,295,'loadoutSlots'),
 node('salvage','Clearance Crew','Clearing obstacles costs 15% less per rank.',3,4,'logistics',310,145),
 node('supplies','Supply Lines','Start each mission with $25 extra per rank.',3,5,'logistics',310,295,'salvage'),
 node('pontoons','Pontoon Engineering','Build weapons on water. A raft costs $35 extra.',1,6,'logistics',310,445,'supplies'),
 node('mines','Last Line','Start with 2 more exit mines per rank. Each deals 5,500 area damage.',5,6,'support',110,145),
 node('drone','Hunter Drone','A UAV follows its priority target across the map. Ranks improve damage and range.',3,8,'support',310,145),
 node('extraDrone','Wingman','Add a second drone with its own upgrades and targeting.',1,12,'support',310,295,'drone'),
 node('chronoBreak','Chrono Break','Extend Stasis by 0.25 seconds per rank.',10,5,'stasis',110,295,null,{type:'active',active:'chronoBreak'}),
 node('chronoCooldown','Temporal Recovery','Reduce Stasis cooldown by 2 seconds per rank.',10,4,'stasis',110,445,'chronoBreak'),
 node('powerSlots','Dual Support','Equip a second, different power. Each has its own cooldown.',1,12,'support',110,445,'mines'),
 node('artillery','Artillery Strike','+180 damage per shell. Starts with 10 shells in 5 seconds.',10,5,'artillery',310,145,null,{type:'active',active:'artillery'}),
 node('artilleryCooldown','Rapid Artillery','Reduce Artillery cooldown by 4s per rank, from 45s to 25s.',5,4,'artillery',110,325,'artillery'),
 node('artilleryArea','Wide Barrage','Increase Artillery blast radius by 15% per rank.',5,4,'artillery',310,325,'artillery'),
 node('artilleryDuration','Sustained Barrage','Add 1 second and 2 shells per rank. Up to 10 seconds and 20 shells.',5,5,'artillery',510,325,'artillery'),
 node('napalm','Napalm','+50 burn damage per second. Aliens crossing the marked area catch fire.',10,5,'napalm',310,145,null,{type:'active',active:'napalm'}),
 node('napalmCooldown','Rapid Napalm','Reduce Napalm cooldown by 4s per rank, from 50s to 30s.',5,4,'napalm',110,325,'napalm'),
 node('napalmArea','Firestorm','Increase the Napalm field radius by 18% per rank.',5,4,'napalm',310,325,'napalm'),
 node('napalmDuration','Lingering Napalm','Add 1 second of burn per rank, up to 11 seconds.',5,5,'napalm',510,325,'napalm'),
];
export const activeSkillTree=skillTree.filter(s=>s.type==='active');
export const passiveSkillTree=skillTree.filter(s=>s.type==='passive');
export const utilitySkillTree=skillTree.filter(s=>s.type==='utility');
export const activeAbilities=[
 {key:'chronoBreak',skillKey:'chronoBreak',name:'Chrono Break',shortName:'Chrono',targeting:'instant'},
 {key:'artillery',skillKey:'artillery',name:'Artillery Strike',shortName:'Artillery',targeting:'map'},
 {key:'napalm',skillKey:'napalm',name:'Napalm',shortName:'Napalm',targeting:'map'},
];
export const isActiveAbilityKey=key=>activeAbilities.some(a=>a.key===key);
export const createDefaultSkills=()=>Object.fromEntries(skillTree.map(s=>[s.key,0]));
export const skillRank=(profile,key)=>Number(profile.skills?.[key])||0;
export const prerequisiteMet=(profile,skill)=>!skill.requires||skillRank(profile,skill.requires.key)>=skill.requires.rank;
export const activeUnlocked=(profile,key)=>isActiveAbilityKey(key);
export const spentSkillPoints=profile=>skillTree.reduce((n,s)=>n+skillRank(profile,s.key)*s.cost,0);
export function canBuySkill(profile,skill){
 if(skill.key==='loadoutSlots'&&3+skillRank(profile,'loadoutSlots')+['level_4','level_10'].filter(k=>(profile.slotRewards?.[k]||profile.caches?.[k])).length>=6)return false;
 return skillRank(profile,skill.key)<skill.maxRank&&profile.skillPoints>=skill.cost&&(skillRank(profile,skill.key)>0||prerequisiteMet(profile,skill));
}
export function buySkill(profile,key){const s=skillTree.find(s=>s.key===key);if(!s||!canBuySkill(profile,s))return false;profile.skills[key]=skillRank(profile,key)+1;profile.skillPoints-=s.cost;if(s.active&&!profile.equippedActiveKey)profile.equippedActiveKey=s.active;return true;}
export function activeAbilityStats(ability,profile){
 const key=ability.key,rank=skillRank(profile,key),r=k=>skillRank(profile,k);
 if(key==='chronoBreak')return {rank,cooldown:50-2*r('chronoCooldown'),duration:3+.25*rank,damage:0,area:0};
 if(key==='artillery')return {rank,cooldown:45-4*r('artilleryCooldown'),duration:5+r('artilleryDuration'),shots:10+2*r('artilleryDuration'),damage:1800+180*rank,area:130*(1+.15*r('artilleryArea'))};
 return {rank,cooldown:50-4*r('napalmCooldown'),duration:6+r('napalmDuration'),damage:1000+50*rank,area:180*(1+.18*r('napalmArea'))};
}

// Preserve the original primary selection when loading older saves.
export const powerCapacity=profile=>1+Math.min(1,Math.max(0,skillRank(profile,'powerSlots')));
export function equippedPowerKeys(profile){
 const first=isActiveAbilityKey(profile.equippedActiveKey)?profile.equippedActiveKey:DEFAULT_EQUIPPED_ACTIVE_KEY;
 const second=isActiveAbilityKey(profile.equippedSecondaryActiveKey)&&profile.equippedSecondaryActiveKey!==first?profile.equippedSecondaryActiveKey:activeAbilities.find(a=>a.key!==first).key;
 return powerCapacity(profile)===2?[first,second]:[first];
}
export function equipPower(profile,key,slot=0){
 if(!isActiveAbilityKey(key)||!Number.isInteger(slot)||slot<0||slot>=powerCapacity(profile))return false;
 const keys=equippedPowerKeys(profile),other=keys.indexOf(key);
 if(other>=0) [keys[slot],keys[other]]=[keys[other],keys[slot]];
 else keys[slot]=key;
 profile.equippedActiveKey=keys[0];profile.equippedSecondaryActiveKey=keys[1]||null;
 return true;
}
