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
}
const path = (key,name,detail,multiplier=.75) => ({key,name,detail,multiplier});
const upgradePaths = {
  handgun: [path('power','Stopping power','+40% damage per rank'),path('tactical','Quickdraw','Faster fire, reload and a larger magazine',.65)],
  assault_rifle: [path('power','Heavy rounds','+32% damage · +2 armor penetration points per rank'),path('tactical','Extended magazine','More ammo, faster reload and sustained fire',.65)],
  machine_pistol: [path('power','Hot barrel','+35% damage per rank'),path('tactical','Suppression','Stronger slow and longer duration',.65)],
  magnum: [path('power','Devastator','+50% damage · stronger armor penetration'),path('tactical','Speed loader','Faster reload and follow-up shots',.65)],
  shotgun: [path('power','Buckshot','Pellets: 3 → 4 → 5 → 6'),path('tactical','Choke & pump','Tighter spread, longer reach, faster reload',.65)],
  sniper: [path('power','Anti-materiel','+50% damage per rank'),path('tactical','Long-range optics','+25% range per rank · faster follow-up',.65)],
  rocket_launcher: [path('power','High explosive','More blast damage and a larger radius'),path('tactical','Rapid loader','Faster rockets, reload and fire rate',.65)],
};
// Stable keys preserve old placed-tower saves/test clients; names and effects vary by gun.
export const towerUpgradePaths = upgradePaths.handgun;
export function towerUpgradePathsFor(key) { return upgradePaths[key] || upgradePaths.handgun; }
export function towerUpgradeCost(tower,key) {
  const p=towerUpgradePathsFor(tower.weapon.key).find(p=>p.key===key);
  return p?Math.round(tower.weapon.price*p.multiplier*(1+(tower.upgrades?.[key]||0)*.9)):Infinity;
}
export function applyTowerUpgrades(weapon,tower) {
  const p=tower.upgrades?.power||0,c=tower.upgrades?.tactical||0;
  const next={...weapon};
  const damagePerRank={handgun:.4,assault_rifle:.32,machine_pistol:.35,magnum:.5,shotgun:.12,sniper:.5,rocket_launcher:.35}[weapon.key] ?? .4;
  next.directDamage*=1+p*damagePerRank;
  if(weapon.key==='shotgun') { next.pelletCount=3+p;next.spread=weapon.spread*(1-c*.14);next.range*=1+c*.1;next.reloadSpeed*=1-c*.13;next.atkSpeed*=1+c*.1; }
  else if(weapon.key==='machine_pistol') {next.slowStrength=Number(Math.min(.65,.25+c*.10).toFixed(2));next.slow=Number((.7+c*.6).toFixed(1));next.atkSpeed*=1+c*.06;}
  else if(weapon.key==='sniper') {next.range*=1+c*.25;next.atkSpeed*=1+c*.08;}
  else if(weapon.key==='magnum') {next.armorPierce=Math.min(1,(weapon.armorPierce||0)+p*.08);next.reloadSpeed*=1-c*.2;next.atkSpeed*=1+c*.1;}
  else if(weapon.key==='assault_rifle') {next.armorPierce=Math.min(1,(weapon.armorPierce||0)+p*.02);next.capacity+=c*15;next.reloadSpeed*=1-c*.12;next.atkSpeed*=1+c*.1;}
  else if(weapon.key==='rocket_launcher') {next.splashRadius+=p*12;next.reloadSpeed*=1-c*.15;next.atkSpeed*=1+c*.12;next.projectileSpeed*=1+c*.2;}
  else {next.capacity+=c*3;next.atkSpeed*=1+c*.15;next.reloadSpeed*=1-c*.12;}
  next.directDamage=Math.round(next.directDamage*(tower.pad==='power'?1.15:1));
  next.range=Math.round(next.range*(tower.pad==='range'?1.18:1));
  next.atkSpeed=Number(next.atkSpeed.toFixed(2));next.reloadSpeed=Number(Math.max(.3,next.reloadSpeed).toFixed(2));
  return next;
}
export function upgradePreview(current,next,key) {
  if(current.key==='shotgun'&&key==='power')return `Pellets ${current.pelletCount} → ${next.pelletCount} · damage ${current.directDamage} → ${next.directDamage}`;
  if(current.key==='machine_pistol'&&key==='tactical')return `Slow ${Math.round((current.slowStrength||.25)*100)}% → ${Math.round(next.slowStrength*100)}% · ${current.slow}s → ${next.slow}s`;
  if(current.key==='sniper'&&key==='tactical')return `Range ${current.range} → ${next.range}`;
  if(current.key==='rocket_launcher'&&key==='power')return `Blast ${current.splashRadius} → ${next.splashRadius} · damage ${current.directDamage} → ${next.directDamage}`;
  if(key==='power')return `Damage ${current.directDamage.toLocaleString('en-US')} → ${next.directDamage.toLocaleString('en-US')}`;
  return `Rate ${current.atkSpeed} → ${next.atkSpeed}/s · reload ${current.reloadSpeed}s → ${next.reloadSpeed}s`;
}
