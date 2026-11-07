import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,recordVictory,addXp} from '../src/systems/profile.js';
import {classUnlocked,loadoutCapacity,loadoutKeys} from '../src/data/arsenal.js';
import {buySkill} from '../src/data/skills.js';
import {campaignStars} from '../src/data/progression.js';
import {createInitialState,placeTower,stepState,upgradeTower} from '../src/game.js';
import {levels} from '../src/data/levels/index.js';
import {weaponRangeCells,rangePerimeter} from '../src/systems/rangeGeometry.js';
globalThis.localStorage={getItem(){},setItem(){}};
const tick=(s,t)=>{for(let n=0;n<t*60;n++)stepState(s,1/60);};

test('range perimeter contains only exterior cell edges, preserving the exact circular cell footprint',()=>{
 const tower={x:100,y:100,tile:40,range:85,weapon:{}},cells=weaponRangeCells(tower),edges=rangePerimeter(cells);
 assert.equal(cells.length,13);assert.equal(edges.length,20);
 const covered=(x,y)=>cells.some(c=>x>c.col-.5&&x<c.col+.5&&y>c.row-.5&&y<c.row+.5);
 for(const [x1,y1,x2,y2] of edges){const x=(x1+x2)/2,y=(y1+y2)/2;
  assert.notEqual(covered(x+(y1===y2?0:.01),y+(x1===x2?0:.01)),covered(x-(y1===y2?0:.01),y-(x1===x2?0:.01)),'every outline edge separates coverage from uncovered ground');
 }
});
test('Mine Foundry builds before the first alien, pauses, caps stock and ignores every range source',()=>{
 const p=normalizeProfile({schemaVersion:8,level:10,skillPoints:500,skills:{range:5,reload:1},discoveredCategories:['minelayer','beacon'],arsenal:{loadout:['minelayer','beacon']}});
 const s=createInitialState(levels[0],p,{width:1280,height:720});s.gold=10000;
 const t=placeTower(s,'minelayer',3,3),range=t.range;assert.equal(range,109);assert.equal(weaponRangeCells(t).length,8);
 const radar=placeTower(s,'beacon',3,2);assert.ok(radar);upgradeTower(s,radar,'tactical');assert.equal(t.range,range);
 tick(s,10);assert.equal(s.phase,'prepare');assert.equal(s.enemies.length,0);assert.ok(s.pathMines.length>=3);
 for(const mine of s.pathMines)assert.equal(Math.max(Math.abs(Math.round((mine.x-t.x)/t.tile)),Math.abs(Math.round((mine.y-t.y)/t.tile))),1);
 s.isPaused=true;const stock=s.pathMines.length;tick(s,10);assert.equal(s.pathMines.length,stock);
 s.isPaused=false;tick(s,7);assert.ok(s.pathMines.length<=6);assert.equal(t.range,range);
 assert.ok(upgradeTower(s,t,'tactical'));assert.equal(t.weapon.mineLimit,8);assert.equal(t.range,range);
});
test('categories have independent level, mission and best-star unlock routes',()=>{
 const p=normalizeProfile({schemaVersion:8,level:1});assert.equal(classUnlocked(p,'factory'),false);assert.equal(classUnlocked(p,'sniper'),false);assert.equal(classUnlocked(p,'magnum'),false);
 p.level=4;assert.equal(classUnlocked(p,'factory'),true);assert.equal(classUnlocked(p,'magnum'),false);assert.equal(classUnlocked(p,'sniper'),false);
 recordVictory(p,levels[0],18);assert.ok(classUnlocked(p,'shotgun'));recordVictory(p,levels[1],18);assert.equal(campaignStars(p),6);assert.ok(classUnlocked(p,'beacon'));assert.ok(classUnlocked(p,'magnum'));assert.equal(classUnlocked(p,'sniper'),false);
 recordVictory(p,levels[3],18);assert.ok(classUnlocked(p,'sniper'));assert.equal(classUnlocked(p,'rocket_launcher'),false);
 const stars=campaignStars(p);recordVictory(p,levels[0],18);assert.equal(campaignStars(p),stars,'replays never inflate the best-star total');
});
test('ten slots require all reward routes; earned slots autofill without duplicate or repeat rewards',()=>{
 const p=normalizeProfile({schemaVersion:8,level:1,skillPoints:200});assert.equal(loadoutCapacity(p),3);
 buySkill(p,'loadoutSlots');buySkill(p,'loadoutSlots');assert.equal(loadoutCapacity(p),5);
 for(let i=0;i<10;i++)recordVictory(p,levels[i],18);
 p.level=Math.max(8,p.level);assert.equal(loadoutCapacity(p),10);assert.equal(loadoutKeys(p).length,10);assert.equal(new Set(loadoutKeys(p)).size,10);
 const balance=p.skillPoints;assert.equal(buySkill(p,'loadoutSlots'),false);assert.equal(p.skillPoints,balance);
 recordVictory(p,levels[3],18);assert.equal(loadoutCapacity(p),10);assert.equal(normalizeProfile(JSON.parse(JSON.stringify(p))).arsenal.loadout.length,10);
});
test('level progress earned in free play can unlock a slot without a mission clear',()=>{
 const p=normalizeProfile({schemaVersion:8,level:7,xp:299});assert.equal(loadoutCapacity(p),3);addXp(p,1);assert.equal(p.level,8);assert.equal(loadoutCapacity(p),4);assert.equal(Object.keys(p.missions).length,0);
});
test('schema migration retains previously earned categories and never repeats SP grants',()=>{
 const raw={schemaVersion:7,level:2,skillPoints:17,skills:{damage:1},arsenal:{loadout:['flamethrower','gas','handgun']},missions:Object.fromEntries(Array.from({length:8},(_,i)=>[`level_${i+1}`,{clears:1,stars:1}]))};
 const p=normalizeProfile(raw);assert.ok(classUnlocked(p,'flamethrower'));assert.ok(classUnlocked(p,'gas'));assert.equal(loadoutKeys(p)[0],'flamethrower');
 const next=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(next.skillPoints,p.skillPoints);assert.deepEqual(next.discoveredCategories,p.discoveredCategories);
});
