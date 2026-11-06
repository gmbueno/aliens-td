import { targetForTower } from './targeting.js';
import { skillRank } from '../data/skills.js';
export const PONTOON_COST=35;
const key=(r,c)=>`${r}:${c}`;
export function reservedTile(state,preferEnd=false){
 const rows=Array.from({length:state.level.rows},(_,i)=>preferEnd?state.level.rows-1-i:i);
 const cols=Array.from({length:state.level.cols},(_,i)=>preferEnd?state.level.cols-1-i:i);
 for(const row of rows)for(const col of cols){
  const k=key(row,col);
  if(state.tileSets.path.has(k)||state.tileSets.blockers.has(k)||state.tileSets.water.has(k)||state.level.pads.some(t=>t.row===row&&t.col===col))continue;
  return {row,col,x:state.board.x+(col+.5)*state.board.tile,y:state.board.y+(row+.5)*state.board.tile};
 }
 return null;
}
export function initializeSupport(state){
 const count=skillRank(state.profile,'mines')*2;
 state.mines=Array.from({length:count},(_,i)=>{
  const t=Math.max(0,state.path.length-4)+(i+.5)/count*2.5;
  const j=Math.min(state.path.length-2,Math.floor(t)),f=t-j,a=state.path[j],b=state.path[j+1];
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,spent:false};
 });
 const rank=skillRank(state.profile,'drone'),base=rank?reservedTile(state):null;
 state.drones=base?Array.from({length:1+Math.min(1,skillRank(state.profile,'extraDrone'))},(_,i)=>({id:`drone-${i}`,rank,base,x:base.x,y:base.y,time:i*8,cooldown:0,flash:0,lastTarget:null,kills:0,targeting:'first',upgrades:{power:0,tactical:0},invested:0})):[];
 state.drone=state.drones[0]||null;
 state.cache={...reservedTile(state,true),opened:Boolean(state.profile.caches[state.level.id]),claimed:Boolean(state.profile.caches[state.level.id]),wave:Math.ceil(state.level.waves.length/2)};
}
export function droneStats(drone){return {damage:Math.round((140+drone.rank*60)*(1+drone.upgrades.power*.6)),range:Math.round((130+drone.rank*20)*(1+drone.upgrades.tactical*.2)),interval:.5/(1+drone.upgrades.tactical*.2)};}
export function droneUpgradeCost(drone,key){return Math.round(90*(1+(drone.upgrades[key]||0)*.8));}
export function upgradeDrone(state,drone,key){
 if(!state.drones.includes(drone)||state.result||!['power','tactical'].includes(key)||drone.upgrades[key]>=3||drone.upgrades.power+drone.upgrades.tactical>=4)return false;
 const cost=droneUpgradeCost(drone,key);if(state.gold<cost)return false;
 state.gold-=cost;drone.invested+=cost;drone.upgrades[key]++;return true;
}
export function updateDrone(state,dt,damageEnemy){
 for(const drone of state.drones){
 drone.time+=dt;drone.flash=Math.max(0,drone.flash-dt);drone.cooldown=Math.max(0,drone.cooldown-dt);
 const span=state.path.length-1,phase=(drone.time*.9)%(span*2),t=phase<=span?phase:span*2-phase;
 const j=Math.min(state.path.length-2,Math.floor(t)),f=t-j,a=state.path[j],b=state.path[j+1];
 drone.x=a.x+(b.x-a.x)*f+Math.cos(drone.time*2)*28;drone.y=a.y+(b.y-a.y)*f-35;
 const stats=droneStats(drone),target=targetForTower({...drone,range:stats.range},state.enemies);
 if(target&&drone.cooldown<=0){damageEnemy(target,stats.damage,.15,{weaponKey:'drone',ownerId:drone.id});drone.cooldown=stats.interval;drone.lastTarget={x:target.x,y:target.y};drone.flash=.09;state.audio?.play('drone',drone.x);}
 }
}
export function triggerMines(state,enemy,damageEnemy,addEffect){
 for(const mine of state.mines){
  if(mine.spent||enemy.life<=0||Math.hypot(enemy.x-mine.x,enemy.y-mine.y)>24)continue;
  mine.spent=true;
  for(const target of state.enemies)if(target.life>0&&Math.hypot(target.x-mine.x,target.y-mine.y)<=48)damageEnemy(target,5500,.6,{weaponKey:'mines'});
  addEffect(state,'explosion',mine.x,mine.y,48,.6);state.audio?.play('impact',mine.x);
 }
}
export function drawSupport(ctx,state,world={}){
 for(const mine of state.mines){if(mine.spent)continue;ctx.save();ctx.translate(mine.x,mine.y);ctx.fillStyle='#596852';ctx.strokeStyle='#d8c38a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ecbc63';ctx.fillRect(-2,-2,4,4);ctx.restore();}
 const cache=state.cache;
 if(cache&&Number.isFinite(cache.x)){
  const image=world[cache.opened?'chest-open':'chest-closed'];
  if(image){ctx.save();ctx.translate(cache.x,cache.y);ctx.shadowColor='#0008';ctx.shadowBlur=8;ctx.shadowOffsetY=5;ctx.drawImage(image,-30,-30,60,60);ctx.shadowColor='transparent';ctx.fillStyle=cache.opened?'#acd7b7':'#f7db97';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(cache.opened?'✓ CLAIMED':`CACHE / W${cache.wave}`,0,34);ctx.restore();}
  else {ctx.save();ctx.translate(cache.x,cache.y);ctx.fillStyle=cache.opened?'#45504b':'#765b34';ctx.strokeStyle=cache.opened?'#839a89':'#e5c383';ctx.lineWidth=2;
  ctx.fillRect(-19,-10,38,27);ctx.strokeRect(-19,-10,38,27);ctx.fillRect(-21,cache.opened?-22:-17,42,10);ctx.strokeRect(-21,cache.opened?-22:-17,42,10);
  ctx.fillStyle='#dfc17f';ctx.fillRect(-3,-8,6,9);ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle=cache.opened?'#9cae9d':'#f3d899';ctx.fillText(cache.opened?'CLAIMED':`CACHE / W${cache.wave}`,0,31);ctx.restore();}
 }
 const drone=state.drone;if(!drone)return;
 ctx.save();ctx.translate(drone.base.x,drone.base.y);ctx.fillStyle='#203c46';ctx.strokeStyle='#76b9cc';ctx.lineWidth=2;ctx.fillRect(-23,-23,46,46);ctx.strokeRect(-23,-23,46,46);ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#b6d7d9';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('UAV',0,5);ctx.restore();
 for(const drone of state.drones){
 if(drone.flash&&drone.lastTarget){ctx.strokeStyle='#9ae7f5aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(drone.x,drone.y);ctx.lineTo(drone.lastTarget.x,drone.lastTarget.y);ctx.stroke();}
 ctx.save();ctx.translate(drone.x,drone.y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(7,35,20,8,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a8cbd1';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(15,11);ctx.moveTo(15,-11);ctx.lineTo(-15,11);ctx.stroke();ctx.fillStyle='#365966';ctx.strokeStyle='#b8d9dc';ctx.lineWidth=1;
 for(const x of [-15,15])for(const y of [-11,11]){ctx.beginPath();ctx.ellipse(x,y,12,4,drone.time*28,0,Math.PI*2);ctx.stroke();}
 ctx.fillRect(-7,-10,14,20);ctx.strokeRect(-7,-10,14,20);ctx.fillStyle='#9ce2ef';ctx.fillRect(-3,6,6,3);ctx.fillStyle='#deebd1';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(`UAV ${state.drones.indexOf(drone)+1} · ${drone.kills} ×`,0,-24);ctx.restore();
 }
}
