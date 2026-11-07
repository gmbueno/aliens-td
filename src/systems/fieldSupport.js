import { targetForTower } from './targeting.js';
import { skillRank } from '../data/skills.js';
export const PONTOON_COST=35;
const key=(r,c)=>`${r}:${c}`;
export function reservedTile(state,preferEnd=false){
 const rows=Array.from({length:state.level.rows},(_,i)=>preferEnd?state.level.rows-1-i:i);
 const cols=Array.from({length:state.level.cols},(_,i)=>preferEnd?state.level.cols-1-i:i);
 for(const row of rows)for(const col of cols){
  const k=key(row,col);
  if(state.tileSets.path.has(k)||state.tileSets.blockers.has(k)||state.tileSets.water.has(k)||state.level.pads.some(t=>t.row===row&&t.col===col)||state.drones?.some(d=>d.base.row===row&&d.base.col===col))continue;
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
 const rank=skillRank(state.profile,'drone');state.drones=[];
 for(let i=0;i<(rank?1+Math.min(1,skillRank(state.profile,'extraDrone')):0);i++){
  const base=reservedTile(state);if(!base)break;
  state.drones.push({id:`drone-${i}`,rank,base,x:base.x,y:base.y,time:i*8,cooldown:0,flash:0,lastTarget:null,kills:0,targeting:'first',upgrades:{power:0,tactical:0},specialization:null,specialRank:0,invested:0});
 }
 state.drone=state.drones[0]||null;
}
export function droneStats(drone){return {damage:Math.round((280+drone.rank*120)*(1+drone.upgrades.power*.6)),range:160,interval:.5/(1+drone.upgrades.tactical*.2)};}
export function droneUpgradeCost(drone,key){if(['slow','burn'].includes(key))return 120+(drone.specialRank||0)*100;return Math.round(90*(1+(drone.upgrades[key]||0)*.8));}
export function upgradeDrone(state,drone,key){
 if(['slow','burn'].includes(key)){if(!state.drones.includes(drone)||state.result||(drone.specialization&&drone.specialization!==key)||(drone.specialRank||0)>=3)return false;const cost=droneUpgradeCost(drone,key);if(state.gold<cost)return false;state.gold-=cost;drone.invested+=cost;drone.specialization=key;drone.specialRank=(drone.specialRank||0)+1;return true;}
 if(!state.drones.includes(drone)||state.result||!['power','tactical'].includes(key)||drone.upgrades[key]>=3||drone.upgrades.power+drone.upgrades.tactical>=4)return false;
 const cost=droneUpgradeCost(drone,key);if(state.gold<cost)return false;
 state.gold-=cost;drone.invested+=cost;drone.upgrades[key]++;return true;
}
export function updateDrone(state,dt,damageEnemy){
 for(const drone of state.drones){
 drone.time+=dt;drone.flash=Math.max(0,drone.flash-dt);drone.cooldown=Math.max(0,drone.cooldown-dt);
 const stats=droneStats(drone),target=targetForTower({...drone,range:Infinity},state.enemies,state.focusEnemyId);
 drone.targetId=target?.id||null;
 const destination=target?{x:target.x+Math.cos(drone.time*1.2)*22,y:target.y-42}:{x:drone.base.x,y:drone.base.y-18};
 const dx=destination.x-drone.x,dy=destination.y-drone.y,distance=Math.hypot(dx,dy),travel=Math.min(distance,dt*240);
 if(distance>0){drone.x+=dx/distance*travel;drone.y+=dy/distance*travel;}
 if(target&&Math.hypot(target.x-drone.x,target.y-drone.y)<=stats.range&&drone.cooldown<=0){damageEnemy(target,stats.damage,.15,{weaponKey:'drone',ownerId:drone.id});if(drone.specialization==='slow'&&!target.immuneSlow){target.slowStrength=.25+drone.specialRank*.1;target.slowTimer=1.5+drone.specialRank*.5;}
 if(drone.specialization==='burn'){target.burnDamage=stats.damage*.35*drone.specialRank;target.burnTimer=2.5;target.burnSource={weaponKey:'drone',ownerId:drone.id};}
 drone.cooldown=stats.interval;drone.lastTarget={x:target.x,y:target.y};drone.flash=.09;state.audio?.play('drone',drone.x);}
 }
}
export function triggerMines(state,enemy,damageEnemy,addEffect){
 for(const mine of state.mines){
  if(mine.spent||enemy.flying||enemy.life<=0||Math.hypot(enemy.x-mine.x,enemy.y-mine.y)>24)continue;
  mine.spent=true;
  for(const target of state.enemies)if(target.life>0&&!target.flying&&Math.hypot(target.x-mine.x,target.y-mine.y)<=48)damageEnemy(target,5500,.6,{weaponKey:'mines'});
  addEffect(state,'explosion',mine.x,mine.y,48,.6);state.audio?.play('impact',mine.x);
 }
}
export function drawSupport(ctx,state,world={}){
 for(const mine of state.mines){if(mine.spent)continue;ctx.save();ctx.translate(mine.x,mine.y);ctx.fillStyle='#596852';ctx.strokeStyle='#d8c38a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ecbc63';ctx.fillRect(-2,-2,4,4);ctx.restore();}
 if(!state.drone)return;
 for(const drone of state.drones){
 if(world.uavBase){ctx.drawImage(world.uavBase,drone.base.x-34,drone.base.y-34,68,68);}else {ctx.save();ctx.translate(drone.base.x,drone.base.y);ctx.fillStyle='#203c46';ctx.strokeStyle='#76b9cc';ctx.lineWidth=2;ctx.fillRect(-23,-23,46,46);ctx.strokeRect(-23,-23,46,46);ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#b6d7d9';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('UAV',0,5);ctx.restore();}}
 for(const drone of state.drones){
 if(drone.flash&&drone.lastTarget){ctx.strokeStyle='#9ae7f5aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(drone.x,drone.y);ctx.lineTo(drone.lastTarget.x,drone.lastTarget.y);ctx.stroke();}
 ctx.save();ctx.translate(drone.x,drone.y);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(7,35,20,8,0,0,Math.PI*2);ctx.fill();if(world.drone){ctx.drawImage(world.drone,-28,-28,56,56);}else {ctx.strokeStyle='#a8cbd1';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(15,11);ctx.moveTo(15,-11);ctx.lineTo(-15,11);ctx.stroke();ctx.fillStyle='#365966';ctx.strokeStyle='#b8d9dc';ctx.lineWidth=1;
 for(const x of [-15,15])for(const y of [-11,11]){ctx.beginPath();ctx.ellipse(x,y,12,4,drone.time*28,0,Math.PI*2);ctx.stroke();}
 ctx.fillRect(-7,-10,14,20);ctx.strokeRect(-7,-10,14,20);ctx.fillStyle='#9ce2ef';ctx.fillRect(-3,6,6,3);}ctx.fillStyle='#deebd1';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(`UAV ${state.drones.indexOf(drone)+1} · ${drone.kills} ×`,0,-24);ctx.restore();
 }
}
