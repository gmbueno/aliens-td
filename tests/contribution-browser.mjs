import assert from 'node:assert/strict';
import {harness,read,advance,tile,autoStart} from './browser-helpers.mjs';
import {missionRecords} from './fixtures.mjs';
const h=await harness('contribution');
try{
 for(const viewport of [{width:1440,height:1000},{width:1280,height:720},{width:390,height:844}]){
  const p=await h.pageFor({schemaVersion:8,level:10,skills:{drone:1,extraDrone:1},missions:missionRecords(18,1)},viewport,viewport.width<500?{isMobile:true,hasTouch:true}:{});
  await p.context().addInitScript(()=>{
   window.__fieldTexts=[];const fill=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(window.__captureFieldText)window.__fieldTexts.push(String(text));return fill.call(this,text,...args);};
  });
  await p.route('**/src/data/levels/index.js',r=>r.fulfill({contentType:'application/javascript',body:"import l from './level1.js';export const levels=[{...l,startGold:5000,blockers:[...l.blockers,{row:3,col:6,kind:'cargo',cost:70},{row:3,col:7,kind:'infested',encounter:true,cost:0}],threat:1,waves:[{name:'Contribution check',healthScale:10,reward:0,spawns:[{enemy:'alien_normal',at:.1},{enemy:'alien_normal',at:100}]}]}];"}));
  await p.reload();await p.click('#menu-play-button');await p.click('#play-pause-button');
  for(const [key,row,col] of [['handgun',3,1],['machine_pistol',3,3]]){
   if((await read(p)).mobileView.collapsed)await p.click('#mobile-deck-toggle');
   await p.click(`[data-weapon-key="${key}"] .weapon-select`);await tile(p,row,col);
  }
  assert.deepEqual((await read(p)).pads,[]);
  await autoStart(p);await advance(p,6000);await p.click('#play-pause-button');
  for(const t of (await read(p)).towers){
   assert.ok(t.damageDealt>0);await tile(p,t.row,t.col);
   assert.equal(await p.locator('[data-stat="dmg-dealt"] strong').innerText(),Math.floor(t.damageDealt).toLocaleString('en-US'));
   assert.equal(await p.locator('[data-stat="kills"] strong').innerText(),String(t.kills));
   const total=t.damageDealt;await advance(p,1000);assert.equal((await read(p)).towers.find(x=>x.id===t.id).damageDealt,total);
   await p.click('[data-upgrade="power"]');assert.equal((await read(p)).towers.find(x=>x.id===t.id).damageDealt,total,'upgrading retains the contribution');
   assert.equal(await p.locator('[data-target="last"]').isVisible(),true);
   await h.shot(p,`tower-${t.weapon}-${viewport.width}`);await p.click('#tower-sidebar-close-button');
  }
  const texts=await p.evaluate(()=>{window.__fieldTexts=[];window.__captureFieldText=true;window.advanceTime(0);window.__captureFieldText=false;return window.__fieldTexts;});
  assert.ok(texts.every(t=>!/^\$\d+$|FREE|^UAV|^\d+\s*[×x]$/.test(t)),`no overhead obstacle/drone/kill labels: ${JSON.stringify(texts)}`);
  assert.ok(!(await p.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).some(n=>/\/(range|power)-pad\.png/.test(n)));
  await h.shot(p,`quiet-map-${viewport.width}`);
  await tile(p,3,6);assert.equal(await p.locator('[data-clear]').innerText(),'Clear obstacle · $70');await p.click('#tower-sidebar-close-button');
  await tile(p,3,7);assert.match(await p.locator('[data-clear]').innerText(),/FREE/);await p.click('#tower-sidebar-close-button');
  const drone=(await read(p)).drones[0];assert.ok(drone.damageDealt>0);await tile(p,drone.base.row,drone.base.col);
  assert.equal(await p.locator('[data-stat="dmg-dealt"] strong').innerText(),Math.floor(drone.damageDealt).toLocaleString('en-US'));
  await h.shot(p,`drone-${viewport.width}`);await p.context().close();
 }
 h.finish();console.log('PASS: quiet map/no bonus pads, genuine weapon and UAV contribution, kills on selection, accurate totals, upgrade/pause retention and clearance prices on inspection at desktop/notebook/mobile sizes.');
}finally{await h.browser.close();}
