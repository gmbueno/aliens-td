import test from 'node:test';import assert from 'node:assert/strict';import {normalizeProfile} from '../src/systems/profile.js';import {weapons} from '../src/data/weapons.js';import {applySkillBonuses,applyTowerUpgrades} from '../src/systems/weaponStats.js';import {projectileHit} from '../src/game.js';
test('Machine Pistol has no innate slow; Suppression unlocks and strengthens real slowing hits',()=>{
 const base=applySkillBonuses(weapons.find(w=>w.key==='machine_pistol'),normalizeProfile());
 for(let rank=0;rank<=3;rank++){
  const w=applyTowerUpgrades(base,{upgrades:{power:0,tactical:rank}});const target={life:10000,maxLife:10000,shield:0,armor:0,slowTimer:0,slowStrength:0};
  projectileHit({enemies:[target],effects:[]},{damage:w.directDamage,armorPierce:0,slow:w.slow,slowStrength:w.slowStrength},target);
  assert.equal(target.life,10000-w.directDamage);assert.equal(target.slowTimer,rank?Number((.7+(rank-1)*.6).toFixed(1)):0);assert.equal(target.slowStrength,rank?Number((.25+(rank-1)*.1).toFixed(2)):0);
 }
 const powerOnly=applyTowerUpgrades(base,{upgrades:{power:3,tactical:0}});assert.equal(powerOnly.slow,0);assert.equal(powerOnly.slowStrength,0);
});
