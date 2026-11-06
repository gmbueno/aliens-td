export const SP_PER_LEVEL=10;
export const DEFAULT_EQUIPPED_ACTIVE_KEY=null;
const node=(key,name,description,maxRank,cost,branch,x,y,parent=null,extra={})=>({key,name,description,maxRank,cost,branch,x,y,type:'utility',requires:parent?{key:parent,rank:1}:null,...extra});
export const skillTree=[
 node('damage','Weapons Training','+8% tower damage per rank.',5,5,'armament',110,145,null,{type:'passive',weaponEffect:{stat:'directDamage',perRank:.08}}),
 node('reload','Rapid Reload','-6% reload time per rank.',5,5,'armament',310,145,null,{type:'passive',weaponEffect:{stat:'reloadSpeed',perRank:-.06,decimals:2,min:.35}}),
 node('fireRate','Trigger Discipline','+5% attack speed per rank.',5,5,'armament',110,295,'damage',{type:'passive',weaponEffect:{stat:'atkSpeed',perRank:.05,decimals:2}}),
 node('range','Sensor Sweep','+6% tower range per rank.',5,5,'armament',310,295,'reload',{type:'passive',weaponEffect:{stat:'range',perRank:.06}}),
 node('weakest','Finish the Weak','Unlock Weakest targeting for every weapon and drone. Focus the alien with the least health + shield.',1,7,'armament',210,445,'fireRate'),
 node('loadoutSlots','Extra Loadout Slot','+1 category slot per rank. Start with 3; maximum 6 total including mission caches. Excess training is refunded when a cache replaces it.',2,8,'logistics',110,145),
 node('duplicates','Twin Emplacements','Raise the limit from 1 to 2 deployed towers of each category.',1,10,'logistics',110,295,'loadoutSlots'),
 node('salvage','Clearance Crew','Clearing obstacles costs 15% less per rank.',3,4,'logistics',310,145),
 node('supplies','Supply Lines','Start each mission with $25 extra per rank.',3,5,'logistics',310,295,'salvage'),
 node('pontoons','Pontoon Engineering','Build weapons on water. A raft costs $35 extra.',1,6,'logistics',310,445,'supplies'),
 node('mines','Last Line','Deploy 2 exit mines per rank: 0 → 2 → 4 → 6 → 8 → 10. Each deals 5,500 area damage. One stock per mission.',5,6,'support',110,145),
 node('drone','Patrol Drone','Unlock one UAV. Further ranks improve its base damage and range. Click its landing pad to upgrade it and choose targets during a mission.',3,8,'support',310,145),
 node('extraDrone','Wingman','Deploy a second patrol drone. Each has independent field upgrades, targeting and kills.',1,12,'support',310,295,'drone'),
 node('chronoBreak','Chrono Break','Unlock stasis. Each rank extends the freeze by 0.2s and reduces cooldown by 2s.',10,5,'support',110,295,null,{type:'active',active:'chronoBreak'}),
 node('artillery','Artillery Strike','Unlock a 5-second, 10-shell barrage. Each rank adds 180 damage per shell.',10,5,'artillery',310,145,null,{type:'active',active:'artillery'}),
 node('artilleryCooldown','Rapid Artillery','Reduce Artillery cooldown by 4s per rank, from 45s to 25s.',5,4,'artillery',110,325,'artillery'),
 node('artilleryArea','Wide Barrage','Increase Artillery blast radius by 15% per rank.',5,4,'artillery',310,325,'artillery'),
 node('artilleryDuration','Sustained Barrage','Add 1 second and 2 shells per rank. Up to 10 seconds and 20 shells.',5,5,'artillery',510,325,'artillery'),
 node('napalm','Napalm','Ignite a marked area for 6 seconds. Each rank adds 50 burn damage per second. Aliens crossing the field catch fire.',10,5,'napalm',310,145,null,{type:'active',active:'napalm'}),
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
export const activeUnlocked=(profile,key)=>Boolean(key&&(skillRank(profile,key)>0||profile.legacyActives?.includes(key)));
export const spentSkillPoints=profile=>skillTree.reduce((n,s)=>n+skillRank(profile,s.key)*s.cost,0);
export function canBuySkill(profile,skill){
 if(skill.key==='loadoutSlots'&&3+skillRank(profile,'loadoutSlots')+['level_4','level_10'].filter(k=>profile.caches?.[k]).length>=6)return false;
 return skillRank(profile,skill.key)<skill.maxRank&&profile.skillPoints>=skill.cost&&(skillRank(profile,skill.key)>0||prerequisiteMet(profile,skill));
}
export function buySkill(profile,key){const s=skillTree.find(s=>s.key===key);if(!s||!canBuySkill(profile,s))return false;profile.skills[key]=skillRank(profile,key)+1;profile.skillPoints-=s.cost;if(s.active&&!profile.equippedActiveKey)profile.equippedActiveKey=s.active;return true;}
export function activeAbilityStats(ability,profile){
 const key=ability.key,rank=skillRank(profile,key),r=k=>skillRank(profile,k);
 if(key==='chronoBreak')return {rank,cooldown:50-2*rank,duration:3+.2*rank,damage:0,area:0};
 if(key==='artillery')return {rank,cooldown:45-4*r('artilleryCooldown'),duration:5+r('artilleryDuration'),shots:10+2*r('artilleryDuration'),damage:1800+180*rank,area:130*(1+.15*r('artilleryArea'))};
 return {rank,cooldown:50-4*r('napalmCooldown'),duration:6+r('napalmDuration'),damage:1000+50*rank,area:180*(1+.18*r('napalmArea'))};
}
