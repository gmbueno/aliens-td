import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
export async function harness(folder){
 const url=process.env.GAME_URL||'http://127.0.0.1:4182',out=process.env.GAME_OUTPUT||`output/${folder}`;await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})}),errors=[];
 async function pageFor(profile={},viewport={width:1440,height:1000},contextOptions={}){
  const context=await browser.newContext({viewport,...contextOptions});await context.addInitScript(p=>{if(!localStorage.getItem('aliens-tower-defense-profile'))localStorage.setItem('aliens-tower-defense-profile',JSON.stringify(p));},{schemaVersion:6,settings:{muted:true},...profile});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await p.goto(url);await p.waitForFunction(()=>typeof window.render_game_to_text==='function');return p;
 }
 const shot=async(p,name)=>{assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflow');await p.screenshot({path:`${out}/${name}.png`,fullPage:true});};
 return {browser,pageFor,shot,errors,finish:()=>assert.deepEqual(errors,[])};
}
export const read=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
export const advance=(p,ms)=>p.evaluate(ms=>window.advanceTime(ms),ms);
export async function tile(p,row,col,hold=0){const s=await read(p),r=await p.locator('#game-canvas').boundingBox(),x=r.x+(s.board.x+(col+.5)*s.board.tile)/1280*r.width,y=r.y+(s.board.y+(row+.5)*s.board.tile)/720*r.height;await p.mouse.move(x,y);if(hold){await p.mouse.down();await p.waitForTimeout(hold);await p.mouse.up();}else await p.mouse.click(x,y);}
export async function research(p,key){await p.click(`[data-select-skill="${key}"]`);await p.click(`[data-skill-key="${key}"]`);}
export async function branch(p,key){await p.click(`[data-skill-branch="${key}"]`);}

export async function autoStart(p){
 const s=await read(p);if(s.paused)await p.click('#play-pause-button');
 if(s.phase==='prepare')await advance(p,(s.waveDelay+.02)*1000/s.gameSpeed);
}
