import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {levels} from '../src/data/levels/index.js';
import {chromium} from 'playwright';
const url=process.env.GAME_URL||'http://127.0.0.1:4178';
const out=process.env.GAME_OUTPUT||'output/arsenal';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[],failed=[];
const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=(p,ms)=>p.evaluate(ms=>window.advanceTime(ms),ms);
async function pageFor(profile,viewport={width:1440,height:1000},fixture=false){
 const context=await browser.newContext({viewport});
 await context.addInitScript(p=>{if(!localStorage.getItem('aliens-tower-defense-profile'))localStorage.setItem('aliens-tower-defense-profile',JSON.stringify({...p,schemaVersion:3}));},profile);
 // Only this explicit trait scenario replaces the spawn schedule, using real enemy definitions.
 // All armory, power, unlock and RPG scenarios below use the production campaign unchanged.
 if(fixture)await context.route('**/src/data/levels/index.js',route=>route.fulfill({contentType:'application/javascript',body:`import level from './level1.js'; export const levels=[{...level, startGold:1000, waves:[{name:'Trait encounter',healthScale:1,reward:0,spawns:[{enemy:'alien_steadfast',at:0},{enemy:'alien_rager',at:1},{enemy:'alien_broodmother',at:2},{enemy:'alien_medic',at:2.5},{enemy:'alien_normal',at:100}]}]}];`}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))failed.push(`${r.status()} ${r.url()}`);});
 await page.goto(url);await page.waitForFunction(()=>window.render_game_to_text);return page;
}
async function tile(p,row,col){const {board}=await read(p),r=await p.locator('#game-canvas').boundingBox();await p.mouse.click(r.x+(board.x+(col+.5)*board.tile)*r.width/1280,r.y+(board.y+(row+.5)*board.tile)*r.height/720);}
async function freezeShot(p,name){await p.evaluate(()=>{if(!JSON.parse(window.render_game_to_text()).paused)document.querySelector('#play-pause-button').click();window.advanceTime(0);});await p.screenshot({path:`${out}/${name}.png`,fullPage:true});await fs.writeFile(`${out}/${name}.json`,await p.evaluate(()=>window.render_game_to_text()));}
try{
 for(const width of [320,390,844,1280]){
  const p=await pageFor({level:1,settings:{muted:true}},{width,height:width===844?390:width===1280?720:844});
  const loadout=await p.locator('.menu-loadout').boundingBox(),customize=await p.locator('#menu-arsenal-button').boundingBox();assert.ok(customize.x+customize.width<=loadout.x+loadout.width,'customize button stays inside its panel');
  await p.click('#menu-arsenal-button');assert.ok(await p.locator('[data-buy-blueprint="rare"]').isDisabled());
  await p.click('[data-arsenal-class="rocket_launcher"]');assert.ok(await p.locator('[data-equip-heavy]').isDisabled());
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await p.locator('.arsenal-card').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
  await p.click('[data-arsenal-class="handgun"]');await p.screenshot({path:`${out}/arsenal-fresh-${width}.png`,fullPage:true});
  await p.keyboard.press('Escape');assert.equal((await read(p)).arsenalOpen,false);await p.context().close();
 }
 const p=await pageFor({level:10,settings:{muted:false}});await p.click('#menu-arsenal-button');
 await p.click('[data-blueprint="legendary"]');await p.click('[data-attachment="incendiary"]');await p.click('[data-attachment="concussive"]');
 assert.ok(await p.locator('[data-attachment="cryo"]').isDisabled());
 await p.click('[data-attachment="concussive"]');await p.click('[data-attachment="cryo"]');
 await p.click('[data-blueprint="rare"]');assert.equal((await read(p)).arsenal.attachments.handgun.length,1);
 await p.click('[data-blueprint="legendary"]');await p.click('[data-attachment="concussive"]');
 await p.screenshot({path:`${out}/arsenal-legendary.png`,fullPage:true});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:`${out}/arsenal-legendary-390.png`,fullPage:true});assert.equal(await p.locator('.arsenal-card').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);await p.setViewportSize({width:1440,height:1000});
 await p.click('[data-arsenal-class="rocket_launcher"]');await p.click('[data-blueprint="legendary"]');await p.click('[data-attachment="incendiary"]');await p.click('[data-equip-heavy]');
 await p.click('#arsenal-close-button');await p.reload();assert.equal((await read(p)).arsenal.heavy,'rocket_launcher');
 await p.click('[data-sector="3"]');await p.click('[data-level-id="level_18"]');await p.click('#menu-play-button');
 assert.equal(await p.locator('.weapon-card').count(),6);assert.equal(await p.locator('[data-weapon-key="sniper"]').count(),0);
 const layout=levels[17],board=(await read(p)).board;let position,best=-1;
 for(let row=0;row<layout.rows;row++)for(let col=0;col<layout.cols;col++){
  if(layout.track.some(t=>t.row===row&&t.col===col)||layout.blockers.some(t=>t.row===row&&t.col===col))continue;
  const score=layout.track.slice(0,18).filter(t=>Math.hypot(t.row-row,t.col-col)*board.tile<=269).length;
  if(score>best){best=score;position={row,col};}
 }
 await p.keyboard.press('6');await tile(p,position.row,position.col);assert.equal((await read(p)).towers[0]?.weapon,'rocket_launcher');
 const rpg=(await read(p)).towers[0];assert.equal(rpg.rarity,'legendary');assert.deepEqual(rpg.attachments,['incendiary']);
 await tile(p,position.row,position.col);assert.match(await p.locator('#tower-actions').innerText(),/High explosive/);
 await p.click('[data-upgrade="power"]');assert.equal((await read(p)).towers[0].upgrades.power,1);
 await p.click('#launch-wave-button');
 let fired=false,exploded=false;
 for(let i=0;i<160;i++){
  await advance(p,100);const s=await read(p);if(s.audio.lastShot?.weapon==='rocket_launcher')fired=true;
  if(s.effects.some(e=>e.kind==='explosion')){exploded=true;await advance(p,130);await freezeShot(p,'rpg-impact');break;}
 }
 assert.ok(fired,'RPG fires its launch sound');assert.ok(exploded,'RPG explodes visually');await p.context().close();
 for(const key of ['artillery','napalm','chronoBreak']){
  const power=await pageFor({level:6,skills:{artillery:2},equippedActiveKey:key,settings:{muted:false}});
  await power.click('#menu-play-button');await power.waitForFunction(()=>JSON.parse(window.render_game_to_text()).audio.loadedClips===20);
  await power.click('#launch-wave-button');await advance(power,2000);
  await power.keyboard.press('q');if(key==='artillery')await tile(power,4,2);
  const activated=await read(power);assert.ok(activated.activeAbilities[key].timer>0);
  assert.equal(activated.audio.lastShot.weapon,key==='chronoBreak'?'chrono':key);
  if(key==='artillery')await advance(power,300);else await advance(power,100);
  await freezeShot(power,`power-${key}`);
  const s=await read(power);assert.ok(s.effects.length>0);
  const cooldown=s.activeAbilities[key].cooldown;await advance(power,2000);assert.equal((await read(power)).activeAbilities[key].cooldown,cooldown);
  await power.click('#play-pause-button');if(key==='artillery'){await advance(power,5100);assert.equal((await read(power)).artillery,null);}
  await power.context().close();
 }
 // Verify all three enemy traits are drawn, and the brood actually releases hatchlings.
 const traits=await pageFor({level:10,settings:{muted:true}},undefined,true);
 await traits.click('#menu-play-button');await traits.click('[data-weapon-key="machine_pistol"] .weapon-select');await tile(traits,3,1);await tile(traits,3,1);await traits.click('[data-target="last"]');await traits.click('#launch-wave-button');await advance(traits,3100);
 let ts=await read(traits);assert.ok(ts.enemies.some(e=>e.immuneSlow));assert.ok(ts.enemies.some(e=>e.raged));assert.ok(ts.enemies.some(e=>e.brood));assert.ok(ts.enemies.some(e=>e.healer));await advance(traits,1500);
 await freezeShot(traits,'enemy-traits');await traits.click('#play-pause-button');await advance(traits,8200);ts=await read(traits);assert.ok(ts.enemies.some(e=>e.key==='alien_hatchling'));await freezeShot(traits,'hatchlings');await traits.context().close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: responsive arsenal, unlocks, models, attachment caps, persistence, Heavy slot, RPG audio/impact, all three power sounds/visuals, pause, enemy traits and hatchlings.');
}finally{await browser.close();}
