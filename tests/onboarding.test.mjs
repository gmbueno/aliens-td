import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,recordVictory,resetSkills} from '../src/systems/profile.js';
import {levels} from '../src/data/levels/index.js';
import {loadoutKeys,loadoutCapacity} from '../src/data/arsenal.js';
import {createInitialState,launchWave,stepState} from '../src/game.js';
import {activeAbilities,activeUnlocked,buySkill} from '../src/data/skills.js';
globalThis.localStorage={getItem(){return null;},setItem(){}};
test('intro is three ready categories, all three powers, two opening species and no paid obstacles/haste',()=>{
 const p=normalizeProfile();assert.deepEqual(loadoutKeys(p),['handgun','assault_rifle','machine_pistol']);assert.equal(p.equippedActiveKey,'chronoBreak');for(const a of activeAbilities)assert.ok(activeUnlocked(p,a.key));
 assert.deepEqual([...new Set(levels[0].waves.flatMap(w=>w.spawns.map(s=>s.enemy)))].sort(),['alien_fast','alien_normal']);
 for(const level of levels.slice(0,3)){assert.ok(level.startGold>=350);assert.ok(level.blockers.every(b=>!b.cost));assert.equal(level.speedTiles?.length||0,0);}
});
test('there is no cache or midpoint payout; milestone slots require victory and are never repeated',()=>{
 const p=normalizeProfile(),level={...levels[3],waves:[{name:'Empty fixture',spawns:[],reward:0},{name:'Hold',spawns:[{enemy:'alien_normal',at:100}],reward:0}]};
 const s=createInitialState(level,p,{width:1280,height:720});assert.equal('cache' in s,false);const gold=s.gold;launchWave(s);stepState(s,.02);assert.equal(loadoutCapacity(p),3);assert.equal(s.gold,gold+15,'only the normal flawless wave reward');assert.equal(p.slotRewards.level_4,undefined);
 assert.ok(recordVictory(p,levels[3],18).slotReward);assert.equal(loadoutCapacity(p),4);assert.equal(recordVictory(p,levels[3],18).slotReward,null);assert.equal(recordVictory(p,levels[0],18).slotReward,null);
});
test('legacy chest slots and completed milestones migrate once, preserving paid ranks and new loadout autofill',()=>{
 const old={schemaVersion:5,level:10,skillPoints:74,skills:{loadoutSlots:2},caches:{level_4:true},missions:{level_10:{clears:1},level_2:{clears:1}},arsenal:{loadout:['handgun','assault_rifle','machine_pistol']}};
 const p=normalizeProfile(old);assert.equal(p.caches,undefined);assert.deepEqual(p.slotRewards,{level_4:true,level_10:true});assert.equal(p.skills.loadoutSlots,2);assert.equal(loadoutCapacity(p),8);assert.equal(p.skillPoints,74);assert.ok(p.arsenal.loadout.includes('shotgun'));assert.equal(normalizeProfile(JSON.parse(JSON.stringify(p))).skillPoints,74);
});
test('learning flags survive refunds and reload; a failed purchase never counts as learned',()=>{
 const p=normalizeProfile();assert.equal(buySkill(p,'damage'),false);assert.equal(p.onboarding.researchSpent,false);
 p.onboarding={researchSpent:true,towerUpgraded:true,powerUsed:true,seenWeapons:['handgun','assault_rifle','machine_pistol']};resetSkills(p);const saved=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.deepEqual(saved.onboarding,p.onboarding);assert.equal(saved.equippedActiveKey,'chronoBreak');
});
