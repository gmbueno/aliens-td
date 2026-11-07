import {setMissileAim,updateTacticalDefense,drawTacticalDefense} from './systems/tacticalDefense.js';
import {currentWave,endlessWave,beginFreeplay} from './systems/endless.js';
import { targetForTower, targetModes, targetingUnlocked, enemySpeed } from './systems/targeting.js';
export { targetForTower } from './systems/targeting.js';
import {criticalShot,energyHit,drawEnergy} from './systems/energyWeapons.js';
import { PONTOON_COST, initializeSupport, updateDrone, triggerMines, drawSupport, droneStats, droneUpgradeCost, upgradeDrone } from './systems/fieldSupport.js';
import { createWeaponAudio } from "./systems/weaponAudio.js";
import { enemies, getEnemy } from "./data/enemies.js";
import { equippedWeapons, classUnlocked, classRequirement, nextClassUnlock, campaignClears, equipCategory, weaponArt, loadoutCapacity, loadoutKeys, placementLimit, SLOT_REWARD_LEVELS } from "./data/arsenal.js";
import { renderArsenal, nextArsenalUnlock } from "./ui/arsenalView.js";
import { weapons } from "./data/weapons.js";
import { xpNeeded } from "./data/player.js";
import { equippedPowerKeys, equipPower, activeAbilities, activeAbilityStats, buySkill, isActiveAbilityKey, activeUnlocked, skillRank, skillTree } from "./data/skills.js";
import { assets as assetPaths } from "./data/assets.js";
import { addXp, loadProfile, saveProfile, recordVictory, resetSkills } from "./systems/profile.js";
import { applyTowerUpgrades, towerUpgradeCost, towerUpgradePaths, towerUpgradePathsFor, upgradePreview, applySkillBonuses, effectiveWeaponByKey as findEffectiveWeaponByKey, refreshTowerSkillBonuses as refreshTowersWithSkills } from "./systems/weaponStats.js";
import { equipActiveKeyFromEvent, renderSkillTree, skillKeyFromEvent } from "./ui/skillTreeView.js";

const TWO_PI = Math.PI * 2;
const BOARD_PAD = 12;
const NEXT_WAVE_DELAY = 6;

const ASSET_CACHE_BUSTER = "frontier-20261105";

function assetUrl(src) {
  return `${src}?v=${ASSET_CACHE_BUSTER}`;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = assetUrl(src);
  });
}

function createAssetStore() {
  const store = {
    tile: null,
    path: null,
    placedBase: null,
    placedWeapons: {},
    enemies: {},
    towers: {},
    world: {},
    loaded: false,
  };
  Promise.all([
    ...['range-pad','power-pad','exit-mine'].map(key=>loadImage(`assets/pads/${key}.png`).then(image=>store.world[key]=image)),
    ...['mine','infested'].map(key=>loadImage(`assets/tactics/${key}.png`).then(image=>store.world[key]=image)),
    ...['drone','uavBase'].map(key=>loadImage(`assets/command/${key}.png`).then(image=>store.world[key]=image)),
    ...['rock','ice','growth','cargo','barrels','water'].map(key=>loadImage(`assets/frontier/world/${key}.png`).then(image=>store.world[key]=image)),
    loadImage(assetPaths.board.tile).then((image) => {
      store.tile = image;
    }),
    loadImage(assetPaths.board.path).then((image) => {
      store.path = image;
    }),
    loadImage(assetPaths.placedTowers.base).then((image) => {
      store.placedBase = image;
    }),
    ...weapons.map((weapon) => loadImage(weapon.asset).then((image) => {
      store.towers[weapon.key] = image;
    })),
    ...weapons.map(weapon=>loadImage(weaponArt(weapon.key)).then(image=>store.placedWeapons[weapon.key]=image)),
    ...Object.values(enemies).map((enemy) => loadImage(enemy.asset).then((image) => {
      store.enemies[enemy.key] = image;
    })),
  ]).then(() => {
    store.loaded = true;
  });
  return store;
}

function cssUrl(src) {
  // CSS variables are consumed by stylesheets in src/ui as well as the root.
  return `url('${new URL(assetUrl(src), document.baseURI).href}')`;
}

function applyAssetCssVariables(root) {
  const vars = {
    "--hud-lives-plaque": assetPaths.hud.livesPlaque,
    "--hud-gold-plaque": assetPaths.hud.goldPlaque,
    "--hud-player-plaque": assetPaths.hud.playerPlaque,
    "--hud-mission-plaque": assetPaths.hud.missionPlaque,
    "--hud-wave-plaque": assetPaths.hud.wavePlaque,
    "--hud-kills-plaque": assetPaths.hud.killsPlaque,
    "--hud-play-button": assetPaths.hud.playButton,
    "--hud-pause-button": assetPaths.hud.pauseButton,
    "--hud-menu-button": assetPaths.hud.menuButton,
    "--hud-speed-plaque": assetPaths.hud.speedPlaque,
    "--slot-price-plaque": assetPaths.slots.pricePlaque,
    "--active-plaque": assetPaths.slots.activePlaque,
  };
  Object.entries(vars).forEach(([name, src]) => root.style.setProperty(name, cssUrl(src)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function awardRunXp(state, amount) {
  const before = state.profile.level;
  addXp(state.profile, amount);
  state.runXp += amount;
  if (state.profile.level > before) {
    state.message = `LEVEL ${state.profile.level} · +${(state.profile.level - before) * 10} SP.`;
    state.messageTimer = 7;
  }
}

function notify(state, message) {
  state.message = message;
  state.messageTimer = 4;
}

function getPathPoints(level, board) {
  return level.track.map((tile) => ({
    x: board.x + tile.col * board.tile + board.tile / 2,
    y: board.y + tile.row * board.tile + board.tile / 2,
  }));
}

function createBoard(level, canvas) {
  const availableW = canvas.width - BOARD_PAD * 2;
  const availableH = canvas.height - BOARD_PAD * 2;
  const tile = Math.floor(Math.min(availableW / level.cols, availableH / level.rows));
  return {
    tile,
    w: tile * level.cols,
    h: tile * level.rows,
    x: Math.floor((canvas.width - tile * level.cols) / 2),
    y: Math.floor((canvas.height - tile * level.rows) / 2),
  };
}

function tileKey(row, col) {
  return `${row}:${col}`;
}

function getTileSets(level) {
  return {
    path: new Set(level.track.map((tile) => tileKey(tile.row, tile.col))),
    blockers: new Set(level.blockers.map((tile) => tileKey(tile.row, tile.col))),
    water: new Set((level.water || []).map(tile=>tileKey(tile.row,tile.col))),
  };
}

function waveTotal(level) {
  return level.waves.reduce((total, wave) => total + wave.spawns.length, 0);
}

function missionLabel(level) {
  const missionNumber = Number(level.id.split("_")[1]) || 1;
  return `${level.sector || 1}-${level.stage || missionNumber}`;
}

function makeEnemy(spawn, state) {
  const definition = getEnemy(spawn.enemy);
  const healthScale = state.level.threat * (currentWave(state).healthScale || 1);
  const life = Math.round(definition.life * healthScale);
  return {
    flying:Boolean(definition.flying),airProgress:0,
    armor: definition.armor || 0,
    shield: Math.round(life * (definition.shield || 0)),
    maxShield: Math.round(life * (definition.shield || 0)),
    xp: definition.xp ?? 2,
    healthScale,
    immuneSlow: Boolean(definition.immuneSlow),
    healer:Boolean(definition.healer),healTimer:2,healFlash:0,
    rageMultiplier: definition.rageMultiplier || 1,
    brood: Boolean(definition.brood),
    broodTimer: 8,
    births: 0,
    slowStrength: 0,
    stunTimer: 0,
    raged: false,
    slowTimer: 0,
    id: `enemy-${state.nextEnemyId++}`,
    key: definition.key,
    label: definition.label,
    shape: definition.shape,
    color: definition.color,
    life,
    maxLife: life,
    speed: definition.speed,
    damage: definition.damage,
    gold: Math.round(definition.gold*1.6),
    asset: definition.asset,
    visualSize: definition.visualSize,
    radius: definition.key === "alien_hatchling" ? 9 : definition.shape === "pentagon" ? 19 : definition.shape === "square" ? 17 : 15,
    segment: 0,
    progress: 0,
    x: state.path[0].x,
    y: state.path[0].y,
    angle: Math.atan2(state.path[1].y - state.path[0].y, state.path[1].x - state.path[0].x),
    burnTimer: 0,
    burnDamage: 0,
    reachedEnd: false,
  };
}

function activeStatus(state, abilityKey) {
  return state.activeAbilities[abilityKey];
}

function abilityStats(profile, abilityKey) {
  const ability = activeAbilities.find((item) => item.key === abilityKey);
  return ability ? activeAbilityStats(ability, profile) : null;
}

function canUseAbility(state, abilityKey) {
  const status = activeStatus(state, abilityKey);
  return !state.isPaused && !state.result && (state.phase === "combat"||state.enemies.some(e=>e.life>0)) && state.equippedActiveKeys.includes(abilityKey) && status && status.cooldown <= 0 && status.timer <= 0;
}

export function activateChronoBreak(state) {
  if (!canUseAbility(state, "chronoBreak")) return false;
  const stats = abilityStats(state.arsenalProfile, "chronoBreak");
  const status = activeStatus(state, "chronoBreak");
  status.timer = stats.duration;
  status.cooldown = stats.cooldown;
  addEffect(state, "stasis", state.board.x+state.board.w/2, state.board.y+state.board.h/2, 500, 1);
  state.audio?.play('chrono');
  state.selectedActiveKey = null;
  if(state.profile.onboarding)state.profile.onboarding.powerUsed=true;
  saveProfile(state.profile);
  return true;
}

export function activateNapalm(state,x=state.board.x+state.board.w/2,y=state.board.y+state.board.h/2) {
  if(!canUseAbility(state,'napalm'))return false;
  const stats=abilityStats(state.arsenalProfile,'napalm'),status=activeStatus(state,'napalm');
  status.timer=stats.duration;status.cooldown=stats.cooldown;status.damage=stats.damage;
  state.napalm={x,y,radius:stats.area,damage:stats.damage,timer:stats.duration};
  state.audio?.play('napalm');addEffect(state,'napalm',x,y,stats.area,1.2);
  state.selectedActiveKey=null;if(state.profile.onboarding)state.profile.onboarding.powerUsed=true;saveProfile(state.profile);return true;
}
function updateNapalm(state,dt){
  if(!state.napalm)return;
  const field=state.napalm;
  for(const enemy of state.enemies)if(enemy.life>0&&distance(enemy,field)<=field.radius){
    enemy.burnTimer=Math.max(enemy.burnTimer,1.8);
    if(enemy.burnDamage<=field.damage){enemy.burnDamage=field.damage;enemy.burnSource={weaponKey:'napalm'};}
  }
  field.timer-=dt;if(field.timer<=0)state.napalm=null;
}

export function activateArtillery(state, x, y) {
  if (!canUseAbility(state, 'artillery')) return false;
  const stats = abilityStats(state.arsenalProfile,'artillery');
  const status = activeStatus(state,'artillery');
  status.timer = stats.duration; status.cooldown = stats.cooldown;
  state.artillery = { x, y, elapsed: 0, next: .25, strikes: 0, duration: stats.duration, shots:stats.shots, damage: stats.damage, radius: stats.area };
  addEffect(state, 'target', x, y, stats.area, stats.duration);
  state.audio?.play('artillery');
  state.selectedActiveKey = null;
  if(state.profile.onboarding)state.profile.onboarding.powerUsed=true;
  saveProfile(state.profile);
  return true;
}

export function addEffect(state, kind, x, y, radius, duration=.5) {
  state.effects.push({kind,x,y,radius,timer:duration,maxTimer:duration});
  if(state.effects.length>90)state.effects.shift();
}
function impact(state,x,y,radius,damage,armorPierce=1,source={weaponKey:'artillery'}) {
  for(const enemy of state.enemies)if(enemy.life>0&&distance(enemy,{x,y})<=radius)damageEnemy(enemy,damage,armorPierce,source);
  addEffect(state,'explosion',x,y,radius,.7);
  state.audio?.play('impact',x);
}
function updateArtillery(state,dt) {
  if(!state.artillery)return;
  const barrage=state.artillery;barrage.elapsed+=dt;
  while(barrage.strikes<barrage.shots&&barrage.elapsed>=barrage.next) {
    const i=barrage.strikes, angle=i*2.39996;
    const scatter=i===0?0:Math.sqrt(i/barrage.shots)*barrage.radius*.38;
    const x=barrage.x+Math.cos(angle)*scatter,y=barrage.y+Math.sin(angle)*scatter;
    impact(state,x,y,barrage.radius*.67,barrage.damage);
    barrage.strikes++;barrage.next+=barrage.duration/barrage.shots;
  }
  if(barrage.elapsed>=barrage.duration)state.artillery=null;
}

export function createInitialState(level, profile, canvas) {
  const board = createBoard(level, canvas);
  const state = {
    mode: "game",
    level,
    board,
    tileSets: getTileSets(level),
    path: getPathPoints(level, board),
    profile,
    arsenalProfile: JSON.parse(JSON.stringify(profile)),
    effects: [],
    artillery: null, napalm: null, runWeaponKills: {},
    visualTime: 0,
    gold: level.startGold+skillRank(profile,'supplies')*25,
    lives: level.lives,
    selectedWeaponKey: null, buildAngle:0, freeplay:false, endlessRound:0,
    selectedTowerId: null, selectedDroneId:null, selectedEnemyId:null,focusEnemyId:null,missileRetargetId:null,pathMines:[],missileStrikes:[],
    wasPausedBeforeWeaponInfo: false,
    hoverPoint: null,
    hoverTile: null,
    towers: [],
    enemies: [],
    projectiles: [],
    nextTowerId: 0,
    nextEnemyId: 0,
    nextProjectileId: 0,
    phase: "prepare",
    waveLeaks: 0,
    leaks: 0,
    runXp: 0,
    clearedObstacles: 0,
    selectedObstacle: null,
    clearedBlockers: new Set(),
    waveIndex: 0,
    waveTime: 0,
    waveDelay: 18,
    spawnedInWave: new Set(),
    kills: 0,
    totalEnemies: waveTotal(level),
    runMode: "play",
    gameSpeed: 1,
    isPaused: false,
    equippedActiveKey: equippedPowerKeys(profile)[0],
    equippedActiveKeys: equippedPowerKeys(profile),
    selectedActiveKey: null,
    activeAbilities: Object.fromEntries(activeAbilities.map((ability) => [ability.key, {
      cooldown: 0,
      timer: 0,
      damage: 0,
      area: 0,
    }])),
    result: null,
    message: "",
    messageTimer: 0,
  };
  initializeSupport(state);
  return state;
}

export function damageEnemy(enemy, damage, armorPierce = 0, source = null) {
  if(enemy.life<=0)return;
  if(source)enemy.lastDamageSource=source;
  const shieldHit = Math.min(enemy.shield||0, damage);
  enemy.shield -= shieldHit;
  enemy.life -= (damage - shieldHit) * (1 - (enemy.armor||0) * (1 - armorPierce));
  if (damage > 0 && enemy.rageMultiplier > 1) enemy.raged = true;
}

function createProjectile(state, tower, target, angleOffset = 0, aimAngle = null) {
  const ballistic = Boolean(tower.weapon.ballistic);
  const baseAngle = aimAngle ?? Math.atan2(target.y - tower.y, target.x - tower.x);
  const angle = baseAngle + angleOffset;
  const muzzle = ballistic ? 24 : 0;
  state.projectiles.push({
    id: `projectile-${state.nextProjectileId++}`,
    weaponKey: tower.weapon.key, ownerId:tower.id, pierce:tower.weapon.pierce||0, hitIds:[],
    x: tower.x + Math.cos(baseAngle) * muzzle,
    y: tower.y + Math.sin(baseAngle) * muzzle,
    vx: Math.cos(angle) * tower.weapon.projectileSpeed,
    vy: Math.sin(angle) * tower.weapon.projectileSpeed,
    damage: tower.weapon.directDamage * (tower.lastCritical ? tower.weapon.critDamage : 1),
    critical: tower.lastCritical,
    armorPierce: tower.weapon.armorPierce || 0,
    slow: tower.weapon.slow || 0,
    speed: tower.weapon.projectileSpeed,
    ballistic,
    targetId: ballistic ? null : target.id,
    impactX: target.x, impactY: target.y,
    splashRadius: tower.weapon.splashRadius || 0,
    slowStrength: tower.weapon.slowStrength || .25,
    life: ballistic ? tower.range * 1.7 / tower.weapon.projectileSpeed : 4,
  });
}

export function fireTower(state, tower, target, continuing=false) {
  tower.shotsFired = (tower.shotsFired || 0) + 1;
  tower.lastCritical=criticalShot(tower);
  if(tower.weapon.continuous){
    energyHit(state,tower,target,projectileHit);
    tower.cooldown+=1/tower.weapon.atkSpeed;tower.ammo--;
    return;
  }
  const pelletCount = tower.weapon.pelletCount || 1;
  if (tower.weapon.ballistic) {
    // Lead the target at firing time; pellets never steer after leaving the muzzle.
    const flight = distance(tower, target) / tower.weapon.projectileSpeed;
    const terrainTile=state.level.track[target.segment];
    const terrain=(state.level.speedTiles?.some(t=>t.row===terrainTile?.row&&t.col===terrainTile?.col)?1.35:1)*(state.level.slowTiles?.some(t=>t.row===terrainTile?.row&&t.col===terrainTile?.col) && !target.immuneSlow ? .75 : 1);
    const movement = activeStatus(state, "chronoBreak").timer > 0 ? 0 : target.speed * terrain * (target.stunTimer>0?0:1) * (target.raged?target.rageMultiplier:1) * (target.slowTimer>0&&!target.immuneSlow?1-(target.slowStrength||.25):1);
    const aimX = target.x + Math.cos(target.angle || 0) * movement * flight;
    const aimY = target.y + Math.sin(target.angle || 0) * movement * flight;
    const angle = tower.weapon.directional?tower.angle:Math.atan2(aimY - tower.y, aimX - tower.x);
    for (let i = 0; i < pelletCount; i += 1) {
      createProjectile(state, tower, target, (i - (pelletCount - 1) / 2) * tower.weapon.spread, angle);
    }
    tower.angle = angle;
  } else {
    createProjectile(state, tower, target);
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  }
  if (!state.profile.settings.muted) state.audio?.play(tower.weapon.key,tower.x,1280,{});
  tower.muzzleFlash = 0.065;
  if(!continuing){tower.cooldown=1/tower.weapon.atkSpeed;tower.burstLeft=(tower.weapon.burstCount||1)-1;}
  tower.burstTimer=tower.weapon.burstGap||.08;
  tower.ammo -= 1;
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    if(tower.weapon.support||tower.weapon.economic||tower.weapon.fixedAim||tower.weapon.minelayer||tower.weapon.gas)continue;
    tower.beamEnd=null;
    tower.muzzleFlash = Math.max(0, (tower.muzzleFlash || 0) - dt);
    if (tower.reloadTimer > 0) {
      tower.reloadTimer -= dt;
      if (tower.reloadTimer <= 0) tower.ammo = tower.weapon.capacity;
      continue;
    }
    tower.cooldown = tower.weapon.continuous ? tower.cooldown-dt : Math.max(0, tower.cooldown - dt);
    if (tower.ammo <= 0) {
      tower.burstLeft=0;
      tower.reloadTimer = tower.weapon.reloadSpeed;
      continue;
    }
    const target = targetForTower(tower, state.enemies,state.focusEnemyId);
    if(tower.weapon.continuous){
      if(!target)tower.cooldown=Math.max(0,tower.cooldown);
      if(target){tower.angle=Math.atan2(target.y-tower.y,target.x-tower.x);tower.beamEnd={x:target.x,y:target.y};if(tower.cooldown<=0)fireTower(state,tower,target);}
      continue;
    }
    if(tower.burstLeft>0){
      tower.burstTimer-=dt;
      if(tower.burstTimer<=0&&target){tower.burstLeft--;fireTower(state,tower,target,true);}
    }else if (target && tower.cooldown <= 0) fireTower(state, tower, target);
  }
  for(const key of ['laser','flamethrower']){
    const active=state.towers.find(t=>t.weapon.key===key&&t.beamEnd);
    state.audio?.energy?.(key,active?.x||640,Boolean(active));
  }
}

function updateEnemies(state, dt) {
  const movementDt = activeStatus(state, "chronoBreak").timer > 0 ? 0 : dt;
  const births = [];
  for (const enemy of state.enemies) {
    if(enemy.life<=0)continue;
    const tile = state.level.track[enemy.segment];
    const onIce = !enemy.flying&&state.level.slowTiles?.some((item) => item.row === tile.row && item.col === tile.col);
    const onHaste=!enemy.flying&&state.level.speedTiles?.some(item=>item.row===tile.row&&item.col===tile.col);
    enemy.onHaste=Boolean(onHaste);enemy.onIce=Boolean(onIce);
    const frozen = enemy.stunTimer > 0;
    let remaining = enemy.speed * movementDt * (onHaste ? 1.35 : 1) * (frozen ? 0 : 1) * (onIce && !enemy.immuneSlow ? .75 : 1) * (enemy.raged ? enemy.rageMultiplier : 1) * (enemy.slowTimer > 0 && !enemy.immuneSlow ? 1-(enemy.slowStrength || .25) : 1);
    enemy.stunTimer = Math.max(0,(enemy.stunTimer || 0)-dt);
    enemy.criticalFlash=Math.max(0,(enemy.criticalFlash||0)-dt);
    enemy.healFlash=Math.max(0,(enemy.healFlash||0)-dt);
    if(enemy.healer&&movementDt>0&&!frozen){
      enemy.healTimer-=dt;
      if(enemy.healTimer<=0){enemy.healTimer=2;enemy.healFlash=.6;for(const ally of state.enemies)if(ally!==enemy&&ally.life>0&&distance(enemy,ally)<110)ally.life=Math.min(ally.maxLife,ally.life+500);}
    }
    if(enemy.brood && movementDt > 0 && !frozen && enemy.births < 3) {
      enemy.broodTimer -= dt;
      if(enemy.broodTimer<=0) { enemy.births++; enemy.broodTimer=8; births.push(...spawnHatchlings(state,enemy,1)); }
    }
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    if(enemy.joinPoint&&remaining>0){const d=distance(enemy,enemy.joinPoint),travel=Math.min(d,remaining);if(d>0){enemy.x+=(enemy.joinPoint.x-enemy.x)*travel/d;enemy.y+=(enemy.joinPoint.y-enemy.y)*travel/d;}remaining-=travel;if(d<=travel+.01)enemy.joinPoint=null;}
    if(enemy.flying){
      const a=state.path[0],b=state.path.at(-1),length=distance(a,b);enemy.airProgress=Math.min(length,(enemy.airProgress||0)+remaining);const f=enemy.airProgress/Math.max(1,length);enemy.x=a.x+(b.x-a.x)*f;enemy.y=a.y+(b.y-a.y)*f;enemy.angle=Math.atan2(b.y-a.y,b.x-a.x);enemy.pathOrder=f*(state.path.length-1)*1000;if(f>=1)enemy.reachedEnd=true;remaining=0;
    }
    while (!enemy.joinPoint&&!enemy.flying&&remaining > 0 && enemy.segment < state.path.length - 1) {
      const from = state.path[enemy.segment];
      const to = state.path[enemy.segment + 1];
      const segmentLength = distance(from, to);
      enemy.angle = Math.atan2(to.y - from.y, to.x - from.x);
      const leftOnSegment = segmentLength - enemy.progress;
      const step = Math.min(remaining, leftOnSegment);
      enemy.progress += step;
      remaining -= step;
      const t = clamp(enemy.progress / segmentLength, 0, 1);
      enemy.x = from.x + (to.x - from.x) * t;
      enemy.y = from.y + (to.y - from.y) * t;
      if (enemy.progress >= segmentLength - 0.01) {
        enemy.segment += 1;
        enemy.progress = 0;
      }
    }
    triggerMines(state,enemy,damageEnemy,addEffect);
    if(!enemy.flying)enemy.pathOrder=enemy.segment*1000+enemy.progress;
    if (enemy.segment >= state.path.length - 1 && enemy.life>0) enemy.reachedEnd = true;
  }

  collectKilledEnemies(state);
  for (const enemy of state.enemies.filter((item) => item.reachedEnd)) {
    state.lives -= enemy.damage;
    state.waveLeaks += enemy.damage;
    state.leaks += 1;
    notify(state, `Breach! −${enemy.damage} lives. Cover the exit or upgrade your defense.`);
  }
  state.enemies = [...state.enemies.filter((item) => !item.reachedEnd), ...births];
}

function spawnHatchlings(state,parent,count) {
  const children=[];
  for(let i=0;i<count;i++) {
    const child=makeEnemy({enemy:'alien_hatchling'},state);
    Object.assign(child,{x:parent.x,y:parent.y,segment:parent.segment,progress:parent.progress,angle:parent.angle});
    children.push(child);
  }
  state.totalEnemies+=children.length;
  return children;
}
function collectKilledEnemies(state) {
  const killed=state.enemies.filter(enemy=>enemy.life<=0),children=[];
  for(const enemy of killed) {
    state.gold+=enemy.gold;state.kills++;
    awardRunXp(state,enemy.xp);
    const source=enemy.lastDamageSource;
    if(source?.weaponKey){
      const key=source.weaponKey;
      state.runWeaponKills[key]=(state.runWeaponKills[key]||0)+1;
      state.profile.weaponKills[key]=(state.profile.weaponKills[key]||0)+1;
      const owner=[...state.towers,...state.drones].find(t=>t.id===source.ownerId);
      if(owner)owner.kills=(owner.kills||0)+1;
    }
    if(enemy.brood)children.push(...spawnHatchlings(state,enemy,3));
  }
  state.enemies=[...state.enemies.filter(enemy=>enemy.life>0),...children];
}
export function projectileHit(state,projectile,enemy) {
  damageEnemy(enemy,projectile.damage,projectile.armorPierce,{weaponKey:projectile.weaponKey,ownerId:projectile.ownerId});
  if(projectile.critical)enemy.criticalFlash=.16;
  if(!enemy.immuneSlow && (projectile.slow || projectile.cryo)) {
    enemy.slowStrength=Math.max(enemy.slowTimer>0?enemy.slowStrength||0:0,projectile.slow?projectile.slowStrength||.25:.16);
    enemy.slowTimer=Math.max(enemy.slowTimer||0,projectile.slow||1);
  }
  const radius=projectile.splashRadius || 0;
  if(radius) {
    for(const other of state.enemies)if(other!==enemy&&other.life>0&&distance(other,enemy)<=radius)damageEnemy(other,projectile.damage,projectile.armorPierce,{weaponKey:projectile.weaponKey,ownerId:projectile.ownerId});
    addEffect(state,projectile.splashRadius?'explosion':'spark',enemy.x,enemy.y,radius,.55);
    if(projectile.splashRadius)state.audio?.play('impact',enemy.x);
  }
}

// Earliest impact along a swept pellet segment, so fast projectiles cannot tunnel
// through an alien at 2x speed and overlapping aliens are hit in physical order.
export function segmentCircleHitTime(from, to, enemy, radius = enemy.radius + 3) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const ox = from.x - enemy.x, oy = from.y - enemy.y;
  const c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a === 0) return null;
  const b = 2 * (ox * dx + oy * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

export function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    if (projectile.ballistic) {
      const travelTime = Math.min(dt, Math.max(0, projectile.life));
      const end = { x: projectile.x + projectile.vx * travelTime, y: projectile.y + projectile.vy * travelTime };
      const hits=state.enemies.filter(e=>e.life>0&&!projectile.hitIds?.includes(e.id)).map(enemy=>({enemy,t:segmentCircleHitTime(projectile,end,enemy)})).filter(h=>h.t!==null).sort((a,b)=>a.t-b.t);
      projectile.hitIds ||= [];
      projectile.life -= dt;
      for(const {enemy,t} of hits){
        const last=projectile.hitIds.length===(projectile.pierce||0);
        projectileHit(state,{...projectile,damage:projectile.damage*(projectile.pierce && last ? .5 : 1)},enemy);
        projectile.hitIds.push(enemy.id);
        if(last){projectile.x+=(end.x-projectile.x)*t;projectile.y+=(end.y-projectile.y)*t;projectile.life=0;break;}
      }
      if(projectile.life>0){projectile.x=end.x;projectile.y=end.y;}
      continue;
    }
    projectile.life -= dt;
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.life > 0);
    if (!target && !projectile.splashRadius) { projectile.life = 0; continue; }
    if(target) {projectile.impactX=target.x;projectile.impactY=target.y;}
    const destination=target || {x:projectile.impactX,y:projectile.impactY,radius:0};
    const d = distance(projectile, destination);
    const travel = projectile.speed * dt;
    if (d <= travel + destination.radius) {
      if(target)projectileHit(state,projectile,target);
      else impact(state,destination.x,destination.y,projectile.splashRadius,projectile.damage,projectile.armorPierce,{weaponKey:projectile.weaponKey,ownerId:projectile.ownerId});
      projectile.life = 0;
    } else {
      projectile.x += ((destination.x - projectile.x) / d) * travel;
      projectile.y += ((destination.y - projectile.y) / d) * travel;
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  collectKilledEnemies(state);
}

function updateBurningEnemies(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.burnTimer <= 0) continue;
    damageEnemy(enemy, enemy.burnDamage * Math.min(dt,enemy.burnTimer), 1, enemy.burnSource);
    enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
    if(!enemy.burnTimer){enemy.burnDamage=0;enemy.burnSource=null;}
  }
  collectKilledEnemies(state);
}

export function launchWave(state) {
  if (state.phase !== "prepare" || state.result || state.isPaused) return false;
  state.phase = "combat";
  state.waveDelay = 0;
  state.waveLeaks = 0;
  notify(state, `Wave ${state.waveIndex + 1} · ${currentWave(state).name}`);
  return true;
}

function updateWaves(state, dt) {
  if (!state.freeplay && state.waveIndex >= state.level.waves.length) return;
  if (state.phase === "prepare") {
    state.waveDelay = Math.max(0, state.waveDelay - dt);
    if (state.waveDelay <= 0) launchWave(state);
    return;
  }
  const wave = currentWave(state);
  state.waveTime += dt;
  wave.spawns.forEach((spawn, index) => {
    if (state.waveTime >= spawn.at && !state.spawnedInWave.has(index)) {
      state.enemies.push(makeEnemy(spawn, state));
      state.spawnedInWave.add(index);
    }
  });
  if (state.spawnedInWave.size === wave.spawns.length && state.enemies.length === 0 && !state.artillery && !state.napalm && !state.missileStrikes.length) {
    const cleanBonus = state.waveLeaks === 0 ? 15 : 0;
    state.gold += wave.reward + cleanBonus;
    awardRunXp(state, 8 + state.level.sector * 2);
    saveProfile(state.profile);
    notify(state, `Wave cleared · +$${wave.reward} supplies${cleanBonus ? " · +$15 flawless defense" : ""}`);
    state.waveIndex += 1;
    if(state.freeplay){state.endlessRound++;state.endlessWave=endlessWave(state.level,state.endlessRound);state.totalEnemies+=state.endlessWave.spawns.length;}
    state.waveTime = 0;
    state.spawnedInWave = new Set();
    state.waveDelay = NEXT_WAVE_DELAY;
    state.phase = "prepare";
    state.projectiles = [];
    state.towers.forEach((tower) => { tower.ammo = tower.weapon.capacity; tower.reloadTimer = 0; tower.cooldown = 0; });
  }
}

function updateResult(state) {
  if (state.result) return;
  if (state.lives <= 0) {
    state.result = "defeat";
    state.isPaused = true;
    saveProfile(state.profile);
  } else if (!state.freeplay && state.waveIndex >= state.level.waves.length && state.enemies.length === 0) {
    state.result = "victory";
    state.isPaused = true;
    state.reward = recordVictory(state.profile, state.level, state.lives);
    state.runXp += state.reward.xp;
    saveProfile(state.profile);
  }
}

export function placeTower(state, weaponKey, row, col) {
  if (state.result || row < 0 || col < 0 || row >= state.level.rows || col >= state.level.cols) return null;
  const weapon = findEffectiveWeaponByKey(weapons, weaponKey, { ...state.profile, arsenal: state.arsenalProfile.arsenal });
  if(!classUnlocked(state.profile,weaponKey)||!loadoutKeys(state.arsenalProfile).includes(weaponKey)||state.towers.filter(t=>t.weapon.key===weaponKey).length>=placementLimit(state.profile))return null;
  const key = tileKey(row, col);
  const water=state.tileSets.water.has(key),platform=water?PONTOON_COST:0;
  if(water&&!skillRank(state.profile,'pontoons'))return null;
  if(state.drones.some(d=>d.base.row===row&&d.base.col===col))return null;
  if (!weapon || state.gold < weapon.price+platform || state.tileSets.path.has(key) || state.tileSets.blockers.has(key) || state.towers.some(t => t.row === row && t.col === col)) return null;
  const tower = {
    id: `tower-${state.nextTowerId++}`, weapon, row, col,
    x: state.board.x + col * state.board.tile + state.board.tile / 2,
    y: state.board.y + row * state.board.tile + state.board.tile / 2,
    tile: state.board.tile, range: weapon.range, cooldown: 0, ammo: weapon.capacity, reloadTimer: 0, angle: weapon.directional?(state.buildAngle||0):0,
    kills:0, upgrades: { power: 0, tactical: 0 }, invested: weapon.price+platform, platform, targeting: "first",
    pad: state.level.pads?.find(pad => pad.row === row && pad.col === col)?.type,
  };
  tower.weapon = applyTowerUpgrades(weapon, tower);
  tower.range = tower.weapon.range;
  state.gold -= weapon.price+platform;
  state.towers.push(tower);
  refreshTowersWithSkills(state.towers,weapons,{...state.profile,arsenal:state.arsenalProfile.arsenal});
  return tower;
}

export function upgradeTower(state, tower, key) {
  if (!tower || state.result || !towerUpgradePaths.some(path => path.key === key)) return false;
  const cost = towerUpgradeCost(tower, key);
  if (tower.upgrades[key] >= (towerUpgradePathsFor(tower.weapon.key).find(p=>p.key===key)?.maxRank||3) || tower.upgrades.power + tower.upgrades.tactical >= 4 || state.gold < cost) return false;
  state.gold -= cost;
  tower.invested += cost;
  tower.upgrades[key] += 1;
  if(state.profile.onboarding)state.profile.onboarding.towerUpgraded=true;
  saveProfile(state.profile);
  refreshTowersWithSkills(state.towers, weapons, { ...state.profile, arsenal: state.arsenalProfile.arsenal });
  return true;
}

export function sellValue(state, tower) {
  return Math.floor(tower.invested * (state.waveIndex === 0 && state.phase === "prepare" ? 1 : 0.7));
}

export function sellTower(state, tower) {
  if (!tower || state.result || !state.towers.includes(tower)) return false;
  state.gold += sellValue(state, tower);
  state.towers = state.towers.filter(item => item !== tower);
  refreshTowersWithSkills(state.towers,weapons,{...state.profile,arsenal:state.arsenalProfile.arsenal});
  state.selectedTowerId = null;
  return true;
}

export function obstacleCost(state,obstacle){return Math.ceil((obstacle?.cost||0)*(1-skillRank(state.profile,'salvage')*.15));}
export function clearObstacle(state, obstacle) {
  const key = obstacle && tileKey(obstacle.row, obstacle.col);
  if(obstacle?.encounter){if(state.result||!state.tileSets.blockers.has(key))return false;state.tileSets.blockers.delete(key);state.clearedBlockers.add(key);state.selectedObstacle=null;state.clearedObstacles++;const x=state.board.x+(obstacle.col+.5)*state.board.tile,y=state.board.y+(obstacle.row+.5)*state.board.tile;let index=0;for(let i=1;i<state.path.length-1;i++)if(distance({x,y},state.path[i])<distance({x,y},state.path[index]))index=i;for(let i=0;i<3;i++){const e=makeEnemy({enemy:i===2?'alien_fast':'alien_normal'},state);Object.assign(e,{x:x+i*5,y,segment:index,joinPoint:{...state.path[index]},fromCrate:true});state.enemies.push(e);}state.totalEnemies+=3;return true;}
  if (!obstacle?.cost || state.result || state.gold < obstacleCost(state,obstacle) || !state.tileSets.blockers.has(key)) return false;
  state.gold -= obstacleCost(state,obstacle);
  state.tileSets.blockers.delete(key);
  state.clearedBlockers.add(key);
  state.selectedObstacle = null;
  state.clearedObstacles += 1;
  notify(state, "Position cleared. Build a tower here.");
  return true;
}

export function stepState(state, dt) {
  if (state.isPaused || state.result) return;
  const scaledDt = dt * state.gameSpeed;
  state.visualTime += scaledDt;
  state.effects = state.effects.map(effect=>({...effect,timer:effect.timer-scaledDt})).filter(effect=>effect.timer>0);
  state.messageTimer = Math.max(0, state.messageTimer - scaledDt);
  // Cooldowns only recover in combat: waiting between waves cannot recharge abilities for free.
  if (state.phase === "combat"||state.enemies.some(e=>e.fromCrate)) Object.values(state.activeAbilities).forEach((status) => {
    status.timer = Math.max(0, status.timer - scaledDt);
    status.cooldown = Math.max(0, status.cooldown - scaledDt);
  });
  updateWaves(state, scaledDt);
  if (state.phase === "combat"||state.enemies.some(e=>e.fromCrate)) {
    if(state.phase==='combat')updateTacticalDefense(state,scaledDt,damageEnemy,addEffect);
    updateArtillery(state, scaledDt);
    updateNapalm(state, scaledDt);
    updateDrone(state,scaledDt,damageEnemy);
    updateTowers(state, scaledDt);
    updateProjectiles(state, scaledDt);
    updateBurningEnemies(state, scaledDt);
    updateEnemies(state, scaledDt);
  }else{
    for(const tower of state.towers)tower.beamEnd=null;
    state.audio?.energy?.('laser',640,false);state.audio?.energy?.('flamethrower',640,false);
  }
  if(state.focusEnemyId&&!state.enemies.some(e=>e.id===state.focusEnemyId&&e.life>0))state.focusEnemyId=null;
  if(state.selectedEnemyId&&!state.enemies.some(e=>e.id===state.selectedEnemyId&&e.life>0))state.selectedEnemyId=null;
  updateResult(state);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawAlienFallback(ctx, enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = "rgba(255,255,255,0.72)";
  ctx.lineWidth = 2;
  const sides = { circle: 36, triangle: 3, square: 4, pentagon: 5 }[enemy.shape] || 36;
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = -Math.PI / 2 + (i / sides) * TWO_PI;
    const r = enemy.radius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#071014";
  ctx.beginPath();
  ctx.arc(-5, -3, 2.5, 0, TWO_PI);
  ctx.arc(5, -3, 2.5, 0, TWO_PI);
  ctx.fill();
  const hpW = enemy.radius * 2;
  ctx.fillStyle = "rgba(7,12,16,0.72)";
  ctx.fillRect(-hpW / 2, -enemy.radius - 11, hpW, 4);
  ctx.fillStyle = "#8dff72";
  ctx.fillRect(-hpW / 2, -enemy.radius - 11, hpW * clamp(enemy.life / enemy.maxLife, 0, 1), 4);
  ctx.restore();
}

function drawAlien(ctx, enemy, assets) {
  const image = assets.enemies[enemy.key];
  if (!image) {
    drawAlienFallback(ctx, enemy);
    return;
  }
  const size = enemy.visualSize || enemy.radius * 2.6;
  const scale = size / Math.max(image.width, image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.save();
  ctx.rotate((enemy.angle || 0) - Math.PI / 2);
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
  ctx.shadowColor = "transparent";
  if(enemy.criticalFlash>0){ctx.fillStyle='#ffdc80';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('CRIT',0,-h/2-13);}
  const hpW = Math.max(28, size * 0.82);
  const hpY = -h / 2 - 8;
  ctx.fillStyle = "rgba(7,12,16,0.72)";
  ctx.fillRect(-hpW / 2, hpY, hpW, 4);
  ctx.fillStyle = "#8dff72";
  ctx.fillRect(-hpW / 2, hpY, hpW * clamp(enemy.life / enemy.maxLife, 0, 1), 4);
  ctx.restore();
}

function drawTowerFallback(ctx, tower) {
  ctx.save();
  ctx.translate(tower.x, tower.y);
  ctx.fillStyle = "rgba(3,8,12,0.9)";
  ctx.strokeStyle = tower.weapon.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(tower.angle || 0);
  ctx.fillStyle = tower.weapon.accent;
  ctx.fillRect(0, -5, 28, 10);
  ctx.fillStyle = "#dce8ec";
  ctx.fillRect(-7, -7, 15, 14);
  ctx.restore();
}

function drawTower(ctx, tower, assets) {
  const baseImage = assets.placedBase;
  const weaponImage = assets.placedWeapons[tower.weapon.key];
  if (!baseImage || !weaponImage) {
    drawTowerFallback(ctx, tower);
    return;
  }
  const baseSize = Math.min(70, tower.tile * 0.9)*(tower.platform ? .72 : 1);
  const weaponHeight = Math.min(76, tower.tile * (tower.weapon.key === "sniper" ? 1.08 : 0.95));
  const weaponScale = weaponHeight / weaponImage.height;
  const weaponW = weaponImage.width * weaponScale;
  const weaponH = weaponImage.height * weaponScale;
  ctx.save();
  ctx.translate(tower.x, tower.y);
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.drawImage(baseImage, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.rotate(tower.angle || 0);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(weaponImage, -weaponW / 2, -weaponH / 2, weaponW, weaponH);
  ctx.restore();
}

function drawWeaponRange(ctx,tower,color){
 if(tower.range<=0)return;
 if(!tower.weapon.directional){
  const tile=tower.tile||77,n=Math.ceil(tower.range/tile);ctx.save();ctx.fillStyle='#e7bf6440';ctx.strokeStyle=color;ctx.lineWidth=2;
  for(let r=-n;r<=n;r++)for(let c=-n;c<=n;c++)if(Math.hypot(r*tile,c*tile)<=tower.range){const x=tower.x+(c-.5)*tile,y=tower.y+(r-.5)*tile;ctx.fillRect(x,y,tile,tile);ctx.strokeRect(x+3,y+3,tile-6,tile-6);}ctx.restore();return;
 }
 ctx.save();ctx.translate(tower.x,tower.y);ctx.rotate(tower.angle||0);ctx.fillStyle='#6fcfe71c';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.fillRect(0,-tower.weapon.laneWidth/2,tower.range,tower.weapon.laneWidth);ctx.strokeRect(0,-tower.weapon.laneWidth/2,tower.range,tower.weapon.laneWidth);ctx.restore();
}
function drawRangeCircle(ctx, x, y, range, color = "rgba(116, 224, 108, 0.82)") {
  ctx.save();
  ctx.fillStyle = "rgba(116, 224, 108, 0.08)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.arc(x, y, range, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPlacementIndicator(ctx, board, row, col, isValid = true) {
  const x = board.x + col * board.tile;
  const y = board.y + row * board.tile;
  const pad = Math.max(7, board.tile * 0.12);
  const size = board.tile - pad * 2;
  const edge = Math.max(8, board.tile * 0.18);
  const midX = x + board.tile / 2;
  const midY = y + board.tile / 2;
  const color = isValid ? "rgba(68, 194, 255, 0.96)" : "rgba(255, 103, 125, 0.92)";
  const glow = isValid ? "rgba(68, 194, 255, 0.42)" : "rgba(255, 103, 125, 0.34)";

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.strokeRect(x + pad, y + pad, size, size);

  ctx.lineWidth = 4;
  const left = x + pad;
  const right = x + board.tile - pad;
  const top = y + pad;
  const bottom = y + board.tile - pad;
  [
    [left, top + edge, left, top, left + edge, top],
    [right - edge, top, right, top, right, top + edge],
    [right, bottom - edge, right, bottom, right - edge, bottom],
    [left + edge, bottom, left, bottom, left, bottom - edge],
  ].forEach(([x1, y1, x2, y2, x3, y3]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();
  });

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(midX, midY, Math.max(6, board.tile * 0.1), 0, TWO_PI);
  ctx.moveTo(midX - edge, midY);
  ctx.lineTo(midX - 4, midY);
  ctx.moveTo(midX + 4, midY);
  ctx.lineTo(midX + edge, midY);
  ctx.moveTo(midX, midY - edge);
  ctx.lineTo(midX, midY - 4);
  ctx.moveTo(midX, midY + 4);
  ctx.lineTo(midX, midY + edge);
  ctx.stroke();

  const marker = Math.max(5, board.tile * 0.08);
  [[midX, top - 1, 0], [right + 1, midY, Math.PI / 2], [midX, bottom + 1, Math.PI], [left - 1, midY, -Math.PI / 2]].forEach(([mx, my, rotation]) => {
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -marker);
    ctx.lineTo(marker * 0.9, marker);
    ctx.lineTo(-marker * 0.9, marker);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawObstacle(ctx, x, y, size, obstacle, selected, cost=obstacle.cost, image=null) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.shadowColor = "#0009"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6;
  if(image){ctx.drawImage(image,-size*.43,-size*.43,size*.86,size*.86);}
  else if (obstacle.kind === "cargo") {
    ctx.fillStyle = "#655137"; ctx.strokeStyle = "#dcb271"; ctx.lineWidth = 2;
    drawRoundedRect(ctx, -size * .31, -size * .3, size * .62, size * .6, 4);
    ctx.fillStyle = "#282c2c";
    ctx.fillRect(-size * .19, -size * .3, size * .07, size * .6);
    ctx.fillRect(size * .12, -size * .3, size * .07, size * .6);
    ctx.strokeStyle = "#f1b75a"; ctx.strokeRect(-size * .1, -size * .12, size * .2, size * .24);
  } else {
    const ice = obstacle.kind === "ice", growth = obstacle.kind === "growth";
    ctx.fillStyle = ice ? "#477b90" : growth ? "#59623b" : "#303e46";
    ctx.strokeStyle = ice ? "#a0e9ef" : growth ? "#a0c871" : "#65727a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let n = 0; n < 6; n++) {
      const angle = n * Math.PI / 3;
      const radius = size * (n % 2 ? .27 : .36);
      const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
      if (n === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size*.25,-size*.1); ctx.lineTo(0,-size*.27); ctx.lineTo(size*.15,0); ctx.stroke();
  }
  ctx.shadowColor = "transparent";
  if (obstacle.cost) {
    ctx.fillStyle = "#141c24"; ctx.fillRect(-18, size*.22, 36, 17);
    ctx.fillStyle = "#efd6a3"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText(`$${cost}`, 0, size*.22 + 13);
  }
  if (selected) { ctx.strokeStyle = "#ffdd88"; ctx.lineWidth = 3; ctx.strokeRect(-size*.4,-size*.4,size*.8,size*.8); }
  ctx.restore();
}

function drawCombatEffects(ctx,state) {
  for(const effect of state.effects) {
    const t=clamp(1-effect.timer/effect.maxTimer,0,1),r=effect.radius;
    ctx.save();ctx.translate(effect.x,effect.y);
    if(effect.kind==='target') {
      const pulse=.7+Math.sin(state.visualTime*8)*.15;
      ctx.strokeStyle=`rgba(255,189,98,${pulse})`;ctx.fillStyle='#e4992c15';ctx.lineWidth=2;
      ctx.setLineDash([12,9]);ctx.beginPath();ctx.arc(0,0,r,0,TWO_PI);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(r-16,0);ctx.lineTo(r+13,0);ctx.stroke();ctx.restore();}
      ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillStyle='#ffe4a4';ctx.fillText('ARTILLERY',0,-r-15);
      // Incoming shells telegraph the next detonation in the marked area.
      const phase=(state.artillery?.elapsed || 0)*2%1;
      ctx.strokeStyle='#ffe7b8';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(90*(1-phase),-240*(1-phase));ctx.lineTo(90*(1-phase)+10,-240*(1-phase)-28);ctx.stroke();
    } else if(effect.kind==='explosion'||effect.kind==='spark') {
      ctx.globalAlpha=1-t;
      const ring=r*(.25+t);const gradient=ctx.createRadialGradient(0,0,0,0,0,Math.max(1,ring));
      gradient.addColorStop(0,'#fff0b6ee');gradient.addColorStop(.25,'#ffbd49c9');gradient.addColorStop(.65,'#ec5d3070');gradient.addColorStop(1,'#5d453700');
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,ring,0,TWO_PI);ctx.fill();
      ctx.strokeStyle='#ffdb90';ctx.lineWidth=3*(1-t)+1;ctx.beginPath();ctx.arc(0,0,r*(.35+t),0,TWO_PI);ctx.stroke();
      for(let i=0;i<12;i++){
        const a=i*2.39996,d=r*(.15+t)*(.5+(i%3)*.2);
        ctx.strokeStyle=i%2?'#fff1be':'#ff9d4c';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*d,Math.sin(a)*d);ctx.lineTo(Math.cos(a)*(d+11*(1-t)),Math.sin(a)*(d+11*(1-t)));ctx.stroke();
      }
      if(t>.2 && effect.kind==='explosion'){
        ctx.globalAlpha=(1-t)*.32;ctx.fillStyle='#b4aaa0';
        for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(Math.cos(i*2.4)*r*t*.4,Math.sin(i*2.4)*r*t*.25-r*t*.3, r*(.12+t*.1),0,TWO_PI);ctx.fill();}
      }
    } else if(effect.kind==='stasis') {
      ctx.strokeStyle=`rgba(255,220,125,${(1-t)*.9})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r*t,0,TWO_PI);ctx.stroke();
    } else if(effect.kind==='napalm') {
      ctx.globalAlpha=(1-t)*.6;
      for(let i=0;i<9;i++){const x=(i-4)*150,y=Math.sin(i*2)*180;ctx.strokeStyle='#ff9b50';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-150*(1-t),y-500*(1-t));ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#ffcd73';ctx.beginPath();ctx.arc(x,y,10+35*t,0,TWO_PI);ctx.fill();}
    }
    ctx.restore();
  }
}

function drawGame(ctx, state, assets) {
  const { board, level, tileSets } = state;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const bg = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  bg.addColorStop(0, "#15242c");
  bg.addColorStop(1, "#070b10");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#0d151b";
  ctx.strokeStyle = "rgba(91, 206, 255, 0.22)";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, board.x - 14, board.y - 14, board.w + 28, board.h + 28, 18);

  for (let row = 0; row < level.rows; row += 1) {
    for (let col = 0; col < level.cols; col += 1) {
      const x = board.x + col * board.tile;
      const y = board.y + row * board.tile;
      const key = tileKey(row, col);
      const isPath = tileSets.path.has(key);
      const isBlocked = tileSets.blockers.has(key);
      const water=tileSets.water.has(key);
      if (isPath && assets.path) {
        ctx.drawImage(assets.path, x + 1, y + 1, board.tile - 2, board.tile - 2);
      } else if (!isPath && assets.tile) {
        ctx.drawImage(assets.tile, x + 1, y + 1, board.tile - 2, board.tile - 2);
        if (isBlocked) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
          ctx.fillRect(x + 2, y + 2, board.tile - 4, board.tile - 4);
        }
      } else {
        ctx.fillStyle = isPath ? "#6b543b" : isBlocked ? "#1a2026" : "#193241";
        ctx.fillRect(x + 2, y + 2, board.tile - 4, board.tile - 4);
      }
      if(water){
        const texture=assets.world.water;
        if(texture){assets.waterPattern ||=ctx.createPattern(texture,'repeat');ctx.fillStyle=assets.waterPattern;ctx.fillRect(x,y,board.tile,board.tile);}
        else{ctx.fillStyle='#1c5667';ctx.fillRect(x,y,board.tile,board.tile);}
        ctx.strokeStyle='#9be0da30';ctx.lineWidth=1;
        ctx.beginPath();ctx.ellipse(x+board.tile*.5,y+board.tile*.5+Math.sin(state.visualTime+row)*3,board.tile*.28,3,0,0,Math.PI);ctx.stroke();
        ctx.strokeStyle='#a8bcb288';ctx.lineWidth=3;
        for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]])if(!tileSets.water.has(tileKey(row+dr,col+dc))){
          ctx.beginPath();if(dr){const sy=y+(dr>0?board.tile:0);ctx.moveTo(x,sy);ctx.lineTo(x+board.tile,sy);}else{const sx=x+(dc>0?board.tile:0);ctx.moveTo(sx,y);ctx.lineTo(sx,y+board.tile);}ctx.stroke();
        }
      }
      ctx.strokeStyle = isPath ? "rgba(247, 163, 69, 0.38)" : "rgba(90, 205, 255, 0.18)";
      ctx.lineWidth = 1;
      if(!water)ctx.strokeRect(x + 2.5, y + 2.5, board.tile - 5, board.tile - 5);
      if (!water && level.biome !== "outpost") {
        ctx.fillStyle = level.biome === "frost" ? (isPath ? "#61c7e04a" : "#367c9c30") : (isPath ? "#a8ba3433" : "#73844325");
        ctx.fillRect(x + 1, y + 1, board.tile - 2, board.tile - 2);
      }
      const slowTile = level.slowTiles?.some(tile => tile.row === row && tile.col === col);
      if (slowTile) {
        ctx.fillStyle = "#8deeff4a"; ctx.fillRect(x+3, y+3, board.tile-6, board.tile-6);
        ctx.fillStyle = "#d6ffff"; ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("❄", x+board.tile/2, y+board.tile/2+8);
      }
      if(level.speedTiles?.some(tile=>tile.row===row&&tile.col===col)){
        ctx.fillStyle='#e99c2540';ctx.fillRect(x+3,y+3,board.tile-6,board.tile-6);
        const index=level.track.findIndex(t=>t.row===row&&t.col===col),to=level.track[Math.min(index+1,level.track.length-1)];
        ctx.save();ctx.translate(x+board.tile/2,y+board.tile/2);ctx.rotate(Math.atan2(to.row-row,to.col-col));
        ctx.strokeStyle='#ffe39a';ctx.lineWidth=3;ctx.lineCap='round';
        for(const cx of [-10,4]){ctx.beginPath();ctx.moveTo(cx-4,-9);ctx.lineTo(cx+5,0);ctx.lineTo(cx-4,9);ctx.stroke();}ctx.restore();
      }
      const pad = level.pads?.find(tile => tile.row === row && tile.col === col);
      if (pad) {
        const overlay=assets.world[pad.type==='power'?'power-pad':'range-pad'];
        if(overlay)ctx.drawImage(overlay,x+3,y+3,board.tile-6,board.tile-6);
      }
      if (isBlocked) {
        const obstacle = level.blockers.find(tile => tile.row === row && tile.col === col);
        drawObstacle(ctx, x, y, board.tile, obstacle, state.selectedObstacle === obstacle,obstacleCost(state,obstacle),assets.world[obstacle.kind]);
        if(obstacle.encounter){ctx.fillStyle='#e8c776';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('FREE ⚠',x+board.tile/2,y+board.tile-7);}
      }
    }
  }

  if (!assets.path) {
    ctx.strokeStyle = "rgba(255, 176, 71, 0.85)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    state.path.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
    ctx.stroke();
  }

  // Direction markers remain visible during planning and are sparse during combat.
  ctx.save();
  state.path.forEach((point, i) => {
    if (i === state.path.length - 1 || i % 4 !== 0) return;
    const next = state.path[i + 1];
    ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(Math.atan2(next.y-point.y, next.x-point.x));
    ctx.strokeStyle = state.phase === "prepare" ? "#ffe6ad88" : "#ffe6ad35"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-5,-7); ctx.lineTo(3,0); ctx.lineTo(-5,7); ctx.stroke(); ctx.restore();
  });
  for (const [point, label, color] of [[state.path[0], "IN", "#ff9a87"], [state.path.at(-1), "BASE", "#b4ef91"]]) {
    ctx.fillStyle = "#111c24df"; ctx.fillRect(point.x-25, point.y+24, 50, 21);
    ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.fillStyle = color; ctx.fillText(label, point.x, point.y+39);
  }
  ctx.restore();

  drawSupport(ctx,state,assets.world);
  drawTacticalDefense(ctx,state,assets.world);
  if(!state.result){
    const wave=currentWave(state),first=wave?.spawns.find((spawn,i)=>!state.spawnedInWave.has(i)),remaining=state.phase==='prepare'?state.waveDelay+(wave?.spawns[0]?.at||0):first?Math.max(0,first.at-state.waveTime):0;
    if(remaining>0&&(state.phase==='prepare'||state.enemies.length===0)){
      const p=state.path[0];ctx.save();ctx.fillStyle='#142329ed';ctx.strokeStyle='#f4c16c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x-42,p.y-53,84,29,6);ctx.fill();ctx.stroke();ctx.fillStyle='#ffdc97';ctx.textAlign='center';ctx.font='bold 14px monospace';ctx.fillText(`${state.isPaused?'Ⅱ ':''}${remaining.toFixed(1)}s`,p.x,p.y-33);ctx.restore();
    }
  }

  const selected = findEffectiveWeaponByKey(weapons, state.selectedWeaponKey, { ...state.profile, arsenal: state.arsenalProfile.arsenal });
  if (selected) {
    ctx.fillStyle = "rgba(120, 226, 127, 0.12)";
    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.cols; col += 1) {
        const key = tileKey(row, col);
        const occupied = state.towers.some((tower) => tower.row === row && tower.col === col);
        if (!tileSets.path.has(key) && !tileSets.blockers.has(key) && (!tileSets.water.has(key)||skillRank(state.profile,'pontoons')) && !occupied) {
          ctx.fillRect(board.x + col * board.tile + 7, board.y + row * board.tile + 7, board.tile - 14, board.tile - 14);
        }
      }
    }
    if (state.hoverTile) {
      const key = tileKey(state.hoverTile.row, state.hoverTile.col);
      const occupied = state.towers.some((tower) => tower.row === state.hoverTile.row && tower.col === state.hoverTile.col);
      const canPlace = state.towers.filter(t=>t.weapon.key===selected.key).length<placementLimit(state.profile) && !state.drones.some(d=>d.base.row===state.hoverTile.row&&d.base.col===state.hoverTile.col) && state.gold >= selected.price+(tileSets.water.has(key)?PONTOON_COST:0) && (!tileSets.water.has(key)||skillRank(state.profile,'pontoons')) && !tileSets.path.has(key) && !tileSets.blockers.has(key) && !occupied;
      const x = board.x + state.hoverTile.col * board.tile + board.tile / 2;
      const y = board.y + state.hoverTile.row * board.tile + board.tile / 2;
      const pad = level.pads?.find(tile => tile.row === state.hoverTile.row && tile.col === state.hoverTile.col);
      const aura=selected.support?0:Math.max(0,...state.towers.filter(t=>t.weapon.support&&Math.hypot(t.x-x,t.y-y)<=t.range).map(t=>.1+t.upgrades.tactical*.04));
      drawWeaponRange(ctx, {x,y,weapon:selected,angle:state.buildAngle,tile:board.tile,range:selected.range*(pad?.type === "range" ? 1.18 : 1)*(1+aura)}, canPlace ? "rgba(116, 224, 108, 0.88)" : "rgba(255, 103, 125, 0.82)");
      drawPlacementIndicator(ctx, board, state.hoverTile.row, state.hoverTile.col, canPlace);
      ctx.save();
      ctx.globalAlpha = canPlace ? .65 : .35;
      drawTower(ctx, { weapon: selected, x, y, tile: board.tile, angle: state.buildAngle,
        platform: tileSets.water.has(key) ? PONTOON_COST : 0 }, assets);
      ctx.restore();
    }
  }

  if(state.missileRetargetId&&state.hoverPoint){const t=state.towers.find(t=>t.id===state.missileRetargetId);if(t)drawRangeCircle(ctx,state.hoverPoint.x,state.hoverPoint.y,t.weapon.splashRadius,'#efca76');}
  if (state.selectedActiveKey && state.hoverPoint) {
    const stats = abilityStats(state.arsenalProfile, state.selectedActiveKey);
    drawRangeCircle(ctx, state.hoverPoint.x, state.hoverPoint.y, stats.area, "rgba(255, 194, 76, 0.92)");
  }

  if(state.napalm){
    const field=state.napalm;ctx.save();ctx.fillStyle='#f4773022';ctx.strokeStyle='#fba35c99';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(field.x,field.y,field.radius,0,TWO_PI);ctx.fill();ctx.stroke();
    for(let i=0;i<25;i++){const a=i*2.4,r=Math.sqrt(i/25)*field.radius,f=(state.visualTime*1.5+i*.16)%1;ctx.fillStyle=`rgba(255,${120+Math.round(f*100)},65,${1-f})`;ctx.beginPath();ctx.ellipse(field.x+Math.cos(a)*r,field.y+Math.sin(a)*r-f*22,3,8,0,0,TWO_PI);ctx.fill();}ctx.restore();
  }
  state.towers.forEach((tower) => {
    const target = targetForTower(tower, state.enemies,state.focusEnemyId);
    if (target && !tower.weapon.directional && !tower.weapon.support && !tower.weapon.economic && !tower.weapon.fixedAim && !tower.weapon.minelayer && !tower.weapon.gas && !(tower.muzzleFlash > 0)) tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    if(tower.platform){ctx.save();ctx.translate(tower.x,tower.y);ctx.fillStyle='#b4955b';ctx.strokeStyle='#edcf8c';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-32,-29,64,58,10);ctx.fill();ctx.stroke();ctx.fillStyle='#536b62';ctx.fillRect(-34,-23,8,46);ctx.fillRect(26,-23,8,46);ctx.restore();}
    if(!state.profile.onboarding?.towerUpgraded && tower===state.towers.find(t=>state.gold>=Math.min(towerUpgradeCost(t,'power'),towerUpgradeCost(t,'tactical')))){
      const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
      ctx.save();ctx.strokeStyle=`rgba(255,220,132,${reduced ? .85 : .72+Math.sin(state.visualTime*5)*.28})`;ctx.shadowColor='#ffd168';ctx.shadowBlur=20;ctx.lineWidth=5;ctx.beginPath();ctx.arc(tower.x,tower.y,38,0,TWO_PI);ctx.stroke();
      ctx.fillStyle='#18282f';ctx.strokeStyle='#ffe099';ctx.beginPath();ctx.roundRect(tower.x-17,tower.y-52,34,20,6);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe099';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('↑',tower.x,tower.y-37);ctx.restore();
    }
    drawTower(ctx, tower, assets);
    drawEnergy(ctx,tower,state.visualTime);
    if (tower.muzzleFlash > 0) {
      ctx.save(); ctx.translate(tower.x, tower.y); ctx.rotate(tower.angle);
      ctx.fillStyle = "#fff3b5"; ctx.shadowColor = "#ffbb48"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(26,-5); ctx.lineTo(43,0); ctx.lineTo(26,5); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.save();ctx.fillStyle='#14252cdd';ctx.fillRect(tower.x+15,tower.y-31,34,15);ctx.fillStyle='#e4e7c4';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(`${tower.kills||0} ×`,tower.x+32,tower.y-20);ctx.restore();
    const ranks = (tower.upgrades?.power || 0) + (tower.upgrades?.tactical || 0);
    for (let i = 0; i < ranks; i++) {
      ctx.fillStyle = i < tower.upgrades.power ? "#ffc24c" : "#7ce1f7";
      ctx.fillRect(tower.x - ranks * 5 + i * 10, tower.y + 28, 7, 5);
    }
    if(tower.weapon.continuous&&tower.reloadTimer<=0){
      ctx.fillStyle='#101922';ctx.fillRect(tower.x-23,tower.y+38,46,4);
      ctx.fillStyle=tower.weapon.continuous==='laser'?'#f3a75c':'#e7b867';ctx.fillRect(tower.x-23,tower.y+38,46*(tower.weapon.continuous==='laser'?1-tower.ammo/tower.weapon.capacity:tower.ammo/tower.weapon.capacity),4);
    }
    if (tower.reloadTimer > 0) {
      ctx.fillStyle = "#101922"; ctx.fillRect(tower.x-23,tower.y+38,46,4);
      ctx.fillStyle = "#f7cc6c"; ctx.fillRect(tower.x-23,tower.y+38,46*(1-tower.reloadTimer/tower.weapon.reloadSpeed),4);
    }
  });

  const inspectedTower = state.towers.find((tower) => tower.id === state.selectedTowerId);
  if (inspectedTower) {
    drawWeaponRange(ctx, inspectedTower, "rgba(246, 211, 117, 0.95)");
    if(inspectedTower.weapon.support){
      ctx.save();ctx.strokeStyle='#e0bf7466';ctx.lineWidth=2;
      for(const ally of state.towers.filter(t=>!t.weapon.support&&distance(t,inspectedTower)<=inspectedTower.range)){ctx.beginPath();ctx.moveTo(inspectedTower.x,inspectedTower.y);ctx.lineTo(ally.x,ally.y);ctx.stroke();ctx.beginPath();ctx.arc(ally.x,ally.y,31,0,TWO_PI);ctx.stroke();}ctx.restore();
    }
    drawPlacementIndicator(ctx, board, inspectedTower.row, inspectedTower.col, true);
  }

  state.projectiles.forEach((projectile) => {
    ctx.fillStyle = "#ffe57c";
    if(projectile.weaponKey==='rocket_launcher') {
      ctx.save();ctx.translate(projectile.x,projectile.y);
      ctx.rotate(Math.atan2(projectile.impactY-projectile.y,projectile.impactX-projectile.x));
      ctx.fillStyle='#ff9e38';ctx.shadowColor='#ff7934';ctx.shadowBlur=10;
      ctx.beginPath();ctx.moveTo(-22,-4);ctx.lineTo(-42,0);ctx.lineTo(-22,4);ctx.fill();
      ctx.fillStyle='#d8ded1';ctx.fillRect(-12,-4,22,8);ctx.fillStyle='#718b5d';ctx.fillRect(5,-5,10,10);ctx.restore();
    }
    if (projectile.ballistic) {
      ctx.strokeStyle = "#fff1b0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(projectile.x-projectile.vx*.025,projectile.y-projectile.vy*.025); ctx.lineTo(projectile.x,projectile.y); ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.ballistic ? 2.5 : 4, 0, TWO_PI);
    ctx.fill();
  });

  drawCombatEffects(ctx,state);

  state.enemies.forEach((enemy) => {
    drawAlien(ctx, enemy, assets);
    if(enemy.id===state.selectedEnemyId||enemy.id===state.focusEnemyId){ctx.save();ctx.strokeStyle=enemy.id===state.focusEnemyId?'#ffe08b':'#dfdfb3';ctx.lineWidth=3;ctx.beginPath();ctx.arc(enemy.x,enemy.y,Math.max(28,enemy.radius+12),0,TWO_PI);ctx.stroke();if(enemy.id===state.focusEnemyId){ctx.fillStyle='#ffe08b';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('PRIORITY',enemy.x,enemy.y-40);}ctx.restore();}

    const radius=(enemy.visualSize || 50)*.42;
    if(enemy.healer){ctx.strokeStyle="#92edb3";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(enemy.x-5,enemy.y-30);ctx.lineTo(enemy.x+5,enemy.y-30);ctx.moveTo(enemy.x,enemy.y-35);ctx.lineTo(enemy.x,enemy.y-25);ctx.stroke();if(enemy.healFlash){ctx.globalAlpha=enemy.healFlash;ctx.beginPath();ctx.arc(enemy.x,enemy.y,110*(1-enemy.healFlash/.6),0,TWO_PI);ctx.stroke();ctx.globalAlpha=1;}}
    if(enemy.immuneSlow || enemy.raged || enemy.brood) {
      const color=enemy.immuneSlow?'#72dbe2':enemy.raged?'#ff6c58':'#d4acff';
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
      if(enemy.immuneSlow)ctx.roundRect(enemy.x-radius,enemy.y-radius,radius*2,radius*2,8);
      else ctx.arc(enemy.x,enemy.y,radius,0,TWO_PI);
      ctx.stroke();
      // Compact trait badges remain legible when several aliens overlap.
      const bx=enemy.x+radius*.7,by=enemy.y-radius*.8;
      ctx.fillStyle='#102128';ctx.beginPath();ctx.arc(bx,by,9,0,TWO_PI);ctx.fill();ctx.stroke();
      ctx.fillStyle=color;ctx.font='bold 14px monospace';ctx.textAlign='center';
      ctx.fillText(enemy.immuneSlow?'×':enemy.raged?'!':'…',bx,by+4);
    }
    if(enemy.stunTimer>0) {ctx.fillStyle='#f9d77f';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('✦',enemy.x,enemy.y-radius-16);}
    if (enemy.shield > 0 || enemy.slowTimer > 0) {
      ctx.strokeStyle = enemy.shield > 0 ? "#81caff" : "#a9a4ff";
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x,enemy.y,enemy.visualSize*.48,0,TWO_PI); ctx.stroke();
      if (enemy.shield > 0) { ctx.fillStyle = "#81caff"; ctx.fillRect(enemy.x-23,enemy.y-enemy.visualSize/2-15,46*enemy.shield/enemy.maxShield,3); }
    }
  });

  state.enemies.filter((enemy) => enemy.burnTimer > 0).forEach((enemy) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 110, 38, 0.92)";
    ctx.fillStyle = "rgba(255, 78, 30, 0.12)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 9, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    for(let i=0;i<5;i++) {
      const phase=(state.visualTime*1.7+i*.19)%1;
      const x=enemy.x+Math.sin(i*2.4)*enemy.radius;
      const y=enemy.y+enemy.radius-phase*(enemy.radius*2+15);
      ctx.globalAlpha=1-phase;ctx.fillStyle=i%2?'#ff9d31':'#ffdf75';
      ctx.beginPath();ctx.ellipse(x,y,3*(1-phase)+1,7*(1-phase)+2,Math.sin(i),0,TWO_PI);ctx.fill();
    }
    ctx.restore();
  });

  if (activeStatus(state, "chronoBreak").timer > 0) {
    ctx.fillStyle = "rgba(225, 175, 62, 0.07)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for(const enemy of state.enemies) {
      ctx.save();ctx.translate(enemy.x,enemy.y);
      ctx.fillStyle='#f8cf5b55';ctx.strokeStyle='#ffe595';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,0,enemy.radius+10,enemy.radius+22,0,0,TWO_PI);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-7,-10);ctx.lineTo(7,-10);ctx.lineTo(-7,10);ctx.lineTo(7,10);ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#ffe4a0";
    ctx.font = "700 30px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("CHRONO BREAK / STASIS", ctx.canvas.width / 2, 54);
  }

  if (activeStatus(state, "napalm").timer > 0) {
    ctx.fillStyle = "rgba(255, 86, 36, 0.08)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

export function createGame({ ui, levels }) {
  const ctx = ui.canvas.getContext("2d");
  const assets = createAssetStore();
  const audio = createWeaponAudio();
  applyAssetCssVariables(document.documentElement);
  let profile = loadProfile();
  audio.sync(profile.settings.muted, true);
  let selectedLevel = levels.find(level => !profile.missions[level.id]?.clears) || levels[0];
  let selectedSector = selectedLevel.sector;
  let state = null;
  let lastTime = performance.now();

  const sectorNames = ["The Outpost", "Frozen Frontier", "Heart of the Hive"];
  const biomeColors = { outpost: "#e9ab64", frost: "#72d9ee", hive: "#c4e97a" };
  // Compare the original template, not browser-normalized HTML (e.g. disabled="").
  const renderedMarkup = new WeakMap();
  const setMarkup = (element, markup) => {
    if (renderedMarkup.get(element) === markup) return;
    element.innerHTML = markup;
    renderedMarkup.set(element, markup);
  };
  let actionsPanelKey = null;
  function mountActions(key, markup) {
    if (actionsPanelKey === key) return;
    ui.towerActions.innerHTML = markup;
    actionsPanelKey = key;
  }
  function mapPreview(level) {
    const color = biomeColors[level.biome];
    return `<svg viewBox="0 0 160 90" aria-hidden="true" class="map-preview">
      <defs><pattern id="grid-${level.id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" stroke-opacity=".06" stroke-width=".6"/></pattern></defs>
      <rect width="160" height="90" fill="url(#grid-${level.id})"/>
      ${(level.water||[]).map(tile=>`<rect x="${tile.col*10+1}" y="${tile.row*10+1}" width="8" height="8" fill="#4eabc2" opacity=".6"/>`).join("")}
      ${level.blockers.map(tile => `<rect x="${tile.col * 10 + 2}" y="${tile.row * 10 + 2}" width="6" height="6" rx="1" fill="${color}" opacity=".25"/>`).join("")}
      <polyline points="${level.track.map(tile => `${tile.col * 10 + 5},${tile.row * 10 + 5}`).join(" ")}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" opacity=".85"/>
      ${(level.speedTiles||[]).map(tile=>`<rect x="${tile.col*10+1}" y="${tile.row*10+1}" width="8" height="8" fill="#ffc14f"/><path d="m${tile.col*10+3},${tile.row*10+3} 3,2 -3,2" fill="none" stroke="#3f321c" stroke-width="1.2"/>`).join('')}
      ${level.pads.map(tile => `<circle cx="${tile.col * 10 + 5}" cy="${tile.row * 10 + 5}" r="2.8" fill="${tile.type === "power" ? "#ffc24c" : "#78e9ff"}"/>`).join("")}
      <circle cx="${level.track[0].col * 10 + 5}" cy="${level.track[0].row * 10 + 5}" r="4" fill="#ff806f"/>
      <circle cx="${level.track.at(-1).col * 10 + 5}" cy="${level.track.at(-1).row * 10 + 5}" r="4" fill="#d0f7b0"/>
    </svg>`;
  }

  function enemyRoster(level,limit=20){
    const keys=[...new Set(level.waves.flatMap(w=>w.spawns.map(s=>s.enemy)))];
    keys.sort((a,b)=>Number(['alien_medic','alien_steadfast','alien_rager','alien_broodmother'].includes(b))-Number(['alien_medic','alien_steadfast','alien_rager','alien_broodmother'].includes(a)));
    return `<div class="enemy-roster">${keys.slice(0,limit).map(key=>`<span title="${enemies[key].label}"><img src="${enemies[key].asset}" alt="">${limit>4?enemies[key].label:''}</span>`).join('')}</div>`;
  }
  function syncMenu() {
    ui.arsenalNextUnlock.textContent = nextArsenalUnlock(profile);
    ui.menuSkillsButton.innerHTML = `<span>COMMANDER / LV ${profile.level}</span><strong>${profile.skillPoints} SP available ↗</strong><i style="--xp:${Math.round(profile.xp / xpNeeded(profile.level) * 100)}%"></i>`;
    const stars = Object.values(profile.missions).reduce((total, item) => total + item.stars, 0);
    ui.campaignProgress.textContent = `CAMPAIGN RECORD / ${stars} ★ of 54`;
    ui.sectorTabs.innerHTML = sectorNames.map((name, i) => `<button type="button" data-sector="${i + 1}" class="${selectedSector === i + 1 ? "selected" : ""}" aria-pressed="${selectedSector === i + 1}"><span>0${i + 1}</span> ${name}</button>`).join("");
    ui.levelGrid.innerHTML = levels.filter(level => level.sector === selectedSector).map(level => {
      const stars = profile.missions[level.id]?.stars || 0;
      return `<button class="level-tile biome-${level.biome} ${selectedLevel?.id === level.id ? "selected" : ""}" data-level-id="${level.id}" type="button" aria-pressed="${selectedLevel?.id === level.id}" aria-label="${missionLabel(level)} ${level.name}, ${stars} of 3 stars">
        <span class="mission-number">${missionLabel(level)} <span class="mission-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span></span>
        ${mapPreview(level)}${enemyRoster(level,4)}<strong>${level.name}</strong><span>${level.rule} · ${level.waves.length} waves</span>
      </button>`;
    }).join("");
    const level = selectedLevel;
    const cleared = profile.missions[level.id]?.clears;
    ui.missionBriefing.innerHTML = `<p class="eyebrow">MISSION ${missionLabel(level)} / BRIEFING</p><h2>${level.name}</h2><p>${level.description}</p>
      <p class="eyebrow">ALIEN INTEL / THIS MISSION</p>${enemyRoster(level)}<div class="brief-stats"><div><span>Starting funds</span><strong>$${level.startGold+skillRank(profile,'supplies')*25}</strong></div><div><span>Base integrity</span><strong>${level.lives} lives</strong></div><div><span>Recommended</span><strong>Lv ${level.recommendedLevel}+</strong></div><div><span>${cleared ? "Clear reward" : "First clear"}</span><strong>+${level.clearXp + (cleared ? 0 : level.firstClearXp)} XP</strong></div></div>
      <div class="brief-tip">${cleared ? "Improve your record: 3 stars for no leaks, 2 for 60%+ lives, 1 for surviving." : "Kills and completed waves earn permanent XP, even if you lose. Each level grants 10 skill points."}</div>`;
    if(SLOT_REWARD_LEVELS.includes(level.id))ui.missionBriefing.insertAdjacentHTML('beforeend',`<div class="next-discovery">MISSION REWARD / <strong>${profile.slotRewards[level.id]?'CATEGORY SLOT CLAIMED':'+1 PERMANENT CATEGORY SLOT'}</strong><br>Awarded on victory · maximum six slots.</div>`);
    const next=nextClassUnlock(profile),nextWeapon=weapons.find(w=>w.key===next?.[0]);
    if(nextWeapon)ui.missionBriefing.insertAdjacentHTML('beforeend',`<div class="next-discovery">NEXT WEAPON / <strong>${nextWeapon.name}</strong><br>${campaignClears(profile)} / ${next[1]} different missions cleared.</div>`);
    ui.menuPlayButton.disabled = false;
    ui.menuPlayButton.textContent = `Deploy to ${missionLabel(level)} →`;
    syncHints();
  }

  const statsScreen=document.getElementById('stats-screen');
  document.getElementById('menu-stats-button').addEventListener('click',()=>{
    ui.mainMenu.classList.add('hidden');statsScreen.classList.remove('hidden');
    const total=Object.values(profile.weaponKills).reduce((n,v)=>n+v,0);
    document.getElementById('stats-total').textContent=total.toLocaleString('en-US');
    document.getElementById('stats-grid').innerHTML=weapons.map(w=>`<article class="combat-record"><img src="${weaponArt(w.key)}" alt=""><div><p>${w.role}</p><h2>${w.name}</h2><strong>${(profile.weaponKills[w.key]||0).toLocaleString('en-US')} <small>KILLS</small></strong><span>${classUnlocked(profile,w.key)?'CATEGORY DISCOVERED':classRequirement(w.key)}</span></div></article>`).join('');
    document.getElementById('stats-support').innerHTML=['drone','mines','artillery','napalm'].map(k=>`<span>${k==='drone'?'Patrol drones':k==='mines'?'Exit mines':k==='artillery'?'Artillery':'Napalm'} <b>${profile.weaponKills[k]||0}</b></span>`).join('');
    document.getElementById('stats-back-button').focus();
  });
  document.getElementById('stats-back-button').addEventListener('click',()=>{statsScreen.classList.add('hidden');ui.mainMenu.classList.remove('hidden');syncMenu();document.getElementById('menu-stats-button').focus();});

  function selectTitle(card,weapon,full,missing){card.querySelector('.weapon-select').title=full?'Category limit reached':missing?`Need $${missing} more`:`Build ${weapon.name}`;}
  function syncHints(){
    const hints=profile.onboarding;
    const research=campaignClears(profile)>0&&!hints.researchSpent&&profile.skillPoints>=4;
    for(const button of [ui.playerLevelButton,ui.menuSkillsButton,ui.resultSkillsButton])button.classList.toggle('learn-pulse',research);
    const discovery=weapons.some(w=>classUnlocked(profile,w.key)&&!hints.seenWeapons.includes(w.key));
    for(const button of [document.getElementById('field-loadout-button'),ui.menuArsenalButton,ui.resultArsenalButton])button.classList.toggle('learn-pulse',discovery);
    const upgrade=state&&!hints.towerUpgraded&&state.towers.length>0;
    ui.towerActions.querySelectorAll('[data-upgrade]').forEach(b=>b.classList.toggle('learn-pulse',Boolean(upgrade&&!b.disabled)));
    ui.abilityBar.querySelectorAll('[data-active-key]').forEach(b=>b.classList.toggle('learn-pulse',Boolean(state&&!hints.powerUsed&&!b.disabled&&state.enemies.length)));
  }

  function wavePreview() {
    const wave = currentWave(state);
    if (!wave) return "All waves cleared";
    const counts = {};
    wave.spawns.forEach(spawn => { counts[spawn.enemy] = (counts[spawn.enemy] || 0) + 1; });
    return Object.entries(counts).map(([key, count]) => `${count} ${enemies[key].label}`).join(" · ");
  }

  function syncHud() {
    if (!state) return;
    audio.sync(profile.settings.muted, state.isPaused || Boolean(state.result));
    ui.livesValue.textContent = Math.max(0, state.lives);
    const integrity = ui.livesValue.closest(".lives-chip");
    integrity.style.setProperty("--integrity", `${clamp(state.lives / state.level.lives, 0, 1) * 100}%`);
    integrity.classList.toggle("critical", state.lives <= state.level.lives / 3);
    integrity.title = `Base integrity: ${Math.max(0, state.lives)} of ${state.level.lives} lives remaining`;
    ui.goldValue.textContent = state.gold;
    ui.playerLevelValue.textContent = profile.level;
    document.getElementById("hud-skill-points").textContent = `${profile.skillPoints} SP`;
    ui.playerXpBar.style.setProperty("--xp-progress", `${Math.round((profile.xp / xpNeeded(profile.level)) * 100)}%`);
    ui.missionValue.textContent = missionLabel(state.level);
    for (const [element, current, total, label] of [
      [ui.waveValue, state.freeplay?state.endlessRound:Math.min(state.waveIndex + 1,state.level.waves.length),state.freeplay?"∞":state.level.waves.length, "Wave"],
      [ui.killsValue, state.kills, state.totalEnemies, "Eliminated"],
    ]) {
      element.querySelector("[data-count-current]").textContent = current;
      element.querySelector("[data-count-total]").textContent = total;
      element.closest(".hud-chip").title = `${label}: ${current} of ${total}`;
    }
    const waveTrack = document.getElementById("hud-wave-track");
    if (waveTrack.childElementCount !== state.level.waves.length) {
      waveTrack.replaceChildren(...state.level.waves.map(() => document.createElement("i")));
    }
    [...waveTrack.children].forEach((segment, index) => {
      segment.classList.toggle("complete", index < state.waveIndex || state.result === "victory");
      segment.classList.toggle("current", index === state.waveIndex && state.phase === "combat" && !state.result);
    });
    ui.playPauseButton.classList.toggle("play-icon", state.isPaused);
    ui.playPauseButton.classList.toggle("pause-icon", !state.isPaused);
    ui.playPauseButton.title = state.isPaused ? "Play" : "Pause";
    ui.playPauseButton.setAttribute("aria-label", state.isPaused ? "Play" : "Pause");
    const speedSprite=`assets/hud/icons/speed-${state.gameSpeed}.svg`;
    if(ui.speedToggleButton.querySelector("img").getAttribute("src")!==speedSprite)ui.speedToggleButton.querySelector("img").src=speedSprite;
    ui.speedToggleButton.querySelector("img").alt = `${state.gameSpeed}x`;
    ui.speedToggleButton.className = `control-button speed-state ${state.gameSpeed === 2 ? "fast" : "normal"}`;
    ui.speedToggleButton.setAttribute("aria-label", `Game speed ${state.gameSpeed}x. Switch to ${state.gameSpeed === 2 ? 1 : 2}x`);
    ui.speedToggleButton.title = `Game speed: ${state.gameSpeed}x`;
    ui.battleMessage.textContent = state.selectedActiveKey ? `Choose an area for ${state.selectedActiveKey==='napalm'?'Napalm':'Artillery'}` : state.messageTimer > 0 ? state.message : '';
    ui.playerLevelButton.title = `Commander Lv ${profile.level} · ${profile.xp}/${xpNeeded(profile.level)} XP · ${profile.skillPoints} SP available`;
    ui.playerLevelButton.setAttribute("aria-label", `Open skill tree. Commander level ${profile.level}, ${profile.skillPoints} skill points available`);
    ui.playerLevelButton.classList.toggle("has-points", profile.skillPoints >= 4);
    ui.soundButton.textContent = profile.settings.muted ? "Sound off" : "Sound on";
    syncAbilityBar();
    ui.weaponBar.querySelectorAll(".weapon-card").forEach((card) => {
      const weapon = weapons.find((item) => item.key === card.dataset.weaponKey);
      const selected = state.selectedWeaponKey === weapon.key;
      const locked=!classUnlocked(state.arsenalProfile,weapon.key);
      const missing = Math.max(0, weapon.price - state.gold);
      const count=state.towers.filter(t=>t.weapon.key===weapon.key).length,limit=placementLimit(profile),full=count>=limit;
      card.classList.toggle("selected", selected);
      card.classList.toggle("unaffordable", missing > 0);
      card.classList.toggle("placement-full",full);
      selectTitle(card,weapon,full,missing);
      card.removeAttribute("aria-disabled");
      const select = card.querySelector(".weapon-select");
      select.disabled=locked||full;
      select.setAttribute("aria-pressed", String(selected));
      select.setAttribute("aria-disabled", String(locked || full || missing > 0));
      // Keep the info action usable even when the weapon is unaffordable.
      card.querySelector(".weapon-state").textContent = full ? "✓" : selected ? "+" : "";
    });
    syncTowerSidebar();
    syncHints();
  }

  function weaponStatsMarkup(weapon) {
    if(weapon.economic)return '<p class="field-guide">$15 per payout · 8 combat seconds · 4 payouts per wave. Upgrade yield or automation. No income while paused or between waves.</p>';

    const stats = [
      ["Damage", weapon.directDamage],
      ["Fire mode", weapon.fireMode || "Single shot"],
      ["Fire rate", `${weapon.atkSpeed}/s${weapon.burstCount?` × ${weapon.burstCount}`:""}`],
      [weapon.continuous==='laser'?"Heat window":weapon.continuous==='flame'?"Fuel window":"Capacity",weapon.continuous?`${(weapon.capacity/weapon.atkSpeed).toFixed(1)}s`:weapon.capacity],
      [weapon.continuous==='laser'?"Cooling":"Reload", `${weapon.reloadSpeed}s`],
      ["Critical chance", `${Math.round((weapon.critChance||0)*100)}%`],
      ["Critical damage", `×${(weapon.critDamage||1.6).toFixed(2)}`],
      ["Range", weapon.range],
    ];
    return stats.map(([label, value]) => `
      <div class="weapon-stat-row">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join("");
  }

  function effectiveWeaponByKey(key) {
    return findEffectiveWeaponByKey(weapons, key, state ? { ...profile, arsenal: state.arsenalProfile.arsenal } : profile);
  }

  function refreshTowerSkillBonuses() {
    if (!state) return;
    refreshTowersWithSkills(state.towers, weapons, { ...profile, arsenal: state.arsenalProfile.arsenal });
  }

  function syncDroneSidebar(){
    const drone=state.drones.find(d=>d.id===state.selectedDroneId);if(!drone){state.selectedDroneId=null;return;}
    const stats=droneStats(drone),total=drone.upgrades.power+drone.upgrades.tactical;
    ui.towerSidebar.classList.remove('hidden');ui.towerSidebar.classList.add('inspecting-tower');ui.towerSidebarCloseButton.classList.remove('hidden');
    ui.towerSidebarTitle.textContent=`Hunter UAV ${state.drones.indexOf(drone)+1}`;
    setMarkup(ui.towerStatList,[['Damage',stats.damage],['Rate',(1/stats.interval).toFixed(1)+'/s'],['Kills',drone.kills]].map(([k,v])=>`<div class="weapon-stat-row"><span>${k}</span><strong>${v}</strong></div>`).join(''));
    mountActions(`drone:${drone.id}`,`<div class="drone-tabs">${state.drones.map((d,i)=>`<button type="button" data-select-drone="${d.id}">UAV ${i+1}</button>`).join('')}</div><div class="panel-section-label">Core upgrades <span data-drone-total></span></div>${['power','tactical'].map(key=>`<button type="button" class="upgrade-button" data-drone-upgrade="${key}"><span class="upgrade-topline"><strong>${key==='power'?'High-caliber UAV':'Motors'}</strong><small data-drone-rank></small></span><span class="upgrade-preview">${key==='power'?'+60% base damage per rank':'+20% attack speed per rank'}</span><span class="upgrade-purchase" data-drone-status></span></button>`).join('')}<div class="panel-section-label">Specialization <span>Choose one</span></div><div class="drone-paths">${['slow','burn'].map(key=>`<button type="button" class="upgrade-button" data-drone-upgrade="${key}"><img src="assets/tactics/${key==='slow'?'cryo':'burn'}.png" alt=""><strong>${key==='slow'?'Cryo rounds':'Incendiary'}</strong><small data-drone-rank></small><span class="upgrade-preview">${key==='slow'?'Slow targets':'Burn targets'}</span><span data-drone-status></span></button>`).join('')}</div><p class="upgrade-limit" data-drone-budget></p><div class="panel-section-label">Target priority</div><div class="target-buttons" role="group" aria-label="Drone target priority">${targetModes.map(m=>`<button type="button" data-target="${m.key}" title="${m.hint}"><span>${m.name}</span></button>`).join('')}</div><p class="target-description" data-target-description></p>`);
    ui.towerActions.querySelectorAll('[data-select-drone]').forEach(b=>{b.classList.toggle('selected',b.dataset.selectDrone===drone.id);b.setAttribute('aria-pressed',String(b.dataset.selectDrone===drone.id));});
    ui.towerActions.querySelectorAll('[data-target]').forEach(b=>{b.disabled=Boolean(state.result)||!targetingUnlocked(profile,b.dataset.target);b.classList.toggle('selected',b.dataset.target===drone.targeting);b.setAttribute('aria-pressed',String(b.dataset.target===drone.targeting));});
    ui.towerActions.querySelector('[data-target-description]').textContent=targetModes.find(m=>m.key===drone.targeting).hint;
    ui.towerActions.querySelector('[data-drone-total]').textContent=`${total}/4`;
    ui.towerActions.querySelector('[data-drone-budget]').textContent='Specializations are exclusive per UAV.';
    ui.towerActions.querySelectorAll('[data-drone-upgrade]').forEach(b=>{const key=b.dataset.droneUpgrade,special=['slow','burn'].includes(key),locked=special&&drone.specialization&&drone.specialization!==key,cost=droneUpgradeCost(drone,key),rank=special?drone.specialization===key?drone.specialRank:0:drone.upgrades[key],max=rank>=3||!special&&total>=4;b.disabled=Boolean(locked||max||state.gold<cost||state.result);b.classList.toggle('needs-gold',!max&&!locked&&state.gold<cost);b.classList.toggle('selected',Boolean(special&&drone.specialization===key));b.querySelector('[data-drone-rank]').textContent=rank+'/3';b.querySelector('[data-drone-status]').textContent=locked?'Other path chosen':max?'Complete':state.gold<cost?`$${cost} · need $${cost-state.gold}`:`Upgrade · $${cost}`;});
  }

  function syncTowerSidebar() {
    const inspecting=Boolean(state.selectedTowerId||state.selectedDroneId||state.selectedObstacle||state.selectedEnemyId);
    document.getElementById('tower-inspector').classList.toggle('hidden',!inspecting);
    document.getElementById('deployment-panel').classList.toggle('hidden',inspecting);

    if(state.selectedEnemyId){
      const e=state.enemies.find(e=>e.id===state.selectedEnemyId);if(e){ui.towerSidebarCloseButton.classList.remove('hidden');ui.towerSidebarTitle.textContent=e.label;setMarkup(ui.towerStatList,`<div class="alien-portrait"><img src="${e.asset}" alt=""></div>${[['HP',Math.ceil(e.life)],['Shield',Math.ceil(e.shield||0)],['Speed',Math.round(enemySpeed(e))]].map(([k,v])=>`<div class="weapon-stat-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}`);mountActions(`enemy:${e.id}`,`<p class="alien-traits">${[e.flying?'Flying · direct route · ignores mines and gas':'Ground · follows path',e.immuneSlow?'Slow immune':'',e.brood?'Spawns hatchlings':'',e.healer?'Heals nearby allies':'',e.armor?`${Math.round(e.armor*100)}% armor`:''].filter(Boolean).join('<br>')}</p><button type="button" class="rotate-tower" data-focus-alien>Mark priority target</button>`);const b=ui.towerActions.querySelector('[data-focus-alien]');b.disabled=!skillRank(profile,'focusTarget');b.textContent=state.focusEnemyId===e.id?'✓ Priority marked · cancel':skillRank(profile,'focusTarget')?'Mark priority target':'Unlock Priority Mark in Training';b.setAttribute('aria-pressed',String(state.focusEnemyId===e.id));return;}
    }
    if(state.selectedDroneId){syncDroneSidebar();return;}
    const tower = state?.towers.find(item => item.id === state.selectedTowerId);
    ui.towerSidebar.classList.remove("hidden");
    ui.towerSidebar.classList.toggle("inspecting-tower", Boolean(tower));
    ui.towerSidebarCloseButton.classList.toggle("hidden", !tower && !state.selectedObstacle);
    if (tower) {
      ui.towerSidebarTitle.textContent = tower.weapon.name;
      const overview = tower.weapon.economic?[["Earned",`$${tower.cashGenerated||0}`],["Payout",`$${tower.weapon.income}`],["Wave cap",`${tower.payouts||0}/${tower.weapon.payoutLimit}`]]:tower.weapon.support?[["Radius",tower.range],["Allies",state.towers.filter(t=>!t.weapon.support&&distance(t,tower)<=tower.range).length],["Damage boost",`+${Math.round((tower.weapon.auraDamage||0)*100)}%`]]:[["Damage",tower.weapon.directDamage.toLocaleString("en-US")],["Range",tower.range],["Kills",tower.kills||0]];
      setMarkup(ui.towerStatList,overview.map(([label,value])=>`<div class="weapon-stat-row"><span>${label}</span><strong>${value}</strong></div>`).join(''));
      // Keep controls mounted for the selected tower, including when gold/ammo changes
      // between pointerdown and pointerup. Only patch their text and availability.
      const paths = towerUpgradePathsFor(tower.weapon.key);
      mountActions(`tower:${tower.id}`, `
        ${tower.weapon.fixedAim?'<button class="rotate-tower" type="button" data-missile-aim>⌖ Set impact point</button>':''}
        ${tower.weapon.directional?'<button class="rotate-tower" type="button" data-rotate="true">↻ Rotate 90°</button>':''}
        <div class="panel-section-label upgrade-heading">Upgrades <span data-upgrade-budget></span></div>
        ${paths.map(path => `<button type="button" class="upgrade-button upgrade-${path.key}" data-upgrade="${path.key}">
          <span class="upgrade-topline"><strong>${path.name}</strong><span class="upgrade-ranks" aria-hidden="true">${Array.from({length:path.maxRank||3},(_,i)=>i).map(rank => `<i data-rank="${rank}"></i>`).join("")}</span></span>
          <span class="upgrade-preview" data-preview></span>
          <span class="upgrade-purchase"><span data-upgrade-status></span><b data-cost></b></span>
        </button>`).join("")}
        <p class="upgrade-limit" data-upgrade-limit></p>
        <div class="panel-section-label" data-target-label>Target priority</div>
        <div class="target-buttons" role="group" aria-label="Target priority">${targetModes.map(mode => `<button type="button" data-target="${mode.key}" title="${mode.key==='weakest'&&!targetingUnlocked(profile,mode.key)?'Unlock Finish the Weak in Training':mode.hint}"><span>${mode.name}</span></button>`).join("")}</div>
        <p class="target-description" data-target-description></p>
        <button type="button" class="secondary-button sell-button" data-sell="true"><span>Sell tower</span><strong data-sell-value></strong></button>
        <p class="upgrade-limit" data-refund-note></p>`);
      ui.towerActions.querySelector('.target-buttons').classList.toggle('hidden',Boolean(tower.weapon.support||tower.weapon.economic||tower.weapon.fixedAim||tower.weapon.minelayer||tower.weapon.gas));
      ui.towerActions.querySelector('[data-target-label]')?.classList.toggle('hidden',Boolean(tower.weapon.support||tower.weapon.economic||tower.weapon.fixedAim||tower.weapon.minelayer||tower.weapon.gas));
      const aimButton=ui.towerActions.querySelector('[data-missile-aim]');if(aimButton)aimButton.textContent=state.missileRetargetId===tower.id?'⌖ Click an impact tile…':'⌖ Set impact point';
      const total = tower.upgrades.power + tower.upgrades.tactical;
      ui.towerActions.querySelectorAll("[data-target]").forEach(button => {
        const selected = tower.targeting === button.dataset.target;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.disabled = Boolean(state.result)||!targetingUnlocked(profile,button.dataset.target);
      });
      ui.towerActions.querySelector("[data-target-description]").textContent = targetModes.find(mode => mode.key === tower.targeting)?.hint || targetModes[0].hint;
      ui.towerActions.querySelector("[data-upgrade-budget]").textContent = `${total} / 4`;
      paths.forEach(path => {
        const button = ui.towerActions.querySelector(`[data-upgrade="${path.key}"]`);
        const rank = tower.upgrades[path.key];
        const cost = towerUpgradeCost(tower, path.key);
        const maxRank=path.maxRank||3;
        const branchMaxed = rank >= maxRank;
        const limitReached = total >= 4;
        const unavailable = branchMaxed || limitReached || state.gold < cost || Boolean(state.result);
        button.disabled = unavailable;
        button.classList.toggle("complete", branchMaxed);
        button.classList.toggle("needs-gold", !branchMaxed && !limitReached && state.gold < cost);
        button.querySelectorAll("[data-rank]").forEach(pip => pip.classList.toggle("filled", Number(pip.dataset.rank) < rank));
        const next = applyTowerUpgrades(effectiveWeaponByKey(tower.weapon.key), { ...tower, upgrades: { ...tower.upgrades, [path.key]: rank + 1 } });
        if(!tower.weapon.support&&tower.aura){next.directDamage=Math.round(next.directDamage*(1+tower.aura.damage));next.atkSpeed=Number((next.atkSpeed*(1+tower.aura.boost)).toFixed(2));next.range=Math.round(next.range*(1+tower.aura.boost));}
        const preview = branchMaxed || limitReached ? path.detail : upgradePreview(tower.weapon,next,path.key);
        setMarkup(button.querySelector("[data-preview]"),preview.split(' · ').map(part=>`<span>${part.replace(/→ (.*)/,'→ <b>$1</b>')}</span>`).join(''));
        button.querySelector("[data-upgrade-status]").textContent = branchMaxed ? "Fully upgraded" : limitReached ? "Tower limit reached" : state.gold < cost ? `Need $${cost - state.gold} more` : "Upgrade";
        button.querySelector("[data-cost]").textContent = branchMaxed ? `${maxRank} / ${maxRank}` : limitReached ? "4 / 4" : `$${cost}`;
        button.setAttribute("aria-label", `${path.name}, rank ${rank} of ${maxRank}. ${preview}. ${button.querySelector("[data-upgrade-status]").textContent}${branchMaxed || limitReached ? "" : `, ${cost} credits`}`);
      });
      ui.towerActions.querySelector("[data-upgrade-limit]").textContent = total >= 4 ? "All 4 upgrades installed" : "4 upgrades per tower";
      ui.towerActions.querySelector("[data-sell-value]").textContent = `+$${sellValue(state, tower)}`;
      ui.towerActions.querySelector("[data-sell]").disabled = Boolean(state.result);
      ui.towerActions.querySelector("[data-refund-note]").textContent = state.waveIndex === 0 && state.phase === "prepare" ? "Full refund before the first wave." : "Returns 70% of your total investment.";
      return;
    }
    const obstacle = state.selectedObstacle;
    if (obstacle) {
      ui.towerSidebarTitle.textContent = obstacle.encounter?"Infested cargo":obstacle.cost ? "Clear this position" : "Solid rock";
      setMarkup(ui.towerStatList, `<p class="field-guide">${obstacle.encounter?"Open for free: releases 3 aliens. Defeat them for credits and XP; this tile becomes buildable.":obstacle.cost ? "Spend credits to remove this obstacle and open a new tower position. It stays cleared for this mission." : "This obstacle cannot be removed. Place towers around it."}</p>`);
      mountActions(`obstacle:${obstacle.row}:${obstacle.col}:${obstacleCost(state,obstacle)}`, obstacle.cost||obstacle.encounter ? `<button type="button" class="primary-button" data-clear="true">${obstacle.encounter?"Open cargo · FREE ⚠":"Clear obstacle · $"+obstacleCost(state,obstacle)}</button>` : "");
      const clearButton = ui.towerActions.querySelector("[data-clear]");
      if (clearButton) clearButton.disabled = state.gold < obstacleCost(state,obstacle);
      return;
    }
    setMarkup(ui.towerStatList, '');
    mountActions('idle','');
  }

  function renderWeaponBar() {
    ui.weaponBar.style.setProperty('--loadout-count',loadoutCapacity(state.arsenalProfile));
    ui.weaponBar.style.setProperty('--weapon-rows',Math.ceil(loadoutCapacity(state.arsenalProfile)/2));
    ui.weaponBar.innerHTML=equippedWeapons(weapons,state.arsenalProfile).map((weapon)=>{
      const effective=applySkillBonuses(weapon,state.arsenalProfile);
      return `<article class="weapon-card" data-weapon-key="${weapon.key}" style="--weapon-card-art:url('${new URL(assetUrl(weapon.slotCardAsset),document.baseURI).href}');--weapon-accent:${weapon.accent}">
      <button class="weapon-select" type="button" aria-label="Build ${weapon.name}, ${weapon.price} credits" aria-pressed="false">
      <span class="weapon-topline"><span class="weapon-state">READY</span><span class="weapon-price">$${weapon.price}</span></span>
      <span class="weapon-art-stage"><img class="weapon-art" src="${assetUrl(effective.hudAsset)}" alt="" draggable="false"></span>
      <span class="weapon-caption"><strong class="weapon-nickname">${weapon.key==='flamethrower'?weapon.nickname:weapon.name}</strong></span>
      </button>
      <button class="weapon-info-button" data-info-weapon-key="${weapon.key}" type="button" aria-label="Inspect ${weapon.name}">i</button></article>`;
    }).join('')+Array.from({length:Math.max(0,loadoutCapacity(state.arsenalProfile)-equippedWeapons(weapons,state.arsenalProfile).length)},()=>`<button class="empty-loadout-card" type="button" data-open-loadout><span>+</span><strong>Open category slot</strong><small>Discover more weapons →</small></button>`).join('');
  }

  function abilityStatusLabel(ability, status) {
    if (state.isPaused) return "Paused";
    if (state.phase === "prepare") return "Standby";
    if (status.timer > 0) return `${status.timer.toFixed(1)}s`;
    if (status.cooldown > 0) return `${status.cooldown.toFixed(1)}s`;
    return ability.targeting === "map" && state.selectedActiveKey === ability.key ? "Target" : "Ready";
  }

  function renderAbilityBar() {
    ui.abilityBar.innerHTML = state.equippedActiveKeys.map(key=>activeAbilities.find(a=>a.key===key)).map((ability) => {
      return `
        <button class="ability-card ability-illustrated active-${ability.key}" data-active-key="${ability.key}" type="button" title="${ability.name}">
          <img class="ability-full-art" src="${assetUrl(assetPaths.slots.activeCards[ability.key])}" alt="${ability.name}" draggable="false">
          <strong class="ability-caption">${ability.name}</strong>
          <small>Ready</small>
        </button>
      `;
    }).join("");
  }

  function syncAbilityBar() {
    ui.abilityBar.querySelectorAll("[data-active-key]").forEach((button) => {
      const ability = activeAbilities.find((item) => item.key === button.dataset.activeKey);
      if (!ability) return;
      const status = activeStatus(state, ability.key);
      const ready = status.cooldown <= 0 && status.timer <= 0;
      button.disabled = !ready || state.isPaused || (state.phase !== "combat"&&!state.enemies.length) || Boolean(state.result);
      button.classList.toggle("selected", state.selectedActiveKey === ability.key);
      button.querySelector("small").textContent = abilityStatusLabel(ability, status);
    });
  }

  function openWeaponInfo(weapon) {
    if (state) {
      state.wasPausedBeforeWeaponInfo = state.isPaused;
      state.isPaused = true;
    }
    const model=effectiveWeaponByKey(weapon.key);
    document.getElementById("weapon-customize-button").dataset.customizeWeapon=weapon.key;
    ui.weaponInfoTitle.textContent = weapon.name;
    ui.weaponInventoryGrid.innerHTML = Array.from({ length: 1 }, (_, index) => index === 0
      ? `<button class="inventory-slot selected" type="button" aria-label="Selected ${weapon.name}">
          <img class="inventory-art" src="${assetUrl(model.asset)}" alt="" draggable="false">
          <span>${weapon.name}</span>
        </button>`
      : `<button class="inventory-slot empty" type="button" aria-label="Empty inventory slot"></button>`).join("");
    ui.weaponStatList.innerHTML = `${classUnlocked(state.arsenalProfile,weapon.key)?'':`<p class="next-discovery">WEAPON TYPE LOCKED<br>${classRequirement(weapon.key)}</p>`}<p class="field-guide">${weapon.description}</p>` + weaponStatsMarkup(model);
    ui.weaponEquipButton.disabled = !state || !classUnlocked(state.arsenalProfile,weapon.key) || state.gold < weapon.price || state.towers.filter(t=>t.weapon.key===weapon.key).length>=placementLimit(profile);
    ui.weaponEquipButton.textContent = `Build · $${weapon.price}`;
    ui.weaponEquipButton.dataset.weaponKey = weapon.key;
    ui.weaponDestroyButton.classList.add("hidden");
    ui.weaponInfoModal.classList.remove("hidden");
    ui.weaponInfoCloseButton.focus();
    syncHud();
  }

  function closeWeaponInfo() {
    ui.weaponInfoModal.classList.add("hidden");
    if (state) {
      state.isPaused = state.wasPausedBeforeWeaponInfo;
      syncHud();
    }
  }

  let arsenalClass = 'handgun';
  let powerSlot = 0;
  function syncArsenal() {
    renderArsenal(ui.arsenalContent,profile,weapons,arsenalClass);
    const powers=equippedPowerKeys(profile);powerSlot=Math.min(powerSlot,powers.length-1);
    document.getElementById('power-picker').innerHTML=`<div class="power-picker-head"><h3>${powers.length===2?'Your support duo.':'Choose your power.'}</h3><span>${powers.length===2?'Independent cooldowns':'Second slot: Support → Dual Support'}</span></div>${powers.length===2?`<div class="power-slot-tabs" role="group" aria-label="Power to replace">${powers.map((key,i)=>`<button type="button" data-power-slot="${i}" class="${i===powerSlot?'selected':''}" aria-pressed="${i===powerSlot}">${i?'Secondary':'Primary'} · ${activeAbilities.find(a=>a.key===key).shortName}</button>`).join('')}</div>`:''}<div class="power-options">${activeAbilities.map(a=>`<button type="button" data-choose-power="${a.key}" class="${powers[powerSlot]===a.key?'selected':''}" aria-pressed="${powers[powerSlot]===a.key}"><img src="${assetPaths.slots.activeCards[a.key]}" alt=""><strong>${a.name}</strong><span>${a.key==='chronoBreak'?'Freeze every alien':a.key==='artillery'?'Bombard a marked area':'Burn an area over time'}</span><small>${powers[powerSlot]===a.key?'✓ EQUIPPED':powers.includes(a.key)?'SWAP POSITIONS':'SELECT'}</small></button>`).join('')}</div>`;

    document.getElementById('arsenal-restart-panel').classList.toggle('hidden',!state||Boolean(state.result));
    const deploymentConfig=p=>JSON.stringify({keys:loadoutKeys(p),slots:loadoutCapacity(p),skills:p.skills,active:equippedPowerKeys(p)});
    document.getElementById('arsenal-restart-button').disabled=Boolean(state&&deploymentConfig(state.arsenalProfile)===deploymentConfig(profile));
    ui.arsenalGoal.textContent = `COMMANDER LV ${profile.level} / ${nextArsenalUnlock(profile)}`;
  }
  function openArsenal() {
    if(state) { state.wasPausedBeforeArsenal=state.isPaused; state.isPaused=true; }
    profile.onboarding.seenWeapons=weapons.filter(w=>classUnlocked(profile,w.key)).map(w=>w.key);saveProfile(profile);
    syncArsenal(); ui.arsenalModal.classList.remove('hidden'); ui.arsenalCloseButton.focus(); syncHud();
  }
  function closeArsenal() {
    ui.arsenalModal.classList.add('hidden');
    if(state) {state.isPaused=state.wasPausedBeforeArsenal; syncHud();} else syncMenu();
    (state?(state.result?ui.resultArsenalButton:document.getElementById("field-loadout-button")):ui.menuArsenalButton).focus();
  }
  document.getElementById('field-power-button').addEventListener('click',()=>{openArsenal();document.getElementById('power-picker').scrollIntoView({block:'center'});});
  document.getElementById('power-picker').addEventListener('click',event=>{const slot=event.target.closest('[data-power-slot]');if(slot){powerSlot=Number(slot.dataset.powerSlot);syncArsenal();return;}const key=event.target.closest('[data-choose-power]')?.dataset.choosePower;if(!equipPower(profile,key,powerSlot))return;saveProfile(profile);syncArsenal();});
  document.getElementById('field-loadout-button').addEventListener('click',openArsenal);
  document.getElementById('weapon-customize-button').addEventListener('click',event=>{arsenalClass=event.currentTarget.dataset.customizeWeapon;ui.arsenalContent.dataset.slot=Math.max(0,loadoutKeys(profile).indexOf(arsenalClass));closeWeaponInfo();openArsenal();});
  document.getElementById('arsenal-restart-button').addEventListener('click',()=>{if(state&&!state.result)startLevel(state.level);});
  ui.menuArsenalButton.addEventListener('click',openArsenal);
  ui.resultArsenalButton.addEventListener('click',openArsenal);
  ui.arsenalCloseButton.addEventListener('click',closeArsenal);
  ui.arsenalModal.addEventListener('click',event=>{if(event.target===ui.arsenalModal)closeArsenal();});
  ui.arsenalContent.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.loadoutSlot!==undefined)ui.arsenalContent.dataset.slot=button.dataset.loadoutSlot;
    else if(button.dataset.equipCategory){equipCategory(profile,Number(ui.arsenalContent.dataset.slot)||0,button.dataset.equipCategory);arsenalClass=button.dataset.equipCategory;}
    saveProfile(profile);syncArsenal();
  });

  function syncDoctrine(key){ui.allowSkillRefund=!state||Boolean(state.result);renderSkillTree(ui,profile,key);}

  function openSkillTree() {
    if (state) {
      state.wasPausedBeforeSkillTree = state.isPaused;
      state.isPaused = true;
    }
    syncDoctrine();
    ui.skillTreeModal.classList.remove("hidden");
    ui.skillTreeCloseButton.focus();
    syncHud();
  }

  function closeSkillTree() {
    ui.skillTreeModal.classList.add("hidden");
    if (!state) syncMenu();
    if (state) {
      state.isPaused = state.wasPausedBeforeSkillTree;
      syncHud();
    }
  }

  function startLevel(level) {
    selectedLevel = level;
    selectedSector = level.sector;
    saveProfile(profile);
    ui.weaponInfoModal.classList.add("hidden");
    ui.skillTreeModal.classList.add("hidden");
    ui.arsenalModal.classList.add("hidden");
    state = createInitialState(level, profile, ui.canvas);
    state.audio = audio;
    actionsPanelKey = null;
    ui.mainMenu.classList.add("hidden");
    ui.gameScreen.classList.remove("hidden");
    ui.pauseModal.classList.add("hidden");
    ui.resultModal.classList.add("hidden");
    renderAbilityBar();
    renderWeaponBar();
    syncHud();
  }

  function openMenu() {
    audio.sync(profile.settings.muted, true);
    saveProfile(profile);
    state = null;
    ui.weaponInfoModal.classList.add("hidden");
    ui.skillTreeModal.classList.add("hidden");
    ui.gameScreen.classList.add("hidden");
    ui.mainMenu.classList.remove("hidden");
    ui.pauseModal.classList.add("hidden");
    ui.resultModal.classList.add("hidden");
    syncMenu();
  }

  function tryPlaceTower(row, col) {
    if (!state?.selectedWeaponKey) return;
    const tower = placeTower(state, state.selectedWeaponKey, row, col);
    if (!tower) {notify(state,state.tileSets.water.has(tileKey(row,col))?skillRank(profile,'pontoons')?'Water deployment adds a  $35 raft. Check your credits.':'Unlock Pontoon Engineering in the command graph to build on water.':'Cannot build here. Choose a free tile and check your credits.');return;}
    state.selectedTowerId = tower.weapon.fixedAim?tower.id:null;
    state.missileRetargetId=tower.weapon.fixedAim?tower.id:null;
    state.selectedWeaponKey = null;
    state.message="";state.messageTimer=0;
  }

  function showResult() {
    if (!state?.result || state.resultShown) return;
    state.resultShown = true;
    const won = state.result === "victory";
    ui.resultTitle.textContent = state.freeplay ? "Free play complete" : won ? (state.level.stage === 6 ? "Sector secured" : "Mission complete") : "Regroup. Rebuild. Return.";
    ui.resultStars.textContent = won ? "★".repeat(state.reward.stars) + "☆".repeat(3 - state.reward.stars) : "↻";
    ui.resultCopy.textContent = won ? `${state.level.name} · ${state.lives}/${state.level.lives} lives protected.` : `${state.level.name} · ${state.waveIndex} waves completed. Your earned XP is safe.`;
    ui.resultRewards.innerHTML = `${state.reward?.unlockedClasses?.map(key=>`<div class="next-discovery">NEW WEAPON TYPE / <strong>${weapons.find(w=>w.key===key).name}</strong><br>${loadoutKeys(profile).includes(key)?"Added to your loadout.":"Available in Change loadout."}</div>`).join('')||''}${state.reward?.slotReward?`<div class="next-discovery">+1 LOADOUT SLOT${state.reward.slotReward.refund?` · ${state.reward.slotReward.refund} SP returned`:""}</div>`:""}<span>${state.kills} kills recorded · ${loadoutCapacity(profile)}/6 category slots</span><strong>+${state.runXp} XP earned</strong><span>Commander Lv ${profile.level} · ${profile.skillPoints} SP available</span>${state.reward?.firstClear ? `<span>First-clear bonus included: +${state.level.firstClearXp} XP</span>` : ""}<p>${won ? "Replay for more stars, or advance to the next mission." : "Try crossfire at bends, upgrade key towers, and spend your skill points."}</p><span>${nextArsenalUnlock(profile)}</span>`;
    document.getElementById("result-freeplay-button").classList.toggle("hidden",!won||state.freeplay);
    ui.resultNextButton.classList.toggle("hidden", !won || levels.indexOf(state.level) === levels.length - 1);
    ui.resultSkillsButton.textContent = `Commander skills · ${profile.skillPoints} SP`;
    ui.resultModal.classList.remove("hidden");
    (won && levels.indexOf(state.level) < levels.length - 1 ? ui.resultNextButton : ui.resultRestartButton).focus();
  }

  ui.levelGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-level-id]");
    if (!button) return;
    selectedLevel = levels.find((level) => level.id === button.dataset.levelId);
    syncMenu();
  });

  document.getElementById('result-freeplay-button').addEventListener('click',()=>{if(beginFreeplay(state)){renderWeaponBar();renderAbilityBar();ui.resultModal.classList.add('hidden');syncHud();}});
  ui.menuPlayButton.addEventListener("click", () => startLevel(selectedLevel));

  ui.weaponBar.addEventListener("click", (event) => {
    if(event.target.closest('[data-open-loadout]')){openArsenal();return;}
    const infoButton = event.target.closest("[data-info-weapon-key]");
    if (infoButton) {
      const weapon = weapons.find((item) => item.key === infoButton.dataset.infoWeaponKey);
      if (weapon) openWeaponInfo(weapon);
      return;
    }
    const card = event.target.closest("[data-weapon-key]");
    if (!card) return;
    const weapon=weapons.find(w=>w.key===card.dataset.weaponKey);
    if(!weapon||!classUnlocked(state.arsenalProfile,weapon.key)||state.gold<weapon.price||state.towers.filter(t=>t.weapon.key===weapon.key).length>=placementLimit(profile))return;
    state.selectedWeaponKey = state.selectedWeaponKey === card.dataset.weaponKey ? null : card.dataset.weaponKey;state.selectedDroneId=null;
    state.selectedObstacle = null;
    state.selectedTowerId = null;state.selectedEnemyId=null;state.missileRetargetId=null;
    state.selectedActiveKey = null;
    syncHud();
  });

  ui.abilityBar.addEventListener("click", (event) => {
    if(event.target.closest("[data-open-doctrine]")){openSkillTree();return;}
    const button = event.target.closest("[data-active-key]");
    if (!button || button.disabled || !state) return;
    const ability = activeAbilities.find((item) => item.key === button.dataset.activeKey);
    if (!ability) return;
    if (ability.key === "chronoBreak") activateChronoBreak(state);
    if (ability.targeting === "map") {
      state.selectedActiveKey = state.selectedActiveKey === ability.key ? null : ability.key;
      state.selectedWeaponKey = null;
      state.selectedTowerId = null;
    }
    collectKilledEnemies(state);
    syncHud();
  });

  ui.weaponInfoCloseButton.addEventListener("click", closeWeaponInfo);
  ui.weaponInfoModal.addEventListener("click", (event) => {
    if (event.target === ui.weaponInfoModal) closeWeaponInfo();
  });

  ui.playerLevelButton.addEventListener("click", openSkillTree);
  ui.skillTreeCloseButton.addEventListener("click", closeSkillTree);
  ui.skillTreeModal.addEventListener("click", (event) => {
    if (event.target === ui.skillTreeModal) closeSkillTree();
  });
  ui.skillTreeNodes.addEventListener("click", (event) => {
    const node=event.target.closest('[data-select-skill]');
    if(node){
      syncDoctrine(node.dataset.selectSkill);
      if(matchMedia('(max-width:700px)').matches)ui.skillTreeNodes.querySelector('.node-inspector').scrollIntoView({block:'start'});
      else ui.skillTreeNodes.querySelector(`.graph-node[data-select-skill="${node.dataset.selectSkill}"]`)?.focus({preventScroll:true});
      return;
    }
    const branch=event.target.closest('[data-skill-branch]');
    if(branch){const first=skillTree.find(s=>s.branch===branch.dataset.skillBranch);syncDoctrine(first.key);return;}
    const equippedActiveKey = equipActiveKeyFromEvent(event);
    if (equippedActiveKey) {
      if (!isActiveAbilityKey(equippedActiveKey)||!activeUnlocked(profile,equippedActiveKey)) return;
      equipPower(profile,equippedActiveKey);
      saveProfile(profile);
      syncDoctrine();
      return;
    }
    const skillKey = skillKeyFromEvent(event);
    if (!skillKey || !buySkill(profile, skillKey)) return;
    if(skillKey==='loadoutSlots'&&state&&!state.result){
      state.arsenalProfile.skills.loadoutSlots=profile.skills.loadoutSlots;
      state.arsenalProfile.arsenal={loadout:loadoutKeys(state.arsenalProfile)};
      renderWeaponBar();
    }
    if(skillKey==='powerSlots'&&state&&!state.result){
      state.arsenalProfile.skills.powerSlots=profile.skills.powerSlots;
      // Add only the newly purchased slot; never reset an existing cooldown or power.
      state.equippedActiveKeys=equippedPowerKeys(state.arsenalProfile);
      state.arsenalProfile.equippedSecondaryActiveKey=state.equippedActiveKeys[1];
    }
    profile.equippedSecondaryActiveKey=equippedPowerKeys(profile)[1]||null;
    profile.onboarding.researchSpent=true;
    profile.arsenal={loadout:loadoutKeys(profile)};
    saveProfile(profile);
    refreshTowerSkillBonuses();
    if (state) { renderAbilityBar(); }
    syncDoctrine();
    const purchase=ui.skillTreeNodes.querySelector('.skill-purchase');
    (purchase.disabled?ui.skillTreeNodes.querySelector('.graph-node.selected'):purchase).focus({preventScroll:true});
    syncHud();
  });

  function canvasPointFromEvent(event) {
    if (!state) return;
    const rect = ui.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * ui.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * ui.canvas.height;
    return { x, y };
  }

  function canvasTileFromEvent(event) {
    const point = canvasPointFromEvent(event);
    if (!point) return null;
    const { x, y } = point;
    const col = Math.floor((x - state.board.x) / state.board.tile);
    const row = Math.floor((y - state.board.y) / state.board.tile);
    if (row < 0 || row >= state.level.rows || col < 0 || col >= state.level.cols) return null;
    return { row, col };
  }

  ui.canvas.addEventListener("mousemove", (event) => {
    if (!state) return;
    state.hoverPoint = canvasPointFromEvent(event);
    state.hoverTile = canvasTileFromEvent(event);
  });

  ui.canvas.addEventListener("mouseleave", () => {
    if (state) {
      state.hoverPoint = null;
      state.hoverTile = null;
    }
  });

  ui.canvas.addEventListener("click", (event) => {
    if (!state || state.result) return;
    const point = canvasPointFromEvent(event);
    if (state.selectedActiveKey === "artillery"||state.selectedActiveKey === "napalm") {
      if (point) {
        if(state.selectedActiveKey==='napalm')activateNapalm(state,point.x,point.y);else activateArtillery(state, point.x, point.y);
        collectKilledEnemies(state);
        syncHud();
      }
      return;
    }
    if(state.missileRetargetId){const t=state.towers.find(t=>t.id===state.missileRetargetId);if(setMissileAim(state,t,point.x,point.y)){state.missileRetargetId=null;syncHud();}return;}
    if(!state.selectedWeaponKey){const e=state.enemies.filter(e=>e.life>0&&distance(e,point)<Math.max(20,e.radius)).sort((a,b)=>distance(a,point)-distance(b,point))[0];if(e){state.selectedEnemyId=e.id;state.selectedTowerId=null;state.selectedDroneId=null;state.selectedObstacle=null;syncHud();return;}}
    state.selectedEnemyId=null;
    const tile = canvasTileFromEvent(event);
    if (!tile) return;
    const drone=state.drones.find(d=>distance(d,point)<25);
    if(!state.selectedWeaponKey&&(drone||state.drones.some(d=>d.base.row===tile.row&&d.base.col===tile.col))){
      state.selectedDroneId=drone?.id||state.drones.find(d=>d.base.row===tile.row&&d.base.col===tile.col)?.id;state.selectedTowerId=null;state.selectedObstacle=null;syncHud();return;
    }
    state.selectedDroneId=null;
    const tower = state.towers.find((item) => item.row === tile.row && item.col === tile.col);
    state.selectedObstacle = null;
    if (tower) {
      state.selectedTowerId = state.selectedTowerId === tower.id ? null : tower.id;
      state.selectedWeaponKey = null;
      syncHud();
      return;
    }
    state.selectedTowerId = null;
    const obstacle = state.level.blockers.find(item => item.row === tile.row && item.col === tile.col && state.tileSets.blockers.has(tileKey(item.row, item.col)));
    if (obstacle) { state.selectedObstacle = obstacle; state.selectedWeaponKey = null; }
    else tryPlaceTower(tile.row, tile.col);
    syncHud();
  });

  ui.playPauseButton.addEventListener("click", () => {
    if (!state || state.result) return;
    state.isPaused = !state.isPaused;
    syncHud();
  });

  ui.speedToggleButton.addEventListener("click", () => {
    if (!state) return;
    state.gameSpeed = state.gameSpeed === 1 ? 2 : 1;
    syncHud();
  });

  ui.towerSidebarCloseButton.addEventListener("click", () => {
    if (!state) return;
    state.selectedTowerId = null;state.selectedDroneId=null;state.selectedEnemyId=null;state.missileRetargetId=null;
    state.selectedObstacle = null;
    syncHud();
  });

  ui.gearButton.addEventListener("click", () => {
    if (!state) return;
    state.isPaused = true;
    ui.pauseModal.classList.remove("hidden");
    syncHud();
  });
  ui.resumeButton.addEventListener("click", () => {
    state.isPaused = false;
    ui.pauseModal.classList.add("hidden");
    syncHud();
  });
  ui.restartButton.addEventListener("click", () => startLevel(state.level));
  ui.changeLevelButton.addEventListener("click", openMenu);
  ui.resultRestartButton.addEventListener("click", () => startLevel(state.level));
  ui.resultLevelsButton.addEventListener("click", openMenu);

  ui.sectorTabs.addEventListener("click", event => {
    const button = event.target.closest("[data-sector]");
    if (!button) return;
    selectedSector = Number(button.dataset.sector);
    selectedLevel = levels.find(level => level.sector === selectedSector && !profile.missions[level.id]?.clears) || levels.find(level => level.sector === selectedSector);
    syncMenu();
  });
  ui.menuSkillsButton.addEventListener("click", openSkillTree);
  ui.resultSkillsButton.addEventListener("click", openSkillTree);
  ui.resultNextButton.addEventListener("click", () => {
    const next = levels[levels.indexOf(state.level) + 1];
    if (next) startLevel(next);
  });
  ui.resetSkillsButton.addEventListener("click", () => {
    if(state&&!state.result)return;
    resetSkills(profile);
    saveProfile(profile);
    refreshTowerSkillBonuses();
    syncDoctrine();
    if (state) { renderAbilityBar(); syncHud(); }
  });


  ui.soundButton.addEventListener("click", () => { profile.settings.muted = !profile.settings.muted; saveProfile(profile); syncHud(); });
  ui.weaponEquipButton.addEventListener("click", () => {
    const key = ui.weaponEquipButton.dataset.weaponKey;
    closeWeaponInfo();
    state.selectedWeaponKey = key;
    state.selectedTowerId = null;state.selectedDroneId=null;state.selectedEnemyId=null;state.missileRetargetId=null;
    syncHud();
  });
  ui.towerActions.addEventListener("click", event => {
    if (!state || state.result) return;
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if(button.hasAttribute('data-focus-alien')){if(skillRank(profile,'focusTarget'))state.focusEnemyId=state.focusEnemyId===state.selectedEnemyId?null:state.selectedEnemyId;syncHud();return;}
    if(button.hasAttribute('data-missile-aim')){state.missileRetargetId=state.selectedTowerId;syncHud();return;}
    if(button.dataset.selectDrone){state.selectedDroneId=button.dataset.selectDrone;syncHud();return;}
    const drone=state.drones.find(d=>d.id===state.selectedDroneId);
    if(drone){
      if(button.dataset.droneUpgrade)upgradeDrone(state,drone,button.dataset.droneUpgrade);
      if(button.dataset.target&&targetingUnlocked(profile,button.dataset.target))drone.targeting=button.dataset.target;
      syncHud();return;
    }
    const tower = state.towers.find(item => item.id === state.selectedTowerId);
    if(button.dataset.rotate&&tower?.weapon.directional){tower.angle=(tower.angle+Math.PI/2)%(Math.PI*2);syncHud();return;}
    if (button.dataset.upgrade && upgradeTower(state, tower, button.dataset.upgrade)) notify(state, `${tower.weapon.name} upgraded.`);
    if (button.dataset.target && tower && targetingUnlocked(profile,button.dataset.target)) {
      tower.targeting = button.dataset.target;
    }
    if (button.dataset.sell && tower) sellTower(state, tower);
    if (button.dataset.clear) clearObstacle(state, state.selectedObstacle);
    syncHud();
  });
  ui.weaponBar.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("button")) event.stopPropagation();
  });
  ui.towerActions.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("button")) event.stopPropagation();
  });
  document.addEventListener("keydown", event => {
    const modal = [...document.querySelectorAll(".modal-backdrop:not(.hidden)")].at(-1);
    if (modal) {
      if (event.key === "Tab") {
        const focusable = [...modal.querySelectorAll("button:not(:disabled), input, summary")].filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (!modal.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === "Escape") {
        if (modal === ui.arsenalModal) closeArsenal();
        else if (modal === ui.skillTreeModal) closeSkillTree();
        else if (modal === ui.weaponInfoModal) closeWeaponInfo();
        else if (modal === ui.pauseModal) ui.resumeButton.click();
      }
      return;
    }
    if (event.target.matches("input, select, textarea") || event.repeat) return;
    if (event.key.toLowerCase() === "f") {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    }
    if (!state || state.result) return;
    if(event.key.toLowerCase()==='r'){
      const tower=state.towers.find(t=>t.id===state.selectedTowerId);
      if(tower?.weapon.directional)tower.angle=(tower.angle+Math.PI/2)%(Math.PI*2);
      else state.buildAngle=(state.buildAngle+Math.PI/2)%(Math.PI*2);
      syncHud();
    }
    if (/^[1-6]$/.test(event.key)) ui.weaponBar.querySelectorAll(".weapon-card")[Number(event.key) - 1]?.click();
    if (event.code === "Space") {
      event.preventDefault();
      ui.playPauseButton.click();
    }
    if (["q","e"].includes(event.key.toLowerCase())) ui.abilityBar.querySelectorAll("[data-active-key]")[event.key.toLowerCase()==="q"?0:1]?.click();
    if (event.key === "Escape") {
      if (state.selectedWeaponKey || state.selectedTowerId || state.selectedDroneId || state.selectedActiveKey || state.selectedObstacle||state.selectedEnemyId||state.missileRetargetId) {
        state.selectedEnemyId=state.missileRetargetId=null;
        state.selectedWeaponKey = state.selectedTowerId = state.selectedDroneId = state.selectedActiveKey = state.selectedObstacle = null;
        syncHud();
      } else ui.gearButton.click();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state && !state.result) { state.isPaused = true; saveProfile(profile); syncHud(); }
  });
  window.addEventListener("pagehide", () => { audio.sync(true, true); saveProfile(profile); });
  const unlockAudio = () => { if (!profile.settings.muted) void audio.unlock().catch(() => {}); };
  document.addEventListener("pointerdown", unlockAudio, { capture: true });
  document.addEventListener("keydown", unlockAudio, { capture: true });

  window.render_game_to_text = () => JSON.stringify({
    mode: !document.getElementById("stats-screen").classList.contains("hidden")?"stats":ui.mainMenu.classList.contains("hidden") ? "game" : "menu",
    coordinateSystem: "canvas origin top-left, x right, y down",
    audio: audio.diagnostics(),
    board: state?.board,
    phase: state?.phase, freeplay:state?.freeplay,endlessRound:state?.endlessRound,entranceCountdown:state?Math.max(0,state.phase==='prepare'?state.waveDelay+(currentWave(state)?.spawns[0]?.at||0):(currentWave(state)?.spawns.find((s,i)=>!state.spawnedInWave.has(i))?.at||0)-state.waveTime):0,
    paused: state?.isPaused,
    gameSpeed: state?.gameSpeed,
    waveDelay: state?.waveDelay,
    runXp: state?.runXp,
    campaign: { totalMissions: levels.length, selectedSector, records: profile.missions },
    blockers: state?.level.blockers.filter(tile => state.tileSets.blockers.has(tileKey(tile.row, tile.col))),
    pads: state?.level.pads,
    selectedObstacle: state?.selectedObstacle,
    nextWave: state ? wavePreview() : null,
    selectedLevel: selectedLevel?.id,
    selectedMission: selectedLevel ? missionLabel(selectedLevel) : null,
    level: state?.level?.id,
    mission: state ? missionLabel(state.level) : null,
    lives: state?.lives,
    gold: state?.gold,
    player: { level: profile.level, xp: profile.xp, skillPoints: profile.skillPoints },
    skills: profile.skills,
    weaponKills:profile.weaponKills,runWeaponKills:state?.runWeaponKills,loadoutSlots:loadoutCapacity(profile),placementLimit:placementLimit(profile),slotRewards:profile.slotRewards,onboarding:profile.onboarding,
    classUnlocks:weapons.filter(w=>classUnlocked(profile,w.key)).map(w=>w.key),speedTiles:state?.level.speedTiles||[],loadout:state?equippedWeapons(weapons,state.arsenalProfile).map(w=>w.key):[],
    fieldMines:state?.mines, drone:state?.drone,drones:state?.drones,selectedDrone:state?.selectedDroneId,napalmField:state?.napalm,  water:state?.level.water||[],
    skillTreeOpen: !ui.skillTreeModal.classList.contains("hidden"),
    arsenalOpen: !ui.arsenalModal.classList.contains("hidden"),
    wave: state ? state.freeplay?`${state.endlessRound}/∞`:`${Math.min(state.waveIndex + 1, state.level.waves.length)}/${state.level.waves.length}` : null,
    kills: state ? `${state.kills}/${state.totalEnemies}` : null,
    selectedEnemy:state?.selectedEnemyId,focusEnemy:state?.focusEnemyId,missileRetarget:state?.missileRetargetId,pathMines:state?.pathMines,missileStrikes:state?.missileStrikes,
    selectedWeapon: state?.selectedWeaponKey,
    selectedTower: state?.selectedTowerId,
    equippedActive: state?.equippedActiveKey,
    equippedPowers: state?.equippedActiveKeys,
    nextEquippedPowers: equippedPowerKeys(profile),
    nextEquippedActive: profile.equippedActiveKey,
    selectedActive: state?.selectedActiveKey,
    activeAbilities: state ? Object.fromEntries(activeAbilities.map((ability) => [
      ability.key,
      {
        rank: abilityStats(state.arsenalProfile, ability.key).rank,
        cooldown: Number(state.activeAbilities[ability.key].cooldown.toFixed(2)),
        timer: Number(state.activeAbilities[ability.key].timer.toFixed(2)),
      },
    ])) : {},
    towers: state?.towers.map((tower) => ({
      id: tower.id,
      weapon: tower.weapon.key,
      row: tower.row,
      col: tower.col,
      range: tower.range,
      damage: tower.weapon.directDamage,
      atkSpeed: tower.weapon.atkSpeed,
      reloadSpeed: tower.weapon.reloadSpeed,
      ammo: tower.ammo,heat:tower.weapon.continuous ? Number((1-tower.ammo/tower.weapon.capacity).toFixed(2)):null,cooling:tower.reloadTimer>0&&tower.weapon.continuous==='laser',beam:tower.beamEnd||null,critChance:tower.weapon.critChance,critDamage:tower.weapon.critDamage,
      fireMode:tower.weapon.fireMode, burstCount:tower.weapon.burstCount, burstLeft:tower.burstLeft, platform:tower.platform,
      pelletCount: tower.weapon.pelletCount,
      slowStrength: tower.weapon.slowStrength,
      slowDuration: tower.weapon.slow,
      impactPoint:tower.impactPoint,cashGenerated:tower.cashGenerated,payouts:tower.payouts,gasActive:tower.gasActive,angle:tower.angle,aura:tower.aura,kills:tower.kills,pierce:tower.weapon.pierce,
      upgrades: tower.upgrades,
      invested: tower.invested,
      targeting: tower.targeting,
      pad: tower.pad,
    })) || [],
    projectiles: state?.projectiles.map(projectile => ({
      id: projectile.id, weapon: projectile.weaponKey, ballistic: projectile.ballistic,
      x: Number(projectile.x.toFixed(1)), y: Number(projectile.y.toFixed(1)),
      vx: Number(projectile.vx.toFixed(1)), vy: Number(projectile.vy.toFixed(1)),
      target: projectile.targetId,
    })) || [],
    enemies: state?.enemies.map((enemy) => ({
      id: enemy.id,
      key: enemy.key,flying:enemy.flying,
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
      life: Math.round(enemy.life),
      shield: Math.round(enemy.shield),
      onHaste:enemy.onHaste,
      slowTimer: enemy.slowTimer,
      slowStrength: enemy.slowStrength,
      immuneSlow: enemy.immuneSlow,
      stunTimer: enemy.stunTimer,
      raged: enemy.raged,
      brood: enemy.brood,
      healer:enemy.healer,
      burnTimer: Number(enemy.burnTimer.toFixed(2)),
    })) || [],
    result: state?.result,
    reward: state?.reward,
    artillery: state?.artillery,
    effects: state?.effects.map(e=>({kind:e.kind,x:e.x,y:e.y,timer:e.timer})),
    arsenal: profile.arsenal,
  });

  window.advanceTime = (ms) => {
    if (!state) return;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) stepState(state, 1 / 60);
    drawGame(ctx, state, assets);
    syncHud();
    showResult();
  };

  let lastHudTime = 0;
  let accumulator = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (state) {
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        stepState(state, 1 / 60);
        accumulator -= 1 / 60;
      }
      drawGame(ctx, state, assets);
      if (now - lastHudTime > 100) { syncHud(); lastHudTime = now; }
      showResult();
    }
    requestAnimationFrame(frame);
  }

  syncMenu();
  requestAnimationFrame(frame);
}
