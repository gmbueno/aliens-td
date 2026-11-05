import { enemies, getEnemy } from "./data/enemies.js";
import { weapons } from "./data/weapons.js";
import { xpNeeded } from "./data/player.js";
import { activeAbilities, activeAbilityStats, buySkill, isActiveAbilityKey } from "./data/skills.js";
import { assets as assetPaths } from "./data/assets.js";
import { addXp, loadProfile, saveProfile, recordVictory, resetSkills } from "./systems/profile.js";
import { applyTowerUpgrades, towerUpgradeCost, towerUpgradePaths, applySkillBonuses, effectiveWeaponByKey as findEffectiveWeaponByKey, refreshTowerSkillBonuses as refreshTowersWithSkills } from "./systems/weaponStats.js";
import { equipActiveKeyFromEvent, renderSkillTree, skillKeyFromEvent } from "./ui/skillTreeView.js";

const TWO_PI = Math.PI * 2;
const BOARD_PAD = 12;
const NEXT_WAVE_DELAY = 8;
let audioContext = null;
const ASSET_CACHE_BUSTER = "armory-20261105";

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
    loaded: false,
  };
  Promise.all([
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
    ...weapons.map((weapon) => loadImage(weapon.placedAsset).then((image) => {
      store.placedWeapons[weapon.key] = image;
    })),
    ...Object.values(enemies).map((enemy) => loadImage(enemy.asset).then((image) => {
      store.enemies[enemy.key] = image;
    })),
  ]).then(() => {
    store.loaded = true;
  });
  return store;
}

function cssUrl(src) {
  return `url('${assetUrl(src)}')`;
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

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playShotSound(weapon) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const pitch = {
    handgun: 660,
    magnum: 440,
    assault_rifle: 760,
    machine_pistol: 880,
    shotgun: 320,
    sniper: 520,
  }[weapon.key] || 620;
  const duration = weapon.key === "shotgun" ? 0.09 : weapon.key === "sniper" ? 0.12 : 0.055;

  oscillator.type = weapon.key === "magnum" || weapon.key === "shotgun" ? "sawtooth" : "square";
  oscillator.frequency.setValueAtTime(pitch, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, pitch * 0.45), now + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(420, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function awardRunXp(state, amount) {
  const before = state.profile.level;
  addXp(state.profile, amount);
  state.runXp += amount;
  if (state.profile.level > before) {
    state.message = `LEVEL ${state.profile.level} · +${(state.profile.level - before) * 10} SP! Open your skill tree.`;
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
  const healthScale = state.level.threat * (state.level.waves[state.waveIndex].healthScale || 1);
  const life = Math.round(definition.life * healthScale);
  return {
    armor: definition.armor || 0,
    shield: Math.round(life * (definition.shield || 0)),
    maxShield: Math.round(life * (definition.shield || 0)),
    xp: definition.xp || 2,
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
    gold: definition.gold,
    asset: definition.asset,
    visualSize: definition.visualSize,
    radius: definition.shape === "pentagon" ? 19 : definition.shape === "square" ? 17 : 15,
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
  return !state.isPaused && !state.result && state.phase === "combat" && state.equippedActiveKey === abilityKey && status && status.cooldown <= 0 && status.timer <= 0;
}

export function activateChronoBreak(state) {
  if (!canUseAbility(state, "chronoBreak")) return false;
  const stats = abilityStats(state.profile, "chronoBreak");
  const status = activeStatus(state, "chronoBreak");
  status.timer = stats.duration;
  status.cooldown = stats.cooldown;
  state.selectedActiveKey = null;
  return true;
}

export function activateNapalm(state) {
  if (!canUseAbility(state, "napalm")) return false;
  const stats = abilityStats(state.profile, "napalm");
  const status = activeStatus(state, "napalm");
  status.timer = stats.duration;
  status.damage = stats.damage;
  status.cooldown = stats.cooldown;
  state.enemies.forEach((enemy) => {
    enemy.burnTimer = Math.max(enemy.burnTimer, stats.duration);
    enemy.burnDamage = stats.damage;
  });
  state.selectedActiveKey = null;
  return true;
}

export function activateRocketLauncher(state, x, y) {
  if (!canUseAbility(state, "rocketLauncher")) return false;
  const stats = abilityStats(state.profile, "rocketLauncher");
  const status = activeStatus(state, "rocketLauncher");
  state.enemies.forEach((enemy) => {
    if (distance(enemy, { x, y }) <= stats.area) damageEnemy(enemy, stats.damage, 1);
  });
  state.rocketBlasts.push({ x, y, radius: stats.area, timer: 0.38, maxTimer: 0.38 });
  status.cooldown = stats.cooldown;
  state.selectedActiveKey = null;
  return true;
}

export function createInitialState(level, profile, canvas) {
  const board = createBoard(level, canvas);
  return {
    mode: "game",
    level,
    board,
    tileSets: getTileSets(level),
    path: getPathPoints(level, board),
    profile,
    gold: level.startGold,
    lives: level.lives,
    selectedWeaponKey: null,
    selectedTowerId: null,
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
    waveDelay: 0,
    spawnedInWave: new Set(),
    kills: 0,
    totalEnemies: waveTotal(level),
    runMode: "play",
    gameSpeed: 1,
    isPaused: false,
    equippedActiveKey: profile.equippedActiveKey,
    selectedActiveKey: null,
    activeAbilities: Object.fromEntries(activeAbilities.map((ability) => [ability.key, {
      cooldown: 0,
      timer: 0,
      damage: 0,
      area: 0,
    }])),
    rocketBlasts: [],
    result: null,
    message: "Choose a tower, place it beside the route, then launch the wave.",
    messageTimer: 8,
  };
}

export function targetForTower(tower, enemies) {
  const candidates = enemies.filter((enemy) => enemy.life > 0 && distance(tower, enemy) <= tower.range);
  return candidates.sort((a, b) => {
    if (tower.targeting === "strongest") return (b.life + b.shield) - (a.life + a.shield);
    if (tower.targeting === "nearest") return distance(tower, a) - distance(tower, b);
    const progressDifference = (b.segment * 1000 + b.progress) - (a.segment * 1000 + a.progress);
    return tower.targeting === "last" ? -progressDifference : progressDifference;
  })[0] || null;
}

export function damageEnemy(enemy, damage, armorPierce = 0) {
  const shieldHit = Math.min(enemy.shield, damage);
  enemy.shield -= shieldHit;
  enemy.life -= (damage - shieldHit) * (1 - enemy.armor * (1 - armorPierce));
}

function createProjectile(state, tower, target, angleOffset = 0) {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x) + angleOffset;
  state.projectiles.push({
    id: `projectile-${state.nextProjectileId++}`,
    weaponKey: tower.weapon.key,
    x: tower.x,
    y: tower.y,
    vx: Math.cos(angle) * tower.weapon.projectileSpeed,
    vy: Math.sin(angle) * tower.weapon.projectileSpeed,
    damage: tower.weapon.directDamage,
    armorPierce: tower.weapon.armorPierce || 0,
    slow: tower.weapon.slow || 0,
    speed: tower.weapon.projectileSpeed,
    targetId: target.id,
    life: 1.2,
  });
}

function fireTower(state, tower, target) {
  const pelletCount = tower.weapon.pelletCount || 1;
  const crowd = [target, ...state.enemies.filter((enemy) => enemy.id !== target.id && enemy.life > 0 && distance(tower, enemy) <= tower.range && distance(target, enemy) < 110)];
  for (let i = 0; i < pelletCount; i += 1) createProjectile(state, tower, crowd[i % Math.max(1, crowd.length)] || target);
  if (!state.profile.settings.muted) playShotSound(tower.weapon);
  tower.cooldown = 1 / tower.weapon.atkSpeed;
  tower.ammo -= 1;
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    if (tower.reloadTimer > 0) {
      tower.reloadTimer -= dt;
      if (tower.reloadTimer <= 0) tower.ammo = tower.weapon.capacity;
      continue;
    }
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.ammo <= 0) {
      tower.reloadTimer = tower.weapon.reloadSpeed;
      continue;
    }
    const target = targetForTower(tower, state.enemies);
    if (target && tower.cooldown <= 0) fireTower(state, tower, target);
  }
}

function updateEnemies(state, dt) {
  const movementDt = activeStatus(state, "chronoBreak").timer > 0 ? 0 : dt;
  for (const enemy of state.enemies) {
    const tile = state.level.track[enemy.segment];
    const onIce = state.level.slowTiles?.some((item) => item.row === tile.row && item.col === tile.col);
    let remaining = enemy.speed * movementDt * (onIce ? 0.75 : 1) * (enemy.slowTimer > 0 ? 0.75 : 1);
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    while (remaining > 0 && enemy.segment < state.path.length - 1) {
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
    if (enemy.segment >= state.path.length - 1) enemy.reachedEnd = true;
  }

  for (const enemy of state.enemies.filter((item) => item.reachedEnd)) {
    state.lives -= enemy.damage;
    state.waveLeaks += enemy.damage;
    state.leaks += 1;
    notify(state, `Breach! −${enemy.damage} lives. Cover the exit or upgrade your defense.`);
  }
  state.enemies = state.enemies.filter((item) => !item.reachedEnd);
}

function collectKilledEnemies(state) {
  const killed = state.enemies.filter((enemy) => enemy.life <= 0);
  for (const enemy of killed) {
    state.gold += enemy.gold;
    state.kills += 1;
    awardRunXp(state, enemy.xp);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.life > 0);
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.life > 0);
    if (!target) { projectile.life = 0; continue; }
    const d = distance(projectile, target);
    const travel = projectile.speed * dt;
    if (d <= travel + target.radius) {
      damageEnemy(target, projectile.damage, projectile.armorPierce);
      if (projectile.slow) target.slowTimer = projectile.slow;
      projectile.life = 0;
    } else {
      projectile.x += ((target.x - projectile.x) / d) * travel;
      projectile.y += ((target.y - projectile.y) / d) * travel;
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
  collectKilledEnemies(state);
}

function updateBurningEnemies(state, dt) {
  for (const enemy of state.enemies) {
    if (enemy.burnTimer <= 0) continue;
    damageEnemy(enemy, enemy.burnDamage * dt, 1);
    enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
  }
  collectKilledEnemies(state);
}

export function launchWave(state) {
  if (state.phase !== "prepare" || state.result || state.isPaused) return false;
  const bonus = state.waveIndex > 0 ? Math.ceil(state.waveDelay) * 2 : 0;
  state.gold += bonus;
  state.phase = "combat";
  state.waveDelay = 0;
  state.waveLeaks = 0;
  notify(state, `Wave ${state.waveIndex + 1} · ${state.level.waves[state.waveIndex].name}${bonus ? ` · +${bonus}g early launch` : ""}`);
  return true;
}

function updateWaves(state, dt) {
  if (state.waveIndex >= state.level.waves.length) return;
  if (state.phase === "prepare") {
    state.waveDelay = Math.max(0, state.waveDelay - dt);
    if (state.waveIndex > 0 && state.profile.settings.autoWave && state.waveDelay <= 0) launchWave(state);
    return;
  }
  const wave = state.level.waves[state.waveIndex];
  state.waveTime += dt;
  wave.spawns.forEach((spawn, index) => {
    if (state.waveTime >= spawn.at && !state.spawnedInWave.has(index)) {
      state.enemies.push(makeEnemy(spawn, state));
      state.spawnedInWave.add(index);
    }
  });
  if (state.spawnedInWave.size === wave.spawns.length && state.enemies.length === 0) {
    const cleanBonus = state.waveLeaks === 0 ? 15 : 0;
    state.gold += wave.reward + cleanBonus;
    awardRunXp(state, 8 + state.level.sector * 2);
    saveProfile(state.profile);
    notify(state, `Wave cleared · +${wave.reward}g supplies${cleanBonus ? " · +15g flawless defense" : ""}`);
    state.waveIndex += 1;
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
  } else if (state.waveIndex >= state.level.waves.length && state.enemies.length === 0) {
    state.result = "victory";
    state.isPaused = true;
    state.reward = recordVictory(state.profile, state.level, state.lives);
    state.runXp += state.reward.xp;
    saveProfile(state.profile);
  }
}

export function placeTower(state, weaponKey, row, col) {
  if (state.result || row < 0 || col < 0 || row >= state.level.rows || col >= state.level.cols) return null;
  const weapon = findEffectiveWeaponByKey(weapons, weaponKey, state.profile);
  const key = tileKey(row, col);
  if (!weapon || state.gold < weapon.price || state.tileSets.path.has(key) || state.tileSets.blockers.has(key) || state.towers.some(t => t.row === row && t.col === col)) return null;
  const tower = {
    id: `tower-${state.nextTowerId++}`, weapon, row, col,
    x: state.board.x + col * state.board.tile + state.board.tile / 2,
    y: state.board.y + row * state.board.tile + state.board.tile / 2,
    tile: state.board.tile, range: weapon.range, cooldown: 0, ammo: weapon.capacity, reloadTimer: 0, angle: 0,
    upgrades: { power: 0, tactical: 0 }, invested: weapon.price, targeting: "first",
    pad: state.level.pads?.find(pad => pad.row === row && pad.col === col)?.type,
  };
  tower.weapon = applyTowerUpgrades(weapon, tower);
  tower.range = tower.weapon.range;
  state.gold -= weapon.price;
  state.towers.push(tower);
  return tower;
}

export function upgradeTower(state, tower, key) {
  if (!tower || state.result || !towerUpgradePaths.some(path => path.key === key)) return false;
  const cost = towerUpgradeCost(tower, key);
  if (tower.upgrades[key] >= 3 || tower.upgrades.power + tower.upgrades.tactical >= 4 || state.gold < cost) return false;
  state.gold -= cost;
  tower.invested += cost;
  tower.upgrades[key] += 1;
  refreshTowersWithSkills(state.towers, weapons, state.profile);
  return true;
}

export function sellValue(state, tower) {
  return Math.floor(tower.invested * (state.waveIndex === 0 && state.phase === "prepare" ? 1 : 0.7));
}

export function sellTower(state, tower) {
  if (!tower || state.result || !state.towers.includes(tower)) return false;
  state.gold += sellValue(state, tower);
  state.towers = state.towers.filter(item => item !== tower);
  state.selectedTowerId = null;
  return true;
}

export function clearObstacle(state, obstacle) {
  const key = obstacle && tileKey(obstacle.row, obstacle.col);
  if (!obstacle?.cost || state.result || state.gold < obstacle.cost || !state.tileSets.blockers.has(key)) return false;
  state.gold -= obstacle.cost;
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
  state.messageTimer = Math.max(0, state.messageTimer - scaledDt);
  // Cooldowns only recover in combat: waiting between waves cannot recharge abilities for free.
  if (state.phase === "combat") Object.values(state.activeAbilities).forEach((status) => {
    status.timer = Math.max(0, status.timer - scaledDt);
    status.cooldown = Math.max(0, status.cooldown - scaledDt);
  });
  state.rocketBlasts = state.rocketBlasts
    .map((blast) => ({ ...blast, timer: blast.timer - scaledDt }))
    .filter((blast) => blast.timer > 0);
  updateWaves(state, scaledDt);
  if (state.phase === "combat") {
    updateTowers(state, scaledDt);
    updateProjectiles(state, scaledDt);
    updateBurningEnemies(state, scaledDt);
    updateEnemies(state, scaledDt);
  }
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
  const baseSize = Math.min(70, tower.tile * 0.9);
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

function drawObstacle(ctx, x, y, size, obstacle, selected) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.shadowColor = "#0009"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6;
  if (obstacle.kind === "cargo") {
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
    ctx.fillStyle = "#efd6a3"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText(`${obstacle.cost}g`, 0, size*.22 + 13);
  }
  if (selected) { ctx.strokeStyle = "#ffdd88"; ctx.lineWidth = 3; ctx.strokeRect(-size*.4,-size*.4,size*.8,size*.8); }
  ctx.restore();
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
      ctx.strokeStyle = isPath ? "rgba(247, 163, 69, 0.38)" : "rgba(90, 205, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2.5, y + 2.5, board.tile - 5, board.tile - 5);
      if (level.biome !== "outpost") {
        ctx.fillStyle = level.biome === "frost" ? (isPath ? "#61c7e04a" : "#367c9c30") : (isPath ? "#a8ba3433" : "#73844325");
        ctx.fillRect(x + 1, y + 1, board.tile - 2, board.tile - 2);
      }
      const slowTile = level.slowTiles?.some(tile => tile.row === row && tile.col === col);
      if (slowTile) {
        ctx.fillStyle = "#8deeff4a"; ctx.fillRect(x+3, y+3, board.tile-6, board.tile-6);
        ctx.fillStyle = "#d6ffff"; ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("❄", x+board.tile/2, y+board.tile/2+8);
      }
      const pad = level.pads?.find(tile => tile.row === row && tile.col === col);
      if (pad) {
        ctx.strokeStyle = pad.type === "power" ? "#ffd36a" : "#7ce1f7";
        ctx.fillStyle = pad.type === "power" ? "#dc982433" : "#61c5f233";
        ctx.lineWidth = 2; ctx.fillRect(x+9, y+9, board.tile-18, board.tile-18); ctx.strokeRect(x+9, y+9, board.tile-18, board.tile-18);
        ctx.fillStyle = ctx.strokeStyle; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillText(pad.type === "power" ? "⚡" : "⊕", x+board.tile/2, y+board.tile/2+8);
      }
      if (isBlocked) {
        const obstacle = level.blockers.find(tile => tile.row === row && tile.col === col);
        drawObstacle(ctx, x, y, board.tile, obstacle, state.selectedObstacle === obstacle);
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

  const selected = findEffectiveWeaponByKey(weapons, state.selectedWeaponKey, state.profile);
  if (selected) {
    ctx.fillStyle = "rgba(120, 226, 127, 0.12)";
    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.cols; col += 1) {
        const key = tileKey(row, col);
        const occupied = state.towers.some((tower) => tower.row === row && tower.col === col);
        if (!tileSets.path.has(key) && !tileSets.blockers.has(key) && !occupied) {
          ctx.fillRect(board.x + col * board.tile + 7, board.y + row * board.tile + 7, board.tile - 14, board.tile - 14);
        }
      }
    }
    if (state.hoverTile) {
      const key = tileKey(state.hoverTile.row, state.hoverTile.col);
      const occupied = state.towers.some((tower) => tower.row === state.hoverTile.row && tower.col === state.hoverTile.col);
      const canPlace = state.gold >= selected.price && !tileSets.path.has(key) && !tileSets.blockers.has(key) && !occupied;
      const x = board.x + state.hoverTile.col * board.tile + board.tile / 2;
      const y = board.y + state.hoverTile.row * board.tile + board.tile / 2;
      const pad = level.pads?.find(tile => tile.row === state.hoverTile.row && tile.col === state.hoverTile.col);
      drawRangeCircle(ctx, x, y, selected.range * (pad?.type === "range" ? 1.18 : 1), canPlace ? "rgba(116, 224, 108, 0.88)" : "rgba(255, 103, 125, 0.82)");
      drawPlacementIndicator(ctx, board, state.hoverTile.row, state.hoverTile.col, canPlace);
    }
  }

  if (state.selectedActiveKey === "rocketLauncher" && state.hoverPoint) {
    const stats = abilityStats(state.profile, "rocketLauncher");
    drawRangeCircle(ctx, state.hoverPoint.x, state.hoverPoint.y, stats.area, "rgba(255, 194, 76, 0.92)");
  }

  state.towers.forEach((tower) => {
    const target = targetForTower(tower, state.enemies);
    if (target) tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    drawTower(ctx, tower, assets);
    const ranks = (tower.upgrades?.power || 0) + (tower.upgrades?.tactical || 0);
    for (let i = 0; i < ranks; i++) {
      ctx.fillStyle = i < tower.upgrades.power ? "#ffc24c" : "#7ce1f7";
      ctx.fillRect(tower.x - ranks * 5 + i * 10, tower.y + 28, 7, 5);
    }
    if (tower.reloadTimer > 0) {
      ctx.fillStyle = "#101922"; ctx.fillRect(tower.x-23,tower.y+38,46,4);
      ctx.fillStyle = "#f7cc6c"; ctx.fillRect(tower.x-23,tower.y+38,46*(1-tower.reloadTimer/tower.weapon.reloadSpeed),4);
    }
  });

  const inspectedTower = state.towers.find((tower) => tower.id === state.selectedTowerId);
  if (inspectedTower) {
    drawRangeCircle(ctx, inspectedTower.x, inspectedTower.y, inspectedTower.range, "rgba(91, 206, 255, 0.88)");
    drawPlacementIndicator(ctx, board, inspectedTower.row, inspectedTower.col, true);
  }

  state.projectiles.forEach((projectile) => {
    ctx.fillStyle = "#ffe57c";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 4, 0, TWO_PI);
    ctx.fill();
  });

  state.rocketBlasts.forEach((blast) => {
    const t = clamp(blast.timer / blast.maxTimer, 0, 1);
    ctx.save();
    ctx.fillStyle = `rgba(255, 125, 40, ${0.18 * t})`;
    ctx.strokeStyle = `rgba(255, 220, 112, ${0.85 * t})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, blast.radius * (1.06 - t * 0.18), 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 242, 182, ${0.32 * t})`;
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, blast.radius * 0.18, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  });

  state.enemies.forEach((enemy) => {
    drawAlien(ctx, enemy, assets);
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
    ctx.restore();
  });

  if (activeStatus(state, "chronoBreak").timer > 0) {
    ctx.fillStyle = "rgba(116, 220, 255, 0.12)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgba(230, 251, 255, 0.84)";
    ctx.font = "700 30px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("CHRONO BREAK", ctx.canvas.width / 2, 54);
  }

  if (activeStatus(state, "napalm").timer > 0) {
    ctx.fillStyle = "rgba(255, 86, 36, 0.08)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

export function createGame({ ui, levels }) {
  const ctx = ui.canvas.getContext("2d");
  const assets = createAssetStore();
  applyAssetCssVariables(document.documentElement);
  let profile = loadProfile();
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
  const targetModes = [
    { key: "first", name: "First", icon: "↗", hint: "Closest to the exit" },
    { key: "last", name: "Last", icon: "↙", hint: "Closest to the entrance" },
    { key: "strongest", name: "Strongest", icon: "◆", hint: "Most health + shield" },
    { key: "nearest", name: "Nearest", icon: "◎", hint: "Closest to this tower" },
  ];

  function mapPreview(level) {
    const color = biomeColors[level.biome];
    return `<svg viewBox="0 0 160 90" aria-hidden="true" class="map-preview">
      <defs><pattern id="grid-${level.id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" stroke-opacity=".06" stroke-width=".6"/></pattern></defs>
      <rect width="160" height="90" fill="url(#grid-${level.id})"/>
      ${level.blockers.map(tile => `<rect x="${tile.col * 10 + 2}" y="${tile.row * 10 + 2}" width="6" height="6" rx="1" fill="${color}" opacity=".25"/>`).join("")}
      <polyline points="${level.track.map(tile => `${tile.col * 10 + 5},${tile.row * 10 + 5}`).join(" ")}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" opacity=".85"/>
      ${level.pads.map(tile => `<circle cx="${tile.col * 10 + 5}" cy="${tile.row * 10 + 5}" r="2.8" fill="${tile.type === "power" ? "#ffc24c" : "#78e9ff"}"/>`).join("")}
      <circle cx="${level.track[0].col * 10 + 5}" cy="${level.track[0].row * 10 + 5}" r="4" fill="#ff806f"/>
      <circle cx="${level.track.at(-1).col * 10 + 5}" cy="${level.track.at(-1).row * 10 + 5}" r="4" fill="#d0f7b0"/>
    </svg>`;
  }

  function syncMenu() {
    ui.menuSkillsButton.innerHTML = `<span>COMMANDER / LV ${profile.level}</span><strong>${profile.skillPoints} SP available ↗</strong><i style="--xp:${Math.round(profile.xp / xpNeeded(profile.level) * 100)}%"></i>`;
    const stars = Object.values(profile.missions).reduce((total, item) => total + item.stars, 0);
    ui.campaignProgress.textContent = `CAMPAIGN RECORD / ${stars} ★ of 54`;
    ui.sectorTabs.innerHTML = sectorNames.map((name, i) => `<button type="button" data-sector="${i + 1}" class="${selectedSector === i + 1 ? "selected" : ""}" aria-pressed="${selectedSector === i + 1}"><span>0${i + 1}</span> ${name}</button>`).join("");
    ui.levelGrid.innerHTML = levels.filter(level => level.sector === selectedSector).map(level => {
      const stars = profile.missions[level.id]?.stars || 0;
      return `<button class="level-tile biome-${level.biome} ${selectedLevel?.id === level.id ? "selected" : ""}" data-level-id="${level.id}" type="button" aria-pressed="${selectedLevel?.id === level.id}" aria-label="${missionLabel(level)} ${level.name}, ${stars} of 3 stars">
        <span class="mission-number">${missionLabel(level)} <span class="mission-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span></span>
        ${mapPreview(level)}<strong>${level.name}</strong><span>${level.rule} · ${level.waves.length} waves</span>
      </button>`;
    }).join("");
    const level = selectedLevel;
    const cleared = profile.missions[level.id]?.clears;
    ui.missionBriefing.innerHTML = `<p class="eyebrow">MISSION ${missionLabel(level)} / BRIEFING</p><h2>${level.name}</h2><p>${level.description}</p>
      <div class="brief-stats"><div><span>Starting funds</span><strong>${level.startGold}g</strong></div><div><span>Base integrity</span><strong>${level.lives} lives</strong></div><div><span>Recommended</span><strong>Lv ${level.recommendedLevel}+</strong></div><div><span>${cleared ? "Clear reward" : "First clear"}</span><strong>+${level.clearXp + (cleared ? 0 : level.firstClearXp)} XP</strong></div></div>
      <div class="brief-tip">${cleared ? "Improve your record: 3 stars for no leaks, 2 for 60%+ lives, 1 for surviving." : "Kills and completed waves earn permanent XP, even if you lose. Each level grants 10 skill points."}</div>`;
    ui.menuPlayButton.disabled = false;
    ui.menuPlayButton.textContent = `Deploy to ${missionLabel(level)} →`;
  }

  function wavePreview() {
    const wave = state.level.waves[state.waveIndex];
    if (!wave) return "All waves cleared";
    const counts = {};
    wave.spawns.forEach(spawn => { counts[spawn.enemy] = (counts[spawn.enemy] || 0) + 1; });
    return Object.entries(counts).map(([key, count]) => `${count} ${enemies[key].label}`).join(" · ");
  }

  function syncHud() {
    if (!state) return;
    ui.livesValue.textContent = Math.max(0, state.lives);
    ui.goldValue.textContent = state.gold;
    ui.playerLevelValue.textContent = profile.level;
    ui.playerLevelButton.querySelector(".readout-label").textContent = profile.skillPoints ? `COMMANDER / ${profile.skillPoints} SP` : "COMMANDER";
    ui.playerXpBar.style.setProperty("--xp-progress", `${Math.round((profile.xp / xpNeeded(profile.level)) * 100)}%`);
    ui.missionValue.textContent = missionLabel(state.level);
    ui.waveValue.textContent = `${Math.min(state.waveIndex + 1, state.level.waves.length)} / ${state.level.waves.length}`;
    ui.killsValue.textContent = `${state.kills} / ${state.totalEnemies}`;
    ui.playPauseButton.classList.toggle("play-icon", state.isPaused);
    ui.playPauseButton.classList.toggle("pause-icon", !state.isPaused);
    ui.playPauseButton.title = state.isPaused ? "Play" : "Pause";
    ui.playPauseButton.setAttribute("aria-label", state.isPaused ? "Play" : "Pause");
    ui.speedToggleButton.textContent = `${state.gameSpeed}x`;
    ui.speedToggleButton.className = `control-button speed-state ${state.gameSpeed === 2 ? "fast" : "normal"}`;
    ui.battleTitle.textContent = `${missionLabel(state.level)} / ${state.level.name}`;
    ui.wavePreview.textContent = `${state.phase === "prepare" ? "UP NEXT" : "INCOMING"} · ${wavePreview()}`;
    ui.launchWaveButton.disabled = state.phase !== "prepare" || state.isPaused || Boolean(state.result);
    const bonus = state.waveIndex > 0 && state.waveDelay > 0 ? ` (+${Math.ceil(state.waveDelay) * 2}g)` : "";
    ui.launchWaveButton.textContent = state.phase === "combat" ? "Wave in progress" : `Launch wave ${state.waveIndex + 1}${bonus}`;
    ui.autoWaveToggle.checked = profile.settings.autoWave;
    ui.battleMessage.textContent = state.messageTimer > 0 ? state.message : state.selectedActiveKey ? "Choose the blast location. Escape to cancel." : state.selectedWeaponKey ? "Choose a free tile. Blue pads extend range; amber pads boost damage." : state.phase === "prepare" ? "Prepare your defense. Click a tower to upgrade it or a crate to clear space." : "Click a tower to upgrade, change target, or sell.";
    ui.playerLevelButton.title = `Commander Lv ${profile.level} · ${profile.xp}/${xpNeeded(profile.level)} XP · ${profile.skillPoints} SP available`;
    ui.playerLevelButton.classList.toggle("has-points", profile.skillPoints >= 5);
    ui.soundButton.textContent = profile.settings.muted ? "Sound off" : "Sound on";
    syncAbilityBar();
    ui.weaponBar.querySelectorAll(".weapon-card").forEach((card) => {
      const weapon = weapons.find((item) => item.key === card.dataset.weaponKey);
      const selected = state.selectedWeaponKey === weapon.key;
      const missing = Math.max(0, weapon.price - state.gold);
      card.classList.toggle("selected", selected);
      card.classList.toggle("unaffordable", missing > 0);
      card.setAttribute("aria-disabled", String(missing > 0));
      const select = card.querySelector(".weapon-select");
      select.setAttribute("aria-pressed", String(selected));
      select.setAttribute("aria-disabled", String(missing > 0));
      // Keep the info action usable even when the weapon is unaffordable.
      card.querySelector(".weapon-state").textContent = selected ? "PLACE ON MAP" : missing > 0 ? `NEED ${missing}g` : "READY";
    });
    syncTowerSidebar();
  }

  function weaponStatsMarkup(weapon) {
    const stats = [
      ["Damage", weapon.directDamage],
      ["ATK Speed", `${weapon.atkSpeed}/s`],
      ["Capacity", weapon.capacity],
      ["Reload Time", `${weapon.reloadSpeed}s`],
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
    return findEffectiveWeaponByKey(weapons, key, profile);
  }

  function refreshTowerSkillBonuses() {
    if (!state) return;
    refreshTowersWithSkills(state.towers, weapons, profile);
  }

  function syncTowerSidebar() {
    const tower = state?.towers.find(item => item.id === state.selectedTowerId);
    ui.towerSidebar.classList.remove("hidden");
    ui.towerSidebar.classList.toggle("inspecting-tower", Boolean(tower));
    ui.towerSidebarCloseButton.classList.toggle("hidden", !tower && !state.selectedObstacle);
    if (tower) {
      ui.towerSidebarTitle.textContent = tower.weapon.name;
      const overview = [
        ["Damage", tower.weapon.directDamage.toLocaleString("en-US")],
        ["Fire rate", `${tower.weapon.atkSpeed}/s`],
        ["Range", tower.range],
        [tower.reloadTimer > 0 ? "Reloading" : "Ammo", tower.reloadTimer > 0 ? `${tower.reloadTimer.toFixed(1)}s` : `${tower.ammo} / ${tower.weapon.capacity}`],
      ];
      setMarkup(ui.towerStatList, `<p class="tower-role">${tower.weapon.role}${tower.pad ? ` · ${tower.pad === "range" ? "+18% range pad" : "+15% damage pad"}` : ""}</p>${overview.map(([label, value]) => `<div class="weapon-stat-row"><span>${label}</span><strong>${value}</strong></div>`).join("")}`);
      // Keep controls mounted for the selected tower, including when gold/ammo changes
      // between pointerdown and pointerup. Only patch their text and availability.
      mountActions(`tower:${tower.id}`, `
        <div class="panel-section-label">TARGET PRIORITY <span>Firing order</span></div>
        <div class="target-buttons" role="group" aria-label="Target priority">${targetModes.map(mode => `<button type="button" data-target="${mode.key}" title="${mode.hint}"><i aria-hidden="true">${mode.icon}</i><span>${mode.name}</span></button>`).join("")}</div>
        <p class="target-description" data-target-description></p>
        <div class="panel-section-label upgrade-heading">FIELD UPGRADES <span data-upgrade-budget></span></div>
        ${towerUpgradePaths.map(path => `<button type="button" class="upgrade-button upgrade-${path.key}" data-upgrade="${path.key}">
          <span class="upgrade-topline"><strong>${path.name}</strong><span class="upgrade-ranks" aria-hidden="true">${[0,1,2].map(rank => `<i data-rank="${rank}"></i>`).join("")}</span></span>
          <span class="upgrade-preview" data-preview></span>
          <span class="upgrade-purchase"><span data-upgrade-status></span><b data-cost></b></span>
        </button>`).join("")}
        <p class="upgrade-limit" data-upgrade-limit></p>
        <button type="button" class="secondary-button sell-button" data-sell="true"><span>Sell tower</span><strong data-sell-value></strong></button>
        <p class="upgrade-limit" data-refund-note></p>`);
      const total = tower.upgrades.power + tower.upgrades.tactical;
      ui.towerActions.querySelectorAll("[data-target]").forEach(button => {
        const selected = tower.targeting === button.dataset.target;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
        button.disabled = Boolean(state.result);
      });
      ui.towerActions.querySelector("[data-target-description]").textContent = targetModes.find(mode => mode.key === tower.targeting)?.hint || targetModes[0].hint;
      ui.towerActions.querySelector("[data-upgrade-budget]").textContent = `${total} / 4 installed`;
      towerUpgradePaths.forEach(path => {
        const button = ui.towerActions.querySelector(`[data-upgrade="${path.key}"]`);
        const rank = tower.upgrades[path.key];
        const cost = towerUpgradeCost(tower, path.key);
        const branchMaxed = rank >= 3;
        const limitReached = total >= 4;
        const unavailable = branchMaxed || limitReached || state.gold < cost || Boolean(state.result);
        button.disabled = unavailable;
        button.classList.toggle("complete", branchMaxed);
        button.classList.toggle("needs-gold", !branchMaxed && !limitReached && state.gold < cost);
        button.querySelectorAll("[data-rank]").forEach(pip => pip.classList.toggle("filled", Number(pip.dataset.rank) < rank));
        const next = applyTowerUpgrades(effectiveWeaponByKey(tower.weapon.key), { ...tower, upgrades: { ...tower.upgrades, [path.key]: rank + 1 } });
        const preview = branchMaxed || limitReached ? path.detail : path.key === "power"
          ? `Damage ${tower.weapon.directDamage.toLocaleString("en-US")} → ${next.directDamage.toLocaleString("en-US")}`
          : `Range ${tower.range} → ${next.range} · Rate ${tower.weapon.atkSpeed} → ${next.atkSpeed}/s`;
        button.querySelector("[data-preview]").textContent = preview;
        button.querySelector("[data-upgrade-status]").textContent = branchMaxed ? "Fully upgraded" : limitReached ? "Tower limit reached" : state.gold < cost ? `Need ${cost - state.gold}g more` : "Upgrade";
        button.querySelector("[data-cost]").textContent = branchMaxed ? "3 / 3" : limitReached ? "4 / 4" : `${cost}g`;
        button.setAttribute("aria-label", `${path.name}, rank ${rank} of 3. ${preview}. ${button.querySelector("[data-upgrade-status]").textContent}${branchMaxed || limitReached ? "" : `, ${cost} gold`}`);
      });
      ui.towerActions.querySelector("[data-upgrade-limit]").textContent = total >= 4 ? "All 4 upgrades installed on this tower." : "Choose 4 upgrades total · up to 3 in one branch.";
      ui.towerActions.querySelector("[data-sell-value]").textContent = `+${sellValue(state, tower)}g`;
      ui.towerActions.querySelector("[data-sell]").disabled = Boolean(state.result);
      ui.towerActions.querySelector("[data-refund-note]").textContent = state.waveIndex === 0 && state.phase === "prepare" ? "Full refund before the first wave." : "Returns 70% of your total investment.";
      return;
    }
    const obstacle = state.selectedObstacle;
    if (obstacle) {
      ui.towerSidebarTitle.textContent = obstacle.cost ? "Clear this position" : "Solid rock";
      setMarkup(ui.towerStatList, `<p class="field-guide">${obstacle.cost ? "Spend gold to remove this obstacle and open a new tower position. It stays cleared for this mission." : "This obstacle cannot be removed. Place towers around it."}</p>`);
      mountActions(`obstacle:${obstacle.row}:${obstacle.col}`, obstacle.cost ? `<button type="button" class="primary-button" data-clear="true">Clear obstacle · ${obstacle.cost}g</button>` : "");
      const clearButton = ui.towerActions.querySelector("[data-clear]");
      if (clearButton) clearButton.disabled = state.gold < obstacle.cost;
      return;
    }
    ui.towerSidebarTitle.textContent = state.phase === "prepare" ? "Plan your defense" : "Hold the line";
    const wave = state.level.waves[state.waveIndex];
    const types = [...new Set(wave?.spawns.map(spawn => spawn.enemy))];
    const tips = { alien_normal: "Scout · reliable fire wears it down.", alien_fast: "Skitter · fast and fragile. Cover the exit.", alien_tank: "Bulwark · 35% armor. Magnum or Sniper.", alien_shielded: "Shielded · extra shield absorbs hits first.", alien_boss: "Overseer · set heavy towers to Strongest.", alien_saucer: "Mothership · shields, armor, lethal breach." };
    setMarkup(ui.towerStatList, `<p class="field-guide">${state.level.description}</p><div class="enemy-intel">${types.map(key => `<div><img src="${assetUrl(enemies[key].asset)}" alt=""><span>${tips[key]}</span></div>`).join("")}</div>`);
    mountActions(`guide:${state.level.id}:${profile.skillPoints}`, `<div class="map-legend"><span><i class="range-dot"></i> Sensor pad: +18% range</span><span><i class="power-dot"></i> Power pad: +15% damage</span>${state.level.biome === "frost" ? "<span>❄ Frozen route: aliens 25% slower</span>" : ""}<span>▧ Crates: click to clear</span></div><p class="upgrade-limit">${profile.skillPoints >= 5 ? `${profile.skillPoints} SP available. Open the commander badge to upgrade.` : "3 stars = no leaks · 2 stars = 60% lives"}</p>`);
  }

  function renderWeaponBar() {
    ui.weaponBar.innerHTML = weapons.map((weapon, index) => `
      <article class="weapon-card" data-weapon-key="${weapon.key}" style="--weapon-accent: ${weapon.accent}">
        <button class="weapon-select" type="button" aria-label="Build ${weapon.name}, ${weapon.price} gold" aria-pressed="false">
          <span class="weapon-topline"><kbd>${index + 1}</kbd><span class="weapon-state">READY</span></span>
          <span class="weapon-art-stage"><img class="weapon-art" src="${assetUrl(weapon.hudAsset)}" alt="" draggable="false"></span>
          <span class="weapon-caption"><strong class="weapon-nickname">${weapon.nickname}</strong><span class="weapon-price">${weapon.price}<small>g</small></span></span>
          <span class="weapon-role">${weapon.role}</span>
        </button>
        <button class="weapon-info-button" data-info-weapon-key="${weapon.key}" type="button" aria-label="View ${weapon.name} attributes">i</button>
      </article>
    `).join("");
  }

  function abilityStatusLabel(ability, status) {
    if (state.isPaused) return "Paused";
    if (state.phase === "prepare") return "Standby";
    if (status.timer > 0) return `${status.timer.toFixed(1)}s`;
    if (status.cooldown > 0) return `${status.cooldown.toFixed(1)}s`;
    return ability.targeting === "map" && state.selectedActiveKey === ability.key ? "Target" : "Ready";
  }

  function renderAbilityBar() {
    const equippedAbility = activeAbilities.find((ability) => ability.key === state.equippedActiveKey);
    ui.abilityBar.innerHTML = [equippedAbility].filter(Boolean).map((ability) => {
      const stats = abilityStats(profile, ability.key);
      return `
        <button class="ability-card active-${ability.key}" data-active-key="${ability.key}" type="button" title="${ability.name}">
          <span class="ability-topline"><kbd>Q</kbd><span>ACTIVE / ${stats.rank}</span></span>
          <span class="ability-art-stage"><img src="${assetUrl(assetPaths.slots.activeCards[ability.key])}" alt="" draggable="false"></span>
          <strong>${ability.name}</strong>
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
      button.disabled = !ready || state.isPaused || state.phase !== "combat" || Boolean(state.result);
      button.classList.toggle("selected", state.selectedActiveKey === ability.key);
      button.querySelector("small").textContent = abilityStatusLabel(ability, status);
    });
  }

  function openWeaponInfo(weapon) {
    if (state) {
      state.wasPausedBeforeWeaponInfo = state.isPaused;
      state.isPaused = true;
    }
    ui.weaponInfoTitle.textContent = weapon.name;
    ui.weaponInventoryGrid.innerHTML = Array.from({ length: 1 }, (_, index) => index === 0
      ? `<button class="inventory-slot selected" type="button" aria-label="Selected ${weapon.name}">
          <img class="inventory-art" src="${assetUrl(weapon.asset)}" alt="" draggable="false">
          <span>${weapon.nickname}</span>
        </button>`
      : `<button class="inventory-slot empty" type="button" aria-label="Empty inventory slot"></button>`).join("");
    ui.weaponStatList.innerHTML = `<p class="field-guide">${weapon.description}</p>` + weaponStatsMarkup(applySkillBonuses(weapon, profile));
    ui.weaponEquipButton.disabled = !state || state.gold < weapon.price;
    ui.weaponEquipButton.textContent = `Build · ${weapon.price}g`;
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

  function openSkillTree() {
    if (state) {
      state.wasPausedBeforeSkillTree = state.isPaused;
      state.isPaused = true;
    }
    renderSkillTree(ui, profile);
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
    state = createInitialState(level, profile, ui.canvas);
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
    if (!tower) { notify(state, "Cannot build here. Choose a free tile and check your gold."); return; }
    state.selectedTowerId = null;
    state.selectedWeaponKey = null;
    notify(state, `${tower.weapon.name} ready${tower.pad ? " · platform bonus active" : ""}. Click it to upgrade.`);
  }

  function showResult() {
    if (!state?.result || state.resultShown) return;
    state.resultShown = true;
    const won = state.result === "victory";
    ui.resultTitle.textContent = won ? (state.level.stage === 6 ? "Sector secured" : "Mission complete") : "Regroup. Rebuild. Return.";
    ui.resultStars.textContent = won ? "★".repeat(state.reward.stars) + "☆".repeat(3 - state.reward.stars) : "↻";
    ui.resultCopy.textContent = won ? `${state.level.name} · ${state.lives}/${state.level.lives} lives protected.` : `${state.level.name} · ${state.waveIndex} waves completed. Your earned XP is safe.`;
    ui.resultRewards.innerHTML = `<strong>+${state.runXp} XP earned</strong><span>Commander Lv ${profile.level} · ${profile.skillPoints} SP available</span>${state.reward?.firstClear ? `<span>First-clear bonus included: +${state.level.firstClearXp} XP</span>` : ""}<p>${won ? "Replay for more stars, or advance to the next mission." : "Try crossfire at bends, upgrade key towers, and spend your skill points."}</p>`;
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

  ui.menuPlayButton.addEventListener("click", () => startLevel(selectedLevel));

  ui.weaponBar.addEventListener("click", (event) => {
    const infoButton = event.target.closest("[data-info-weapon-key]");
    if (infoButton) {
      const weapon = weapons.find((item) => item.key === infoButton.dataset.infoWeaponKey);
      if (weapon) openWeaponInfo(weapon);
      return;
    }
    const card = event.target.closest("[data-weapon-key]");
    if (!card || card.getAttribute("aria-disabled") === "true") return;
    state.selectedWeaponKey = state.selectedWeaponKey === card.dataset.weaponKey ? null : card.dataset.weaponKey;
    state.selectedObstacle = null;
    state.selectedTowerId = null;
    state.selectedActiveKey = null;
    syncHud();
  });

  ui.abilityBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-active-key]");
    if (!button || button.disabled || !state) return;
    const ability = activeAbilities.find((item) => item.key === button.dataset.activeKey);
    if (!ability) return;
    if (ability.key === "chronoBreak") activateChronoBreak(state);
    if (ability.key === "napalm") activateNapalm(state);
    if (ability.key === "rocketLauncher") {
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
    const equippedActiveKey = equipActiveKeyFromEvent(event);
    if (equippedActiveKey) {
      if (!isActiveAbilityKey(equippedActiveKey)) return;
      profile.equippedActiveKey = equippedActiveKey;
      saveProfile(profile);
      renderSkillTree(ui, profile);
      return;
    }
    const skillKey = skillKeyFromEvent(event);
    if (!skillKey || !buySkill(profile, skillKey)) return;
    saveProfile(profile);
    refreshTowerSkillBonuses();
    if (state) renderAbilityBar();
    renderSkillTree(ui, profile);
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
    if (state.selectedActiveKey === "rocketLauncher") {
      if (point) {
        activateRocketLauncher(state, point.x, point.y);
        collectKilledEnemies(state);
        syncHud();
      }
      return;
    }
    const tile = canvasTileFromEvent(event);
    if (!tile) return;
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
    state.selectedTowerId = null;
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
    resetSkills(profile);
    saveProfile(profile);
    refreshTowerSkillBonuses();
    renderSkillTree(ui, profile);
    if (state) { renderAbilityBar(); syncHud(); }
  });
  ui.launchWaveButton.addEventListener("click", () => { launchWave(state); syncHud(); });
  ui.autoWaveToggle.addEventListener("change", () => { profile.settings.autoWave = ui.autoWaveToggle.checked; saveProfile(profile); });
  ui.soundButton.addEventListener("click", () => { profile.settings.muted = !profile.settings.muted; saveProfile(profile); syncHud(); });
  ui.weaponEquipButton.addEventListener("click", () => {
    const key = ui.weaponEquipButton.dataset.weaponKey;
    closeWeaponInfo();
    state.selectedWeaponKey = key;
    state.selectedTowerId = null;
    syncHud();
  });
  ui.towerActions.addEventListener("click", event => {
    if (!state || state.result) return;
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const tower = state.towers.find(item => item.id === state.selectedTowerId);
    if (button.dataset.upgrade && upgradeTower(state, tower, button.dataset.upgrade)) notify(state, `${tower.weapon.name} upgraded.`);
    if (button.dataset.target && tower && targetModes.some(mode => mode.key === button.dataset.target)) {
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
        const focusable = [...modal.querySelectorAll("button:not(:disabled), input")].filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (!modal.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === "Escape") {
        if (modal === ui.skillTreeModal) closeSkillTree();
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
    if (/^[1-6]$/.test(event.key)) ui.weaponBar.querySelectorAll(".weapon-card")[Number(event.key) - 1]?.click();
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "prepare" && !state.isPaused) ui.launchWaveButton.click();
      else ui.playPauseButton.click();
    }
    if (event.key.toLowerCase() === "q") ui.abilityBar.querySelector("button")?.click();
    if (event.key === "Escape") {
      if (state.selectedWeaponKey || state.selectedTowerId || state.selectedActiveKey || state.selectedObstacle) {
        state.selectedWeaponKey = state.selectedTowerId = state.selectedActiveKey = state.selectedObstacle = null;
        syncHud();
      } else ui.gearButton.click();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state && !state.result) { state.isPaused = true; saveProfile(profile); syncHud(); }
  });
  window.addEventListener("pagehide", () => saveProfile(profile));

  window.render_game_to_text = () => JSON.stringify({
    mode: ui.mainMenu.classList.contains("hidden") ? "game" : "menu",
    coordinateSystem: "canvas origin top-left, x right, y down",
    board: state?.board,
    phase: state?.phase,
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
    skillTreeOpen: !ui.skillTreeModal.classList.contains("hidden"),
    wave: state ? `${Math.min(state.waveIndex + 1, state.level.waves.length)}/${state.level.waves.length}` : null,
    kills: state ? `${state.kills}/${state.totalEnemies}` : null,
    selectedWeapon: state?.selectedWeaponKey,
    selectedTower: state?.selectedTowerId,
    equippedActive: state?.equippedActiveKey,
    nextEquippedActive: profile.equippedActiveKey,
    selectedActive: state?.selectedActiveKey,
    activeAbilities: state ? Object.fromEntries(activeAbilities.map((ability) => [
      ability.key,
      {
        rank: abilityStats(profile, ability.key).rank,
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
      ammo: tower.ammo,
      upgrades: tower.upgrades,
      invested: tower.invested,
      targeting: tower.targeting,
      pad: tower.pad,
    })) || [],
    enemies: state?.enemies.map((enemy) => ({
      key: enemy.key,
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
      life: Math.round(enemy.life),
      shield: Math.round(enemy.shield),
      slowTimer: enemy.slowTimer,
      burnTimer: Number(enemy.burnTimer.toFixed(2)),
    })) || [],
    result: state?.result,
    reward: state?.reward,
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
