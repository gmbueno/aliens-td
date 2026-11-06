import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.GAME_URL || 'http://127.0.0.1:4176';
const out=process.env.GAME_OUTPUT || 'output/ui-refresh/controls';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.GAME_BROWSER_EXECUTABLE ? {executablePath:process.env.GAME_BROWSER_EXECUTABLE} : {})});
const errors=[];
const state=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function create(viewport={width:1440,height:1000},touch=false) {
 const context=await browser.newContext({viewport,hasTouch:touch});
 await context.addInitScript(()=>localStorage.setItem('aliens-tower-defense-profile',JSON.stringify({schemaVersion:5,level:1,skills:{loadoutSlots:2},caches:{level_4:true},missions:Object.fromEntries(Array.from({length:6},(_,i)=>[`level_${i+2}`,{clears:1,stars:3,bestLives:18}])),settings:{muted:true}})));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);return page;
}
async function deploy(page,late=false) {
 if(late){await page.click('[data-sector="3"]');await page.click('[data-level-id="level_18"]');}
 await page.click('#menu-play-button');
}
async function tile(page,row,col) {
 const {board}=await state(page);const rect=await page.locator('#game-canvas').boundingBox();
 await page.mouse.click(rect.x+(board.x+(col+.5)*board.tile)/1280*rect.width,rect.y+(board.y+(row+.5)*board.tile)/720*rect.height);
}
async function place(page,key='handgun') {
 const {pads}=await state(page);const pad=pads[0];
 await page.click(`.weapon-card[data-weapon-key="${key}"] .weapon-select`);await tile(page,pad.row,pad.col);await tile(page,pad.row,pad.col);
}
async function heldClick(page,selector,duringPress) {
 const el=await page.locator(selector).elementHandle();const box=await el.boundingBox();assert.ok(box);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.waitForTimeout(350);
 if(duringPress)await duringPress();
 assert.equal(await el.evaluate(e=>e.isConnected),true,`${selector} detached during held click`);
 await page.mouse.up();
}
try {
 const page=await create();await deploy(page,true);await place(page);
 for(let n=0;n<2;n++)for(const mode of ['strongest','nearest','last','first']) {
   await heldClick(page,`[data-target="${mode}"]`);
   assert.equal((await state(page)).towers[0].targeting,mode);
   assert.equal(await page.locator(`[data-target="${mode}"]`).getAttribute('aria-pressed'),'true');
 }
 await page.locator('[data-target="last"]').focus();await page.keyboard.press('Space');
 assert.equal((await state(page)).towers[0].targeting,'last');assert.equal((await state(page)).phase,'prepare');
 for(const [key,rank] of [['power',1],['tactical',1],['power',2],['tactical',2]]) {
   const before=(await state(page)).gold;
   await heldClick(page,`[data-upgrade="${key}"]`);
   const after=await state(page);assert.equal(after.towers[0].upgrades[key],rank);assert.ok(after.gold<before);
 }
 assert.ok((await state(page)).gold>0);assert.equal(await page.locator('[data-upgrade="power"]').isDisabled(),true);
 assert.match(await page.locator('[data-upgrade-limit]').textContent(),/All 4 upgrades/);
 await page.screenshot({path:`${out}/upgrade-limit.png`,fullPage:true});
 await page.click('[data-sell]');assert.equal((await state(page)).gold,630);
 await place(page);
 for(let rank=1;rank<=3;rank++) {await heldClick(page,'[data-upgrade="power"]');assert.equal((await state(page)).towers[0].upgrades.power,rank);}
 assert.equal(await page.locator('[data-upgrade="power"]').isDisabled(),true);
 assert.match(await page.locator('[data-upgrade="power"] [data-upgrade-status]').textContent(),/Fully upgraded/);
 assert.equal(await page.locator('[data-upgrade="tactical"]').isDisabled(),false);
 await heldClick(page,'[data-upgrade="tactical"]');assert.equal((await state(page)).towers[0].upgrades.tactical,1);
 await page.click('[data-sell]');assert.equal((await state(page)).gold,630);
 await page.click('#gear-button');await page.click('#change-level-button');await page.click('[data-sector="1"]');await page.click('[data-level-id="level_1"]');await page.click('#menu-play-button');
 // Live combat: kills change gold and ammo while the pointer remains held.
 await place(page,'assault_rifle');await page.click('#launch-wave-button');
 const before=(await state(page)).gold;
 await heldClick(page,'[data-target="last"]',()=>page.evaluate(()=>window.advanceTime(22000)));
 assert.equal((await state(page)).towers[0].targeting,'last');assert.ok((await state(page)).gold>before);
 await heldClick(page,'[data-upgrade="power"]',()=>page.evaluate(()=>window.advanceTime(1000)));
 assert.equal((await state(page)).towers[0].upgrades.power,1);
 await page.click('#play-pause-button');
 await heldClick(page,'[data-target="nearest"]');assert.equal((await state(page)).towers[0].targeting,'nearest');
 await page.screenshot({path:`${out}/live-combat.png`,fullPage:true});
 await page.click('#gear-button');await page.click('#restart-button');await place(page,'sniper');
 assert.equal((await state(page)).gold,25);assert.equal(await page.locator('[data-upgrade="power"]').isDisabled(),true);
 assert.match(await page.locator('[data-upgrade="power"] [data-upgrade-status]').textContent(),/Need \$\d+ more/);
 await page.screenshot({path:`${out}/insufficient-funds.png`,fullPage:true});
 await page.click('[data-sell]');const select=page.locator('[data-weapon-key="handgun"] .weapon-select');await select.focus();await page.keyboard.press('Space');
 assert.equal((await state(page)).selectedWeapon,'handgun');assert.equal((await state(page)).phase,'prepare');
 await page.screenshot({path:`${out}/selected-weapon.png`,fullPage:true});await page.context().close();
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:1024,height:768},{width:844,height:390},{width:1280,height:720},{width:1920,height:1080}]) {
   const p=await create(viewport,true);await deploy(p);await place(p);
   await p.locator('[data-target="last"]').tap();assert.equal((await state(p)).towers[0].targeting,'last');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   const rect=await p.locator('#game-canvas').boundingBox();assert.ok(Math.abs(rect.width/rect.height-16/9)<.015);
   if(viewport.width>=1024 && viewport.height>=581) {
     for(const key of ['power','tactical']) {
       const bounds=await p.locator(`[data-upgrade="${key}"]`).boundingBox();
       assert.ok(bounds.y>=0 && bounds.y+bounds.height<=viewport.height, `${key} upgrade must be visible without scrolling`);
     }
   }
   await p.screenshot({path:`${out}/tower-${viewport.width}.png`,fullPage:true});
   await p.click('#tower-sidebar-close-button');await p.click('[data-weapon-key="assault_rifle"] .weapon-select');
   await p.screenshot({path:`${out}/armory-${viewport.width}.png`,fullPage:true});
   await p.context().close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: held clicks, all four priorities, live gold/ammo updates, upgrades, cap vs funds feedback, keyboard selection, touch, responsive armory.');
} finally {await browser.close();}
