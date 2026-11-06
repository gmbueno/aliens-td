import {missionRecords} from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,resetSkills,recordVictory} from '../src/systems/profile.js';
import {skillTree,buySkill,activeUnlocked,spentSkillPoints} from '../src/data/skills.js';
import {missionSlotReward} from '../src/data/arsenal.js';
import {weapons} from '../src/data/weapons.js';
import {levels} from '../src/data/levels/index.js';
import {createInitialState,stepState,launchWave,placeTower,clearObstacle,obstacleCost,fireTower,activateChronoBreak,activateNapalm,activateArtillery} from '../src/game.js';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const profile=raw=>normalizeProfile({schemaVersion:4,missions:missionRecords(),level:12,settings:{muted:true},...raw});
const make=(p=profile(),level=levels[0])=>createInitialState(level,p,{width:1280,height:720});
const tick=(s,t)=>{for(let n=0;n<t*60;n++)stepState(s,1/60);};
function encounter(p=profile(),spawns=[{enemy:'alien_steadfast',at:0}]){
 const level={...levels[0],threat:1,waves:[{name:'Test',spawns:[...spawns,{enemy:'alien_normal',at:100}],healthScale:1,reward:0}]};
 const s=make(p,level);launchWave(s);tick(s,.02);return s;
}
test('command graph is acyclic with valid prerequisites, and locks purchases until trained',()=>{
 const keys=new Set(skillTree.map(s=>s.key));assert.equal(keys.size,22);
 for(const skill of skillTree){let current=skill,seen=new Set();while(current.requires){assert.ok(keys.has(current.requires.key));assert.ok(!seen.has(current.key));seen.add(current.key);current=skillTree.find(s=>s.key===current.requires.key);}}
 const p=profile();assert.equal(buySkill(p,'pontoons'),false);assert.equal(buySkill(p,'extraDrone'),false);
 assert.ok(buySkill(p,'salvage'));assert.ok(buySkill(p,'supplies'));assert.ok(buySkill(p,'pontoons'));assert.equal(buySkill(p,'pontoons'),false);
 assert.ok(buySkill(p,'mines'));assert.ok(buySkill(p,'drone'));assert.equal(spentSkillPoints(p),29);
});
test('all powers start unlocked, default Stasis works and legacy equipped powers survive',()=>{
 const fresh=normalizeProfile({schemaVersion:6});assert.equal(fresh.equippedActiveKey,'chronoBreak');
 for(const key of ['chronoBreak','artillery','napalm'])assert.ok(activeUnlocked(fresh,key));
 const s=make(fresh);launchWave(s);assert.equal(activateChronoBreak(s),true);assert.equal(activateNapalm(s),false,'only the equipped power can fire');
 const old=normalizeProfile({level:6,skills:{damage:2},equippedActiveKey:'artillery'});assert.equal(old.equippedActiveKey,'artillery');
 resetSkills(old);assert.equal(old.equippedActiveKey,'artillery');assert.equal(normalizeProfile(JSON.parse(JSON.stringify(old))).equippedActiveKey,'artillery');
});
test('clearance discounts show the charged price; starting funds cannot be farmed with a respec',()=>{
 const p=profile({skills:{salvage:3,supplies:2}}),s=make(p,levels[3]);assert.equal(s.gold,levels[3].startGold+50);
 const obstacle=s.level.blockers.find(t=>t.cost);assert.equal(obstacleCost(s,obstacle),Math.ceil(obstacle.cost*.55));
 const before=s.gold;clearObstacle(s,obstacle);assert.equal(s.gold,before-Math.ceil(obstacle.cost*.55));
 const gold=s.gold;resetSkills(p);buySkill(p,'salvage');buySkill(p,'supplies');assert.equal(s.gold,gold);assert.equal(make(p).gold,levels[0].startGold+25);
});
test('water terrain is valid and a raft requires research and exactly 35 extra credits',()=>{
 for(const level of levels)for(const water of level.water||[]){assert.ok(![...level.track,...level.blockers,...level.pads].some(t=>t.row===water.row&&t.col===water.col));}
 assert.equal(levels.filter(l=>l.water?.length).length,5);
 const p=profile(),s=make(p,levels[3]),water=s.level.water[0];assert.equal(placeTower(s,'handgun',water.row,water.col),null);
 buySkill(p,'salvage');buySkill(p,'supplies');buySkill(p,'pontoons');const before=s.gold;
 const tower=placeTower(s,'handgun',water.row,water.col);assert.ok(tower);assert.equal(tower.platform,35);assert.equal(s.gold,before-105);assert.equal(tower.invested,105);
});
test('automatic exit mines damage aliens once, are finite, and are not replenished by a respec',()=>{
 const p=profile({skills:{mines:2}}),s=encounter(p);assert.equal(s.mines.length,4);
 const enemy=s.enemies[0],mine=s.mines[0];enemy.speed=0;enemy.x=mine.x;enemy.y=mine.y;
 const hp=enemy.life;tick(s,.02);assert.ok(enemy.life<hp);assert.ok(s.mines.some(m=>m.spent));
 const spent=s.mines.filter(m=>m.spent).length;resetSkills(p);buySkill(p,'mines');assert.equal(s.mines.filter(m=>m.spent).length,spent);assert.equal(make(p).mines.length,2);
});
test('UAV patrol attacks automatically, reserves a visible base, and freezes on pause',()=>{
 const s=encounter(profile({skills:{mines:1,drone:1}}));const drone=s.drone;assert.ok(drone);
 assert.equal(placeTower(s,'handgun',drone.base.row,drone.base.col),null);
 const enemy=s.enemies[0];enemy.speed=0;const hp=enemy.life;tick(s,1);assert.ok(enemy.life<hp);assert.ok(drone.time>0);
 drone.time=(s.path.length-1)/.9-.01;tick(s,.02);const end=s.path.at(-1);assert.ok(Math.hypot(drone.x-end.x,drone.y-end.y)<80,"UAV turns back at the exit instead of teleporting to the entrance");
 s.isPaused=true;const time=drone.time;tick(s,3);assert.equal(drone.time,time);
});
test('Menders heal other live aliens, respect maximum HP, and do not revive killed aliens',()=>{
 const s=encounter(profile(),[{enemy:'alien_steadfast',at:0},{enemy:'alien_medic',at:0}]);const [ally,medic]=s.enemies;ally.speed=medic.speed=0;ally.life=ally.maxLife-100;
 tick(s,2.1);assert.equal(ally.life,ally.maxLife);assert.ok(medic.healer);
 ally.life=0;tick(s,2.1);assert.ok(!s.enemies.includes(ally));
});
test('special ranks use the deployment snapshot when new research is purchased mid-mission',()=>{
 const p=profile({skills:{mines:1,napalm:1},equippedActiveKey:'napalm'}),s=encounter(p);
 assert.ok(buySkill(p,'napalm'));assert.ok(activateNapalm(s));assert.equal(s.activeAbilities.napalm.damage,1050);
 const next=encounter(p);activateNapalm(next);assert.equal(next.activeAbilities.napalm.damage,1100);
});
