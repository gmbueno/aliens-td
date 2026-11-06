import {missionRecords} from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../src/data/levels/index.js';
import { enemies } from '../src/data/enemies.js';
import { weapons } from '../src/data/weapons.js';
import { createInitialState, stepState, launchWave, placeTower, upgradeTower, sellTower, sellValue, clearObstacle, damageEnemy, activateChronoBreak, activateArtillery, activateNapalm } from '../src/game.js';
import { normalizeProfile, loadProfile, saveProfile, recordVictory, missionStars, resetSkills } from '../src/systems/profile.js';
import { buySkill, spentSkillPoints } from '../src/data/skills.js';
import { refreshTowerSkillBonuses, towerUpgradeCost } from '../src/systems/weaponStats.js';
import { simulate } from './balance.mjs';

const saved = new Map();
globalThis.localStorage = {getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
const make = (level=levels[0], raw={}) => createInitialState(level,normalizeProfile({schemaVersion:3,skills:{loadoutSlots:2},caches:{level_4:true},missions:missionRecords(),settings:{muted:true},...raw}),{width:1280,height:720});
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

test('artillery and napalm apply damage and cooldown, without duplicate kill rewards',()=>{
  const state=make(undefined,{equippedActiveKey:'rocketLauncher',settings:{muted:true}});
  launchWave(state);tick(state,1);const enemy=state.enemies[0];
  assert.ok(activateArtillery(state,enemy.x,enemy.y));tick(state,.3);
  assert.ok(enemy.life<enemy.maxLife);tick(state,1);assert.ok(state.kills>0);const kills=state.kills;
  assert.equal(activateArtillery(state,enemy.x,enemy.y),false);tick(state,.02);assert.equal(state.kills,kills);
  const burn=make(undefined,{equippedActiveKey:'napalm',settings:{muted:true}});launchWave(burn);tick(burn,1);
  const hp=burn.enemies[0].life;assert.ok(activateNapalm(burn,burn.enemies[0].x,burn.enemies[0].y));tick(burn,1);assert.ok(burn.enemies[0].life<hp);
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
    const ranks=Math.min(5,Math.max(1,Math.ceil((index+1)/3)));
    assert.equal(simulate(level,ranks).result,'victory',`${level.name} at passive rank ${ranks}`);
  }
});

test('First, Last, Strongest and Nearest choose their actual in-range target', async()=>{
  const {targetForTower}=await import('../src/game.js');
  const tower={x:0,y:0,range:100,targeting:'first'};
  const aliens=[
    {id:'front',x:80,y:0,life:100,shield:0,segment:4,progress:1},
    {id:'back',x:40,y:0,life:100,shield:0,segment:1,progress:2},
    {id:'heavy',x:70,y:0,life:300,shield:400,segment:2,progress:1},
    {id:'near',x:10,y:0,life:200,shield:0,segment:2,progress:10},
    {id:'out-of-range',x:120,y:0,life:10000,shield:0,segment:0,progress:0},
    {id:'dead',x:0,y:0,life:0,shield:0,segment:0,progress:0},
  ];
  for(const [mode,id] of [['first','front'],['last','back'],['strongest','heavy'],['nearest','near']]){
    tower.targeting=mode;assert.equal(targetForTower(tower,aliens).id,id);
  }
  assert.equal(targetForTower(tower,[]),null);
  assert.equal(aliens[0].id,'front','targeting must not reorder the live enemy array');
});

test('shotgun emits its whole fan at one enemy, using one shell and one sound', async()=>{
  const {fireTower}=await import('../src/game.js');
  const state=make();state.gold=1000;
  const tower=placeTower(state,'shotgun',1,1);
  const target={id:'only',x:tower.x+100,y:tower.y,life:5000,speed:0,angle:0,slowTimer:0};
  state.enemies=[target];const before=tower.ammo;let sounds=0;
  state.profile.settings.muted=false;state.audio={play(){sounds++;}};
  fireTower(state,tower,target);
  assert.equal(state.projectiles.length,3);assert.equal(tower.ammo,before-1);assert.equal(sounds,1);
  assert.ok(state.projectiles.every(p=>p.ballistic&&p.targetId===null));
  assert.equal(new Set(state.projectiles.map(p=>p.vy.toFixed(3))).size,3);
});

test('ballistic pellets keep their trajectory after target movement or death', async()=>{
  const {fireTower,updateProjectiles}=await import('../src/game.js');
  const state=make();state.gold=1000;const tower=placeTower(state,'shotgun',1,1);
  const target={id:'original',x:tower.x+100,y:tower.y,life:5000,speed:0,angle:0,slowTimer:0};
  state.enemies=[target];fireTower(state,tower,target);
  const trajectories=state.projectiles.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy}));
  state.enemies=[];updateProjectiles(state,.1);
  assert.equal(state.projectiles.length,3,'death of the original target must not erase pellets');
  state.projectiles.forEach((p,i)=>{assert.equal(p.vx,trajectories[i].vx);assert.equal(p.vy,trajectories[i].vy);assert.ok(Math.abs(p.x-trajectories[i].x-p.vx*.1)<.001);});
});

test('a different alien crossing the fan is hit after the original target disappears', async()=>{
  const {fireTower,updateProjectiles}=await import('../src/game.js');
  const state=make();state.gold=1000;const tower=placeTower(state,'shotgun',1,1);
  fireTower(state,tower,{id:'gone',x:tower.x+110,y:tower.y,life:5000,speed:0,angle:0,slowTimer:0});
  const pellet=state.projectiles[0];
  const crossing={id:'crossing',x:pellet.x+pellet.vx*.2,y:pellet.y+pellet.vy*.2,life:5000,shield:0,armor:0,radius:10};
  state.enemies=[crossing];updateProjectiles(state,.25);
  assert.ok(crossing.life<5000);
});

test('swept pellet collision chooses the first live alien, even across a large time step', async()=>{
  const {updateProjectiles}=await import('../src/game.js');
  const state=make();
  const enemy=(id,x)=>({id,x,y:100,life:2000,shield:0,armor:0,radius:10});
  const far=enemy('far',180),near=enemy('near',80);state.enemies=[far,near];
  state.projectiles=[{id:'pellet',ballistic:true,x:0,y:100,vx:1000,vy:0,damage:700,armorPierce:0,life:1}];
  updateProjectiles(state,.3);assert.equal(near.life,1300);assert.equal(far.life,2000);assert.equal(state.projectiles.length,0);
});

test('pellets expire and never damage the same alien repeatedly', async()=>{
  const {updateProjectiles}=await import('../src/game.js');
  const state=make();const enemy={id:'one',x:80,y:100,life:2000,shield:0,armor:0,radius:10};
  state.enemies=[enemy];state.projectiles=[{id:'p',ballistic:true,x:0,y:100,vx:1000,vy:0,damage:700,armorPierce:0,life:1}];
  updateProjectiles(state,.1);updateProjectiles(state,.1);assert.equal(enemy.life,1300);
  state.projectiles=[{id:'expired',ballistic:true,x:0,y:100,vx:1000,vy:0,damage:700,armorPierce:0,life:.02}];
  updateProjectiles(state,.3);assert.equal(enemy.life,1300);assert.equal(state.projectiles.length,0);
});

// Arsenal scenarios validate outcomes, migration and saved-build boundaries.
test('weapon-specific upgrades change the intended combat roles',()=>{
 const state=make(undefined,{level:10});state.gold=100000;
 const build=key=>{state.arsenalProfile.arsenal.loadout=[key,...state.arsenalProfile.arsenal.loadout.filter(k=>k!==key)];for(let row=0;row<state.level.rows;row++)for(let col=0;col<state.level.cols;col++){const tower=placeTower(state,key,row,col);if(tower)return tower;}};
 const shotgun=build('shotgun');assert.equal(shotgun.weapon.pelletCount,3);
 upgradeTower(state,shotgun,'power');assert.equal(shotgun.weapon.pelletCount,4);
 upgradeTower(state,shotgun,'power');assert.equal(shotgun.weapon.pelletCount,5);
 const mp=build('machine_pistol');const slow=mp.weapon.slow;upgradeTower(state,mp,'tactical');
 assert.equal(mp.weapon.slowStrength,.35);assert.ok(mp.weapon.slow>slow);assert.equal(mp.weapon.slow,1.3);
 const magnum=build('magnum'),damage=magnum.weapon.directDamage;upgradeTower(state,magnum,'power');assert.equal(magnum.weapon.directDamage,damage*1.5);
 const sniper=build('sniper'),range=sniper.range;upgradeTower(state,sniper,'tactical');assert.equal(sniper.range,Math.round(range*1.25));
 const rpg=build('rocket_launcher'),radius=rpg.weapon.splashRadius;upgradeTower(state,rpg,'power');assert.equal(rpg.weapon.splashRadius,radius+12);
});

test('legacy rocket active and invested ranks migrate to artillery without losing SP',()=>{
 const profile=normalizeProfile({level:8,skillPoints:31,skills:{rocketLauncher:3},equippedActiveKey:'rocketLauncher'});
 assert.equal(profile.equippedActiveKey,'artillery');assert.equal(profile.skills.artillery,3);assert.equal(profile.skills.rocketLauncher,undefined);assert.ok(profile.skillPoints>=31);
});

const customState=(enemyKey,active='chronoBreak')=>{
 const level={...levels[0],threat:1,waves:[{name:'Trait test',healthScale:1,reward:0,spawns:[{enemy:enemyKey,at:0},{enemy:'alien_normal',at:100}]}]};
 const s=make(level,{level:10,equippedActiveKey:active});launchWave(s);tick(s,.02);return s;
};
test('slow-immune enemies resist weapons; rage triggers only after a damaging hit',async()=>{
 const {projectileHit}=await import('../src/game.js');
 const immune=customState('alien_steadfast'),enemy=immune.enemies[0];
 projectileHit(immune,{damage:1,armorPierce:0,slow:2,slowStrength:.6,cryo:true},enemy);assert.equal(enemy.slowTimer,0);
 const rage=customState('alien_rager'),rager=rage.enemies[0];assert.equal(rager.raged,false);
 const start=rager.x;tick(rage,.5);const normal=rager.x-start;
 damageEnemy(rager,1,1);assert.equal(rager.raged,true);const x=rager.x;tick(rage,.5);assert.ok(rager.x-x>normal*1.5);
});

test('broodmother spawns live hatchlings over time and on death; babies give no farmable rewards',()=>{
 const s=customState('alien_broodmother'),parent=s.enemies[0];const total=s.totalEnemies;
 tick(s,8.1);assert.ok(s.enemies.some(e=>e.key==='alien_hatchling'));assert.equal(s.totalEnemies,total+1);
 parent.life=0;tick(s,.02);const babies=s.enemies.filter(e=>e.key==='alien_hatchling');assert.equal(babies.length,4);assert.equal(s.kills,1);
 const gold=s.gold,xp=s.runXp;babies.forEach(b=>b.life=0);tick(s,.02);assert.equal(s.gold,gold);assert.equal(s.runXp,xp);assert.equal(s.kills,5);
});

test('artillery produces exactly ten impacts across five seconds; pause stops it',()=>{
 const s=customState('alien_steadfast','artillery'),enemy=s.enemies[0],sounds=[];s.audio={play:key=>sounds.push(key)};
 enemy.speed=0;enemy.life=100000;enemy.maxLife=100000;
 activateArtillery(s,enemy.x,enemy.y);assert.equal(s.artillery.strikes,0);tick(s,.3);assert.equal(s.artillery.strikes,1);
 s.isPaused=true;tick(s,3);assert.equal(s.artillery.strikes,1);s.isPaused=false;
 tick(s,4.8);assert.equal(s.artillery,null);assert.equal(sounds.filter(k=>k==='impact').length,10);assert.ok(enemy.life<100000);assert.ok(s.activeAbilities.artillery.cooldown>0);
});

test('RPG detonates in an area even when the original target dies in flight',async()=>{
 const {fireTower,updateProjectiles}=await import('../src/game.js');
 const s=customState('alien_steadfast');s.arsenalProfile.arsenal.loadout=['rocket_launcher'];s.gold=10000;const tile=freeTile(s),tower=placeTower(s,'rocket_launcher',tile.row,tile.col);
 const target={...s.enemies[0],x:tower.x+100,y:tower.y,id:'target'},other={...s.enemies[0],x:tower.x+105,y:tower.y,id:'other'};s.enemies=[target,other];
 fireTower(s,tower,target);target.life=0;updateProjectiles(s,.5);assert.ok(other.life<other.maxLife);assert.ok(s.effects.some(e=>e.kind==='explosion'));
});
