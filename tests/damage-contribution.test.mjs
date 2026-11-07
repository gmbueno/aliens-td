import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/data/levels/index.js';
import {enemies} from '../src/data/enemies.js';
import {normalizeProfile} from '../src/systems/profile.js';
import {createInitialState,placeTower,projectileHit,updateProjectiles,damageEnemy,fireTower,stepState,upgradeTower} from '../src/game.js';
import {missionRecords} from './fixtures.mjs';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const make=()=>{const s=createInitialState({...levels[0],waves:[{spawns:[{enemy:'alien_normal',at:1000}],healthScale:1,reward:0}]},normalizeProfile({schemaVersion:8,level:10,missions:missionRecords(18,1),arsenal:{loadout:['handgun','assault_rifle','flamethrower','rocket_launcher']},settings:{muted:true}}),{width:1280,height:720});s.gold=10000;return s;};
const enemy=(s,overrides={})=>({...enemies.alien_normal,id:'victim',...s.path[0],life:1000,maxLife:1000,shield:0,armor:0,speed:0,radius:15,segment:0,progress:0,burnTimer:0,slowTimer:0,stunTimer:0,...overrides});
const shot=(tower,damage,extra={})=>({weaponKey:tower.weapon.key,ownerId:tower.id,damage,armorPierce:0,...extra});

test('damage contribution counts real armor-adjusted health and shield, caps overkill and separates last-hit kills',()=>{
 const s=make(),main=placeTower(s,'handgun',3,1),finisher=placeTower(s,'assault_rifle',3,3),e=enemy(s,{shield:50,armor:.5});s.enemies=[e];
 projectileHit(s,shot(main,100),e);assert.equal(main.damageDealt,75);assert.equal(e.life,975);assert.equal(e.shield,0);assert.equal(main.kills,0);
 projectileHit(s,shot(main,1600),e);assert.equal(main.damageDealt,875);assert.equal(e.life,175);
 projectileHit(s,shot(finisher,10000,{armorPierce:1}),e);assert.equal(finisher.damageDealt,175);assert.equal(e.life,0);
 projectileHit(s,shot(main,10000),e);assert.equal(main.damageDealt,875,'dead enemies add nothing');
 updateProjectiles(s,0);assert.equal(main.kills,0);assert.equal(finisher.kills,1);assert.equal(s.runWeaponKills.assault_rifle,1);
 assert.equal(main.damageDealt+finisher.damageDealt,1050);
 const armored=enemy(s,{armor:1});assert.equal(damageEnemy(armored,100,0,{ownerId:main.id},s),0);assert.equal(main.damageDealt,875);
});
test('area damage counts each living victim once, and power/exit mine damage never inflates a tower',()=>{
 const s=make(),rocket=placeTower(s,'rocket_launcher',3,3),a=enemy(s,{x:500,y:300,life:500}),b=enemy(s,{id:'neighbor',x:510,y:300,life:80}),dead=enemy(s,{id:'dead',x:505,y:300,life:0});s.enemies=[a,b,dead];
 projectileHit(s,shot(rocket,2000,{splashRadius:100}),a);assert.equal(rocket.damageDealt,580);
 const other=enemy(s);damageEnemy(other,100,1,{weaponKey:'artillery'},s);damageEnemy(other,100,1,{weaponKey:'mines'},s);assert.equal(rocket.damageDealt,580);
});
test('flame direct hits and later burns retain the originating unit; pause and upgrades preserve the total',()=>{
 const s=make(),flame=placeTower(s,'flamethrower',3,1),e=enemy(s,{x:0,y:0,life:10000,maxLife:10000});e.x=flame.x+70;e.y=flame.y;s.enemies=[e];s.phase='combat';flame.weapon.critChance=0;
 fireTower(s,flame,e);flame.reloadTimer=100;const direct=flame.damageDealt;assert.ok(direct>0);
 for(let i=0;i<30;i++)stepState(s,1/60);assert.ok(flame.damageDealt>direct);assert.ok(Math.abs(flame.damageDealt-(10000-e.life))<.001);
 const total=flame.damageDealt;s.isPaused=true;stepState(s,5);assert.equal(flame.damageDealt,total);upgradeTower(s,flame,'power');assert.equal(flame.damageDealt,total);
 const fresh=make(),replacement=placeTower(fresh,'flamethrower',3,1);assert.equal(replacement.damageDealt,0);
});
