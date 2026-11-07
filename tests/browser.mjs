import assert from 'node:assert/strict';
import {harness,read,advance,tile,autoStart,branch,research} from './browser-helpers.mjs';
import {levels} from '../src/data/levels/index.js';
import {createInitialState,placeTower,upgradeTower} from '../src/game.js';
import {normalizeProfile} from '../src/systems/profile.js';
import {invest} from './balance.mjs';
const h=await harness('browser');
const choose=async(p,level)=>{await p.click(`[data-sector="${level.sector}"]`);await p.click(`[data-level-id="${level.id}"]`);await p.click('#menu-play-button');};
async function investViaUI(p,level){
 let actual=await read(p);if(!actual.paused)await p.click('#play-pause-button');
 const model=createInitialState(level,normalizeProfile({schemaVersion:6,...actual.player,skills:actual.skills,missions:actual.campaign.records,slotRewards:actual.slotRewards,arsenal:actual.arsenal}),{width:1280,height:720});
 for(const t of actual.towers){model.gold=100000;const tower=placeTower(model,t.weapon,t.row,t.col);for(const key of ['power','tactical'])for(let i=0;i<t.upgrades[key];i++)upgradeTower(model,tower,key);}
 model.gold=actual.gold;invest(model);
 for(const tower of model.towers){
  const old=actual.towers.find(t=>t.row===tower.row&&t.col===tower.col);
  if((await read(p)).selectedTower)await p.click('#tower-sidebar-close-button');
  if(!old){await p.click(`[data-weapon-key="${tower.weapon.key}"] .weapon-select`);await tile(p,tower.row,tower.col);}
  if(Object.keys(tower.upgrades).some(k=>tower.upgrades[k]>(old?.upgrades[k]||0))){await tile(p,tower.row,tower.col);for(const key of ['power','tactical'])for(let i=old?.upgrades[key]||0;i<tower.upgrades[key];i++)await p.click(`[data-upgrade="${key}"]`);}
 }
 if((await read(p)).selectedTower)await p.click('#tower-sidebar-close-button');
 await p.click('#play-pause-button');
}
try{
 const p=await h.pageFor();await choose(p,levels[0]);
 assert.deepEqual((await read(p)).loadout,['handgun','assault_rifle','machine_pistol']);assert.equal((await read(p)).equippedActive,'chronoBreak');
 assert.equal(await p.locator('.mission-toolbar,#launch-wave-button,#auto-wave-toggle,.hud-bottom').count(),0);
 assert.equal((await read(p)).blockers.some(t=>t.cost>0),false);
 assert.equal(await p.locator('#player-level-button.learn-pulse').count(),0,'no skill tree onboarding before first victory');
 assert.equal(await p.locator('.weapon-kills,.weapon-role').count(),0,'build cards show no extraneous statistics or roles');
 await p.click('#play-pause-button');const paused=await read(p);await advance(p,60000);assert.equal((await read(p)).waveDelay,paused.waveDelay);
 await p.keyboard.press('1');await tile(p,3,3);await tile(p,3,3);
 assert.ok(await p.locator('#deployment-panel').isHidden());assert.ok(await p.locator('#tower-inspector').isVisible());
 assert.ok(await p.locator('[data-upgrade="power"]').evaluate(e=>e.classList.contains('learn-pulse')));
 await p.click('[data-upgrade="power"]');assert.equal((await read(p)).onboarding.towerUpgraded,true);
 assert.equal(await p.locator('[data-upgrade].learn-pulse').count(),0);await h.shot(p,'first-upgrade');
 await p.click('[data-sell]');assert.equal((await read(p)).gold,levels[0].startGold);assert.ok(await p.locator('#deployment-panel').isVisible());
 await investViaUI(p,levels[0]);await autoStart(p);await advance(p,800);
 assert.ok(await p.locator('[data-active-key].learn-pulse').count());await p.keyboard.press('q');assert.ok((await read(p)).activeAbilities.chronoBreak.timer>0);assert.equal((await read(p)).onboarding.powerUsed,true);
 await p.keyboard.press('Space');const before=await read(p);await advance(p,3000);assert.equal((await read(p)).activeAbilities.chronoBreak.cooldown,before.activeAbilities.chronoBreak.cooldown);await p.keyboard.press('Space');
 await p.click('#speed-toggle-button');assert.equal((await read(p)).gameSpeed,2);await p.click('#speed-toggle-button');await h.shot(p,'first-combat');
 // Play the first three actual authored missions, reinvesting only between waves.
 for(let i=0;i<3;i++){
  let previousWave=(await read(p)).wave;
  if(i>0)await investViaUI(p,levels[i]);
  for(let t=0;t<800;t++){
   await advance(p,1000);const s=await read(p);if(s.result)break;
   if(s.phase==='prepare'&&s.wave!==previousWave){previousWave=s.wave;await investViaUI(p,levels[i]);}
  }
  let s=await read(p);assert.equal(s.result,'victory',`intro mission ${i+1}`);assert.ok(s.lives>=levels[i].lives*.6,`mission ${i+1} should forgive beginner errors`);
  await h.shot(p,`victory-${i+1}`);
  if(i===0){
   assert.ok(s.classUnlocks.includes('shotgun'));assert.ok(s.onboarding.towerUpgraded);assert.equal(s.cache,undefined);
   assert.ok(await p.locator('#result-skills-button.learn-pulse').count());
   await p.click('#result-next-button');assert.ok(await p.locator('#player-level-button.learn-pulse').count());assert.ok(await p.locator('#field-loadout-button.learn-pulse').count());
   await p.click('#player-level-button');const sp=(await read(p)).player.skillPoints;await branch(p,'logistics');await research(p,'loadoutSlots');assert.equal((await read(p)).player.skillPoints,sp-8);assert.match(await p.locator('.checkout-balance').innerText(),/SP/);await h.shot(p,'first-training-purchase');await p.click('#skill-tree-close-button');assert.equal((await read(p)).loadout.length,4);assert.ok((await read(p)).loadout.includes('shotgun'),'new slot autofills without opening loadout');assert.equal(await p.locator('#player-level-button.learn-pulse').count(),0);
   await p.click('#field-loadout-button');await h.shot(p,'powers-and-loadout');await p.click('#arsenal-close-button');assert.equal(await p.locator('#field-loadout-button.learn-pulse').count(),0);
  }else if(i<2)await p.click('#result-next-button');
 }
 const saved=await read(p);await p.click('#result-levels-button');await p.reload();const loaded=await read(p);assert.equal(loaded.campaign.records.level_3.clears,1);assert.equal(loaded.onboarding.towerUpgraded,true);assert.equal(loaded.onboarding.researchSpent,true);assert.equal(loaded.onboarding.powerUsed,true);assert.deepEqual(loaded.weaponKills,saved.weaponKills);
 await p.click('#menu-stats-button');assert.equal((await read(p)).mode,'stats');await h.shot(p,'saved-records');await p.context().close();
 // Fresh powers are equipped without spending SP; mid-run choice preserves the current power until restart.
 const powers=await h.pageFor();await powers.click('#menu-arsenal-button');assert.equal(await powers.locator('[data-choose-power]:enabled').count(),3);await powers.click('[data-choose-power="napalm"]');assert.equal((await read(powers)).player.skillPoints,0);await powers.click('#arsenal-close-button');await choose(powers,levels[0]);assert.equal((await read(powers)).equippedActive,'napalm');
 await powers.click('#field-power-button');await powers.click('[data-choose-power="artillery"]');assert.equal((await read(powers)).equippedActive,'napalm');await powers.click('#arsenal-restart-button');assert.equal((await read(powers)).equippedActive,'artillery');await powers.context().close();
 const defeat=await h.pageFor();await choose(defeat,levels[0]);await advance(defeat,180000);assert.equal((await read(defeat)).result,'defeat');await defeat.click('#result-restart-button');assert.equal((await read(defeat)).phase,'prepare');assert.equal((await read(defeat)).lives,18);await defeat.context().close();
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:768,height:1024},{width:844,height:390},{width:1280,height:720}]){
  const p=await h.pageFor({level:3,missions:{level_1:{clears:1}}},viewport);await choose(p,levels[0]);await p.click('#play-pause-button');await h.shot(p,`deck-${viewport.width}`);const rect=await p.locator('#game-canvas').boundingBox();assert.ok(Math.abs(rect.width/rect.height-16/9)<.01);
  await p.click('[data-weapon-key="handgun"] .weapon-select');await tile(p,3,3);await tile(p,3,3);await p.click('[data-upgrade="power"]');await p.click('#tower-sidebar-close-button');assert.ok(await p.locator('#deployment-panel').isVisible());
  await p.click('#player-level-button');await p.click('[data-select-skill="fireRate"]');assert.ok(await p.locator('[data-skill-key="fireRate"]').isDisabled());await p.click('[data-select-skill="damage"]');await p.click('[data-skill-key="damage"]');await p.click('[data-select-skill="fireRate"]');assert.equal(await p.locator('[data-skill-key="fireRate"]').isDisabled(),false);await p.click('[data-skill-key="fireRate"]');assert.equal((await read(p)).skills.fireRate,1);await h.shot(p,`talents-${viewport.width}`);await p.context().close();
 }
 h.finish();console.log('PASS: three real intro victories, automatic waves/pause/no launch controls, one-time learning/persistence, sidebar switching, automatic slots, all free powers, costs/prerequisites, mobile inputs, defeat/restart.');
}finally{await h.browser.close();}
