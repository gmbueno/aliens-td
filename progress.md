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

- Active/passive skill expansion:
  split the tree into Active Skills and Passive Skills while leaving the four existing passive skills unchanged;
  added active upgrade tracks for Chrono Break, Rocket Launcher, and Napalm, each rank 0-10 with 5 SP per rank;
  replaced the single Time Stop button with a three-button active ability bar;
  Chrono Break now scales from 50s cooldown/2s duration to 30s/4s;
  Rocket Launcher now enters map-target mode, then damages enemies in an area scaling from 40k/300 to 80k/600 with a fixed 30s cooldown;
  Napalm now burns currently visible enemies, scaling from 50s cooldown/6s duration/1000 DPS to 30s/10s/1500 DPS;
  verified active skill stats, skill-tree layout on desktop/mobile, Chrono/Napalm activation, and Rocket targeting/kills with Playwright screenshots and render_game_to_text.

- Active equip/timer fixes:
  active cooldowns and durations now pause while the game is paused and tick with game speed when running at 2x;
  the profile now stores one equipped active ability, defaulting to Chrono Break;
  changing the equipped active in the skill tree saves it for the next mission only, while the current mission keeps the active it started with;
  verified pause timing, 2x timing, and next-game equip behavior with Playwright state captures.

- Active card art pass:
  wired Chrono Break to assets/slots/cards/time-stop.png, Rocket Launcher to assets/slots/cards/rocket_launcher.png, and Napalm to the provided napalm card asset currently present as assets/slots/cards/napalm.png.png;
  the in-game active card now uses the card art directly with only the ready/cooldown plaque overlaid.

## Campaign expansion — October 29, 2026
- User authorized research, broad gameplay/balance/UI improvements, and production deployment.
- Preserve the existing uncommitted skill/ability/card changes; starting diff backed up at /tmp/aliens-td-before-campaign.patch.
- Research: George Fan's GDC 2012 tutorial talk (learn through play, gradual mechanics, visual clarity), Ninja Kiwi's BTD6 product page and official Netflix help (tower upgrades, selling, map variety and permanent progression).
- Plan: 18 authored missions across 3 sectors; prepare/launch wave loop and enemy preview; obstacles with removal costs and strategic pads; two upgrade branches, targeting, sell; fixed mission difficulty, stars/first-clear rewards, bounded meta progression and free respec; desktop/mobile interface, deterministic balance and browser tests, GitHub Pages deployment.
- Implemented 18 explicit missions, three terrain palettes, visible clearable obstacles, sensor/power pads, and frost slow tiles.
- Implemented preparation/launch/auto-wave flow, previews/intel, supplies and flawless/early-launch bonuses, differentiated armor/shield/slow mechanics, homing shots, tower upgrade branches/target priorities/selling.
- Campaign atlas, stars, first-clear/replay XP, free skill refunds, mobile layout, keyboard controls, sound toggle, background-tab pause, fixed simulation stepping added.
- Initial deterministic balance run exposed overtuned sector 2/3 openings. Reduced opening density, increased later starting budgets, and retained stronger later waves. Baseline screenshots reviewed; inherited widget/client console error is being investigated alongside full browser validation.
- Core regression suite passes: mission geometry, preparation, placement, obstacle removal, tower branch limits/refunds, meta/pad stacking, armor/shields, active abilities, pause/2x timing, legacy profiles, first-clear/star rewards, full victory and defeat.
- Corrected target priority: single projectiles now actually fire at the selected First/Strongest/Nearest target (the cluster selection previously superseded it).
- Adjusted final Mothership HP after max-trained simulation could reach but not defeat it; final trained benchmark wins with 11 lives.
- Full UI test reached victory, persisted stars through reload, advanced to the next mission, and exercised all abilities. Found/fixed narrow-screen HUD overflow and added compact landscape layout.
- Identified inherited browser error as invalid JavaScript served by the Vibe Jam widget. Replaced it with a static event attribution link; no game telemetry dependency remains.
- GitHub Pages workflow now gates deployment on campaign tests and uploads runtime files only.
- Final local validation: all 15 automated tests pass, including trained no-ability wins on all 18 missions. The complete Playwright UI suite passes with zero JavaScript errors and zero missing local assets; portrait, landscape and desktop screenshots inspected.
- The required develop-web-game client passes after the widget fix; final screenshot/text show actual combat and no errors.
- Research and tuning rationale documented in docs/design-notes.md; README now covers campaign, economy, controls and reproducible test commands.
- Ready to deploy the integrated work (including pre-existing active-skill/card changes) to the existing GitHub Pages production site.
- Production complete: runtime commit 1e4c17e deployed successfully to https://gmbueno.github.io/aliens-td/ via Actions run 40932058262 (2026-10-29).
- Re-ran the entire Playwright suite against the public production URL: passed, with zero browser errors or failed runtime assets. Production title/campaign markup verified; production screenshots saved under output/production/.
- No blocking TODOs remain for this release. Future optional tuning should use player feedback on short-route maps, specialization diversity, and boss pressure; do not assume the automated policy represents every human strategy.

## Interaction fixes and UI review — November 5, 2026
- User reports missed target-priority and Firepower/Control clicks, requests Last targeting and several UI improvement/self-critique rounds.
- Use isolated headless Playwright only; do not open or interact with the user's browser/desktop.
- Suspected root cause: comparing DOM-serialized innerHTML with raw template HTML causes controls to be replaced on the 100ms HUD refresh, interrupting held clicks. Will reproduce before fixing and add timed-pointer regression coverage.
- Visual direction: a cohesive field-command console, a purpose-built weapon rack with larger artwork and clear selected/affordable states, and a clearer tower upgrade/targeting panel.
- Reproduced the issue: the original held click detached its button. After the fix, a 350ms held click keeps the same node connected and correctly changes targeting / purchases an upgrade.
- Round 1: replaced plain weapon boxes with an illustrated, accented weapon rack; added full-cost/missing-gold/selected states, native build buttons, a matching active-ability strip and consistent field readouts. Tower controls now include exact next-stat previews and distinct branch/total-limit messages.
- Round 1 self-review: notebook screenshots still hid upgrades below the sidebar fold. Round 2 reserves a full-height right command column, reduces redundant tower stats, and condenses targeting for short desktop screens. Portrait keeps touch-sized controls; landscape retains a scrollable drawer.
- Round 2 screenshots confirm Firepower and Control are visible without sidebar scrolling at 1280×720 and 1024×768. Both cost previews and four-way targeting remain accessible during combat.
- Round 3: constrained intrinsic artwork sizing, fixed the 320px HUD overflow, added visible available SP to the commander badge, and checked insufficient-funds / selected / maximum-upgrade states. Added CI coverage for held-pointer interactions and responsive control visibility before deployment.
- Final local validation: 16 game tests pass; full browser flow passes; new controls suite passes at 320, 390, 844, 1024, 1280 and 1920px, including live-gold changes during a 350ms hold, both upgrade branches, branch/total caps with money remaining, and keyboard/touch selection. Final skill-client screenshot/text reviewed with no browser errors.
- Reviewed screenshots after each of three visual iterations. Notebook upgrades now remain visible; mobile arsenal has larger illustrations, stronger selection/price hierarchy, and no 320px horizontal overflow. All browser work used isolated headless contexts; the user's browser and desktop were not controlled or opened.
- Production release: dbd9008 deployed successfully via Actions run 42045047315. The first run's browser provisioning was slow; cancelled it and used the runner's existing headless Chrome (with a bounded fallback install) instead. Both the 16 rules tests and the held-click/browser regression suite passed on the runner.
- Public production validation passed: all four priorities, held upgrade clicks across live gold/ammo changes, keyboard/Space interaction, touch, upgrade limits and all six viewport sizes. Production screenshots reviewed under output/ui-refresh/production/; no browser errors.
- No blocking TODOs remain. Optional follow-up: use player feedback to guide further weapon-rack styling; keep the stable mounted controls and held-pointer regression coverage when changing the panel.

## Recorded weapon audio and ballistic shotgun — November 5, 2026
- User requested realistic FPS-style gunshots with variation and a complete shotgun spread whose pellets travel independently and hit any alien crossing their paths.
- Research selected The Free Firearm Sound Library (Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney), CC0, via its preserved Prepared SFX recordings and metadata. Use self-hosted edited recordings with source/license records; retain isolated headless browser testing.
- Current shotgun emits 4 homing projectiles at the same target when alone, so pellets overlap and disappear if that target dies. Will replace its homing with a fixed fan and swept first-hit collision, retaining regular weapons' existing guidance.
- Integrated 14 edited CC0 recordings (about 130 KB total), two/three real takes per gun, small pitch/gain variation, stereo position, compression/voice limits, and pause/mute/menu cleanup. Removed the oscillator generator. Source/license metadata ships with the audio.
- Shotgun now fires four fixed-angle pellets per shell, uses swept first-hit collision against any live alien, retains pellets after target death, and displays trails/muzzle flashes. Added five physics regressions covering the requested behavior.
- All 21 core tests pass; all 18 trained campaign benchmarks still win. Full game and held-control browser suites pass. Audio browser tests decode all 14 clips, verify recorded signals and variation on all 6 weapons, reject oscillator synthesis, and check silence after pause/mute/menu.
- Final visual review: paused gameplay capture visibly shows separate pellet trails in a fan; render_game_to_text confirms independent velocities and no target IDs. Improved the screenshot capture to freeze the actual volley before capture rather than letting real frames erase it.
- Audio diagnostics confirm all 14 decoded signals have usable transients, no clipping, and short tails. Browser tests explicitly fail if an oscillator is used; pause, mute/unmute and returning to the menu all behave correctly. Browser tests run with OS audio muted, so the user's speakers/browser are not disturbed.
- Prepared 0.2.2 for production with the new audio/shotgun browser checks in CI. No blocking TODOs remain locally.
- Production complete: runtime commit 20552e7 deployed via Actions run 42049712537. All 21 core tests, held-control browser checks, and recorded-audio/shotgun browser checks passed on the runner.
- Repeated the recorded-audio and shotgun suite against https://gmbueno.github.io/aliens-td/: all 14 clips decoded, each of the 6 weapons played varied recorded samples, no oscillator synthesis, pause/mute/menu silence, independent pellet fan visible. Production screenshot reviewed in output/audio-shotgun/production/.
- No release blockers remain. Future optional tuning: collect player listening feedback on individual weapon loudness and close-range shotgun feel; retain the recorded-sample and swept-collision regression checks.
