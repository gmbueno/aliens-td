import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.GAME_URL||'http://127.0.0.1:4180',out=process.env.GAME_OUTPUT||'output/doctrine';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[],failed=[];
async function pageFor(profile,viewport={width:1440,height:1000},mineFixture=false){
 const context=await browser.newContext({viewport});await context.addInitScript(p=>{if(!localStorage.getItem('aliens-tower-defense-profile'))localStorage.setItem('aliens-tower-defense-profile',JSON.stringify(p));},profile);
 if(mineFixture)await context.route('**/src/data/levels/index.js',route=>route.fulfill({contentType:'application/javascript',body:`import l from './level1.js';export const levels=[{...l,threat:.3,track:l.track.slice(0,5),waves:[{name:'Mine interception',healthScale:1,reward:0,spawns:[{enemy:'alien_normal',at:0},{enemy:'alien_normal',at:100}]}]}];`}));
 const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
 await p.goto(url);await p.waitForFunction(()=>window.render_game_to_text);return p;
}
const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=(p,ms)=>p.evaluate(ms=>window.advanceTime(ms),ms);
async function select(p,key){await p.locator(`[data-select-skill="${key}"]`).first().click();}
async function buy(p,key){await select(p,key);await p.click(`[data-skill-key="${key}"]`);}
async function tile(p,row,col){const {board}=await read(p),r=await p.locator('#game-canvas').boundingBox();await p.mouse.click(r.x+(board.x+(col+.5)*board.tile)*r.width/1280,r.y+(board.y+(row+.5)*board.tile)*r.height/720);}
async function freeze(p,name){await p.evaluate(()=>{if(!JSON.parse(window.render_game_to_text()).paused)document.querySelector('#play-pause-button').click();window.advanceTime(0);});await p.screenshot({path:`${out}/${name}.png`,fullPage:true});await fs.writeFile(`${out}/${name}.json`,await p.evaluate(()=>window.render_game_to_text()));}
try{
 for(const viewport of [{width:320,height:844},{width:390,height:844},{width:844,height:390},{width:1280,height:720},{width:1440,height:1000}]){
  const p=await pageFor({schemaVersion:4,level:5,settings:{muted:true}},viewport);await p.click('#menu-skills-button');
  assert.equal(await p.locator('.graph-node').count(),12);assert.equal(await p.locator('.graph-connections path').count(),12);
  await select(p,'drone');assert.ok(await p.locator('[data-skill-key="drone"]').isDisabled());assert.match(await p.locator('.node-inspector').innerText(),/Requires Last Line/);
  await p.click('.prerequisite-link');assert.equal(await p.locator('#skill-tree-nodes').getAttribute('data-selected'),'mines');
  await p.click('[data-skill-key="mines"]');await buy(p,'drone');
  assert.equal((await read(p)).skills.drone,1);await select(p,'pontoons');assert.ok(await p.locator('[data-skill-key="pontoons"]').isDisabled());
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await p.locator('.skill-tree-card').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,`Skill modal overflow at ${viewport.width}px`);
  await p.screenshot({path:`${out}/graph-${viewport.width}.png`,fullPage:true});
  await p.keyboard.press('Escape');assert.equal((await read(p)).skillTreeOpen,false);await p.context().close();
 }
 const p=await pageFor({schemaVersion:4,level:8,salvage:120,settings:{muted:false}});
 await p.click('#menu-play-button');assert.equal((await read(p)).equippedActive,null);assert.equal(await p.locator('[data-open-doctrine]').count(),1);
 await p.click('[data-open-doctrine]');assert.equal((await read(p)).paused,true);
 for(const key of ['mines','drone','salvage','supplies','pontoons','napalm'])await buy(p,key);
 assert.equal((await read(p)).player.skillPoints,36);assert.equal((await read(p)).nextEquippedActive,'napalm');
 await select(p,'napalm');await p.screenshot({path:`${out}/graph-trained.png`,fullPage:true});await p.click('#skill-tree-close-button');
 assert.equal((await read(p)).equippedActive,null,'new equipment waits until deployment');assert.equal((await read(p)).fieldMines.length,0);
 await p.click('#gear-button');await p.click('#change-level-button');await p.click('#menu-arsenal-button');
 await p.click('.model-options > summary');await p.click('[data-buy-blueprint="rare"]');assert.equal((await read(p)).player.skillPoints,28);assert.equal((await read(p)).arsenal.blueprints.handgun,'rare');
 await p.click('[data-buy-attachment="incendiary"]');assert.equal((await read(p)).salvage,80);assert.deepEqual((await read(p)).arsenal.attachments.handgun,['incendiary']);
 assert.match(await p.locator('.arsenal-statline').innerText(),/Lynx Auto/);assert.match(await p.locator('.arsenal-statline').innerText(),/Full-auto/);
 await p.screenshot({path:`${out}/arsenal-acquisitions.png`,fullPage:true});await p.click('#arsenal-close-button');await p.reload();
 let state=await read(p);assert.equal(state.player.skillPoints,28);assert.equal(state.salvage,80);assert.equal(state.arsenal.blueprints.handgun,'rare');
 await p.click('[data-level-id="level_4"]');await p.click('#menu-play-button');state=await read(p);
 assert.equal(state.equippedActive,'napalm');assert.equal(state.fieldMines.length,5);assert.ok(state.drone);assert.ok(state.water.length);
 assert.equal(await p.locator('.weapon-card').count(),6);assert.match(await p.locator('[data-weapon-key="handgun"]').innerText(),/Lynx Auto/);
 const water=state.water[0],gold=state.gold;await p.click('[data-weapon-key="handgun"] .weapon-select');assert.match(await p.locator('#battle-message').innerText(),/Lynx Auto/);await tile(p,water.row,water.col);
 state=await read(p);assert.equal(state.towers[0].blueprint,'Lynx Auto');assert.equal(state.towers[0].platform,35);assert.equal(state.gold,gold-105);
 await tile(p,water.row,water.col);const obstacle=state.blockers.find(o=>o.cost);await tile(p,obstacle.row,obstacle.col);
 assert.match(await p.locator('[data-clear]').innerText(),new RegExp(String(Math.ceil(obstacle.cost*.85))));
 await p.click('#launch-wave-button');await advance(p,2300);state=await read(p);assert.ok(state.drone.time>0);await p.keyboard.press('q');assert.ok((await read(p)).activeAbilities.napalm.timer>0);
 await freeze(p,'water-uav-mines');await p.click('#player-level-button');assert.ok(await p.locator('#reset-skills-button').isDisabled());await p.click('#skill-tree-close-button');await p.click('#gear-button');await p.click('#change-level-button');await p.click('#menu-skills-button');await p.click('#reset-skills-button');
 assert.equal((await read(p)).player.skillPoints,62);await p.click('#skill-tree-close-button');await p.click('#menu-play-button');state=await read(p);assert.equal(state.equippedActive,null);assert.equal(state.drone,null);assert.equal(state.fieldMines.length,0);assert.equal(state.towers.length,0);
 await p.context().close();
 const mines=await pageFor({schemaVersion:4,level:5,skills:{mines:2},settings:{muted:true}},undefined,true);
 await mines.click('#menu-play-button');await mines.click('#launch-wave-button');let detonation=false;
 for(let i=0;i<80;i++){await advance(mines,50);const s=await read(mines);if(s.effects.some(e=>e.kind==='explosion')){detonation=true;break;}}
 assert.ok(detonation);assert.ok((await read(mines)).fieldMines.some(m=>m.spent));await freeze(mines,'mine-detonation');await mines.context().close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: graph prerequisites, purchases/refunds, specials locked for new players, responsive graph, Rare SP license, Salvage attachment, persistence, model identity, water/raft cost, clearance preview, automatic mines/UAV, next-deployment and pause semantics.');
}finally{await browser.close();}
