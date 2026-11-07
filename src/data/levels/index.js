import level1 from "./level1.js";
import level2 from "./level2.js";
import level3 from "./level3.js";
import level4 from "./level4.js";
import level5 from "./level5.js";
import level6 from "./level6.js";
import level7 from "./level7.js";
import level8 from "./level8.js";
import level9 from "./level9.js";
import level10 from "./level10.js";
import level11 from "./level11.js";
import level12 from "./level12.js";
import level13 from "./level13.js";
import level14 from "./level14.js";
import level15 from "./level15.js";
import level16 from "./level16.js";
import level17 from "./level17.js";
import level18 from "./level18.js";

export const levels = [level1, level2, level3, level4, level5, level6, level7, level8, level9, level10, level11, level12, level13, level14, level15, level16, level17, level18];

// The opening teaches placement; later missions fund and demand a larger army.
for(const [index,level] of levels.entries()){
 level.startGold=Math.round(level.startGold*(index<3?1.6:4.2)/5)*5;
 level.threat*=index<3?1.08:1.2;
 level.waves=level.waves.map(w=>({...w,reward:Math.round(w.reward*(index<3?1.25:1.9)),spawns:w.spawns.flatMap((s,i)=>index>=3&&i%2===0?[{...s},{...s,at:s.at+.25}]:index<3&&i%6===5?[{...s},{...s,at:s.at+.3}]:[{...s}]).sort((a,b)=>a.at-b.at)}));
}

// Optional risk/reward positions appear after the training missions.
for(const [index,level] of levels.entries()){
 if(index>=3){
  const occupied=t=>[...level.track,...level.blockers,...level.pads,...(level.water||[])].some(p=>p.row===t.row&&p.col===t.col);
  const available=[];for(let row=1;row<level.rows-1;row++)for(let col=1;col<level.cols-1;col++){const t={row,col};if(!occupied(t))available.push(t);}
  level.blockers.push(...available.filter((_,i)=>i%13===4).slice(0,2).map(t=>({...t,kind:'infested',encounter:true,cost:0})));
 }
 if(index>=4)level.waves=level.waves.map((w,i)=>i%2===1?{...w,spawns:[...w.spawns,{enemy:'alien_flyer',at:3}].sort((a,b)=>a.at-b.at)}:w);
}
