import {inWeaponRange} from './targeting.js';
import {currentWave} from './endless.js';
import {weaponRangeCells} from './rangeGeometry.js';
export function producePathMines(state,dt){
 state.pathMines ||= [];
 for(const t of state.towers.filter(t=>t.weapon.minelayer)){
  t.cooldown=Math.max(0,t.cooldown-dt);
  const positions=state.path.filter(p=>inWeaponRange(t,p)),w=t.weapon;
  if(t.cooldown>0||!positions.length||state.pathMines.filter(m=>m.ownerId===t.id).length>=(w.mineLimit||6)||state.pathMines.length>=120)continue;
  const point=positions[(t.minesProduced||0)%positions.length];t.minesProduced=(t.minesProduced||0)+1;
  state.pathMines.push({x:point.x+((t.minesProduced%3)-1)*10,y:point.y,damage:w.directDamage,radius:w.splashRadius,ownerId:t.id});t.cooldown=1/w.atkSpeed;
 }
}
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
  if(!w.fixedAim&&!w.gas)continue;
  t.gasActive=false;t.cooldown=Math.max(0,t.cooldown-dt);
  if(t.reloadTimer>0){t.reloadTimer=Math.max(0,t.reloadTimer-dt);if(t.reloadTimer===0)t.ammo=w.capacity;continue;}
  if(t.ammo<=0){t.reloadTimer=w.reloadSpeed;continue;}
  if(t.cooldown>0)continue;
  if(w.fixedAim){
   const pending=state.spawnedInWave.size<(currentWave(state)?.spawns.length||0),threat=pending||state.enemies.some(e=>e.life>0);
   if(t.impactPoint&&threat){state.missileStrikes.push({...t.impactPoint,startX:t.x,startY:t.y,timer:1.1,duration:1.1,damage:w.directDamage,radius:w.splashRadius,source:{weaponKey:w.key,ownerId:t.id}});t.ammo--;t.cooldown=1/w.atkSpeed;state.audio?.play('rocket_launcher',t.x);}
  }else{
   const targets=state.enemies.filter(e=>e.life>0&&!e.flying&&inWeaponRange(t,e));
   if(targets.length){for(const e of targets)damageEnemy(e,w.directDamage,.1,{weaponKey:w.key,ownerId:t.id});t.ammo--;t.cooldown=1/w.atkSpeed;t.gasActive=true;t.gasVisual=.65;}
  }
 }
 for(const mine of state.pathMines){if(!state.enemies.some(e=>e.life>0&&!e.flying&&Math.hypot(e.x-mine.x,e.y-mine.y)<=24))continue;
  for(const e of state.enemies)if(e.life>0&&!e.flying&&Math.hypot(e.x-mine.x,e.y-mine.y)<=mine.radius)damageEnemy(e,mine.damage,.5,{weaponKey:'minelayer',ownerId:mine.ownerId});mine.spent=true;addEffect(state,'explosion',mine.x,mine.y,mine.radius,.4);state.audio?.play('impact',mine.x);
 }
 state.pathMines=state.pathMines.filter(m=>!m.spent);
}
export function drawTacticalDefense(ctx,state,world={}){
 for(const mine of state.pathMines||[]){if(world.mine)ctx.drawImage(world.mine,mine.x-12,mine.y-12,24,24);else{ctx.fillStyle='#d7c67c';ctx.fillRect(mine.x-5,mine.y-5,10,10);}}
 for(const s of state.missileStrikes||[]){ctx.save();ctx.strokeStyle='#e8bc6388';ctx.setLineDash([7,4]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);const f=1-s.timer/s.duration,x=s.startX+(s.x-s.startX)*f,y=s.startY+(s.y-s.startY)*f-Math.sin(f*Math.PI)*140;ctx.translate(x,y);ctx.rotate(Math.atan2(s.y-s.startY-Math.cos(f*Math.PI)*Math.PI*140,s.x-s.startX)+Math.PI/2);const trail=ctx.createLinearGradient(0,20,0,62);trail.addColorStop(0,'#ffd578aa');trail.addColorStop(1,'#bbc6b000');ctx.fillStyle=trail;ctx.beginPath();ctx.moveTo(-5,18);ctx.lineTo(0,66);ctx.lineTo(5,18);ctx.fill();if(world['missile-flight'])ctx.drawImage(world['missile-flight'],-13,-31,26,62);ctx.restore();}
 for(const t of state.towers){if(t.weapon.gas&&t.gasVisual>0){ctx.save();const tile=t.tile||77;ctx.beginPath();for(const c of weaponRangeCells(t))ctx.rect(t.x+(c.col-.5)*tile,t.y+(c.row-.5)*tile,tile,tile);ctx.clip();
  for(let i=0;i<8;i++){const a=i*2.399+state.visualTime*.15,r=t.range*(.18+(i%3)*.23),size=t.range*(.9+Math.sin(state.visualTime*.7+i)*.1),cloud=world[`gas-cloud-${['a','b','c'][i%3]}`];if(!cloud)continue;ctx.save();ctx.globalAlpha=.17*Math.min(1,t.gasVisual/.3);ctx.translate(t.x+Math.cos(a)*r,t.y+Math.sin(a)*r);ctx.rotate(a+state.visualTime*.05);ctx.drawImage(cloud,-size/2,-size/2,size,size);ctx.restore();}ctx.restore();}
  if(t.weapon.fixedAim&&t.impactPoint&&state.selectedTowerId===t.id){ctx.strokeStyle='#efc171';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.impactPoint.x,t.impactPoint.y,t.weapon.splashRadius,0,Math.PI*2);ctx.stroke();}
  if(t.cashFlash>0){ctx.fillStyle='#ffe39b';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(`+$${t.weapon.income||15}`,t.x,t.y-45);}
 }
}
