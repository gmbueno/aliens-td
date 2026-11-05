// A visual beam stays continuous between damage ticks; heat/fuel is consumed
// once per tick, and the normal reload state becomes cooling/refilling.
export function criticalShot(tower) {
  const id=Number(tower.id.split('-').at(-1))||0;
  let seed=Math.imul((tower.shotsFired||0)+1,2654435761)^Math.imul(id+1,2246822519);
  seed=Math.imul(seed^(seed>>>16),3266489917);
  return (seed>>>0)/4294967296 < (tower.weapon.critChance||0);
}
export function energyHit(state,tower,target,hit) {
  const weapon=tower.weapon,angle=Math.atan2(target.y-tower.y,target.x-tower.x);
  tower.angle=angle;
  const critical=criticalShot(tower),damage=weapon.directDamage*(critical?weapon.critDamage:1);
  const targets=weapon.continuous==='laser'?[target]:state.enemies.filter(enemy=>{
    const dx=enemy.x-tower.x-Math.cos(angle)*29,dy=enemy.y-tower.y-Math.sin(angle)*29;
    const d=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-angle;
    return enemy.life>0&&d<=tower.range-29&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<=weapon.cone;
  });
  for(const enemy of targets){
    hit(state,{damage:damage*(enemy.shield>0?(weapon.shieldBonus||1):1),armorPierce:weapon.armorPierce||0,
      incendiary:weapon.attachments.includes('incendiary'),cryo:weapon.attachments.includes('cryo'),
      stun:weapon.attachments.includes('concussive')&&tower.shotsFired%5===0,
      blast:weapon.attachments.includes('blast')},enemy);
    if(weapon.continuous==='flame'){
      enemy.burnTimer=Math.max(enemy.burnTimer||0,1.8);
      enemy.burnDamage=Math.max(enemy.burnDamage||0,weapon.burnDamage);
    }
    if(critical)enemy.criticalFlash=.16;
  }
  tower.lastCritical=critical;
}
export function drawEnergy(ctx,tower,time){
  if(!tower.beamEnd||tower.reloadTimer>0)return;
  const angle=tower.angle,muzzle={x:tower.x+Math.cos(angle)*29,y:tower.y+Math.sin(angle)*29};
  ctx.save();
  if(tower.weapon.continuous==='laser'){
    const end=tower.beamEnd;
    ctx.lineCap='round';ctx.shadowColor='#40ffe0';ctx.shadowBlur=12;
    for(const [width,color] of [[9,'#32e8cb33'],[4,'#5ef6de'],[1.5,'#f4ffed']]){
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(muzzle.x,muzzle.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    }
    ctx.fillStyle='#effff0';ctx.beginPath();ctx.arc(end.x,end.y,4+Math.sin(time*30)*1.5,0,Math.PI*2);ctx.fill();
  }else{
    ctx.translate(muzzle.x,muzzle.y);ctx.rotate(angle);
    const reach=tower.range-29,spread=tower.weapon.cone;
    const gradient=ctx.createRadialGradient(0,0,3,0,0,reach);
    gradient.addColorStop(0,'#fff6c1ee');gradient.addColorStop(.2,'#ffdd76dd');gradient.addColorStop(.65,'#ff682f88');gradient.addColorStop(1,'#e83e1500');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,reach,-spread,spread);ctx.closePath();ctx.fill();
    for(let i=0;i<10;i++){const f=((time*1.9+i*.127)%1),a=Math.sin(i*37)*spread*.8;
      ctx.fillStyle=i%2?'#ffb14aa0':'#ffef9dc0';ctx.beginPath();ctx.ellipse(Math.cos(a)*reach*f,Math.sin(a)*reach*f,3+f*7,2+f*3,a,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
