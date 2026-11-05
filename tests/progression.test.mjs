import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,resetSkills,recordVictory} from '../src/systems/profile.js';
import {skillTree,buySkill,activeUnlocked,spentSkillPoints} from '../src/data/skills.js';
import {purchaseBlueprint,purchaseAttachment,cacheReward,eliteDrop,equipBlueprint,unlockBlueprint,applyArsenal} from '../src/data/arsenal.js';
import {weapons} from '../src/data/weapons.js';
import {levels} from '../src/data/levels/index.js';
import {createInitialState,stepState,launchWave,placeTower,clearObstacle,obstacleCost,fireTower,activateChronoBreak,activateNapalm,activateArtillery} from '../src/game.js';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const profile=raw=>normalizeProfile({schemaVersion:4,level:12,settings:{muted:true},...raw});
const make=(p=profile(),level=levels[0])=>createInitialState(level,p,{width:1280,height:720});
const tick=(s,t)=>{for(let n=0;n<t*60;n++)stepState(s,1/60);};
function encounter(p=profile(),spawns=[{enemy:'alien_steadfast',at:0}]){
 const level={...levels[0],threat:1,waves:[{name:'Test',spawns:[...spawns,{enemy:'alien_normal',at:100}],healthScale:1,reward:0}]};
 const s=make(p,level);launchWave(s);tick(s,.02);return s;
}
test('command graph is acyclic with valid prerequisites, and locks purchases until trained',()=>{
 const keys=new Set(skillTree.map(s=>s.key));assert.equal(keys.size,12);
 for(const skill of skillTree){let current=skill,seen=new Set();while(current.requires){assert.ok(keys.has(current.requires.key));assert.ok(!seen.has(current.key));seen.add(current.key);current=skillTree.find(s=>s.key===current.requires.key);}}
 const p=profile();assert.equal(buySkill(p,'pontoons'),false);assert.equal(buySkill(p,'drone'),false);
 assert.ok(buySkill(p,'salvage'));assert.ok(buySkill(p,'supplies'));assert.ok(buySkill(p,'pontoons'));assert.equal(buySkill(p,'pontoons'),false);
 assert.ok(buySkill(p,'mines'));assert.ok(buySkill(p,'drone'));assert.equal(spentSkillPoints(p),29);
});
test('new commanders unlock specials through prerequisites; saved legacy specials remain available',()=>{
 const fresh=normalizeProfile({schemaVersion:4});assert.equal(fresh.equippedActiveKey,null);
 const s=make(fresh);launchWave(s);for(const fn of [activateChronoBreak,activateNapalm])assert.equal(fn(s),false);assert.equal(activateArtillery(s,100,100),false);
 const p=profile();assert.equal(buySkill(p,'napalm'),false);buySkill(p,'mines');buySkill(p,'napalm');assert.ok(activeUnlocked(p,'napalm'));assert.equal(p.equippedActiveKey,'napalm');
 const old=normalizeProfile({level:6,skills:{damage:2},equippedActiveKey:'artillery'});assert.ok(activeUnlocked(old,'artillery'));assert.equal(old.equippedActiveKey,'artillery');
 const again=normalizeProfile(JSON.parse(JSON.stringify(old)));assert.ok(activeUnlocked(again,'artillery'));
});
test('Rare license SP persists across reload and commander refunds; attachments charge Salvage once',()=>{
 const p=profile({level:5,salvage:100});const start=p.skillPoints;
 assert.ok(purchaseBlueprint(p,'handgun','rare'));assert.equal(p.skillPoints,start-8);assert.equal(p.arsenal.blueprints.handgun,'rare');assert.equal(purchaseBlueprint(p,'handgun','rare'),false);
 buySkill(p,'damage');resetSkills(p);assert.equal(p.skillPoints,start-8);
 const saved=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(saved.skillPoints,start-8);assert.equal(saved.arsenal.spSpent,8);
 assert.ok(purchaseAttachment(p,'incendiary'));assert.equal(p.salvage,60);assert.equal(purchaseAttachment(p,'incendiary'),false);
 assert.ok(purchaseAttachment(p,'cryo'));assert.equal(p.salvage,0);assert.equal(purchaseAttachment(p,'blast'),false);
});
test('midpoint caches pay once, keep rewards on defeat/reload, and guarantee an advanced model',()=>{
 const p=profile();const reward=cacheReward(p,levels[0]);assert.equal(reward.tier,'epic');assert.ok(p.arsenal.unlocked.includes('handgun:epic'));assert.equal(p.salvage,30);
 assert.equal(cacheReward(p,levels[0]),null);assert.equal(p.salvage,30);
 const saved=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.equal(cacheReward(saved,levels[0]),null);assert.equal(saved.salvage,30);
 assert.equal(cacheReward(p,levels[5]).tier,'legendary');
});
test('elite drops exclude hatchlings, honor chance and guarantee a drop within 20 eligible kills',()=>{
 const p=profile();assert.equal(eliteDrop(p,{key:'alien_hatchling'},0),null);assert.equal(p.lootRolls,0);
 for(let n=0;n<19;n++)assert.equal(eliteDrop(p,{key:'alien_steadfast'},1),null);
 const reward=eliteDrop(p,{key:'alien_steadfast'},1);assert.ok(reward);assert.equal(p.lootMisses,0);assert.equal(p.salvage,8);assert.equal(p.arsenal.unlocked.filter(k=>k.endsWith(':legendary')).length,1);
 assert.equal(eliteDrop(p,{key:'alien_boss'},.19),null);assert.ok(eliteDrop(p,{key:'alien_boss'},.17));
});
test('clearance discounts show the charged price; starting funds cannot be farmed with a respec',()=>{
 const p=profile({skills:{salvage:3,supplies:2}}),s=make(p);assert.equal(s.gold,levels[0].startGold+50);
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
 const p=profile({skills:{mines:2}}),s=encounter(p);assert.equal(s.mines.length,10);
 const enemy=s.enemies[0],mine=s.mines[0];enemy.speed=0;enemy.x=mine.x;enemy.y=mine.y;
 const hp=enemy.life;tick(s,.02);assert.ok(enemy.life<hp);assert.ok(s.mines.some(m=>m.spent));
 const spent=s.mines.filter(m=>m.spent).length;resetSkills(p);buySkill(p,'mines');assert.equal(s.mines.filter(m=>m.spent).length,spent);assert.equal(make(p).mines.length,5);
});
test('UAV patrol attacks automatically, reserves a visible base, and freezes on pause',()=>{
 const s=encounter(profile({skills:{mines:1,drone:1}}));const drone=s.drone;assert.ok(drone);
 assert.equal(placeTower(s,'handgun',drone.base.row,drone.base.col),null);
 const enemy=s.enemies[0];enemy.speed=0;const hp=enemy.life;tick(s,1);assert.ok(enemy.life<hp);assert.ok(drone.time>0);
 drone.time=(s.path.length-1)/.9-.01;tick(s,.02);const end=s.path.at(-1);assert.ok(Math.hypot(drone.x-end.x,drone.y-end.y)<80,"UAV turns back at the exit instead of teleporting to the entrance");
 s.isPaused=true;const time=drone.time;tick(s,3);assert.equal(drone.time,time);
});
test('models differ in firing behavior, damage, range and magazine, with real queued bursts',()=>{
 const p=profile();for(const tier of ['rare','epic','legendary'])unlockBlueprint(p,'handgun',tier);
 const gun=weapons[0];equipBlueprint(p,'handgun','rare');const auto=applyArsenal(gun,p);assert.equal(auto.atkSpeed,10);assert.equal(auto.fireMode,'Full-auto');assert.ok(auto.directDamage<gun.directDamage);
 equipBlueprint(p,'handgun','epic');assert.equal(applyArsenal(gun,p).directDamage,900);
 equipBlueprint(p,'handgun','legendary');const s=encounter(p),enemy=s.enemies[0];enemy.speed=0;enemy.life=100000;
 const tower=placeTower(s,'handgun',3,2),ammo=tower.ammo;fireTower(s,tower,enemy);assert.equal(tower.burstLeft,2);assert.equal(tower.ammo,ammo-1);
 tick(s,.18);assert.equal(tower.burstLeft,0);assert.equal(tower.ammo,ammo-3);
});
test('Menders heal other live aliens, respect maximum HP, and do not revive killed aliens',()=>{
 const s=encounter(profile(),[{enemy:'alien_steadfast',at:0},{enemy:'alien_medic',at:0}]);const [ally,medic]=s.enemies;ally.speed=medic.speed=0;ally.life=ally.maxLife-100;
 tick(s,2.1);assert.equal(ally.life,ally.maxLife);assert.ok(medic.healer);
 ally.life=0;tick(s,2.1);assert.ok(!s.enemies.includes(ally));
});
test('mission rewards pay persistent Salvage, with smaller replay rewards',()=>{
 const p=profile();const first=recordVictory(p,levels[0],18);assert.equal(first.salvage,25);assert.equal(p.salvage,25);
 const again=recordVictory(p,levels[0],18);assert.equal(again.salvage,8);assert.equal(p.salvage,33);
});
test('special ranks use the deployment snapshot when new research is purchased mid-mission',()=>{
 const p=profile({skills:{mines:1,napalm:1},equippedActiveKey:'napalm'}),s=encounter(p);
 assert.ok(buySkill(p,'napalm'));assert.ok(activateNapalm(s));assert.equal(s.activeAbilities.napalm.damage,1050);
 const next=encounter(p);activateNapalm(next);assert.equal(next.activeAbilities.napalm.damage,1100);
});
test('advanced models stay within the sustained damage envelope while keeping range/control tradeoffs',()=>{
 const p=profile(),dps=w=>{const rounds=w.atkSpeed*(w.burstCount||1);return rounds*w.directDamage*(w.pelletCount||1)/(1+rounds*w.reloadSpeed/w.capacity);};
 for(const weapon of weapons){
  const base=dps(weapon);
  for(const tier of ['rare','epic','legendary']){
   unlockBlueprint(p,weapon.key,tier);assert.ok(equipBlueprint(p,weapon.key,tier));
   const model=applyArsenal(weapon,p),ratio=dps(model)/base;
   assert.ok(ratio>=.8&&ratio<=1.45,`${model.blueprint}: ${ratio.toFixed(2)}× base sustained damage`);
  }
 }
});
