import assert from 'node:assert/strict';
import {harness,read,advance,tile,autoStart} from './browser-helpers.mjs';
import {missionRecords} from './fixtures.mjs';
const h=await harness('refinement');
const complete={schemaVersion:8,level:15,skills:{loadoutSlots:2,powerSlots:1},missions:missionRecords(18,1),slotRewards:{level_4:true,level_10:true}};
const decode=p=>p.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
try{
 for(const viewport of [{width:1440,height:1000},{width:1280,height:720},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const p=await h.pageFor(complete,viewport);await decode(p);
  const menu=await p.locator('.menu-card').boundingBox();assert.ok(Math.abs(menu.x+menu.width/2-viewport.width/2)<2,'mission selection horizontally centered');
  const deploy=await p.locator('#menu-play-button').boundingBox();assert.ok(deploy.y+deploy.height<viewport.height,'initial deployment visible');
  assert.ok((await p.locator('.level-tile .map-preview').first().boundingBox()).height>=20,'map thumbnails remain visible even in short landscape');
  await p.click('[data-level-id="level_2"]');assert.equal(await p.locator('[data-level-id="level_2"]').getAttribute('aria-pressed'),'true');
  assert.ok(await p.locator('[data-level-id="level_2"]').evaluate(e=>getComputedStyle(e,'::after').content.includes('✓')));
  if(viewport.width>760){const body=await p.locator('.campaign-body').boundingBox(),nav=await p.locator('.menu-loadout').boundingBox();assert.ok(body.y+body.height<=nav.y,'briefing and navigation never overlap');assert.ok(menu.y+menu.height<=viewport.height);}
  await h.shot(p,`review-menu-${viewport.width}`);
  await p.click('#menu-skills-button');let before;
  for(const branch of ['armament','logistics','support','artillery','napalm','stasis']){
   await p.click(`[data-skill-branch="${branch}"]`);await decode(p);const box=await p.locator('.skill-tree-card').boundingBox();
   if(before)for(const key of ['x','y','width','height'])assert.ok(Math.abs(box[key]-before[key])<1,`${branch} preserves modal ${key}`);before=box;
  }
  await h.shot(p,`review-stable-tree-${viewport.width}`);await p.click('#skill-tree-close-button');await p.click('#menu-play-button');await p.click('#play-pause-button');await decode(p);
  let s=await read(p);assert.equal(s.loadout.length,10);assert.equal(await p.locator('.weapon-card').count(),10);
  assert.equal(await p.locator('.weapon-card').evaluateAll(es=>es.some((e,i)=>es.some((f,j)=>{if(j<=i)return false;const a=e.getBoundingClientRect(),b=f.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}))),false,'equipment cards never overlap, including short landscape screens');
  if(viewport.width>760){const canvas=await p.locator('#game-canvas').boundingBox(),deck=await p.locator('#tower-sidebar').boundingBox();assert.ok(Math.abs(canvas.x+canvas.width-deck.x)<1);assert.ok(Math.abs(canvas.y-deck.y)<1);assert.ok(Math.abs(canvas.height-deck.height)<1);const powers=await p.locator('.ability-full-art').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));assert.ok(powers.every(b=>b.top>=deck.y&&b.bottom<=deck.y+deck.height),'both powers remain visible with ten categories');}
  await p.keyboard.press('0');assert.equal((await read(p)).selectedWeapon,s.loadout[9],'tenth-slot shortcut works');await p.keyboard.press('Escape');
  await h.shot(p,`review-ten-slots-${viewport.width}`);
  await p.click('#field-loadout-button');await p.click('[data-choose-power="napalm"]');assert.equal(await p.locator('#arsenal-restart-button').isEnabled(),true);await p.locator('#arsenal-restart-button').scrollIntoViewIfNeeded();await h.shot(p,`review-restart-${viewport.width}`);await p.click('#arsenal-restart-button');assert.equal((await read(p)).equippedActive,'napalm');assert.equal((await read(p)).towers.length,0);await p.context().close();
 }
 const p=await h.pageFor({...complete,arsenal:{loadout:['minelayer','gas','missile','handgun']}});
 await p.route('**/src/data/levels/index.js',r=>r.fulfill({contentType:'application/javascript',body:"import l from './level1.js';export const levels=[{...l,startGold:10000,threat:1,slowTiles:[l.track[2]],speedTiles:[l.track[4]],waves:[{name:'Art and mine check',healthScale:100,reward:0,spawns:[{enemy:'alien_normal',at:.1},{enemy:'alien_normal',at:100}]}]}];"}));
 await p.reload();await p.click('#menu-play-button');await p.click('#play-pause-button');
 for(const [key,row,col] of [['minelayer',3,3],['gas',3,1],['missile',3,2]]){await p.click(`[data-weapon-key="${key}"] .weapon-select`);await tile(p,row,col);if(key==='missile')await tile(p,2,7);}
 await p.click('#tower-sidebar-close-button');await p.click('#play-pause-button');await advance(p,5000);let s=await read(p);assert.equal(s.enemies.length,0);assert.equal(s.phase,'prepare');assert.ok(s.pathMines.length>=2,'foundry produces during entrance preparation');await p.click('#play-pause-button');await h.shot(p,'mines-before-arrival');
 const count=s.pathMines.length;await advance(p,5000);assert.equal((await read(p)).pathMines.length,count,'pause freezes preparation production');
 await autoStart(p);await advance(p,800);s=await read(p);assert.ok(s.missileStrikes.length>0);assert.ok(s.towers.find(t=>t.weapon==='gas').ammo<32);await p.click('#play-pause-button');await tile(p,3,1);await h.shot(p,'gas-missile-and-range');await tile(p,3,3);await h.shot(p,'adjacent-mine-range');await p.context().close();
 const q=await h.pageFor({schemaVersion:8,level:7,xp:299});
 await q.route('**/src/data/levels/index.js',r=>r.fulfill({contentType:'application/javascript',body:"import l from './level1.js';export const levels=[{...l,startGold:3000,threat:1,waves:[{name:'Live slot unlock',healthScale:.001,reward:0,spawns:[{enemy:'alien_normal',at:.1},{enemy:'alien_normal',at:100}]}]}];"}));
 await q.reload();await q.click('#menu-play-button');assert.equal((await read(q)).loadout.length,3);await q.click('[data-weapon-key="handgun"] .weapon-select');await tile(q,3,1);await autoStart(q);await advance(q,2000);s=await read(q);assert.equal(s.player.level,8);assert.equal(s.loadout.length,4);assert.equal(s.towers.length,1,'earned slot does not restart defense');assert.equal(await q.locator('.weapon-card').count(),4);await q.click('#play-pause-button');await h.shot(q,'earned-slot-without-restart');await q.reload();assert.equal((await read(q)).loadoutSlots,4);await q.context().close();
 h.finish();console.log('PASS: fixed skill modal on every tab, centered clear campaign navigation, integrated battlefield/deck, ten slots and shortcuts, themed power restart, prep mine production/pause, illustrated terrain/missile/gas/range and live earned-slot persistence.');
}finally{await h.browser.close();}
