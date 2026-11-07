import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,resetSkills} from '../src/systems/profile.js';
import {levels} from '../src/data/levels/index.js';
import {weapons} from '../src/data/weapons.js';
import {skillTree,buySkill,activeAbilityStats,activeAbilities} from '../src/data/skills.js';
import {loadoutCapacity,loadoutKeys,equipCategory,missionSlotReward,placementLimit,applyArsenal} from '../src/data/arsenal.js';
import {createInitialState,placeTower,sellTower,fireTower,updateProjectiles,upgradeTower,launchWave,stepState,activateNapalm,activateArtillery,targetForTower} from '../src/game.js';
import {upgradeDrone,droneStats} from '../src/systems/fieldSupport.js';
import {targetingUnlocked} from '../src/systems/targeting.js';
import {missionRecords} from './fixtures.mjs';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const profile=(raw={})=>normalizeProfile({schemaVersion:6,level:20,missions:missionRecords(),settings:{muted:true},...raw});
const make=(raw={},key='magnum')=>{const p=profile({...raw,arsenal:{loadout:[key,...(raw.arsenal?.loadout||[])]}});const s=createInitialState({...levels[0],threat:1,waves:[{name:'Test',healthScale:1,reward:0,spawns:[{enemy:'alien_normal',at:1000}]}]},p,{width:1280,height:720});s.gold=10000;return s;};
const enemy=(id,x,y=128,life=10000)=>({id,key:'alien_normal',x,y,life,maxLife:life,shield:0,armor:0,radius:10,speed:0,angle:0,segment:0,progress:0,burnTimer:0,burnDamage:0,slowTimer:0,stunTimer:0,gold:0,xp:0});
const tick=(s,t)=>{for(let n=0;n<t*60;n++)stepState(s,1/60);};

test('only categories remain, with three initial slots and no models or attachments',()=>{
 const p=profile({schemaVersion:8,level:1,missions:{},skillPoints:100});assert.equal(loadoutCapacity(p),3);assert.equal(loadoutKeys(p).length,3);
 assert.ok(buySkill(p,'loadoutSlots'));assert.ok(buySkill(p,'loadoutSlots'));assert.equal(loadoutCapacity(p),5);assert.equal(buySkill(p,'loadoutSlots'),false);
 assert.ok(equipCategory(p,0,'assault_rifle'));assert.equal(loadoutKeys(p)[0],'assault_rifle');assert.equal(equipCategory(p,5,'sniper'),false);
 for(const w of weapons){const effective=applyArsenal(w,p);assert.equal(effective.directDamage,w.directDamage);assert.equal(effective.attachments,undefined);assert.equal(effective.rarity,undefined);}
});
test('mission rewards combine with level, stars and research to reach ten permanent slots',()=>{
 const p=profile();buySkill(p,'loadoutSlots');buySkill(p,'loadoutSlots');
 const start=p.skillPoints;assert.equal(missionSlotReward(p,levels[3]).slot,true);assert.equal(loadoutCapacity(p),9);
 assert.equal(missionSlotReward(p,levels[3]),null);assert.equal(p.skillPoints,start);
 const reward=missionSlotReward(p,levels[9]);assert.equal(reward.refund,0);assert.equal(p.skills.loadoutSlots,2);assert.equal(loadoutCapacity(p),10);assert.equal(p.skillPoints,start);
 assert.equal(buySkill(p,'loadoutSlots'),false);const saved=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(saved.skillPoints,p.skillPoints);assert.equal(loadoutCapacity(saved),10);
 resetSkills(saved);assert.equal(loadoutCapacity(saved),8);
});
test('old models and attachments are removed and model-license SP returns exactly once',()=>{
 const old={schemaVersion:4,level:5,skillPoints:27,skills:{damage:1},arsenal:{spSpent:8,heavy:'laser',blueprints:{handgun:'legendary'},attachments:{handgun:['incendiary']}}};
 const p=normalizeProfile(old);assert.equal(p.schemaVersion,8);assert.deepEqual(Object.keys(p.arsenal),['loadout']);assert.ok(p.skillPoints>=35);
 const again=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(again.skillPoints,p.skillPoints);assert.equal(again.skills.damage,1);
});
test('two towers initially, five with research, and selling restores placement availability',()=>{
 const s=make({},'handgun');const first=placeTower(s,'handgun',1,1);assert.ok(first);assert.equal(placementLimit(s.profile),2);assert.ok(placeTower(s,'handgun',1,2));assert.equal(placeTower(s,'handgun',1,4),null);
 buySkill(s.profile,'loadoutSlots');for(let i=0;i<3;i++)assert.ok(buySkill(s.profile,'duplicates'));assert.equal(placementLimit(s.profile),5);assert.ok(placeTower(s,'handgun',1,4));sellTower(s,first);assert.ok(placeTower(s,'handgun',1,1));assert.equal(placeTower(s,'laser',1,6),null);
});
test('loadout changes during a mission take effect only after restarting',()=>{
 const s=make({},'handgun');equipCategory(s.profile,0,'laser');assert.equal(loadoutKeys(s.arsenalProfile)[0],'handgun');assert.equal(placeTower(s,'laser',1,1),null);
 const next=createInitialState(s.level,s.profile,{width:1280,height:720});next.gold=1000;assert.ok(placeTower(next,'laser',1,1));
});
test('Magnum pierces 1, 2 or 3 aliens and only the final allowed target takes half damage',()=>{
 for(let rank=0;rank<3;rank++){
  const s=make(),tower=placeTower(s,'magnum',1,1);tower.weapon.critChance=0;
  for(let i=0;i<rank;i++)assert.ok(upgradeTower(s,tower,'tactical'));
  if(rank===2)assert.equal(upgradeTower(s,tower,'tactical'),false);
  const count=rank+2,aliens=Array.from({length:5},(_,i)=>enemy(`target-${i}`,tower.x+50+i*45,tower.y));s.enemies=aliens;
  fireTower(s,tower,aliens[0]);updateProjectiles(s,.6);
  aliens.forEach((e,i)=>assert.equal(e.life,10000-(i<count?tower.weapon.directDamage*(i===count-1?.5:1):0),`rank ${rank}, hit ${i}`));
  updateProjectiles(s,.5);assert.equal(aliens[0].life,10000-tower.weapon.directDamage,'no repeated hits');
 }
});
test('Magnum trajectory does not follow its original target or vanish when it dies',()=>{
 const s=make(),t=placeTower(s,'magnum',1,1);t.weapon.critChance=0;
 const first=enemy('first',t.x+80,t.y),behind=enemy('behind',t.x+170,t.y);s.enemies=[first,behind];fireTower(s,t,first);first.life=0;
 updateProjectiles(s,.3);assert.ok(behind.life<behind.maxLife);assert.equal(s.projectiles[0].vy,0);
});
test('five mine ranks deploy two extra mines each, dealing 5x previous damage',()=>{
 for(let rank=0;rank<=5;rank++)assert.equal(make({skills:{mines:rank}}).mines.length,rank*2);
 const s=make({skills:{mines:1}}),mine=s.mines[0],e=enemy('mine-victim',mine.x,mine.y,5000);s.enemies=[e];launchWave(s);tick(s,.02);
 assert.equal(s.runWeaponKills.mines,1);assert.ok(s.mines[0].spent);assert.equal(s.profile.weaponKills.mines,1);const spent=s.mines.filter(m=>m.spent).length;tick(s,.1);assert.equal(s.mines.filter(m=>m.spent).length,spent);
});
test('a second drone has independent upgrades, targeting and pause-safe patrol',()=>{
 const s=make({skills:{drone:1,extraDrone:1}});assert.equal(s.drones.length,2);
 const [a,b]=s.drones,before=droneStats(a);assert.ok(upgradeDrone(s,a,'power'));assert.ok(droneStats(a).damage>before.damage);assert.equal(droneStats(b).damage,before.damage);
 assert.ok(upgradeDrone(s,a,'tactical'));assert.equal(droneStats(a).range,before.range);assert.ok(droneStats(a).interval<before.interval);a.targeting='last';b.targeting='strongest';launchWave(s);tick(s,.1);const times=s.drones.map(d=>d.time);s.isPaused=true;tick(s,5);assert.deepEqual(s.drones.map(d=>d.time),times);
 s.gold=0;assert.equal(upgradeDrone(s,a,'power'),false);
});
test('Weakest is a purchased targeting mode and uses health plus shields, ignoring dead/out-of-range enemies',()=>{
 const p=profile();assert.equal(targetingUnlocked(p,'weakest'),false);buySkill(p,'damage');buySkill(p,'fireRate');assert.ok(buySkill(p,'weakest'));assert.equal(targetingUnlocked(p,'weakest'),true);
 const t={x:0,y:0,range:100,targeting:'weakest'},a=enemy('shield',30,0,10),b=enemy('weak',50,0,100),c=enemy('far',150,0,1);a.shield=1000;
 assert.equal(targetForTower(t,[a,b,c]).id,'weak');
});
test('kill credit belongs to the lethal tower and persists by category exactly once, including splash',()=>{
 const s=make({},'rocket_launcher'),t=placeTower(s,'rocket_launcher',1,1);t.weapon.critChance=0;
 s.enemies=[enemy('one',t.x+50,t.y,100),enemy('two',t.x+60,t.y,100)];fireTower(s,t,s.enemies[0]);updateProjectiles(s,.5);
 assert.equal(t.kills,2);assert.equal(s.runWeaponKills.rocket_launcher,2);assert.equal(s.profile.weaponKills.rocket_launcher,2);updateProjectiles(s,1);assert.equal(t.kills,2);
 const saved=normalizeProfile(JSON.parse(JSON.stringify(s.profile)));assert.equal(saved.weaponKills.rocket_launcher,2);
});
test('flames pass through front aliens and retain kill attribution for lingering burn',()=>{
 const s=make({},'flamethrower'),t=placeTower(s,'flamethrower',1,1);t.weapon.critChance=0;
 const a=enemy('front',t.x+60,t.y,200),b=enemy('rear',t.x+100,t.y,200);s.enemies=[a,b];fireTower(s,t,a);assert.ok(a.burnTimer&&b.burnTimer);t.reloadTimer=10;launchWave(s);tick(s,.5);assert.equal(t.kills,2);assert.equal(s.profile.weaponKills.flamethrower,2);
});
test('artillery and Napalm have independently purchased damage, radius, duration and cooldown',()=>{
 for(const key of ['artillery','napalm']){
  const p=profile({skills:{[key]:1}}),ability=activeAbilities.find(a=>a.key===key),base=activeAbilityStats(ability,p);
  for(const [suffix,field,direction] of [['Cooldown','cooldown',-1],['Area','area',1],['Duration','duration',1]]){
   const q=structuredClone(p);assert.ok(buySkill(q,key+suffix));const next=activeAbilityStats(ability,q);assert.ok((next[field]-base[field])*direction>0);assert.equal(next.damage,base.damage);
  }
  buySkill(p,key);assert.ok(activeAbilityStats(ability,p).damage>base.damage);assert.equal(activeAbilityStats(ability,p).cooldown,base.cooldown);
 }
});
test('extended artillery fires twenty shells over ten seconds; Napalm burns later arrivals only inside its field',()=>{
 const s=make({skills:{artillery:1,artilleryDuration:5},equippedActiveKey:'artillery'});launchWave(s);assert.ok(activateArtillery(s,100,100));assert.equal(s.artillery.shots,20);tick(s,5.1);assert.ok(s.artillery);tick(s,5);assert.equal(s.artillery,null);
 const n=make({skills:{napalm:1},equippedActiveKey:'napalm'});launchWave(n);activateNapalm(n,500,300);tick(n,2);
 const inside=enemy('inside',500,300),outside=enemy('outside',900,300);n.enemies=[inside,outside];tick(n,.1);assert.ok(inside.burnTimer>0);assert.equal(outside.burnTimer,0);assert.ok(inside.life<inside.maxLife);assert.equal(outside.life,outside.maxLife);
});
test('power kills credit the correct source and expired burns do not carry damage into later ignitions',()=>{
 for(const key of ['artillery','napalm']){
  const s=make({skills:{[key]:1},equippedActiveKey:key}),e=enemy('power-victim',500,300,100);s.enemies=[e];launchWave(s);
  if(key==='artillery')activateArtillery(s,500,300);else activateNapalm(s,500,300);
  tick(s,.4);assert.equal(s.runWeaponKills[key],1);assert.equal(s.profile.weaponKills[key],1);assert.equal(s.kills,1);
 }
 const s=make({},'flamethrower'),tower=placeTower(s,'flamethrower',1,1),e=enemy('burn',tower.x+70,tower.y,100000);s.enemies=[e];fireTower(s,tower,e);tower.reloadTimer=10;launchWave(s);tick(s,2);
 assert.equal(e.burnTimer,0);assert.equal(e.burnDamage,0);assert.equal(e.burnSource,null);
});
