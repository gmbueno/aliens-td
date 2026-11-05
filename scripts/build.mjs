import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

async function filesIn(directory){
 const entries=await fs.readdir(directory,{withFileTypes:true});
 return (await Promise.all(entries.map(entry=>entry.isDirectory()?filesIn(path.join(directory,entry.name)):[path.join(directory,entry.name)]))).flat();
}
const {version}=JSON.parse(await fs.readFile('package.json','utf8'));
const sources=['index.html','styles.css',...await filesIn('src'),...await filesIn('assets')].sort();
const hash=createHash('sha256');
for(const file of sources){hash.update(file);hash.update(await fs.readFile(file));}
const release=`${version}-${hash.digest('hex').slice(0,12)}`;
const output=path.resolve('_site'),runtime=path.join(output,'releases',release);
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(runtime,{recursive:true});
for(const directory of ['src','assets'])await fs.cp(directory,path.join(runtime,directory),{recursive:true});
await fs.copyFile('styles.css',path.join(runtime,'styles.css'));
await fs.copyFile('favicon.ico',path.join(output,'favicon.ico'));
const html=(await fs.readFile('index.html','utf8')).replace('<head>',`<head>\n    <base href="./releases/${release}/" />\n    <meta name="game-release" content="${release}" />`);
await fs.writeFile(path.join(output,'index.html'),html);
await fs.writeFile(path.join(output,'.nojekyll'),'');
console.log(`Built ${release}: versioned runtime, persistent browser profile origin.`);
