import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeProfile,resetSkills} from '../src/systems/profile.js';import {levels} from '../src/data/levels/index.js';import {weapons} from '../src/data/weapons.js';import {createInitialState,launchWave,placeTower,upgradeTower,sellTower,stepState,fireTower} from '../src/game.js';import {targetForTower,inWeaponRange} from '../src/systems/targeting.js';import {updateDrone} from '../src/systems/fieldSupport.js';import {beginFreeplay,endlessWave} from '../src/systems/endless.js';import {placementLimit} from '../src/data/arsenal.js';import {missionRecords} from './fixtures.mjs';
globalThis.localStorage={getItem(){},setItem(){}};
const make=raw=>{const p=normalizeProfile({schemaVersion:7,level:20,missions:missionRecords(),arsenal:{loadout:['handgun','beacon','magnum','laser']},skills:{loadoutSlots:1,duplicates:2},...raw});const s=createInitialState(levels[0],p,{width:1280,height:720});s.gold=10000;return s;};
const enemy=(id,x,y,segment,life)=>({id,x,y,segment,progress:0,life,shield:0,speed:0,angle:0,radius:15});
test('drones follow all five priority selections over the entire map and return to base without aliens',()=>{
 const s=make({skills:{drone:1}}),d=s.drone;s.enemies=[enemy('first',800,300,10,100),enemy('last',200,400,1,60),enemy('strong',600,500,5,500),enemy('near',d.x+40,d.y+5,3,80),enemy('weak',650,300,6,10)];
 for(const [mode,id] of [['first','first'],['last','last'],['strongest','strong'],['nearest','near'],['weakest','weak']]){d.x=d.base.x;d.y=d.base.y;d.targeting=mode;const before={x:d.x,y:d.y};updateDrone(s,.1,()=>{});assert.equal(d.targetId,id);assert.ok(Math.hypot(d.x-before.x,d.y-before.y)<=24.001);}
 s.enemies=[];for(let i=0;i<120;i++)updateDrone(s,1/60,()=>{});assert.equal(d.targetId,null);assert.ok(Math.hypot(d.x-d.base.x,d.y-d.base.y)<20);
});
test('Magnum only targets its fixed rectangle and physical shots preserve that heading',()=>{
 const s=make(),t=placeTower(s,'magnum',3,3);t.angle=0;const ahead=enemy('ahead',t.x+80,t.y,5,1000),side=enemy('side',t.x,t.y+80,10,5000);s.enemies=[ahead,side];assert.equal(targetForTower(t,s.enemies).id,'ahead');assert.equal(inWeaponRange(t,side),false);fireTower(s,t,ahead);assert.equal(t.angle,0);assert.ok(s.projectiles.every(p=>Math.abs(p.vy)<.001));t.angle=Math.PI/2;assert.equal(targetForTower(t,s.enemies).id,'side');
});
test('Radar boosts actual combat stats, does not stack, upgrades allies, and selling removes its aura',()=>{
 const s=make(),gun=placeTower(s,'handgun',3,3);const base={damage:gun.weapon.directDamage,range:gun.range,rate:gun.weapon.atkSpeed};const a=placeTower(s,'beacon',3,2);assert.ok(gun.range>base.range&&gun.weapon.atkSpeed>base.rate);const boosted=gun.range;const b=placeTower(s,'beacon',2,3);assert.equal(gun.range,boosted);upgradeTower(s,a,'power');assert.ok(gun.weapon.directDamage>base.damage);sellTower(s,a);assert.equal(gun.weapon.directDamage,base.damage);sellTower(s,b);assert.equal(gun.range,base.range);assert.equal(gun.weapon.atkSpeed,base.rate);
});
test('Free play preserves the army, advances procedurally without mission reward farming, and has bounded wave storage',()=>{
 const s=make(),tower=placeTower(s,'handgun',3,3);s.result='victory';s.waveIndex=s.level.waves.length;s.isPaused=true;const gold=s.gold;s.profile.slotRewards.level_4=true;assert.ok(beginFreeplay(s));assert.equal(s.arsenalProfile.slotRewards.level_4,true);assert.equal(s.towers[0],tower);assert.equal(s.gold,gold);assert.equal(beginFreeplay(s),false);assert.ok(s.endlessWave.healthScale>s.level.waves.at(-1).healthScale);const before=s.profile.missions.level_1?.clears;
 launchWave(s);s.endlessWave={...s.endlessWave,spawns:[]};stepState(s,.02);assert.equal(s.endlessRound,2);assert.equal(s.result,null);assert.equal(s.profile.missions.level_1?.clears,before);assert.equal(s.level.waves.length,levels[0].waves.length);
 const a=endlessWave(levels[0],1),b=endlessWave(levels[0],30),c=endlessWave(levels[0],100000);assert.deepEqual(a,endlessWave(levels[0],1));assert.ok(b.healthScale>a.healthScale&&b.spawns.length>a.spawns.length);assert.ok(c.spawns.length<=180&&Number.isFinite(c.healthScale));assert.ok(new Set(b.spawns.map(s=>s.enemy)).size>=4);
});
test('new army caps progress from one through three and old Stasis cooldowns survive migration once',()=>{
 for(let r=0;r<3;r++)assert.equal(placementLimit({skills:{duplicates:r}}),r+1);
 const p=normalizeProfile({schemaVersion:6,skills:{chronoBreak:3},skillPoints:8});assert.equal(p.skills.chronoCooldown,3);const again=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(again.skillPoints,p.skillPoints);assert.equal(again.skills.chronoCooldown,3);resetSkills(p);assert.equal(p.skills.chronoCooldown,0);
 assert.equal(weapons.find(w=>w.key==='laser').directDamage,624);
});
