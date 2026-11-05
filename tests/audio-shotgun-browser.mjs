import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const url=process.env.GAME_URL || 'http://127.0.0.1:4177';
const out=process.env.GAME_OUTPUT || 'output/audio-shotgun';
await fs.mkdir(out,{recursive:true});
// Silence the OS output, while exercising the actual AudioContext/mixer graph.
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
const errors=[],failed=[],reports=[];
const read=page=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=(page,ms)=>page.evaluate(ms=>window.advanceTime(ms),ms);
async function tickUntil(page,predicate,max=120) {
 for(let i=0;i<max;i++){await advance(page,1000/60);await page.waitForTimeout(20);const state=await read(page);if(predicate(state))return state;}
 throw new Error('Timed out waiting for combat/audio event');
}
try {
 for(const key of ['handgun','assault_rifle','machine_pistol','magnum','shotgun','sniper']) {
   const context=await browser.newContext({viewport:{width:1440,height:1000}});
   await context.addInitScript(()=>{
     localStorage.setItem('aliens-tower-defense-profile',JSON.stringify({level:1,settings:{muted:false}}));
     const native=window.AudioContext||window.webkitAudioContext;
     if(native)native.prototype.createOscillator=()=>{throw new Error('Synthetic oscillator used instead of a recorded sample');};
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))failed.push(`${r.status()} ${r.url()}`);});
   await page.goto(url);assert.equal((await read(page)).audio.state,'locked');
   await page.click('#menu-play-button');
   await page.waitForFunction(()=>{const s=JSON.parse(window.render_game_to_text());return s.audio.loadedClips===s.audio.totalClips;});
   assert.equal((await read(page)).audio.totalClips,20);assert.equal((await read(page)).audio.errors,0);
   await page.click(`.weapon-card[data-weapon-key="${key}"] .weapon-select`);
   const s=await read(page),rect=await page.locator('#game-canvas').boundingBox(),pad=s.pads[0];
   await page.mouse.click(rect.x+(s.board.x+(pad.col+.5)*s.board.tile)/1280*rect.width,rect.y+(s.board.y+(pad.row+.5)*s.board.tile)/720*rect.height);
   await page.click('#launch-wave-button');
   const events=[];
   for(let n=0;n<5;n++) {
     const previous=(await read(page)).audio.played;
     const current=await tickUntil(page,state=>state.audio.played>previous);
     assert.equal(current.audio.lastShot.weapon,key);assert.equal(current.audio.lastShot.model,current.towers[0].blueprint);assert.ok(current.audio.activeVoices<=24);
     events.push(current.audio.lastShot);
   }
   assert.ok(new Set(events.map(e=>e.variant)).size>=2,`${key} must vary recorded samples`);
   for(let i=1;i<events.length;i++)if(events[i].sequence===events[i-1].sequence+1)assert.notEqual(events[i].variant,events[i-1].variant,`${key}: avoid immediate sample repeats`);
   assert.ok(new Set(events.map(e=>e.rate)).size>1,'pitch should vary subtly');
   assert.ok(events.every(e=>e.rate>=.975&&e.rate<=1.025));
   reports.push({weapon:key,events,loaded:(await read(page)).audio.loadedClips});
   if(key==='shotgun') {
     let volley;
     for(let i=0;i<240;i++){
       await advance(page,1000/60);const now=await read(page);
       if(now.projectiles.filter(p=>p.ballistic).length>=3){volley=now;break;}
     }
     assert.ok(volley,'shotgun fan must be visible in live gameplay');
     assert.ok(volley.projectiles.filter(p=>p.ballistic).every(p=>p.target===null));
     assert.ok(new Set(volley.projectiles.filter(p=>p.ballistic).map(p=>p.vy)).size>=3);
     await page.evaluate(()=>{ document.querySelector('#play-pause-button').click(); window.advanceTime(0); });
     await page.screenshot({path:`${out}/shotgun-fan.png`,fullPage:true});
     await fs.writeFile(`${out}/shotgun-state.json`,JSON.stringify(volley,null,2));
   }
   if(key==='handgun') {
     await page.click('#play-pause-button');let paused=await read(page);await page.waitForTimeout(80);await advance(page,3000);
     assert.equal((await read(page)).audio.played,paused.audio.played);assert.equal((await read(page)).audio.activeVoices,0);
     await page.click('#play-pause-button');await tickUntil(page,state=>state.audio.played>paused.audio.played);
     await page.click('#gear-button');await page.click('#sound-button');await page.click('#resume-button');
     const muted=(await read(page)).audio.played;await advance(page,1500);await page.waitForTimeout(80);
     assert.equal((await read(page)).audio.played,muted);assert.equal((await read(page)).audio.activeVoices,0);
     await page.click('#gear-button');await page.click('#sound-button');await page.click('#resume-button');await tickUntil(page,state=>state.audio.played>muted);
     await page.click('#gear-button');await page.click('#change-level-button');assert.equal((await read(page)).audio.paused,true);
     // Verify real decoded waveforms, including fast attack and a non-silent tail.
     const audioMetrics=await page.evaluate(async()=>{
       const {weaponAudio}=await import('./src/data/audio.js');const decoder=new OfflineAudioContext(1,44100,44100);const rows=[];
       for(const [weapon,config] of Object.entries(weaponAudio))for(const file of config.files){
         const buffer=await decoder.decodeAudioData(await (await fetch(file)).arrayBuffer());const data=buffer.getChannelData(0);
         let peak=0,energy=0;for(const v of data){peak=Math.max(peak,Math.abs(v));energy+=v*v;}
         rows.push({weapon,duration:buffer.duration,peak,rms:Math.sqrt(energy/data.length)});
       }return rows;
     });
     assert.equal(audioMetrics.length,20);assert.ok(audioMetrics.every(m=>m.peak>.02&&m.peak<1&&m.rms>.0001&&m.duration<2.5));
     await fs.writeFile(`${out}/audio-metrics.json`,JSON.stringify(audioMetrics,null,2));
   }
   await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 await fs.writeFile(`${out}/audio-variation.json`,JSON.stringify(reports,null,2));
 console.log('PASS: 20 recorded clips decode with signal, all 6 weapons play varied samples, no oscillators, pause/mute/menu silence, ballistic shotgun fan visible.');
} finally {await browser.close();}
