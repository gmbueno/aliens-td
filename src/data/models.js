// Fictional models inspired by distinct firing archetypes, not copied COD weapons.
const model = (name, mode, stats, description) => ({ name, mode, stats, description });
export const models = {
 laser: [
 model('Helios Beam','Continuous beam',{},'A sustained anti-shield beam. Overheats after five seconds; cools before firing again.'),
 model('Prism Lance','Continuous beam',{directDamage:440,range:290,capacity:32,reloadSpeed:2.5},'Longer reach with a shorter heat window.'),
 model('Ion Core','Continuous beam',{directDamage:580,range:220,capacity:48,reloadSpeed:3.4},'A heavy emitter: more damage and heat capacity.'),
 model('Aurora Array','Continuous beam',{directDamage:520,range:275,capacity:48,reloadSpeed:2.7},'An efficient long-range beam array.'),
 ],
 flamethrower: [
 model('Ember Jet','Flame cone',{},'Short range, wide flame cone and lingering burns. The fuel tank needs refilling.'),
 model('Cinder Sprayer','Flame cone',{range:145,directDamage:115,cone:.65,burnDamage:380},'Wider coverage and lighter direct damage.'),
 model('Inferno Torch','Flame cone',{range:115,directDamage:190,burnDamage:580,capacity:24,reloadSpeed:2.5},'A short, concentrated jet for heavy burns.'),
 model('Phoenix Rig','Flame cone',{range:145,directDamage:160,burnDamage:490,capacity:40,reloadSpeed:2.6},'Longer fuel capacity and controlled flames.'),
 ],
 handgun: [
  model('Service 9','Semi-auto',{},'Balanced service pistol. Fast, inexpensive coverage.'),
  model('Lynx Auto','Full-auto',{atkSpeed:10,directDamage:140,capacity:30,range:140,reloadSpeed:1.3},'A compact machine pistol: many light rounds at close range.'),
  model('Hammer .45','Semi-auto',{atkSpeed:1.8,directDamage:900,capacity:8,range:190,reloadSpeed:1.2},'Slower, heavy-caliber shots with longer reach.'),
  model('Sentinel 3R','3-round burst',{atkSpeed:1.8,directDamage:320,capacity:18,range:185,reloadSpeed:1.3,burstCount:3,burstGap:.075},'Three quick rounds, then a deliberate pause. Reliable burst damage.'),
 ],
 assault_rifle: [
  model('Patrol M4','Full-auto',{},'Balanced sustained fire.'),
  model('Viper 3R','3-round burst',{atkSpeed:3.3,directDamage:230,capacity:30,burstCount:3,burstGap:.08},'Controlled three-round bursts for concentrated damage.'),
  model('Bastion DMR','Semi-auto',{atkSpeed:2,directDamage:1000,capacity:12,range:285,armorPierce:.25,reloadSpeed:1.6},'Marksman conversion: heavy single shots, long reach, small magazine.'),
  model('Vanguard LMG','Full-auto',{atkSpeed:10,directDamage:240,capacity:45,range:220,reloadSpeed:1.8},'Heavy sustained fire with a large magazine.'),
 ],
 machine_pistol: [
  model('Vector S','Full-auto',{},'Fast suppressive rounds.'),
  model('Wasp 3R','3-round burst',{atkSpeed:5.5,directDamage:110,capacity:42,range:175,slow:.9,slowStrength:.28,burstCount:3,burstGap:.045},'Short bursts with better reach and sustained suppression.'),
  model('Lockdown PDW','Full-auto',{atkSpeed:8,directDamage:230,capacity:40,slow:1.2,slowStrength:.38},'Slower cadence, stronger and longer-lasting slow.'),
  model('Spectre SMG','Full-auto',{atkSpeed:18,directDamage:155,capacity:72,range:180,slow:1,slowStrength:.3},'High-volume suppression with a generous magazine.'),
 ],
 magnum: [
  model('Iron .357','Double-action',{},'Deliberate armor-piercing shots.'),
  model('Outlaw .38','Semi-auto',{atkSpeed:2.2,directDamage:1300,capacity:10,reloadSpeed:1.5},'Lighter rounds and faster follow-up shots.'),
  model('Anvil .50','Single-action',{atkSpeed:.7,directDamage:3700,capacity:5,range:225,armorPierce:.95},'Huge single hits with a slow recovery.'),
  model('Judgment 2R','2-round burst',{atkSpeed:1,directDamage:1600,capacity:8,range:210,reloadSpeed:1.8,burstCount:2,burstGap:.12},'Two heavy rounds per burst for armored targets.'),
 ],
 shotgun: [
  model('Breacher 12','Pump-action',{},'Three pellets per shell. Buckshot adds one pellet per rank.'),
  model('Scatter Auto','Full-auto',{atkSpeed:3.8,directDamage:420,capacity:12,range:125},'Fast shells with lighter pellets and short reach.'),
  model('Bulldog Twin','Double barrel',{atkSpeed:1,directDamage:750,pelletCount:4,capacity:4,range:175,reloadSpeed:1.4,spread:.1,burstCount:2,burstGap:.16},'Two four-pellet shells in quick succession, then reload.'),
  model('Tempest Drum','Full-auto',{atkSpeed:2.6,directDamage:420,pelletCount:5,capacity:10,range:165},'Five-pellet automatic shells with a drum magazine.'),
 ],
 sniper: [
  model('Ranger Bolt','Bolt-action',{},'Long-range armor-piercing precision.'),
  model('Longbow SLR','Semi-auto',{atkSpeed:2.2,directDamage:1900,capacity:12,range:300},'Lighter rounds, faster follow-up, more ammo.'),
  model('Deadeye AMR','Bolt-action',{atkSpeed:.65,directDamage:6500,capacity:4,range:430},'Extreme range and damage, slow to cycle.'),
  model('Horizon 2R','2-round burst',{atkSpeed:.8,directDamage:3000,capacity:8,range:380,burstCount:2,burstGap:.13},'Two precision shots in a controlled burst.'),
 ],
 rocket_launcher: [
  model('RPG-7','Single rocket',{},'Balanced homing rocket with blast damage.'),
  model('Javelin AT','Heavy rocket',{atkSpeed:.48,directDamage:5100,range:350,splashRadius:80},'Long-reaching heavy rockets with a slow launch cycle.'),
  model('Siegebreaker','Rapid rocket',{atkSpeed:.9,directDamage:2800,splashRadius:105},'Larger blast area with lighter, faster rockets.'),
  model('Atlas Twin','2-rocket salvo',{atkSpeed:.45,directDamage:3300,capacity:4,range:300,splashRadius:90,burstCount:2,burstGap:.22},'Two rockets per salvo. Punishes clustered aliens.'),
 ],
};
