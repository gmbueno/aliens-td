import { skillRank, skillTree } from '../data/skills.js';
import { applyArsenal } from '../data/arsenal.js';

export function applySkillBonuses(weapon, profile) {
  const next = applyArsenal(weapon, profile);
  for (const skill of skillTree) {
    const rank = skillRank(profile,skill.key);
    if (!rank || !skill.weaponEffect) continue;
    const effect=skill.weaponEffect;
    const scaled=Math.max(effect.min ?? -Infinity,next[effect.stat]*(1+effect.perRank*rank));
    next[effect.stat]=effect.decimals === undefined ? Math.round(scaled) : Number(scaled.toFixed(effect.decimals));
  }
  return next;
}
export function effectiveWeaponByKey(weapons,key,profile) { const w=weapons.find(w=>w.key===key);return w?applySkillBonuses(w,profile):null; }
export function refreshTowerSkillBonuses(towers,weapons,profile) {
  towers.forEach(t=>{
    const w=effectiveWeaponByKey(weapons,t.weapon.key,profile);if(!w)return;
    t.weapon=applyTowerUpgrades(w,t);t.range=t.weapon.range;t.ammo=Math.min(t.ammo,t.weapon.capacity);
  });
  applySupportBuffs(towers);
}
export function applySupportBuffs(towers){
 for(const tower of towers){
  if(tower.weapon.support)continue;
  const nearby=towers.filter(b=>b.weapon.support&&Math.hypot(b.x-tower.x,b.y-tower.y)<=b.range);
  const damage=Math.max(0,...nearby.map(b=>(b.upgrades.power||0)*.15)),boost=Math.max(0,...nearby.map(b=>.1+(b.upgrades.tactical||0)*.04));
  tower.aura={damage,boost};tower.weapon.directDamage=Math.round(tower.weapon.directDamage*(1+damage));tower.weapon.atkSpeed=Number((tower.weapon.atkSpeed*(1+boost)).toFixed(2));tower.range=tower.weapon.range=Math.round(tower.weapon.range*(1+boost));
 }
}
const path = (key,name,detail,multiplier=.75) => ({key,name,detail,multiplier});
const upgradePaths = {
 factory:[path('power','High-yield Press','+$12 per payout per rank'),path('tactical','Automation','Faster payouts and one additional payout per wave per rank',.65)],
 missile:[path('power','Heavy Payload','More damage and wider explosions'),path('tactical','Rapid Launch','Faster launches and reloads',.65)],
 minelayer:[path('power','Shaped Charges','More mine damage and larger blasts'),path('tactical','Assembly Line','More active mines and faster production',.65)],
 gas:[path('power','Toxic Compound','More damage per tick'),path('tactical','Pressure System','Wider coverage and faster refill',.65)],
  beacon:[path('power','Fire Control','+15% damage for nearby weapons per rank'),path('tactical','Signal Amplifier','Larger aura; +4% range and fire-rate bonus per rank',.65)],
 laser:[path('power','Focused prism','+30% beam damage · stronger critical hits'),path('tactical','Cryo cooling','Longer heat window, faster cooling and more range',.65)],
 flamethrower:[path('power','Incinerator','Stronger direct damage and lingering burns'),path('tactical','Fuel & nozzle','More fuel, faster refill and a wider cone',.65)],
  handgun: [path('power','Stopping power','+40% damage · +3% critical chance per rank'),path('tactical','Quickdraw','Faster fire, reload and a larger magazine',.65)],
  assault_rifle: [path('power','Heavy rounds','+32% damage · +2 armor penetration points per rank'),path('tactical','Extended magazine','More ammo, faster reload and sustained fire',.65)],
  machine_pistol: [path('power','Hot barrel','+35% damage per rank'),path('tactical','Suppression','Stronger slow and longer duration',.65)],
  magnum: [path('power','Devastator','+50% damage · +25% critical damage per rank'),{...path('tactical','Penetrator','Pierce 1 → 2 → 3 aliens; the final hit deals 50% damage',.65),maxRank:2}],
  shotgun: [path('power','Buckshot','+1 pellet per shell per rank · +12% pellet damage'),path('tactical','Choke & pump','Tighter spread, longer reach, faster reload',.65)],
  sniper: [path('power','Anti-materiel','+50% damage · +5% critical chance per rank'),path('tactical','Long-range optics','+25% range per rank · faster follow-up',.65)],
  rocket_launcher: [path('power','High explosive','More blast damage and a larger radius'),path('tactical','Rapid loader','Faster rockets, reload and fire rate',.65)],
};
// Stable keys preserve old placed-tower saves/test clients; names and effects vary by gun.
export const towerUpgradePaths = upgradePaths.handgun;
export function towerUpgradePathsFor(key) { return upgradePaths[key] || upgradePaths.handgun; }
export function towerUpgradeCost(tower,key) {
  const p=towerUpgradePathsFor(tower.weapon.key).find(p=>p.key===key);
  return p?Math.round(tower.weapon.price*p.multiplier*.54*(1+(tower.upgrades?.[key]||0)*.9)):Infinity;
}
export function applyTowerUpgrades(weapon,tower) {
  const p=tower.upgrades?.power||0,c=tower.upgrades?.tactical||0;
  const next={...weapon};
  if(weapon.support)next.auraDamage=p*.15;
  const damagePerRank={handgun:.4,assault_rifle:.32,machine_pistol:.35,magnum:.5,shotgun:.12,sniper:.5,rocket_launcher:.35,laser:.3,flamethrower:.3}[weapon.key] ?? .4;
  next.directDamage*=1+p*damagePerRank;
  next.critChance=Math.min(.5,(weapon.critChance||0)+p*(weapon.key==='sniper'?.05:weapon.key==='handgun'?.03:0));
  next.critDamage=(weapon.critDamage||1.6)+p*(['magnum','laser'].includes(weapon.key)?.25:0);
  if(weapon.economic){next.income=15+p*12;next.incomeInterval=8-c*1.2;next.payoutLimit=4+c;}
  else if(weapon.fixedAim){next.splashRadius+=p*12;next.reloadSpeed*=1-c*.15;next.atkSpeed*=1+c*.2;}
  else if(weapon.minelayer){next.splashRadius+=p*8;next.mineLimit=6+c*2;next.atkSpeed*=1+c*.3;}
  else if(weapon.gas){next.range*=1+c*.14;next.reloadSpeed*=1-c*.18;}
  else if(weapon.support)next.range*=1+c*.18;
  else if(weapon.key==='laser') {next.capacity+=c*12;next.reloadSpeed*=1-c*.15;next.range*=1+c*.08;}
  else if(weapon.key==='flamethrower') {next.burnDamage*=1+p*.35;next.capacity+=c*8;next.reloadSpeed*=1-c*.14;next.cone+=c*.1;next.range*=1+c*.06;}
  else if(weapon.key==='shotgun') { next.pelletCount=weapon.pelletCount+p;next.spread=weapon.spread*(1-c*.14);next.range*=1+c*.1;next.reloadSpeed*=1-c*.13;next.atkSpeed*=1+c*.1; }
  else if(weapon.key==='machine_pistol') {next.slowStrength=Number(Math.min(.65,(weapon.slowStrength||.25)+c*.10).toFixed(2));next.slow=Number(((weapon.slow||.7)+c*.6).toFixed(1));next.atkSpeed*=1+c*.06;}
  else if(weapon.key==='sniper') {next.range*=1+c*.25;next.atkSpeed*=1+c*.08;}
  else if(weapon.key==='magnum') {next.armorPierce=Math.min(1,(weapon.armorPierce||0)+p*.08);next.pierce=Math.min(3,1+c);next.reloadSpeed*=1-c*.1;next.atkSpeed*=1+c*.06;}
  else if(weapon.key==='assault_rifle') {next.armorPierce=Math.min(1,(weapon.armorPierce||0)+p*.02);next.capacity+=c*15;next.reloadSpeed*=1-c*.12;next.atkSpeed*=1+c*.1;}
  else if(weapon.key==='rocket_launcher') {next.splashRadius+=p*12;next.reloadSpeed*=1-c*.15;next.atkSpeed*=1+c*.12;next.projectileSpeed*=1+c*.2;}
  else {next.capacity+=c*3;next.atkSpeed*=1+c*.15;next.reloadSpeed*=1-c*.12;}
  next.directDamage=Math.round(next.directDamage*(tower.pad==='power'?1.15:1));
  next.range=Math.round(next.range*(tower.pad==='range'?1.18:1));
  next.atkSpeed=Number(next.atkSpeed.toFixed(2));next.reloadSpeed=Number(Math.max(.3,next.reloadSpeed).toFixed(2));
  return next;
}
export function upgradePreview(current,next,key) {
  if(current.economic)return key==='power'?`Payout $${current.income} → $${next.income}`:`Cycle ${current.incomeInterval.toFixed(1)}s → ${next.incomeInterval.toFixed(1)}s · cap ${current.payoutLimit} → ${next.payoutLimit}`;
  if(current.minelayer&&key==='tactical')return `Active mines ${current.mineLimit} → ${next.mineLimit} · faster production`;
  if(current.gas&&key==='tactical')return `Radius ${current.range} → ${next.range} · refill ${current.reloadSpeed}s → ${next.reloadSpeed}s`;
  if(current.support)return key==='power'?`Aura damage +${Math.round((current.auraDamage||0)*100)}% → +${Math.round((next.auraDamage||0)*100)}%`:`Radius ${current.range} → ${next.range} · stronger range / rate boost`;
  if(current.key==='magnum'&&key==='tactical')return `Pierce ${current.pierce} → ${next.pierce} · ${next.pierce+1} hits, last at 50%`;
  if(current.key==='shotgun'&&key==='power')return `Pellets ${current.pelletCount} → ${next.pelletCount} · damage ${current.directDamage} → ${next.directDamage}`;
  if(current.key==='machine_pistol'&&key==='tactical')return `Slow ${Math.round((current.slowStrength||.25)*100)}% → ${Math.round(next.slowStrength*100)}% · ${current.slow}s → ${next.slow}s`;
  if(current.key==='sniper'&&key==='tactical')return `Range ${current.range} → ${next.range}`;
  if(current.key==='rocket_launcher'&&key==='power')return `Blast ${current.splashRadius} → ${next.splashRadius} · damage ${current.directDamage} → ${next.directDamage}`;
  if(current.key==='laser'&&key==='tactical')return `Beam ${(current.capacity/current.atkSpeed).toFixed(1)}s → ${(next.capacity/next.atkSpeed).toFixed(1)}s · cooling ${current.reloadSpeed}s → ${next.reloadSpeed}s`;
  if(current.key==='flamethrower'&&key==='tactical')return `Fuel ${current.capacity} → ${next.capacity} · refill ${current.reloadSpeed}s → ${next.reloadSpeed}s`;
  if(key==='power'&&current.critChance!==next.critChance)return `Damage ${current.directDamage} → ${next.directDamage} · crit ${Math.round(current.critChance*100)}% → ${Math.round(next.critChance*100)}%`;
  if(key==='power'&&current.critDamage!==next.critDamage)return `Damage ${current.directDamage} → ${next.directDamage} · crit ×${current.critDamage.toFixed(2)} → ×${next.critDamage.toFixed(2)}`;
  if(key==='power')return `Damage ${current.directDamage.toLocaleString('en-US')} → ${next.directDamage.toLocaleString('en-US')}`;
  return `Rate ${current.atkSpeed} → ${next.atkSpeed}/s · reload ${current.reloadSpeed}s → ${next.reloadSpeed}s`;
}
