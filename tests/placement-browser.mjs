import {weapons} from '../src/data/weapons.js';
import {autoStart} from './browser-helpers.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {levels} from '../src/data/levels/index.js';
import {missionRecords} from './fixtures.mjs';
const url=process.env.GAME_URL||'http://127.0.0.1:4182';
const out=process.env.GAME_OUTPUT||'output/placement';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[];
const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
async function point(p,tile){const s=await read(p),r=await p.locator('#game-canvas').boundingBox();return{x:r.x+(s.board.x+(tile.col+.5)*s.board.tile)*r.width/1280,y:r.y+(s.board.y+(tile.row+.5)*s.board.tile)*r.height/720};}
async function hover(p,tile){const pos=await point(p,tile);await p.mouse.move(pos.x,pos.y);await p.evaluate(()=>window.advanceTime(0));return pos;}
async function pageFor(level,mode='card',fresh=false,viewport={width:1280,height:720}){
 const context=await browser.newContext({viewport});
 await context.addInitScript(profile=>localStorage.setItem('aliens-tower-defense-profile',JSON.stringify(profile)),{schemaVersion:4,level:1,missions:fresh?{}:missionRecords(),settings:{muted:true}});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(url);await p.click(`[data-sector="${level.sector}"]`);await p.click(`[data-level-id="${level.id}"]`);await p.click('#menu-play-button');
 if(mode==='info'){await p.click('[data-info-weapon-key="handgun"]');await p.click('#weapon-equip-button');}
 else if(mode==='keyboard')await p.keyboard.press('1');
 else await p.click('[data-weapon-key="handgun"] .weapon-select');
 assert.equal((await read(p)).selectedWeapon,'handgun');return p;
}
try{
 for(const level of levels){
  const p=await pageFor(level),start=await read(p);
  // A physical pointer move runs the placement preview; click-only input does
  // not exercise this rendering path and previously missed the frozen frame.
  const invalid=await hover(p,level.track[0]);
  await p.mouse.click(invalid.x,invalid.y);assert.equal((await read(p)).towers.length,0);assert.equal((await read(p)).gold,start.gold);
  const tile=start.pads[0],pos=await hover(p,tile);await p.screenshot({path:`${out}/${level.id}-preview.png`});
  await p.mouse.down();await p.waitForTimeout(50);await p.mouse.up();
  const placed=await read(p);assert.equal(placed.towers.length,1,level.id);assert.equal(placed.gold,start.gold-weapons.find(w=>w.key==='handgun').price);assert.equal(placed.towers[0].row,tile.row);assert.equal(placed.towers[0].col,tile.col);
  await p.mouse.move(pos.x+3,pos.y+3);await p.screenshot({path:`${out}/${level.id}-placed.png`});
  await p.evaluate(()=>{const s=JSON.parse(window.render_game_to_text());window.advanceTime(Math.max(0,s.waveDelay-.3)*1000);});
  // Native RAF must still animate, without a time-step hook reviving a loop
  // that crashed while hovering. First enemies spawn at 0.4s in every mission.
  await p.waitForFunction(()=>JSON.parse(window.render_game_to_text()).enemies.length>0,{},{timeout:5000});
  assert.deepEqual(errors,[],level.id);await p.context().close();
 }
 for(const [mode,viewport] of [['info',{width:1440,height:1000}],['keyboard',{width:1024,height:768}],['card',{width:390,height:844}]]){
  const p=await pageFor(levels[2],mode,true,viewport),start=await read(p),pos=await hover(p,start.pads[0]);await p.mouse.click(pos.x,pos.y);
  assert.equal((await read(p)).towers.length,1);assert.equal((await read(p)).gold,start.gold-weapons.find(w=>w.key==='handgun').price);await p.context().close();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: real mouse hover, rejected path placement, held click purchase and live RAF/wave continuation on all 18 missions; fresh-profile card, info/build, keyboard and phone placement.');
}finally{await browser.close();}
