import { enemies, getEnemy } from "./data/enemies.js";
import { weapons } from "./data/weapons.js";
import { xpNeeded } from "./data/player.js";
import { buySkill } from "./data/skills.js";
import { assets as assetPaths } from "./data/assets.js";
import { addXp, loadProfile, saveProfile } from "./systems/profile.js";
import { applySkillBonuses, effectiveWeaponByKey as findEffectiveWeaponByKey, refreshTowerSkillBonuses as refreshTowersWithSkills } from "./systems/weaponStats.js";
import { renderSkillTree, skillKeyFromEvent } from "./ui/skillTreeView.js";

const TWO_PI = Math.PI * 2;
const BOARD_PAD = 12;
const NEXT_WAVE_DELAY = 2.2;
const TIME_STOP = { duration: 4, cooldown: 20, price: 0 };
let audioContext = null;
const ASSET_CACHE_BUSTER = Date.now().toString(36);

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
    "--time-stop-card": assetPaths.slots.timeStopCard,
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

function awardXp(profile, amount) {
  addXp(profile, amount);
  saveProfile(profile);
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
  return `1-${missionNumber}`;
}

function makeEnemy(spawn, state) {
  const definition = getEnemy(spawn.enemy);
  return {
    id: `enemy-${state.nextEnemyId++}`,
    key: definition.key,
    label: definition.label,
    shape: definition.shape,
    color: definition.color,
    life: definition.life,
    maxLife: definition.life,
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
    reachedEnd: false,
  };
}

function createInitialState(level, profile, canvas) {
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
    hoverTile: null,
    towers: [],
    enemies: [],
    projectiles: [],
    nextTowerId: 0,
    nextEnemyId: 0,
    nextProjectileId: 0,
    waveIndex: 0,
    waveTime: 0,
    waveDelay: 0,
    spawnedInWave: new Set(),
    kills: 0,
    totalEnemies: waveTotal(level),
    runMode: "play",
    gameSpeed: 1,
    isPaused: false,
    timeStopTimer: 0,
    timeStopCooldown: 0,
    result: null,
    message: "Select a weapon, then click a free tile.",
  };
}

function targetForTower(tower, enemies) {
  let best = null;
  let bestProgress = -1;
  for (const enemy of enemies) {
    const inRange = distance(tower, enemy) <= tower.range;
    const progressScore = enemy.segment * 1000 + enemy.progress;
    if (inRange && progressScore > bestProgress) {
      best = enemy;
      bestProgress = progressScore;
    }
  }
  return best;
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
    targetId: target.id,
    life: 1.2,
  });
}

function fireTower(state, tower, target) {
  const pelletCount = tower.weapon.pelletCount || 1;
  const spread = tower.weapon.spread || 0;
  if (pelletCount === 1) {
    createProjectile(state, tower, target);
  } else {
    const center = (pelletCount - 1) / 2;
    for (let i = 0; i < pelletCount; i += 1) {
      createProjectile(state, tower, target, (i - center) * spread);
    }
  }
  playShotSound(tower.weapon);
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
  const movementDt = state.timeStopTimer > 0 ? 0 : dt;
  for (const enemy of state.enemies) {
    let remaining = enemy.speed * movementDt;
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
  }
  state.enemies = state.enemies.filter((item) => !item.reachedEnd);
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    const hit = state.enemies.find((enemy) => distance(projectile, enemy) <= enemy.radius + 4);
    if (hit) {
      hit.life -= projectile.damage;
      projectile.life = 0;
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);

  const killed = state.enemies.filter((enemy) => enemy.life <= 0);
  for (const enemy of killed) {
    state.gold += enemy.gold;
    state.kills += 1;
    awardXp(state.profile, enemy.shape === "pentagon" ? 30 : 8);
  }
  state.enemies = state.enemies.filter((enemy) => enemy.life > 0);
}

function updateWaves(state, dt) {
  if (state.waveIndex >= state.level.waves.length) return;
  if (state.waveDelay > 0) {
    state.waveDelay -= dt;
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
    state.waveIndex += 1;
    state.waveTime = 0;
    state.spawnedInWave = new Set();
    state.waveDelay = NEXT_WAVE_DELAY;
  }
}

function updateResult(state) {
  if (state.result) return;
  if (state.lives <= 0) {
    state.result = "defeat";
    state.isPaused = true;
  } else if (state.waveIndex >= state.level.waves.length && state.enemies.length === 0) {
    state.result = "victory";
    state.isPaused = true;
    awardXp(state.profile, 35);
  }
}

function stepState(state, dt) {
  state.timeStopTimer = Math.max(0, state.timeStopTimer - dt);
  state.timeStopCooldown = Math.max(0, state.timeStopCooldown - dt);
  if (state.isPaused || state.result) return;
  const scaledDt = dt * state.gameSpeed;
  updateWaves(state, scaledDt);
  updateTowers(state, scaledDt);
  updateProjectiles(state, scaledDt);
  updateEnemies(state, scaledDt);
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
      if (isBlocked && !assets.tile) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x + 18, y + 18, board.tile - 36, board.tile - 36);
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

  const selected = weapons.find((weapon) => weapon.key === state.selectedWeaponKey);
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
      const canPlace = !tileSets.path.has(key) && !tileSets.blockers.has(key) && !occupied;
      const x = board.x + state.hoverTile.col * board.tile + board.tile / 2;
      const y = board.y + state.hoverTile.row * board.tile + board.tile / 2;
      drawRangeCircle(ctx, x, y, selected.range, canPlace ? "rgba(116, 224, 108, 0.88)" : "rgba(255, 103, 125, 0.82)");
      drawPlacementIndicator(ctx, board, state.hoverTile.row, state.hoverTile.col, canPlace);
    }
  }

  state.towers.forEach((tower) => {
    const target = targetForTower(tower, state.enemies);
    if (target) tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    drawTower(ctx, tower, assets);
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

  state.enemies.forEach((enemy) => drawAlien(ctx, enemy, assets));

  if (state.timeStopTimer > 0) {
    ctx.fillStyle = "rgba(116, 220, 255, 0.12)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgba(230, 251, 255, 0.84)";
    ctx.font = "700 30px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("TIME STOP", ctx.canvas.width / 2, 54);
  }
}

export function createGame({ ui, levels }) {
  const ctx = ui.canvas.getContext("2d");
  const assets = createAssetStore();
  applyAssetCssVariables(document.documentElement);
  let profile = loadProfile();
  let selectedLevel = levels[0];
  let state = null;
  let lastTime = performance.now();

  function syncMenu() {
    ui.levelGrid.innerHTML = levels.map((level, index) => `
      <button class="level-tile ${selectedLevel?.id === level.id ? "selected" : ""}" data-level-id="${level.id}" type="button">
        <strong>1-${index + 1}</strong>
      </button>
    `).join("");
    ui.menuPlayButton.disabled = !selectedLevel;
  }

  function syncHud() {
    if (!state) return;
    ui.livesValue.textContent = Math.max(0, state.lives);
    ui.goldValue.textContent = state.gold;
    ui.playerLevelValue.textContent = profile.level;
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
    const ready = state.timeStopCooldown <= 0 && state.timeStopTimer <= 0;
    ui.timeStopButton.disabled = !ready;
    ui.timeStopStatus.textContent = state.timeStopTimer > 0
      ? `${state.timeStopTimer.toFixed(1)}s`
      : state.timeStopCooldown > 0
        ? `${state.timeStopCooldown.toFixed(1)}s`
        : "Ready";
    ui.weaponBar.querySelectorAll(".weapon-card").forEach((button) => {
      const weapon = weapons.find((item) => item.key === button.dataset.weaponKey);
      button.classList.toggle("selected", state.selectedWeaponKey === weapon.key);
      button.classList.toggle("unaffordable", state.gold < weapon.price);
      button.setAttribute("aria-disabled", state.gold < weapon.price ? "true" : "false");
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
    const tower = state?.towers.find((item) => item.id === state.selectedTowerId);
    if (!tower) {
      ui.towerSidebar.classList.add("hidden");
      return;
    }
    ui.towerSidebarTitle.textContent = tower.weapon.name;
    ui.towerStatList.innerHTML = `
      ${weaponStatsMarkup(tower.weapon)}
      <div class="weapon-stat-row">
        <span>Ammo</span>
        <strong>${tower.ammo} / ${tower.weapon.capacity}</strong>
      </div>
    `;
    ui.towerSidebar.classList.remove("hidden");
  }

  function renderWeaponBar() {
    ui.weaponBar.innerHTML = weapons.map((weapon, index) => `
      <article class="weapon-card" data-weapon-key="${weapon.key}" style="--slot-card-image: ${cssUrl(weapon.slotCardAsset)}">
        <strong style="padding-left: 16px" class="weapon-nickname">${weapon.nickname}</strong>
        <button class="weapon-info-button" data-info-weapon-key="${weapon.key}" type="button" aria-label="View ${weapon.name} attributes">i</button>
        <span class="slot-label">Slot ${index + 1}</span>
        <img class="weapon-art" src="${assetUrl(weapon.hudAsset)}" alt="" draggable="false">
        <small>${weapon.price}g</small>
      </article>
    `).join("");
  }

  function openWeaponInfo(weapon) {
    if (state) {
      state.wasPausedBeforeWeaponInfo = state.isPaused;
      state.isPaused = true;
    }
    ui.weaponInfoTitle.textContent = weapon.name;
    ui.weaponInventoryGrid.innerHTML = Array.from({ length: 9 }, (_, index) => index === 0
      ? `<button class="inventory-slot selected" type="button" aria-label="Selected ${weapon.name}">
          <img class="inventory-art" src="${assetUrl(weapon.asset)}" alt="" draggable="false">
          <span>${weapon.nickname}</span>
        </button>`
      : `<button class="inventory-slot empty" type="button" aria-label="Empty inventory slot"></button>`).join("");
    ui.weaponStatList.innerHTML = weaponStatsMarkup(applySkillBonuses(weapon, profile));
    ui.weaponEquipButton.disabled = true;
    ui.weaponDestroyButton.disabled = true;
    ui.weaponInfoModal.classList.remove("hidden");
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
    syncHud();
  }

  function closeSkillTree() {
    ui.skillTreeModal.classList.add("hidden");
    if (state) {
      state.isPaused = state.wasPausedBeforeSkillTree;
      syncHud();
    }
  }

  function startLevel(level) {
    selectedLevel = level;
    profile = loadProfile();
    state = createInitialState(level, profile, ui.canvas);
    ui.mainMenu.classList.add("hidden");
    ui.gameScreen.classList.remove("hidden");
    ui.pauseModal.classList.add("hidden");
    ui.resultModal.classList.add("hidden");
    renderWeaponBar();
    syncHud();
  }

  function openMenu() {
    ui.gameScreen.classList.add("hidden");
    ui.mainMenu.classList.remove("hidden");
    ui.pauseModal.classList.add("hidden");
    ui.resultModal.classList.add("hidden");
    syncMenu();
  }

  function tryPlaceTower(row, col) {
    if (!state?.selectedWeaponKey) return;
    const weapon = effectiveWeaponByKey(state.selectedWeaponKey);
    const key = tileKey(row, col);
    const occupied = state.towers.some((tower) => tower.row === row && tower.col === col);
    if (state.gold < weapon.price || state.tileSets.path.has(key) || state.tileSets.blockers.has(key) || occupied) return;
    state.gold -= weapon.price;
    const tower = {
      id: `tower-${state.nextTowerId++}`,
      weapon,
      row,
      col,
      x: state.board.x + col * state.board.tile + state.board.tile / 2,
      y: state.board.y + row * state.board.tile + state.board.tile / 2,
      tile: state.board.tile,
      range: weapon.range,
      cooldown: 0,
      ammo: weapon.capacity,
      reloadTimer: 0,
      angle: 0,
    };
    state.towers.push(tower);
    state.selectedTowerId = null;
    state.selectedWeaponKey = null;
  }

  function showResult() {
    if (!state?.result) return;
    ui.resultTitle.textContent = state.result === "victory" ? "Mission Complete" : "Base Overrun";
    ui.resultCopy.textContent = state.result === "victory"
      ? `Cleared ${state.level.name} with ${Math.max(0, state.lives)} lives left.`
      : `The aliens breached ${state.level.name}.`;
    ui.resultModal.classList.remove("hidden");
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
    state.selectedTowerId = null;
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
    const skillKey = skillKeyFromEvent(event);
    if (!skillKey || !buySkill(profile, skillKey)) return;
    saveProfile(profile);
    refreshTowerSkillBonuses();
    renderSkillTree(ui, profile);
    syncHud();
  });

  function canvasTileFromEvent(event) {
    if (!state) return;
    const rect = ui.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * ui.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * ui.canvas.height;
    const col = Math.floor((x - state.board.x) / state.board.tile);
    const row = Math.floor((y - state.board.y) / state.board.tile);
    if (row < 0 || row >= state.level.rows || col < 0 || col >= state.level.cols) return null;
    return { row, col };
  }

  ui.canvas.addEventListener("mousemove", (event) => {
    if (!state) return;
    state.hoverTile = canvasTileFromEvent(event);
  });

  ui.canvas.addEventListener("mouseleave", () => {
    if (state) state.hoverTile = null;
  });

  ui.canvas.addEventListener("click", (event) => {
    if (!state) return;
    const tile = canvasTileFromEvent(event);
    if (!tile) return;
    const tower = state.towers.find((item) => item.row === tile.row && item.col === tile.col);
    if (tower) {
      state.selectedTowerId = state.selectedTowerId === tower.id ? null : tower.id;
      state.selectedWeaponKey = null;
      syncHud();
      return;
    }
    state.selectedTowerId = null;
    tryPlaceTower(tile.row, tile.col);
  });

  ui.playPauseButton.addEventListener("click", () => {
    if (!state) return;
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

  ui.timeStopButton.addEventListener("click", () => {
    if (!state || state.timeStopCooldown > 0 || state.timeStopTimer > 0) return;
    state.timeStopTimer = TIME_STOP.duration;
    state.timeStopCooldown = TIME_STOP.cooldown;
  });

  window.render_game_to_text = () => JSON.stringify({
    mode: ui.mainMenu.classList.contains("hidden") ? "game" : "menu",
    coordinateSystem: "canvas origin top-left, x right, y down",
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
    })) || [],
    enemies: state?.enemies.map((enemy) => ({ key: enemy.key, x: Math.round(enemy.x), y: Math.round(enemy.y), life: Math.round(enemy.life) })) || [],
    result: state?.result,
  });

  window.advanceTime = (ms) => {
    if (!state) return;
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i += 1) stepState(state, 1 / 60);
    drawGame(ctx, state, assets);
    syncHud();
    showResult();
  };

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (state) {
      stepState(state, dt);
      drawGame(ctx, state, assets);
      syncHud();
      showResult();
    }
    requestAnimationFrame(frame);
  }

  syncMenu();
  requestAnimationFrame(frame);
}
