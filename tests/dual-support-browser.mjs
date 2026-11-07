import assert from 'node:assert/strict';
import {harness,read,advance,tile,autoStart,research,branch} from './browser-helpers.mjs';
const h=await harness('dual-support');
try {
 const p=await h.pageFor({level:5,skills:{chronoBreak:1,mines:1}},{width:1280,height:720});
 await p.click('#menu-play-button');assert.equal(await p.locator('[data-active-key]').count(),1);
 assert.equal(await p.locator('#weapon-bar kbd,#ability-bar kbd').count(),0);
 await autoStart(p);await p.keyboard.press('q');let s=await read(p);assert.ok(s.activeAbilities.chronoBreak.cooldown>0);
 await p.click('#player-level-button');await branch(p,'support');const before=(await read(p)).player.skillPoints;
 await research(p,'powerSlots');assert.equal((await read(p)).player.skillPoints,before-12);await h.shot(p,'dual-support-research');
 await p.click('#skill-tree-close-button');s=await read(p);assert.deepEqual(s.equippedPowers,['chronoBreak','artillery']);assert.ok(s.activeAbilities.chronoBreak.cooldown>0,'buying slot must not reset primary cooldown');
 assert.equal(await p.locator('[data-active-key]').count(),2);assert.equal(await p.locator('[data-active-key="artillery"]').isEnabled(),true);
 await p.keyboard.press('e');assert.equal((await read(p)).selectedActive,'artillery');await tile(p,4,1);s=await read(p);assert.ok(s.activeAbilities.artillery.cooldown>0);assert.ok(s.activeAbilities.chronoBreak.cooldown>0);
 await p.click('#play-pause-button');const frozen=(await read(p)).activeAbilities;await advance(p,1200);assert.deepEqual((await read(p)).activeAbilities,frozen);await h.shot(p,'independent-cooldowns');
 await p.click('#field-power-button');await p.click('[data-power-slot="1"]');await p.click('[data-choose-power="napalm"]');assert.deepEqual((await read(p)).nextEquippedPowers,['chronoBreak','napalm']);assert.deepEqual((await read(p)).equippedPowers,['chronoBreak','artillery']);
 await p.click('[data-choose-power="chronoBreak"]');assert.deepEqual((await read(p)).nextEquippedPowers,['napalm','chronoBreak'],'choosing equipped power swaps, never duplicates');await h.shot(p,'power-picker');
 await p.click('#arsenal-restart-button');assert.deepEqual((await read(p)).equippedPowers,['napalm','chronoBreak']);
 await autoStart(p);await p.keyboard.press('q');await tile(p,4,1);await p.keyboard.press('e');s=await read(p);assert.ok(s.napalmField);assert.ok(s.activeAbilities.chronoBreak.timer>0);
 await p.click('#gear-button');await p.locator('.shortcuts summary').click();assert.match(await p.locator('.shortcuts').innerText(),/Secondary power/);await h.shot(p,'shortcuts');await p.click('#change-level-button');await p.reload();assert.deepEqual((await read(p)).nextEquippedPowers,['napalm','chronoBreak']);
 await p.click('#menu-play-button');await p.click('#field-power-button');await p.click('[data-power-slot="1"]');await p.click('[data-choose-power="artillery"]');await p.click('#arsenal-restart-button');await autoStart(p);await p.click('[data-active-key="napalm"]');await tile(p,4,1);await p.click('[data-active-key="artillery"]');await tile(p,4,2);await advance(p,100);s=await read(p);assert.ok(s.napalmField&&s.artillery,'both area powers coexist');await h.shot(p,'two-area-powers');await p.context().close();
 // Same frame height, flush join, centered prices and two-column layout across desktop and phone.
 for(const viewport of [{width:1280,height:720},{width:1024,height:768},{width:390,height:844}]){
  const p=await h.pageFor({},viewport);await p.click('#menu-play-button');
  const b=await p.evaluate(()=>{const rect=q=>{const r=document.querySelector(q).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};return {canvas:rect('#game-canvas'),deck:rect('#tower-sidebar'),cards:[...document.querySelectorAll('.weapon-card')].map(e=>{const r=e.getBoundingClientRect(),price=e.querySelector('.weapon-price').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,priceX:price.x+price.width/2}})}});
  assert.equal(b.cards[0].y,b.cards[1].y);if(viewport.width>760)assert.ok(b.cards[2].y>b.cards[0].y);else assert.equal(b.cards[2].y,b.cards[0].y);
  for(const c of b.cards)assert.ok(Math.abs(c.priceX-c.x-c.w/2)<2,'price centered');
  if(viewport.width>760){assert.ok(Math.abs(b.canvas.h-b.deck.h)<1);assert.ok(Math.abs(b.canvas.y-b.deck.y)<1);assert.ok(Math.abs(b.canvas.x+b.canvas.w-b.deck.x)<1);}
  await p.click('[data-weapon-key="handgun"] .weapon-select');await tile(p,5,3);await tile(p,5,3);await h.shot(p,'upgrade-'+viewport.width);await p.context().close();
 }
 h.finish();console.log('PASS: purchase live without resetting cooldown, all power pairs, aiming, independent timers, pause, swap/restart/save, shortcuts, adaptive columns, centered prices and flush canvas-height deck.');
} finally {await h.browser.close();}
