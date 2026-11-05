import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {missionRecords} from './fixtures.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:4182',out=process.env.GAME_OUTPUT||'output/frontier';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[],failed=[];
const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=(p,ms)=>p.evaluate(ms=>window.advanceTime(ms),ms);
const advanced={schemaVersion:4,level:8,salvage:100,missions:missionRecords(10),skills:{napalm:1},equippedActiveKey:'napalm',settings:{muted:true}};
async function pageFor(profile,viewport={width:1440,height:1000},fixture=false){
 const c=await browser.newContext({viewport});await c.addInitScript(p=>localStorage.setItem('aliens-tower-defense-profile',JSON.stringify(p)),profile);
 if(fixture){
  await c.route('**/src/data/levels/index.js',r=>r.fulfill({contentType:'application/javascript',body:`import l from './level1.js';export const levels=[{...l,startGold:2000,threat:1,waves:[{name:'Energy endurance fixture',healthScale:100,reward:0,spawns:[{enemy:'alien_tank',at:0},{enemy:'alien_tank',at:.2},{enemy:'alien_tank',at:1000}]}]}];`}));
  await c.route('**/src/data/enemies.js',async r=>{const response=await r.fetch();const body=(await response.text()).replace('speed: 42,','speed: 0,');await r.fulfill({response,body});});
 }
 const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await p.goto(url);await p.waitForFunction(()=>window.render_game_to_text);return p;
}
async function tile(p,row,col){const {board}=await read(p),r=await p.locator('#game-canvas').boundingBox();await p.mouse.click(r.x+(board.x+(col+.5)*board.tile)*r.width/1280,r.y+(board.y+(row+.5)*board.tile)*r.height/720);}
async function shot(p,name,pause=false){if(pause){await p.evaluate(()=>{if(!JSON.parse(window.render_game_to_text()).paused)document.querySelector('#play-pause-button').click();});}await p.screenshot({path:`${out}/${name}.png`,fullPage:true});await fs.writeFile(`${out}/${name}.json`,await p.evaluate(()=>window.render_game_to_text()));}
try{
 const fresh=await pageFor({schemaVersion:3,level:50,settings:{muted:true}});await fresh.click('#menu-play-button');
 assert.deepEqual((await read(fresh)).classUnlocks,['handgun','assault_rifle']);assert.equal(await fresh.locator('.weapon-select:enabled').count(),2);assert.equal(await fresh.locator('.class-locked').count(),4);
 assert.equal(await fresh.locator('.lives-chip').evaluate(e=>getComputedStyle(e).cursor),'default');assert.equal(await fresh.locator('#player-level-button').evaluate(e=>getComputedStyle(e).cursor),'pointer');
 assert.match(await fresh.locator('[data-weapon-key="shotgun"]').innerText(),/Complete 2 different missions/);
 await shot(fresh,'two-starter-types');await fresh.click('[data-info-weapon-key="shotgun"]');assert.match(await fresh.locator('#weapon-info-modal').innerText(),/Complete 2 different missions/);await fresh.click('#weapon-info-close-button');await fresh.click('#field-loadout-button');await fresh.click('[data-arsenal-class="laser"]');assert.ok(await fresh.locator('[data-equip-heavy="laser"]').isDisabled());await fresh.context().close();

 const swap=await pageFor(advanced);await swap.click('#menu-play-button');await swap.click('[data-weapon-key="handgun"] .weapon-select');await tile(swap,3,1);
 assert.equal((await read(swap)).towers[0].blueprint,'Service 9');
 await swap.click('[data-info-weapon-key="handgun"]');await swap.click('#weapon-customize-button');assert.equal((await read(swap)).arsenalOpen,true);assert.equal((await read(swap)).paused,true);
 await swap.click('.model-options > summary');await swap.click('[data-buy-blueprint="rare"]');assert.equal((await read(swap)).arsenal.blueprints.handgun,'rare');assert.equal((await read(swap)).towers[0].blueprint,'Service 9');
 await swap.click('[data-buy-attachment="incendiary"]');assert.equal((await read(swap)).salvage,60);assert.deepEqual((await read(swap)).arsenal.attachments.handgun,['incendiary']);
 await shot(swap,'mid-mission-model-change');await swap.click('#arsenal-restart-button');assert.equal((await read(swap)).towers.length,0);assert.equal((await read(swap)).phase,'prepare');assert.equal((await read(swap)).arsenalOpen,false);
 assert.match(await swap.locator('.weapon-card[data-weapon-key="handgun"]').innerText(),/Lynx Auto/);await swap.click('[data-weapon-key="handgun"] .weapon-select');await tile(swap,3,1);assert.equal((await read(swap)).towers[0].blueprint,'Lynx Auto');
 await swap.context().close();

 const energy=await pageFor({...advanced,settings:{muted:false},arsenal:{heavy:'laser',support:'flamethrower'}},undefined,true);await energy.click('#menu-play-button');
 assert.equal(await energy.locator('.ability-full-art').getAttribute('src').then(s=>s.includes('napalm')),true);
 await energy.click('[data-weapon-key="laser"] .weapon-select');await tile(energy,3,1);
 await energy.click('[data-weapon-key="flamethrower"] .weapon-select');await tile(energy,5,0);
 await energy.click('#launch-wave-button');await advance(energy,500);await energy.waitForTimeout(250);
 let state=await read(energy);assert.ok(state.towers.find(t=>t.weapon==='laser').beam);assert.ok(state.enemies.some(e=>e.burnTimer>0));assert.equal(state.projectiles.length,0);assert.ok(state.audio.activeEnergyVoices>0);
 await shot(energy,'continuous-laser-flame',true);assert.equal((await read(energy)).audio.activeEnergyVoices,0);
 await energy.click('#play-pause-button');await advance(energy,4800);state=await read(energy);assert.ok(state.towers.find(t=>t.weapon==='laser').cooling);assert.equal(state.towers.find(t=>t.weapon==='laser').beam,null);
 await shot(energy,'laser-cooling',true);await energy.click('#play-pause-button');await advance(energy,3200);assert.ok((await read(energy)).towers.find(t=>t.weapon==='laser').ammo>0);await energy.context().close();

 const graph=await pageFor({schemaVersion:4,level:1,skillPoints:5,skills:{damage:1},settings:{muted:true}});await graph.click('#menu-skills-button');
 for(const key of ['owned','available','unfunded','locked'])assert.ok(await graph.locator(`.graph-node.${key}`).count()>0,key);
 const colors=await graph.locator('.graph-node').evaluateAll(nodes=>Object.fromEntries(['owned','available','unfunded','locked'].map(state=>[state,getComputedStyle(nodes.find(n=>n.classList.contains(state))).backgroundColor])));assert.equal(new Set(Object.values(colors)).size,4);
 await graph.click('[data-select-skill="drone"]');assert.match(await graph.locator('.node-inspector').innerText(),/Requires Last Line/);assert.ok(await graph.locator('[data-skill-key="drone"]').isDisabled());await shot(graph,'research-four-states');
 await graph.click('.prerequisite-link');assert.match(await graph.locator('[data-skill-key="mines"]').innerText(),/Need 1 more SP/);await graph.click('[data-select-skill="reload"]');await graph.click('[data-skill-key="reload"]');assert.equal((await read(graph)).player.skillPoints,0);assert.equal((await read(graph)).skills.reload,1);await graph.context().close();

 for(const viewport of [{width:320,height:844},{width:390,height:844},{width:844,height:390},{width:1024,height:768},{width:1280,height:720}]){
  const p=await pageFor(advanced,viewport);await p.click('[data-sector="3"]');await p.click('[data-level-id="level_17"]');assert.ok(await p.locator('.mission-briefing .enemy-roster img[src*="frontier/aliens"]').count()>0);
  await p.click('#menu-play-button');assert.ok((await read(p)).water.length);assert.equal(await p.locator('.ability-full-art').evaluate(img=>getComputedStyle(img).objectFit),'contain');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await shot(p,`water-cards-${viewport.width}`);
  await p.click('#player-level-button');assert.equal(await p.locator('.skill-tree-card').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);await shot(p,`research-${viewport.width}`);await p.context().close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: two starter classes, milestone gates for legacy saves, real mid-mission model/attachment swap and explicit restart, continuous laser/heat/cooling, flame cone/burn, energy audio/pause, full special art, dedicated alien previews, water and research states across responsive layouts.');
}finally{await browser.close();}
