import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProfile,resetSkills} from '../src/systems/profile.js';
import {equippedPowerKeys,equipPower,buySkill} from '../src/data/skills.js';
import {createInitialState,launchWave,activateChronoBreak,activateArtillery,activateNapalm,stepState} from '../src/game.js';
import {levels} from '../src/data/levels/index.js';
globalThis.localStorage={getItem(){return null;},setItem(){}};
test('second support slot requires research, costs SP once, and keeps legacy primary selection',()=>{
 const p=normalizeProfile({schemaVersion:6,skillPoints:20,equippedActiveKey:'napalm'});
 assert.deepEqual(equippedPowerKeys(p),['napalm']);assert.equal(equipPower(p,'artillery',1),false);
 assert.equal(buySkill(p,'powerSlots'),false);assert.equal(buySkill(p,'chronoBreak'),true);assert.equal(buySkill(p,'powerSlots'),true);assert.equal(p.skillPoints,3);assert.equal(buySkill(p,'powerSlots'),false);
 assert.deepEqual(equippedPowerKeys(p),['napalm','chronoBreak']);
});
test('power choices swap without duplicates, persist and remove only the extra slot on refund',()=>{
 const p=normalizeProfile({skills:{powerSlots:1},equippedActiveKey:'napalm',equippedSecondaryActiveKey:'napalm'});
 assert.deepEqual(equippedPowerKeys(p),['napalm','chronoBreak']);
 assert.equal(equipPower(p,'artillery',1),true);assert.equal(equipPower(p,'artillery',0),true);
 assert.deepEqual(equippedPowerKeys(p),['artillery','napalm']);
 assert.equal(equipPower(p,'invalid',0),false);assert.equal(equipPower(p,'napalm',2),false);
 assert.deepEqual(equippedPowerKeys(normalizeProfile(JSON.parse(JSON.stringify(p)))),['artillery','napalm']);
 resetSkills(p);assert.deepEqual(equippedPowerKeys(p),['artillery']);assert.equal(p.equippedSecondaryActiveKey,null);
});
test('all pairs can activate concurrently with independent timers, cooldowns and pause',()=>{
 const cast={chronoBreak:s=>activateChronoBreak(s),artillery:s=>activateArtillery(s,300,300),napalm:s=>activateNapalm(s,300,300)};
 for(const [a,b] of [['chronoBreak','artillery'],['chronoBreak','napalm'],['artillery','napalm']]){
  const p=normalizeProfile({skills:{powerSlots:1},equippedActiveKey:a,equippedSecondaryActiveKey:b});
  const s=createInitialState(levels[0],p,{width:1280,height:720});launchWave(s);
  assert.equal(cast[a](s),true);const cd=s.activeAbilities[a].cooldown;
  assert.equal(s.activeAbilities[b].cooldown,0);assert.equal(cast[b](s),true);assert.equal(s.activeAbilities[a].cooldown,cd);
  assert.equal(cast[a](s),false);assert.equal(cast[b](s),false);
  const missing=Object.keys(cast).find(k=>k!==a&&k!==b);assert.equal(cast[missing](s),false);
  if(a==='artillery')assert.ok(s.artillery&&s.napalm);
  s.isPaused=true;const snapshot=JSON.stringify(s.activeAbilities);stepState(s,1);assert.equal(JSON.stringify(s.activeAbilities),snapshot);
  s.isPaused=false;stepState(s,.5);assert.ok(s.activeAbilities[a].cooldown<cd);assert.ok(s.activeAbilities[b].cooldown>0);
  // Editing the saved loadout cannot grant a free cast or change a live deployment.
  equipPower(p,missing,0);assert.equal(cast[missing](s),false);assert.deepEqual(s.equippedActiveKeys,[a,b]);
 }
});
