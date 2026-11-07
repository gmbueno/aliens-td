import {autoStart} from './browser-helpers.mjs';
import assert from 'node:assert/strict';
import {harness,read,advance,tile,research,branch} from './browser-helpers.mjs';
import {missionRecords} from './fixtures.mjs';
const h=await harness('doctrine');
try{
 for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const p=await h.pageFor({level:20},viewport);await p.click('#menu-skills-button');
  for(const name of ['armament','logistics','support','artillery','napalm','stasis']){
   await branch(p,name);const nodes=await p.locator('.graph-node').evaluateAll(es=>es.map(e=>({key:e.dataset.selectSkill,x:e.offsetLeft,y:e.offsetTop,w:e.offsetWidth,h:e.offsetHeight})));
   for(const a of nodes)for(const b of nodes)if(a.key!==b.key)assert.ok(Math.abs(a.x-b.x)>=a.w||Math.abs(a.y-b.y)>=a.h,'nodes do not overlap');
  }
  await h.shot(p,`research-${viewport.width}`);await p.context().close();
 }
 const p=await h.pageFor({level:20,missions:missionRecords()});await p.click('#menu-skills-button');await branch(p,'logistics');
 await research(p,'loadoutSlots');await research(p,'loadoutSlots');await research(p,'duplicates');assert.equal((await read(p)).loadoutSlots,5);assert.equal((await read(p)).placementLimit,2);
 await branch(p,'support');await research(p,'drone');await research(p,'extraDrone');await research(p,'mines');await research(p,'mines');
 await p.click('#skill-tree-close-button');await p.click('[data-sector="3"]');await p.click('[data-level-id="level_18"]');await p.click('#menu-play-button');
 let s=await read(p);assert.equal(s.drones.length,2);assert.equal(s.fieldMines.length,4);const base=s.drone.base;
 await tile(p,base.row,base.col);assert.equal((await read(p)).selectedDrone,'drone-0');assert.ok(await p.locator('[data-target="weakest"]').isDisabled());
 await p.click('[data-drone-upgrade="power"]');await p.click('[data-drone-upgrade="tactical"]');assert.equal((await read(p)).drones[0].upgrades.power,1);
 await p.click('[data-target="last"]');await p.click('[data-select-drone="drone-1"]');await p.click('[data-target="strongest"]');assert.equal((await read(p)).drones[0].targeting,'last');assert.equal((await read(p)).drones[1].targeting,'strongest');
 await p.click('#player-level-button');await branch(p,'armament');await research(p,'damage');await research(p,'fireRate');await research(p,'weakest');await p.click('#skill-tree-close-button');await p.click('[data-target="weakest"]');assert.equal((await read(p)).drones[1].targeting,'weakest');
 await h.shot(p,'two-drones-upgraded');await p.click('#tower-sidebar-close-button');
 for(const [r,c]of [[1,1],[1,3]]){await p.click('[data-weapon-key="handgun"] .weapon-select');await tile(p,r,c);}
 assert.equal((await read(p)).towers.length,2);assert.ok(await p.locator('[data-weapon-key="handgun"] .weapon-select').isDisabled());await tile(p,1,1);await p.click('[data-target="weakest"]');assert.equal((await read(p)).towers[0].targeting,'weakest');
 await autoStart(p);await advance(p,30000);await p.click('#play-pause-button');s=await read(p);assert.ok(s.drones.some(d=>d.lastTarget),'UAVs acquired and fired on live targets');await h.shot(p,'drone-combat-kills');
 await p.click('#gear-button');await p.click('#change-level-button');await p.click('#menu-stats-button');assert.equal((await read(p)).mode,'stats');assert.match(await p.locator('#stats-support').innerText(),/Hunter drones|Patrol drones/);await h.shot(p,'combat-records');await p.click('#stats-back-button');await p.reload();await p.context().close();
 const uav=await h.pageFor({level:20,skills:{drone:3,extraDrone:1}});await uav.click('#menu-play-button');let us=await read(uav);await tile(uav,us.drone.base.row,us.drone.base.col);await uav.click('[data-drone-upgrade="power"]');await autoStart(uav);await advance(uav,80000);us=await read(uav);assert.ok(us.runWeaponKills.drone>0);assert.ok(us.drones.some(d=>d.kills>0));await h.shot(uav,'uav-kill-record');await uav.click('#gear-button');await uav.click('#change-level-button');await uav.reload();assert.equal((await read(uav)).weaponKills.drone,us.runWeaponKills.drone);await uav.click('#menu-stats-button');await h.shot(uav,'persistent-uav-records');await uav.context().close();
 const poor=await h.pageFor();await poor.click('#menu-skills-button');assert.ok(await poor.locator('[data-skill-key="damage"]').isDisabled());assert.ok(await poor.locator('[data-select-skill="damage"]').evaluate(e=>getComputedStyle(e).opacity<1));await h.shot(poor,'research-no-sp');await poor.context().close();
 h.finish();console.log('PASS: five readable graphs, slots/caps, mines, two UAVs, independent upgrades/targets, paid Weakest, persistent combat records and unfunded states.');
}finally{await h.browser.close();}
