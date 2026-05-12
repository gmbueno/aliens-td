Original prompt: using @game-studio create a simple top-down alien-themed tower defense MVP like Bloons Tower Defense, with shape placeholder enemies, six weapon slots, separate data files for enemies/weapons/levels, a 3x3 level-select menu, in-game HUD, waves, persistent player level, pause/menu controls, and a Time Stop ability.

- Implemented a static browser MVP with HTML, CSS, and canvas-based ES modules.
- Active entry points:
  `index.html`,
  `styles.css`,
  `src/main.js`,
  `src/game.js`.
- Tuning data is split into:
  `src/data/enemies.js`,
  `src/data/weapons.js`,
  `src/data/player.js`,
  and `src/data/levels/level1.js` through `level9.js`.
- Gameplay currently includes:
  a 3x3 level selector,
  six fixed weapon slots,
  tile path/build/blocker rules,
  waves and enemy leaks,
  gold rewards,
  persistent player XP/level,
  projectile towers with ammo/reload,
  pause/play/2x,
  gear menu,
  restart/change-level actions,
  victory/defeat modal,
  Time Stop duration/cooldown,
  and `window.render_game_to_text` plus `window.advanceTime(ms)` for testing.

TODO
- Continue replacing remaining placeholder visuals with isolated or provided image assets, especially shot effects/projectiles and optional extra enemy types.
- Add the later skill tree/proficiency screen from the player-level button.
- Balance levels and weapon numbers after a few real play sessions.

- Follow-up change:
  removed `src/data/levelFactory.js` and expanded every level into a fully explicit `levelN.js` object so track, blockers, starting resources, lives, and every spawn timing are visible in the file that owns that level.
- Added tower range inspection:
  selecting a weapon shows its circular range over the hovered build tile;
  clicking an already placed tower shows that tower's circular range.
- Split the old 3-state speed button into separate Play/Pause and 1x/2x controls.

- Follow-up balance/audio pass:
  expanded all levels from 9x7 to 16x9 with longer explicit tracks and wider build space;
  increased every weapon range, with sniper range increased the most;
  added a Web Audio shot sound in `fireTower`, so sound plays when the weapon fires rather than when the projectile impacts.

- Added weapon slot info popups:
  every weapon slot now has a top-right info button;
  clicking it opens a two-column weapon inventory/details modal;
  the left side is a 3x3 inventory grid with the current weapon selected in the first slot;
  the right side shows damage, ATK speed, capacity, reload time, and range, plus disabled Equip and Destroy buttons reserved for later weapon drops/rewards.

- Follow-up UI pass:
  clicking a weapon info button now pauses the game while the inventory modal is open, then restores the previous pause state on close;
  clicking a placed tower opens an arena-row sidebar with weapon attributes plus live ammo;
  removed the visible arena wrapper card styling so the canvas and tower sidebar fit in the second UI row without a nested-card look;
  swapped top controls so the speed toggle appears before Play/Pause.

- Follow-up arena cleanup:
  removed the remaining arena frame treatment and made the tower sidebar overlay the arena row instead of pushing/resizing the canvas;
  changed Play/Pause from text to icon-only arrow/pause bars with accessible labels.

- Renamed the in-game level HUD chip to Mission and display missions as `1-1` through `1-9` so it does not conflict with persistent player level.
- Simplified the first-screen selector to say Mission Selector, removed the game title eyebrow, and made mission tiles show only `1-1` through `1-9`.

- Asset integration pass:
  copied the provided metal tile into assets/tiles/metal-floor.png and HUD reference into assets/ui/hud-controls-reference.png (doesn't exist anymore);
  cropped the provided turret strip into six PNGs under assets/towers/;
  wired weapon asset paths into src/data/weapons.js;
  updated src/game.js to preload/draw the metal tile and turret sprites on the canvas with placeholder fallback;
  updated shop and inventory cards to show turret artwork instead of CSS placeholder icons.
- Remaining asset TODO:
  alien sprites, muzzle flashes, tracers/hit effects, lower HUD card art, and the fourth placement indicator still need local source files or isolated assets; the embedded chat-only sheets were not present as readable files in the workspace.

- Follow-up asset polish:
  reordered weapon slots to match the provided turret strip/reference order;
  added a fourth-option-inspired placement/selection reticle directly in the canvas renderer for hovered build tiles and selected towers.

- Placed turret asset pass:
  added top-down crops from weapons_base.png under assets/placed-towers/;
  board turrets now compose base A with weapon variants: handgun A, sniper C, shotgun B, AR B, magnum A, and machine pistol A;
  shop cards still use the previous card-art turret crops.

- Aliens and lower HUD asset pass:
  cropped aliens.png into assets/aliens/ and wired current enemies to basic, fast, tank, and boss sprites;
  cropped slots.png into empty card frames, lower-HUD weapon art, and a price plaque under assets/slots/;
  lower HUD weapon cards now use the slots.png card/frame, weapon-on-base art, and gold plaque while placed turrets remain on weapons_base.png top-down assets;
  verified with Playwright screenshots and no console errors.

- Upper HUD asset pass:
  cropped the high-resolution hud.png sheet into assets/hud/ plaque and button textures;
  added src/data/assets.js as the central manifest for board, HUD, alien, placed tower, lower slot, and card art paths so future visual swaps are localized;
  updated the upper HUD to use the cropped plaque/button textures while preserving live values and controls.

- Path texture pass:
  moved path.png into assets/tiles/path.png;
  added board.path to src/data/assets.js;
  path tiles now draw the dirt texture instead of the procedural brown fill, with the old orange route line kept only as a missing-asset fallback.

- Skill tree implementation pass:
  clicking the player level HUD chip now opens a paused character skill tree modal;
  level-ups now grant 10 SP, and existing saved profiles are normalized to the new 10-SP-per-level budget;
  added four spendable skills (damage, range, attack speed, reload) that update newly placed and already placed towers.
- Skill tree verification:
  ran the develop-web-game Playwright smoke client against http://127.0.0.1:4174 with no console errors;
  seeded a level-3 profile, opened the tree, bought a skill, and confirmed SP/rank updates in screenshots and render_game_to_text;
  placed a handgun after buying damage/range and confirmed boosted stats in render_game_to_text (range 180, damage 432).
- Mobile skill tree check:
  fixed the mobile game grid so the wrapped top HUD no longer sits under the canvas and the player-level chip can open the tree on phone-width viewports.

- Skill system refactor:
  extracted skill definitions/spend helpers to src/data/skills.js;
  moved profile load/save/normalize/XP logic to src/systems/profile.js;
  moved skill-based weapon stat calculation to src/systems/weaponStats.js;
  moved skill-tree markup rendering and click-key parsing to src/ui/skillTreeView.js;
  verified the refactor with syntax checks, a Playwright smoke run, and a seeded buy/place flow that preserved boosted handgun stats.
