import {inWeaponRange} from './targeting.js';
import {currentWave} from './endless.js';
export function setMissileAim(state,tower,x,y){
 if(!state.towers.includes(tower)||!tower.weapon.fixedAim||state.result||!Number.isFinite(x)||!Number.isFinite(y)||x<state.board.x||y<state.board.y||x>state.board.x+state.board.w||y>state.board.y+state.board.h||!inWeaponRange(tower,{x,y}))return false;
 tower.impactPoint={x,y};return true;
}
export function updateTacticalDefense(state,dt,damageEnemy,addEffect){
 state.pathMines ||= [];state.missileStrikes ||= [];
 for(const strike of state.missileStrikes){strike.timer-=dt;if(strike.timer<=0){for(const e of state.enemies)if(e.life>0&&Math.hypot(e.x-strike.x,e.y-strike.y)<=strike.radius)damageEnemy(e,strike.damage,.5,strike.source);addEffect(state,'explosion',strike.x,strike.y,strike.radius,.6);state.audio?.play('impact',strike.x);}}
 state.missileStrikes=state.missileStrikes.filter(s=>s.timer>0);
 for(const t of state.towers){const w=t.weapon;
  if(w.economic){
   if(t.incomeWave!==state.waveIndex){t.incomeWave=state.waveIndex;t.payouts=0;t.incomeTimer=0;}
   if(t.payouts<(w.payoutLimit||4)){t.incomeTimer+=dt;if(t.incomeTimer>=(w.incomeInterval||8)){t.incomeTimer-=w.incomeInterval||8;t.payouts++;const amount=w.income||15;state.gold+=amount;t.cashGenerated=(t.cashGenerated||0)+amount;t.cashFlash=.8;}}
   t.cashFlash=Math.max(0,(t.cashFlash||0)-dt);continue;
  }
  if(!w.fixedAim&&!w.minelayer&&!w.gas)continue;
  t.gasActive=false;t.cooldown=Math.max(0,t.cooldown-dt);
  if(t.reloadTimer>0){t.reloadTimer=Math.max(0,t.reloadTimer-dt);if(t.reloadTimer===0)t.ammo=w.capacity;continue;}
  if(t.ammo<=0){t.reloadTimer=w.reloadSpeed;continue;}
  if(t.cooldown>0)continue;
  if(w.fixedAim){
   const pending=state.spawnedInWave.size<(currentWave(state)?.spawns.length||0),threat=pending||state.enemies.some(e=>e.life>0);
   if(t.impactPoint&&threat){state.missileStrikes.push({...t.impactPoint,startX:t.x,startY:t.y,timer:1.1,duration:1.1,damage:w.directDamage,radius:w.splashRadius,source:{weaponKey:w.key,ownerId:t.id}});t.ammo--;t.cooldown=1/w.atkSpeed;state.audio?.play('rocket_launcher',t.x);}
  }else if(w.minelayer){
   const positions=state.path.filter(p=>inWeaponRange(t,p));
   if(positions.length&&state.pathMines.filter(m=>m.ownerId===t.id).length<(w.mineLimit||6)&&state.pathMines.length<120){
    const point=positions[(t.minesProduced||0)%Math.min(positions.length,3)];t.minesProduced=(t.minesProduced||0)+1;
    state.pathMines.push({x:point.x+((t.minesProduced%3)-1)*10,y:point.y,damage:w.directDamage,radius:w.splashRadius,ownerId:t.id});t.cooldown=1/w.atkSpeed;
   }
  }else{
   const targets=state.enemies.filter(e=>e.life>0&&!e.flying&&inWeaponRange(t,e));
   if(targets.length){for(const e of targets)damageEnemy(e,w.directDamage,.1,{weaponKey:w.key,ownerId:t.id});t.ammo--;t.cooldown=1/w.atkSpeed;t.gasActive=true;}
  }
 }
 for(const mine of state.pathMines){if(!state.enemies.some(e=>e.life>0&&!e.flying&&Math.hypot(e.x-mine.x,e.y-mine.y)<=24))continue;
  for(const e of state.enemies)if(e.life>0&&!e.flying&&Math.hypot(e.x-mine.x,e.y-mine.y)<=mine.radius)damageEnemy(e,mine.damage,.5,{weaponKey:'minelayer',ownerId:mine.ownerId});mine.spent=true;addEffect(state,'explosion',mine.x,mine.y,mine.radius,.4);state.audio?.play('impact',mine.x);
 }
 state.pathMines=state.pathMines.filter(m=>!m.spent);
}
export function drawTacticalDefense(ctx,state,world={}){
 for(const mine of state.pathMines||[]){if(world.mine)ctx.drawImage(world.mine,mine.x-12,mine.y-12,24,24);else{ctx.fillStyle='#d7c67c';ctx.fillRect(mine.x-5,mine.y-5,10,10);}}
 for(const s of state.missileStrikes||[]){ctx.save();ctx.strokeStyle='#e8bc63';ctx.setLineDash([7,4]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);const f=1-s.timer/s.duration,x=s.startX+(s.x-s.startX)*f,y=s.startY+(s.y-s.startY)*f-Math.sin(f*Math.PI)*140;ctx.fillStyle='#ffe7a4';ctx.beginPath();ctx.ellipse(x,y,5,14,Math.atan2(s.y-s.startY,s.x-s.startX),0,Math.PI*2);ctx.fill();ctx.restore();}
 for(const t of state.towers){if(t.gasActive||t.weapon.gas&&t.cooldown>0&&t.reloadTimer<=0){ctx.save();ctx.fillStyle='#a9c97922';ctx.strokeStyle='#b8cc7955';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,t.range,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6+state.visualTime*.7,r=(.4+((state.visualTime*.3+i*.15)%1)*.6)*t.range;ctx.fillStyle='#bacd8655';ctx.beginPath();ctx.arc(t.x+Math.cos(a)*r,t.y+Math.sin(a)*r,8,0,Math.PI*2);ctx.fill();}ctx.restore();}
  if(t.weapon.fixedAim&&t.impactPoint&&state.selectedTowerId===t.id){ctx.strokeStyle='#efc171';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.impactPoint.x,t.impactPoint.y,t.weapon.splashRadius,0,Math.PI*2);ctx.stroke();}
  if(t.cashFlash>0){ctx.fillStyle='#ffe39b';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(`+$${t.weapon.income||15}`,t.x,t.y-45);}
 }
}
