import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const {version}=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8'));
const url=process.env.GAME_URL||'http://127.0.0.1:4183';
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.GAME_BROWSER_EXECUTABLE?{executablePath:process.env.GAME_BROWSER_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.url().startsWith(url)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url);await page.click('#menu-play-button');await page.waitForLoadState('networkidle');
 assert.ok((await page.evaluate(()=>document.baseURI)).includes(`/releases/${version}-`));
 const state=JSON.parse(await page.evaluate(()=>window.render_game_to_text()));assert.deepEqual(state.classUnlocks,['handgun','assault_rifle']);
 assert.equal(await page.locator('.weapon-select:enabled').count(),2);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 assert.deepEqual(errors,[]);await fs.mkdir('output/frontier',{recursive:true});await page.screenshot({path:'output/frontier/build-smoke.png',fullPage:true});
 console.log('PASS: packaged release resolves modules, images, audio and CSS; fresh profile keeps two starter types.');
}finally{await browser.close();}
