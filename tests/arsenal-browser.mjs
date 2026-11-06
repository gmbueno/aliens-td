import {autoStart} from './browser-helpers.mjs';
import assert from 'node:assert/strict';
import {harness,read,advance,tile} from './browser-helpers.mjs';
import {missionRecords} from './fixtures.mjs';
const h=await harness('arsenal');
try{
 for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const p=await h.pageFor({},viewport);await p.click('#menu-arsenal-button');
  assert.equal(await p.locator('[data-loadout-slot]:enabled').count(),3);assert.equal(await p.locator('[data-equip-category]:not(:disabled)').count(),2);
  assert.equal(await p.locator('.blueprint,.attachment,.model-options').count(),0);assert.ok(await p.locator('[data-equip-category="laser"]').isDisabled());
  assert.equal(await p.locator('.arsenal-card').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);await h.shot(p,`categories-${viewport.width}`);await p.keyboard.press('Escape');assert.equal((await read(p)).arsenalOpen,false);await p.context().close();
 }
 const p=await h.pageFor({schemaVersion:4,level:12,missions:missionRecords(),skills:{loadoutSlots:2},caches:{level_4:true},arsenal:{spSpent:8,blueprints:{handgun:'legendary'},attachments:{handgun:['incendiary']}}});
 await p.click('[data-sector="1"]');await p.click('[data-level-id="level_1"]');await p.click('#menu-play-button');assert.equal((await read(p)).loadout.length,6);
 await p.click('[data-weapon-key="handgun"] .weapon-select');await tile(p,5,3,250);assert.equal((await read(p)).towers.length,1);
 assert.ok(await p.locator('[data-weapon-key="handgun"] .weapon-select').isDisabled());
 await p.click('[data-info-weapon-key="handgun"]');assert.ok(await p.locator('#weapon-equip-button').isDisabled());await p.click('#weapon-customize-button');assert.equal((await read(p)).paused,true);
 await p.click('[data-loadout-slot="0"]');await p.click('[data-equip-category="rocket_launcher"]');assert.equal((await read(p)).loadout[0],'handgun','current deployment keeps its categories');
 await h.shot(p,'changed-category-restart');await p.click('#arsenal-restart-button');assert.equal((await read(p)).towers.length,0);assert.equal((await read(p)).loadout[0],'rocket_launcher');
 assert.equal(await p.locator('[data-weapon-key="rocket_launcher"]').evaluate(e=>e.classList.contains('unaffordable')),false);
 await p.click('[data-info-weapon-key="rocket_launcher"]');assert.equal(await p.locator('#weapon-equip-button').isDisabled(),false);await p.click('#weapon-info-close-button');
 await p.click('#gear-button');await p.click('#change-level-button');await p.reload();assert.equal((await read(p)).arsenal.loadout[0],'rocket_launcher');await p.context().close();
 const expand=await h.pageFor({level:10,missions:missionRecords()});await expand.click('#menu-play-button');assert.equal((await read(expand)).loadout.length,3);
 await expand.click('#player-level-button');await expand.click('[data-skill-branch="logistics"]');await expand.click('[data-select-skill="loadoutSlots"]');await expand.click('[data-skill-key="loadoutSlots"]');await expand.click('#skill-tree-close-button');
 assert.equal((await read(expand)).loadout.length,4);await expand.click('#field-loadout-button');assert.equal(await expand.locator('[data-loadout-slot]:enabled').count(),4);assert.equal(await expand.locator('#arsenal-restart-button').isDisabled(),true);await expand.click('#arsenal-close-button');assert.equal((await read(expand)).loadout.length,4);await expand.context().close();
 // Powers are genuinely aimed and active in live gameplay; cooldown and pause freeze.
 for(const active of ['artillery','napalm','chronoBreak']){
  const p=await h.pageFor({level:10,skills:{[active]:1},equippedActiveKey:active});await p.click('[data-level-id="level_1"]');await p.click('#menu-play-button');await autoStart(p);await advance(p,1400);await p.keyboard.press('q');
  if(active!=='chronoBreak'){assert.equal((await read(p)).selectedActive,active);await tile(p,4,1);}
  await advance(p,600);let s=await read(p);assert.ok(s.activeAbilities[active].cooldown>0);
  if(active==='napalm')assert.ok(s.napalmField&&s.enemies.some(e=>e.burnTimer>0));if(active==='artillery')assert.ok(s.artillery.strikes>0);if(active==='chronoBreak')assert.ok(s.activeAbilities.chronoBreak.timer>0);
  await p.click('#play-pause-button');s=await read(p);await advance(p,2000);assert.equal((await read(p)).activeAbilities[active].cooldown,s.activeAbilities[active].cooldown);await h.shot(p,`power-${active}`);await p.context().close();
 }
 h.finish();console.log('PASS: categories only, 3→6 slots, responsive loadout, caps, inspect access, live category restart, save migration, and aimed powers.');
}finally{await h.browser.close();}
