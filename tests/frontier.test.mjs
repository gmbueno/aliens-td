import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,recordVictory} from '../src/systems/profile.js';
import {weapons} from '../src/data/weapons.js';
import {enemies} from '../src/data/enemies.js';
import {levels} from '../src/data/levels/index.js';
import {classUnlocked,classMilestones,missionSlotReward,applyArsenal} from '../src/data/arsenal.js';
import {createInitialState,placeTower,stepState,launchWave,fireTower,upgradeTower} from '../src/game.js';
import {missionRecords} from './fixtures.mjs';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const profile=()=>normalizeProfile({schemaVersion:5,level:8,skills:{loadoutSlots:2},caches:{level_4:true},arsenal:{loadout:['laser','flamethrower','handgun','magnum']},missions:missionRecords(),settings:{muted:true}});
const make=()=>{const s=createInitialState({...levels[0],waves:[{name:'Energy endurance',spawns:[{enemy:'alien_normal',at:1000}],healthScale:1,reward:0}]},profile(),{width:1280,height:720});s.gold=10000;return s;};
const tick=(s,time)=>{for(let n=0;n<time*60;n++)stepState(s,1/60);};
function dummy(tower,id,x=100,y=0){return {...enemies.alien_normal,id,x:tower.x+x,y:tower.y+y,life:1e7,maxLife:1e7,shield:0,armor:0,speed:0,radius:15,segment:0,progress:0,burnTimer:0,slowTimer:0,stunTimer:0,angle:0};}

test('fresh players start with three types; level rewards and old earned categories are preserved',()=>{
 const fresh=normalizeProfile();assert.deepEqual(weapons.filter(w=>classUnlocked(fresh,w.key)).map(w=>w.key),['handgun','assault_rifle','machine_pistol']);
 const old=normalizeProfile({level:99,schemaVersion:3});for(const key of ['factory','minelayer','laser'])assert.ok(classUnlocked(old,key));assert.equal(classUnlocked(old,'shotgun'),false);
 const earned=normalizeProfile({schemaVersion:7,missions:missionRecords(8,1)});assert.ok(classUnlocked(earned,'flamethrower'));
 const s=createInitialState(levels[0],fresh,{width:1280,height:720});s.gold=10000;assert.equal(placeTower(s,'laser',1,1),null);
});
test('laser persists between ticks, overheats, stops damage while cooling, and automatically resumes',()=>{
 const s=make(),tower=placeTower(s,'laser',1,1),enemy=dummy(tower,'target');s.enemies=[enemy];launchWave(s);
 tick(s,.1);assert.ok(tower.beamEnd);assert.equal(s.projectiles.length,0);const life=enemy.life;
 tick(s,5.6);assert.ok(tower.reloadTimer>0);assert.equal(tower.ammo,0);assert.equal(tower.beamEnd,null);
 const coolingLife=enemy.life;tick(s,.25);assert.equal(enemy.life,coolingLife);
 s.isPaused=true;const timer=tower.reloadTimer;tick(s,3);assert.equal(tower.reloadTimer,timer);
 s.isPaused=false;tick(s,3.5);assert.ok(enemy.life<coolingLife);assert.ok(enemy.life<life);assert.ok(tower.ammo>0);
});
test('flamethrower hits a cone, leaves burning damage and refills without reaching distant or rear aliens',()=>{
 const s=make(),tower=placeTower(s,'flamethrower',1,1);
 const front=dummy(tower,'front',70),near=dummy(tower,'near',85,15),rear=dummy(tower,'rear',-70),far=dummy(tower,'far',160),outsideJet=dummy(tower,'outside-jet',80,35);
 s.enemies=[front,near,rear,far,outsideJet];fireTower(s,tower,front);
 assert.ok(front.life<front.maxLife&&near.life<near.maxLife);assert.equal(rear.life,rear.maxLife);assert.equal(far.life,far.maxLife);
 assert.equal(outsideJet.life,outsideJet.maxLife,'damage cone matches the visible jet from the muzzle');
 assert.equal(front.burnTimer,1.8);const life=front.life;launchWave(s);tower.reloadTimer=2;tick(s,.5);assert.ok(front.life<life);
 tower.ammo=0;tower.reloadTimer=0;tick(s,.1);assert.ok(tower.reloadTimer>0);tick(s,3);assert.ok(tower.ammo>0);
});
test('energy upgrades improve their stated role and critical upgrades change real combat stats',()=>{
 const s=make(),laser=placeTower(s,'laser',1,1),flame=placeTower(s,'flamethrower',1,2),handgun=placeTower(s,'handgun',1,4),magnum=placeTower(s,'magnum',1,6);
 const capacity=laser.weapon.capacity,cooling=laser.weapon.reloadSpeed,burn=flame.weapon.burnDamage;
 upgradeTower(s,laser,'tactical');assert.ok(laser.weapon.capacity>capacity&&laser.weapon.reloadSpeed<cooling);
 upgradeTower(s,flame,'power');assert.ok(flame.weapon.burnDamage>burn);
 upgradeTower(s,handgun,'power');assert.ok(handgun.weapon.critChance>.05);
 upgradeTower(s,magnum,'power');assert.ok(magnum.weapon.critDamage>1.6);
 const enemy=dummy(handgun,'crit');handgun.weapon.critChance=1;s.enemies=[enemy];fireTower(s,handgun,enemy);
 assert.equal(s.projectiles.at(-1).damage,handgun.weapon.directDamage*handgun.weapon.critDamage);
});
test('amber overdrive is on the route, separate from ice, and increases real movement by 35%',()=>{
 assert.equal(levels.filter(l=>l.speedTiles?.length).length,5);
 for(const l of levels)for(const tile of l.speedTiles||[]){assert.ok(l.track.some(t=>t.row===tile.row&&t.col===tile.col));assert.ok(!l.slowTiles.some(t=>t.row===tile.row&&t.col===tile.col));}
 const normal=make(),fast=make();fast.level={...fast.level,speedTiles:[fast.level.track[0]]};
 for(const s of [normal,fast]){launchWave(s);const dummyTower={x:s.path[0].x-100,y:s.path[0].y};s.enemies=[dummy(dummyTower,'runner')];s.enemies[0].speed=10;}
 tick(normal,.5);tick(fast,.5);assert.ok(Math.abs(fast.enemies[0].progress/normal.enemies[0].progress-1.35)<.001);
});
test('trait aliens retain distinct artwork and ordinary missions never grant cache rewards',()=>{
 const keys=['alien_medic','alien_steadfast','alien_rager','alien_broodmother'];assert.equal(new Set(keys.map(k=>enemies[k].asset)).size,4);
 assert.ok(keys.every(k=>enemies[k].asset.startsWith('assets/frontier/aliens/')));
 const p=normalizeProfile();assert.equal(missionSlotReward(p,levels[0]),null);
 assert.equal(missionSlotReward(p,levels[0]),null);assert.equal(applyArsenal(weapons[0],p).attachments,undefined);
});
