import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.GAME_URL || 'http://127.0.0.1:4181';
const out = process.env.GAME_OUTPUT || 'output/hud';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true, args:['--mute-audio'],
  ...(process.env.GAME_BROWSER_EXECUTABLE ? {executablePath:process.env.GAME_BROWSER_EXECUTABLE} : {})});
const errors = [];
const read = page => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (page, ms) => page.evaluate(ms => window.advanceTime(ms), ms);

async function pageFor(viewport, fixture=false) {
  const context = await browser.newContext({viewport});
  await context.addInitScript(() => localStorage.setItem('aliens-tower-defense-profile',
    JSON.stringify({schemaVersion:4, level:5, xp:45, settings:{muted:true}})));
  if (fixture) await context.route('**/src/data/levels/index.js', route => route.fulfill({
    contentType:'application/javascript',
    body:`import l from './level1.js';export const levels=[{...l,lives:3,startGold:9876,track:l.track.slice(0,3),waves:[{name:'Integrity test',healthScale:1,reward:0,spawns:[{enemy:'alien_normal',at:0},{enemy:'alien_normal',at:1}]},{name:'Reserve',healthScale:1,reward:0,spawns:[{enemy:'alien_normal',at:0}]}]}];`,
  }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  page.on('response', response => {if(response.url().startsWith(url) && response.status()>=400) errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(url);
  await page.click('#menu-play-button');
  await page.locator('.hud-symbol').last().evaluate(img => img.decode());
  return page;
}

async function verifyCounters(page) {
  const state = await read(page);
  assert.equal(await page.locator('#lives-value').innerText(), String(Math.max(0,state.lives)));
  assert.equal(await page.locator('#gold-value').innerText(), String(state.gold));
  assert.equal(await page.locator('#mission-value').innerText(), state.mission);
  for (const [selector, value] of [['#wave-value',state.wave],['#kills-value',state.kills]]) {
    assert.equal((await page.locator(selector).innerText()).replace(/\s/g,''), value);
  }
  assert.equal(await page.locator('#hud-skill-points').innerText(), `${state.player.skillPoints} SP`);
  const bounds = await page.locator('.hud-top').evaluate(hud => {
    const problems = [];
    for(const el of hud.querySelectorAll('.hud-chip, .hud-readout, .hud-controls')) {
      if(el.scrollWidth>el.clientWidth+1) problems.push(`${el.className}: ${el.scrollWidth}/${el.clientWidth}`);
    }
    for(const el of hud.querySelectorAll('.readout-label, .hud-readout strong, .hud-sp')) {
      const r=el.getBoundingClientRect(),p=el.closest('.hud-chip').getBoundingClientRect();
      if(r.right>p.right-2 || r.left<p.left+2) problems.push(`clipped ${el.textContent}`);
    }
    if(hud.getBoundingClientRect().right>innerWidth+1 || document.documentElement.scrollWidth>innerWidth+1) problems.push('page overflow');
    return problems;
  });
  assert.deepEqual(bounds, [], `HUD overflow at ${page.viewportSize().width}px`);
}

try {
  for (const viewport of [{width:320,height:844},{width:390,height:844},{width:768,height:1024},
    {width:667,height:375},{width:844,height:390},{width:960,height:720},{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]) {
    const page = await pageFor(viewport);
    await verifyCounters(page);
    const sprites = await page.locator('.hud-top img').evaluateAll(images => images.map(img => {
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
      const data=ctx.getImageData(0,0,64,64).data;
      return {loaded:img.complete&&img.naturalWidth===64&&img.naturalHeight===64,
        alpha:data.some((v,i)=>i%4===3&&v===0), opaque:data.some((v,i)=>i%4===3&&v===255)};
    }));
    assert.equal(sprites.length,7);
    assert.ok(sprites.every(s=>s.loaded&&s.alpha&&s.opaque), 'Native-alpha sprites must load');
    await page.getByRole('button',{name:/Game speed 1x/}).click();
    assert.equal((await read(page)).gameSpeed,2);
    await page.getByRole('button',{name:'Pause',exact:true}).click();
    assert.equal((await read(page)).paused,true);
    assert.deepEqual(await page.locator('#play-pause-button').evaluate(button => ({
      visibleSymbols:[...button.querySelectorAll('svg')].filter(svg=>getComputedStyle(svg).display!=='none').length,
      legacySymbol:getComputedStyle(button,'::before').content,
    })), {visibleSymbols:1,legacySymbol:'none'}, 'Resume displays a single play symbol');
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:/Open skill tree. Commander/}).click();
    assert.equal((await read(page)).skillTreeOpen,true);
    await page.click('#skill-tree-close-button');
    assert.equal((await read(page)).paused,false);
    await page.getByRole('button',{name:'Menu',exact:true}).click();
    await page.click('#resume-button');
    assert.equal((await read(page)).paused,false);
    await page.screenshot({path:`${out}/hud-${viewport.width}x${viewport.height}.png`,fullPage:true});
    if(viewport.width===1024) {
      const ability=await page.locator('.ability-bar').boundingBox(),weapons=await page.locator('.weapon-bar').boundingBox();
      assert.ok(weapons.y>=ability.y+ability.height || weapons.x>=ability.x+ability.width,'Armory cannot overlap special');
      assert.ok(weapons.y+weapons.height<=viewport.height,'Notebook armory stays in view');
    }
    await page.context().close();
  }
  const page=await pageFor({width:1280,height:720});
  const state=await read(page),pad=state.pads[0],rect=await page.locator('#game-canvas').boundingBox();
  await page.click('[data-weapon-key="handgun"] .weapon-select');
  await page.mouse.click(rect.x+(state.board.x+(pad.col+.5)*state.board.tile)*rect.width/1280,
    rect.y+(state.board.y+(pad.row+.5)*state.board.tile)*rect.height/720);
  await verifyCounters(page);
  assert.equal((await read(page)).gold,state.gold-70);
  await page.click('#launch-wave-button');
  assert.equal(await page.locator('#hud-wave-track .current').count(),1);
  const speed=await page.locator('#speed-toggle-button').elementHandle();
  const box=await speed.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await advance(page,1500);await page.mouse.up();
  assert.equal((await read(page)).gameSpeed,2,'Held click survives HUD updates');
  assert.ok(await speed.evaluate(el=>el===document.getElementById('speed-toggle-button')));
  for(let i=0;i<8;i++) await advance(page,1500);
  assert.ok(Number((await read(page)).kills.split('/')[0])>0);
  await verifyCounters(page);
  await page.click('#play-pause-button');
  await page.screenshot({path:`${out}/hud-combat.png`,fullPage:true});
  await page.context().close();

  const damaged=await pageFor({width:320,height:844},true);
  await verifyCounters(damaged);
  await damaged.click('#launch-wave-button');
  for(let i=0;i<20&&(await read(damaged)).lives>1;i++) await advance(damaged,1000);
  assert.equal((await read(damaged)).lives,1);
  assert.equal(await damaged.locator('.lives-chip.critical').count(),1);
  assert.equal(await damaged.locator('#hud-wave-track .complete').count(),1);
  assert.equal(await damaged.locator('#hud-wave-track .current').count(),0);
  await verifyCounters(damaged);
  await damaged.screenshot({path:`${out}/hud-critical.png`,fullPage:true});
  await damaged.context().close();
  assert.deepEqual(errors,[]);
  console.log('PASS: HUD counters match gameplay, alpha sprites, 9 viewport sizes, no clipped labels, responsive armory, accessible controls, held clicks, kills/credits updates, wave segments and critical integrity.');
} finally {await browser.close();}
