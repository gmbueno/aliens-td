import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/data/levels/index.js';
import { enemies } from '../src/data/enemies.js';
import { weapons } from '../src/data/weapons.js';
import { createInitialState, stepState, launchWave, placeTower, upgradeTower, sellTower, sellValue, clearObstacle, damageEnemy, activateChronoBreak, activateRocketLauncher, activateNapalm } from '../src/game.js';
import { normalizeProfile, loadProfile, saveProfile, recordVictory, missionStars, resetSkills } from '../src/systems/profile.js';
import { buySkill, spentSkillPoints } from '../src/data/skills.js';
import { refreshTowerSkillBonuses, towerUpgradeCost } from '../src/systems/weaponStats.js';
import { simulate } from './balance.mjs';

const saved = new Map();
globalThis.localStorage = {getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const make = (level=levels[0], raw={}) => createInitialState(level,normalizeProfile({settings:{muted:true},...raw}),{width:1280,height:720});
const tick = (state, seconds) => { for(let n=0;n<seconds*60;n++)stepState(state,1/60); };
const freeTile = state => {
  for(let row=0;row<state.level.rows;row++)for(let col=0;col<state.level.cols;col++) if(!state.tileSets.path.has(`${row}:${col}`)&&!state.tileSets.blockers.has(`${row}:${col}`))return{row,col};
};

test('18 authored missions have valid paths, distinct layouts, legal obstacles/pads and timed waves',()=>{
  assert.equal(levels.length,18);
  assert.equal(new Set(levels.map(level=>JSON.stringify(level.track))).size,18);
  for(const level of levels) {
    const path=new Set(level.track.map(t=>`${t.row}:${t.col}`));
    for(const [i,t] of level.track.entries()) {
      assert.ok(t.row>=0&&t.row<level.rows&&t.col>=0&&t.col<level.cols,level.id);
      if(i)assert.equal(Math.abs(t.row-level.track[i-1].row)+Math.abs(t.col-level.track[i-1].col),1,level.id);
    }
    const terrain=new Set();
    for(const tile of [...level.blockers,...level.pads]) {
      const key=`${tile.row}:${tile.col}`;
      assert.ok(!path.has(key)&&!terrain.has(key),`${level.id}: occupied terrain ${key}`);
      assert.ok(tile.row>=0&&tile.row<level.rows&&tile.col>=0&&tile.col<level.cols);
      terrain.add(key);
    }
    for(const tile of level.slowTiles)assert.ok(path.has(`${tile.row}:${tile.col}`));
    for(const wave of level.waves) {
      assert.ok(wave.spawns.length>0);
      wave.spawns.forEach((spawn,i)=>{assert.ok(enemies[spawn.enemy]);assert.ok(spawn.at>=0);if(i)assert.ok(spawn.at>=wave.spawns[i-1].at);});
    }
  }
});

test('preparation waits indefinitely and first launch cannot generate gold',()=>{
  const state=make();tick(state,120);
  assert.equal(state.enemies.length,0); assert.equal(state.waveIndex,0);
  const gold=state.gold;
  assert.equal(activateChronoBreak(state),false);
  assert.equal(launchWave(state),true);assert.equal(launchWave(state),false);
  assert.equal(state.gold,gold);tick(state,1);assert.ok(state.enemies.length>0);
});

test('cannot build on route, obstacle, occupied tile, out of bounds or without funds',()=>{
  const state=make();const route=state.level.track[0], obstacle=state.level.blockers[0], free=freeTile(state);
  assert.equal(placeTower(state,'handgun',route.row,route.col),null);
  assert.equal(placeTower(state,'handgun',obstacle.row,obstacle.col),null);
  assert.equal(placeTower(state,'handgun',-1,0),null);
  assert.ok(placeTower(state,'handgun',free.row,free.col));
  assert.equal(placeTower(state,'handgun',free.row,free.col),null);
  state.gold=0;assert.equal(placeTower(state,'sniper',1,1),null);
});

test('obstacle clearance charges once and opens a usable position',()=>{
  const state=make();const obstacle=state.level.blockers.find(t=>t.cost);
  const gold=state.gold;assert.equal(clearObstacle(state,obstacle),true);
  assert.equal(state.gold,gold-obstacle.cost);assert.equal(clearObstacle(state,obstacle),false);
  assert.ok(placeTower(state,'handgun',obstacle.row,obstacle.col));
  assert.equal(clearObstacle(state,state.level.blockers[0]),false);
});

test('tower upgrades, meta skills and pad bonuses compose; refund preserves accounting',()=>{
  const state=make(undefined,{level:8,skillPoints:70,settings:{muted:true}});state.gold=10000;
  const pad=state.level.pads[0];const tower=placeTower(state,'handgun',pad.row,pad.col);
  assert.equal(tower.range,Math.round(170*1.18));
  const before=state.gold,cost=towerUpgradeCost(tower,'power');
  assert.ok(upgradeTower(state,tower,'power'));assert.equal(state.gold,before-cost);
  assert.equal(tower.weapon.directDamage,560);
  buySkill(state.profile,'damage');refreshTowerSkillBonuses(state.towers,weapons,state.profile);
  assert.equal(tower.weapon.directDamage,605);
  resetSkills(state.profile);refreshTowerSkillBonuses(state.towers,weapons,state.profile);
  assert.equal(tower.weapon.directDamage,560);
  assert.ok(upgradeTower(state,tower,'power'));assert.ok(upgradeTower(state,tower,'power'));
  assert.equal(upgradeTower(state,tower,'power'),false);
  assert.ok(upgradeTower(state,tower,'tactical'));assert.equal(upgradeTower(state,tower,'tactical'),false);
  const refund=sellValue(state,tower), gold=state.gold;assert.equal(refund,tower.invested);
  assert.ok(sellTower(state,tower));assert.equal(state.gold,gold+refund);assert.equal(sellTower(state,tower),false);
});

test('selling during combat refunds 70%, never produces profit',()=>{
  const state=make();const tile=freeTile(state),tower=placeTower(state,'handgun',tile.row,tile.col);
  launchWave(state);assert.equal(sellValue(state,tower),49);sellTower(state,tower);assert.equal(state.gold,state.level.startGold-21);
});

test('armor and shields have distinct counters',()=>{
  const armored={life:1000,shield:0,armor:.35};damageEnemy(armored,100,0);assert.equal(armored.life,935);
  damageEnemy(armored,100,1);assert.equal(armored.life,835);
  const shielded={life:1000,shield:50,armor:.35};damageEnemy(shielded,100,1);
  assert.equal(shielded.shield,0);assert.equal(shielded.life,950);
});

test('pause freezes simulation and cooldowns; 2x advances them twice as fast',()=>{
  const state=make();launchWave(state);tick(state,1);assert.ok(activateChronoBreak(state));
  const x=state.enemies[0].x;tick(state,1);assert.equal(state.enemies[0].x,x);
  const cooldown=state.activeAbilities.chronoBreak.cooldown;
  state.isPaused=true;tick(state,10);assert.equal(state.activeAbilities.chronoBreak.cooldown,cooldown);
  state.isPaused=false;state.gameSpeed=2;tick(state,.5);
  assert.ok(Math.abs(state.activeAbilities.chronoBreak.cooldown-(cooldown-1))<.001);
  state.phase='prepare';const c=state.activeAbilities.chronoBreak.cooldown;tick(state,10);assert.equal(state.activeAbilities.chronoBreak.cooldown,c);
});

test('rocket and napalm apply damage and cooldown, without duplicate kill rewards',()=>{
  const state=make(undefined,{equippedActiveKey:'rocketLauncher',settings:{muted:true}});
  launchWave(state);tick(state,1);const enemy=state.enemies[0];
  assert.ok(activateRocketLauncher(state,enemy.x,enemy.y));tick(state,.02);
  assert.ok(state.kills>0);const kills=state.kills;
  assert.equal(activateRocketLauncher(state,enemy.x,enemy.y),false);tick(state,.02);assert.equal(state.kills,kills);
  const burn=make(undefined,{equippedActiveKey:'napalm',settings:{muted:true}});launchWave(burn);tick(burn,1);
  const hp=burn.enemies[0].life;assert.ok(activateNapalm(burn));tick(burn,1);assert.ok(burn.enemies[0].life<hp);
});

test('legacy profiles migrate without losing skills, points or equipped ability',()=>{
  const profile=normalizeProfile({level:6,xp:24,skillPoints:40,skills:{damage:2},equippedActiveKey:'napalm'});
  assert.equal(profile.level,6);assert.equal(profile.skills.damage,2);assert.equal(profile.skillPoints,40);assert.equal(profile.equippedActiveKey,'napalm');
  assert.deepEqual(profile.missions,{});assert.equal(profile.settings.autoWave,false);
  const total=profile.skillPoints+spentSkillPoints(profile);resetSkills(profile);assert.equal(profile.skillPoints,total);assert.equal(spentSkillPoints(profile),0);
  assert.ok(saveProfile(profile));assert.equal(loadProfile().skillPoints,total);
  assert.equal(normalizeProfile(null).level,1);
  assert.equal(normalizeProfile({level:Infinity,skills:{damage:-1,range:2.8}}).skills.range,2);
  assert.equal(saveProfile(profile,{setItem(){throw Error('full')}}),false);
  assert.equal(loadProfile({getItem(){throw Error('denied')}}).level,1);
});

test('first-clear rewards and new stars cannot be farmed twice; best record never falls',()=>{
  const profile=normalizeProfile();const first=recordVictory(profile,levels[0],18);
  const second=recordVictory(profile,levels[0],18);
  assert.equal(first.firstClear,true);assert.equal(second.firstClear,false);
  assert.equal(first.xp-second.xp,levels[0].firstClearXp+45);
  recordVictory(profile,levels[0],1);assert.equal(profile.missions.level_1.stars,3);assert.equal(profile.missions.level_1.clears,3);
  assert.deepEqual([missionStars(0,18),missionStars(1,18),missionStars(11,18),missionStars(18,18)],[0,1,2,3]);
});

test('a full fresh-profile opening mission is winnable without active powers',()=>{
  const result=simulate(levels[0],0);assert.equal(result.result,'victory');assert.ok(result.xp>=250);assert.ok(result.time<300);
});

test('permanent upgrades materially improve a fixed later mission',()=>{
  const fresh=simulate(levels[4],0),trained=simulate(levels[4],2);
  assert.equal(fresh.result,'defeat');assert.equal(trained.result,'victory');
});

test('no defense loses, and defeat does not grant a mission completion',()=>{
  const state=make();
  for(let i=0;i<60*300&&!state.result;i++){if(state.phase==='prepare')launchWave(state);stepState(state,1/60);}
  assert.equal(state.result,'defeat');assert.equal(state.profile.missions.level_1,undefined);
});

test('all 18 missions are beatable with the campaign training curve, without active powers',()=>{
  for(const [index,level] of levels.entries()) {
    const ranks=Math.min(5,Math.max(1,Math.ceil((index+1)/4)));
    assert.equal(simulate(level,ranks).result,'victory',`${level.name} at passive rank ${ranks}`);
  }
});
