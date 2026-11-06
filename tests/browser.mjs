import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { levels } from '../src/data/levels/index.js';
import { createInitialState } from '../src/game.js';
import { normalizeProfile } from '../src/systems/profile.js';
import { invest } from './balance.mjs';

const url=process.env.GAME_URL || 'http://127.0.0.1:4175';
const out=process.env.GAME_OUTPUT || 'output/browser';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[], failed=[];
async function pageFor(profile,viewport={width:1440,height:1000}) {
 const context=await browser.newContext({viewport});
 if(profile)await context.addInitScript(p=>{if(!localStorage.getItem('aliens-tower-defense-profile'))localStorage.setItem('aliens-tower-defense-profile',JSON.stringify({...p,schemaVersion:3}));},profile);
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.stack || String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(url))failed.push(`${response.status()} ${response.url()}`);});
 await page.goto(url);await page.waitForFunction(()=>typeof window.render_game_to_text==='function');
 return page;
}
const read=page=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=(page,ms)=>page.evaluate(ms=>window.advanceTime(ms),ms);
async function tileClick(page,row,col) {
 const {board}=await read(page),rect=await page.locator('#game-canvas').boundingBox();
 await page.mouse.click(rect.x+(board.x+(col+.5)*board.tile)/1280*rect.width,rect.y+(board.y+(row+.5)*board.tile)/720*rect.height);
}
async function noOverflow(page) {
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow');
 const rect=await page.locator('#game-canvas').boundingBox();
 if(rect)assert.ok(Math.abs(rect.width/rect.height-16/9)<.015,'canvas aspect ratio');
}
async function choose(page,level) {
 await page.locator(`[data-sector="${level.sector}"]`).click();
 await page.locator(`[data-level-id="${level.id}"]`).click();
 await page.locator('#menu-play-button').click();
}
try {
 const page=await pageFor({level:1,settings:{muted:true}});
 await page.screenshot({path:`${out}/menu.png`,fullPage:true});
 await choose(page,levels[0]);await noOverflow(page);
 assert.equal((await read(page)).phase,'prepare');await advance(page,60000);assert.equal((await read(page)).enemies.length,0);
 await page.keyboard.press('1');const pad=(await read(page)).pads[0];await tileClick(page,pad.row,pad.col);
 assert.equal((await read(page)).towers.length,1);await tileClick(page,pad.row,pad.col);
 await page.locator('[data-upgrade="power"]').click();await page.locator('[data-upgrade="tactical"]').click();
 await page.locator('[data-target="strongest"]').click();
 let state=await read(page);assert.equal(state.towers[0].damage,560);assert.equal(state.towers[0].targeting,'strongest');
 await page.screenshot({path:`${out}/upgrades.png`,fullPage:true});
 await page.locator('[data-sell]').click();assert.equal((await read(page)).gold,235);
 const obstacle=(await read(page)).blockers.find(t=>t.cost);await tileClick(page,obstacle.row,obstacle.col);await page.locator('[data-clear]').click();
 assert.equal((await read(page)).gold,185);await page.keyboard.press('1');await tileClick(page,obstacle.row,obstacle.col);assert.equal((await read(page)).towers.length,1);
 await page.locator('#launch-wave-button').click();await advance(page,2000);
 await page.keyboard.press('q');assert.ok((await read(page)).activeAbilities.chronoBreak.timer>0);
 await page.locator('#play-pause-button').click();state=await read(page);await advance(page,5000);assert.equal((await read(page)).activeAbilities.chronoBreak.cooldown,state.activeAbilities.chronoBreak.cooldown);
 await page.locator('#play-pause-button').click();await page.locator('#speed-toggle-button').click();assert.equal((await read(page)).gameSpeed,2);
 await page.screenshot({path:`${out}/combat.png`,fullPage:true});
 await page.locator('#gear-button').click();await page.locator('#change-level-button').click();
 const before=(await read(page)).player.xp;await advance(page,50000);assert.equal((await read(page)).player.xp,before);
 await choose(page,levels[6]);await page.screenshot({path:`${out}/frost.png`,fullPage:true});
 await page.locator('#gear-button').click();await page.locator('#change-level-button').click();await choose(page,levels[12]);await page.screenshot({path:`${out}/hive.png`,fullPage:true});

 await page.context().close();
 const skilled=await pageFor({level:6,xp:0,skillPoints:50,settings:{muted:true}});
 await skilled.locator('#menu-skills-button').click();await skilled.locator('[data-skill-key="damage"]').click();
 assert.equal((await read(skilled)).skills.damage,1);assert.equal((await read(skilled)).player.skillPoints,45);
 await skilled.locator('[data-skill-branch="artillery"]').click();await skilled.locator('[data-select-skill="artillery"]').click();await skilled.locator('[data-equip-active-key="artillery"]').click();await skilled.locator('#skill-tree-close-button').click();await choose(skilled,levels[0]);
 await skilled.keyboard.press('1');await tileClick(skilled,3,7);assert.equal((await read(skilled)).towers[0].damage,432);
 await skilled.locator('#player-level-button').click();await skilled.locator('[data-skill-branch="napalm"]').click();await skilled.locator('[data-select-skill="napalm"]').click();await skilled.locator('[data-equip-active-key="napalm"]').click();assert.ok(await skilled.locator('#reset-skills-button').isDisabled());
 await skilled.screenshot({path:`${out}/skills.png`,fullPage:true});await skilled.locator('#skill-tree-close-button').click();
 assert.equal((await read(skilled)).towers[0].damage,432);assert.equal((await read(skilled)).equippedActive,'artillery');
 await skilled.locator('#launch-wave-button').click();await advance(skilled,2000);await skilled.keyboard.press('q');
 assert.equal((await read(skilled)).selectedActive,'artillery');await tileClick(skilled,4,1);assert.ok((await read(skilled)).activeAbilities.artillery.cooldown>0);
 await skilled.locator('#gear-button').click();await skilled.locator('#restart-button').click();assert.equal((await read(skilled)).equippedActive,'napalm');
 await skilled.locator('#launch-wave-button').click();await advance(skilled,2000);await skilled.keyboard.press('q');await tileClick(skilled,4,1);await advance(skilled,100);assert.ok((await read(skilled)).enemies.some(e=>e.burnTimer>0));
 await skilled.locator('[data-info-weapon-key="handgun"]').click();assert.equal((await read(skilled)).paused,true);await skilled.locator('#weapon-info-close-button').click();assert.equal((await read(skilled)).paused,false);

 await skilled.context().close();
 // Complete an entire mission through UI purchases/launches and the public deterministic time hook.
 const victory=await pageFor({level:1,settings:{muted:true}});await choose(victory,levels[0]);
 for(let wave=0;wave<levels[0].waves.length;wave++) {
   let actual=await read(victory);
   const model=createInitialState(levels[0],normalizeProfile({level:actual.player.level,xp:actual.player.xp,skills:actual.skills,settings:{muted:true}}),{width:1280,height:720});
   model.gold=actual.gold;
   // Replay prior UI purchases in a planning model; do not modify live game state.
   const {placeTower,upgradeTower}=await import('../src/game.js');
   for(const t of actual.towers) {
     model.gold=100000;const tower=placeTower(model,t.weapon,t.row,t.col);
     for(const key of ['power','tactical'])for(let r=0;r<t.upgrades[key];r++)upgradeTower(model,tower,key);
   }
   model.gold=actual.gold;const previous=structuredClone(actual.towers);invest(model);
   for(const tower of model.towers) {
     const old=previous.find(t=>t.row===tower.row&&t.col===tower.col);
     if(!old) {await victory.locator(`.weapon-card[data-weapon-key="${tower.weapon.key}"]`).click();await tileClick(victory,tower.row,tower.col);}
     const upgrades=Object.keys(tower.upgrades).some(k=>tower.upgrades[k]>(old?.upgrades[k]||0));
     if(upgrades) {
       await tileClick(victory,tower.row,tower.col);
       for(const key of ['power','tactical'])for(let r=old?.upgrades[key]||0;r<tower.upgrades[key];r++)await victory.locator(`[data-upgrade="${key}"]`).click();
     }
   }
   await victory.locator('#launch-wave-button').click();
   for(let n=0;n<30;n++){await advance(victory,10000);actual=await read(victory);if(actual.phase==='prepare'||actual.result)break;}
   if(actual.result)break;
 }
 assert.equal((await read(victory)).result,'victory');
 assert.equal((await read(victory)).caches.level_1,true);assert.equal((await read(victory)).arsenal.attachments,undefined);assert.ok((await read(victory)).classUnlocks.includes('machine_pistol'));assert.ok((await read(victory)).weaponKills.handgun>0);
 assert.ok((await read(victory)).campaign.records.level_1.stars>0);
 await victory.screenshot({path:`${out}/victory.png`,fullPage:true});
 await victory.locator('#result-next-button').click();assert.equal((await read(victory)).level,'level_2');
 await victory.locator('#gear-button').click();await victory.locator('#change-level-button').click();await victory.reload();
 assert.ok((await read(victory)).campaign.records.level_1.stars>0,'completion survives reload');

 await victory.context().close();
 const defeat=await pageFor({level:1,settings:{muted:true,autoWave:true}});await choose(defeat,levels[0]);await defeat.locator('#launch-wave-button').click();await advance(defeat,180000);
 assert.equal((await read(defeat)).result,'defeat');await defeat.screenshot({path:`${out}/defeat.png`,fullPage:true});
 await defeat.locator('#result-restart-button').click();assert.equal((await read(defeat)).phase,'prepare');assert.equal((await read(defeat)).lives,18);

 await defeat.context().close();
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:720}]) {
   const mobile=await pageFor({level:3,skillPoints:20,settings:{muted:true}},viewport);
   await noOverflow(mobile);await mobile.screenshot({path:`${out}/menu-${viewport.width}.png`,fullPage:true});
   await choose(mobile,levels[0]);await noOverflow(mobile);
   await mobile.locator('[data-weapon-key="handgun"]').click();await tileClick(mobile,3,7);assert.equal((await read(mobile)).towers.length,1);
   await tileClick(mobile,3,7);await mobile.screenshot({path:`${out}/game-${viewport.width}.png`,fullPage:true});
   await mobile.locator('#player-level-button').click();await mobile.screenshot({path:`${out}/skills-${viewport.width}.png`,fullPage:true});await mobile.locator('#skill-tree-close-button').click();
   await mobile.context().close();
 }
 assert.deepEqual(failed,[],'failed local assets');assert.deepEqual(errors,[],'browser errors');
 console.log('PASS: campaign, placement, upgrades, sell, obstacles, skills, targeting, all abilities, pause/speed, victory, persistence, defeat, next mission, responsive viewports.');
} finally {await browser.close();}
