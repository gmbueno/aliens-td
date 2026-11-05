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

## Arsenal expansion — November 5, 2026
- User requests heavier/less harsh gun sound, distinct per-weapon upgrade identities, audiovisual power feedback, RPG as a tower with a 5-second artillery power, simple unlockable variants/rarities/attachments, and new readable enemy behaviors.
- Design: keep six deployment slots; the Heavy slot chooses Sniper or RPG. Four curated blueprints per weapon unlocked at commander levels 1/3/6/10 (RPG class at 4), with 0/1/1/2 attachment slots. Four deterministic attachment options with free swaps; no random loot or new currency. Changes apply at next deployment. Two battlefield branches per gun, same 4-total/3-per-branch rule. Keep targeting controls accessible.
- Research: official BTD6 description and Netflix gameplay guide support differentiated upgrade paths and visible progression unlocks. Use those principles without importing the full complexity of BTD6.
- Preserve old skills and loadouts: migrate the Rocket Launcher active and its SP ranks to Artillery. Use isolated headless browsers and OS-muted audio testing throughout.

- Implemented per-gun upgrade effects/previews, 3→4→5→6 ballistic pellets, MP stronger/longer slow, Magnum damage/penetration, Sniper optics and RPG splash/reload branches. Six battle cards retained with Heavy Sniper/RPG choice.
- Added deterministic 4-tier model unlocks and 4 attachments with 0/1/1/2 sockets, free swaps, next-deployment snapshots, visible next unlock goals, mobile scroll hints and a sticky close header. Arsenal models/attachments persist; old rocket ranks/equip migrate to Artillery.
- Added a timed 10-impact / 5-second barrage, recorded impact/launch sounds and original fire/stasis samples. Powers now draw target markings, sparks/smoke, napalm trails/flames and golden stasis. Gun audio reprocessed for body, less harshness, and a slower compressor attack; measured low/presence ratio increased 1.5–2.3× on all 14 recordings. Added 45Hz cleanup after a diagnostic exposed excessive sub-bass in the sniper source.
- New Ravager, slow-immune Juggernaut and Broodmother/hatchling behaviors are introduced from missions 5/8/10 with readable intel/trait markers. Hatchlings give no gold/XP. Existing 18-mission trained benchmark still wins with Common models and no attachments/abilities.
- Core tests expanded from 21 to 30. Existing controls, full browser flow and 19-clip audio suite pass. New arsenal browser suite passes unlock/model/socket/persistence/Heavy/RPG/power/trait scenarios; final small visual polish and verification are underway.
- Visual self-review: mobile model list needs explicit swipe affordance and a persistent close control; implemented both. Models now appear on battle cards. Corrected the RPG barrel direction and made impact sparks/smoke easier to see. Browser work is isolated and OS-muted.
- Final local verification: all 30 core/campaign tests pass; all 18 trained Common-only campaign runs win; full browser flow, held-pointer/responsive controls, recorded-audio decoding/variation/silence and the new arsenal/powers/traits suite pass. Reviewed desktop/mobile arsenal, RPG impact, Napalm, golden stasis, trait badges and hatchling screenshots. Audio hashes match all 19 delivered clips.
- Final UI corrections: constrain Customize/Heavy buttons to their panels, keep unlock explanations readable on mobile, replace overlapping enemy trait captions with compact badges and round MP slow previews. Added a menu-button containment regression.
- Ready to publish 0.3.0 to the already-authorized GitHub Pages production deployment. No local release blockers remain; production verification is next.
- Production complete: runtime ba9a55c deployed successfully via Actions run 42057653072 to https://gmbueno.github.io/aliens-td/. All 30 core/campaign tests plus controls, audio and arsenal browser gates passed on the runner.
- Repeated the complete arsenal/powers/traits and recorded-audio/shotgun browser suites against the public URL: passed with zero browser errors or missing runtime assets. Reviewed public screenshots of the Legendary loadout, RPG impact and Artillery; artifacts are under output/arsenal/production/ and output/arsenal/production-audio/.
- Required skill-client combat capture also verified a deployed Legendary Handgun with Incendiary and golden Chrono stasis, with matching render_game_to_text and no console errors. Its local, ignored fixture seeds a muted profile and starts deployment; normal menu/held-pointer flows are independently covered by the browser suites.
- No blocking TODOs remain for 0.3.0. Future tuning should be based on player feedback on gun punch, RPG value and preferred attachment builds; the automated policy does not replace human listening/playtesting.

## Command graph and expedition progression — November 2026
- User requests a substantially redesigned skill-tree graph with prerequisites, logistics (cheaper clearance, starting credits), automatic exit mines and patrol drone, water/pontoons, clearer equipped-model identity, paid special unlocks, 4 genuinely different weapon archetypes per class, SP/loot/cache acquisitions, persistent accessory currency, another enemy behavior, and stronger gun sound using the successful artillery as a reference. Production deployment remains authorized. Isolated headless browsers only.
- Research: official Black Ops 7 launch equipment guide confirms semi-auto/automatic/burst pistols, burst/automatic rifles and pump/double-barrel/automatic shotguns. Adapt firing archetypes into fictional models, not COD assets.
- Chosen design: one readable commander graph (Armament, Logistics, Support), 12 purchasable nodes plus a free command root. Keep six battle slots. Utilities run automatically. SP buys training and Rare licenses (8 SP); automatic midpoint caches award Epic plans, elite drops and sector caches award Legendary plans, persistent Salvage buys attachments. First cache per mission is guaranteed and one-time, with rare-drop pity. Old unlocks/loadouts are migrated.
- Implemented 12-node commander graph with Armament/Logistics/Support, prerequisite links, inspector previews, locked-special unlocks for new profiles, and preserved legacy entitlements. Second UI review shortened graph spacing so every node fits a notebook; mobile has a sticky close/refund header and scrollable graph.
- Logistics: −15% obstacle cost/rank, +25 starting credits/rank, 35-credit pontoons on water in five authored maps. Last Line automatically places 5/10 finite exit mines. Patrol UAV automatically reserves a base, follows the route and shoots. Node refunds are free between missions to prevent deploying utilities then refunding into live combat training. Active/support loadout ranks snapshot at deployment; training and clearance/pontoons apply live.
- Implemented persistent Salvage, 8-SP Rare licenses, automatic one-time midpoint caches, Legendary elite drops with a 20-eligible-kill pity limit, and attachment purchases. Licenses and attachments survive reload/respec; cache rewards survive defeat. Existing 0.3 availability is grandfathered.
- Added 28 model specifications and individual SVG silhouettes. Models have meaningful semi-auto/auto/burst/pump/double-barrel/heavy differences; bursts queue and consume ammo separately. Battlefield cards now prioritize model name, class, mode and credits, with model-aware inspection/previews.
- Added Mender healing support enemies from mission 12. Gun reports now layer full-band firearm cracks with a short caliber-scaled portion of the approved artillery recording and room reflections; model pitch/gain varies subtly. The approved power files and power processing are preserved separately. Audio preparation recipe/provenance updated.
- 44 rule tests (including all 18 Common-only campaign wins) now cover prerequisite/refund/license accounting, migration, cache/drop persistence/pity, utilities, water charges, firing bursts, healing and loadout snapshots. Browser suites cover responsive graphs, purchases, special locks, persistent inventory, field identity and automatic support. Final audiovisual/browser review and production deployment remain.

- Final balance pass bounds advanced models' sustained direct damage to 0.8–1.45× base while varying range, suppression, splash, cadence and magazine. Added a guard for this envelope. UAV now turns back continuously at the exit instead of teleporting; mine-killed enemies cannot heal/spawn before death cleanup. Shotgun lead respects actual slow/rage/stun.
- Final UI review corrected inherited generic small-tag styling that obscured class/model labels. Prices moved to the card top line, with model/class/mode readable below. The mobile graph header wraps at 320px, stays reachable while scrolling, and explains node refunds between missions. Graph, water/raft/UAV/mines, cache, and Mender screenshots reviewed in isolated contexts.
- Final local release validation: all 44 rules/balance tests pass, including 18 Common-only mission wins and the advanced-model damage envelope. Full campaign browser flow, held-control/responsive tests, arsenal/power/Mender tests, graph/economy/field-support tests (including actual mine detonation), and 20-source recorded audio tests pass. All 19 unique audio-file hashes match provenance; approved power samples are unchanged.
- Required skill-client graph and field captures reviewed; text and screenshots agree, with no browser errors. All browser interactions used isolated headless contexts and audio-enabled tests used OS mute.
- No local release blockers remain. Ready for the authorized 0.4.0 production deployment and public-site verification.
- Production complete: 0.4.0 runtime 33a9fde deployed via Actions run 42078764105. Final model-aware shotgun upgrade copy (389867e) deployed via run 42079353923. Both deployments passed all 44 rules/campaign tests and controls, audio, arsenal/traits, and progression/field-support browser gates.
- Repeated the complete progression and audio suites against https://gmbueno.github.io/aliens-td/: passed with no browser errors or missing local assets. Public graph, mobile graph, equipped model, water/raft/UAV/mines and purchase screenshots reviewed under output/doctrine/production/. Audio artifacts are under output/doctrine/production-audio/.
- Final public smoke check verifies the current shotgun upgrade text and all 12 graph nodes. No blocking TODOs remain for 0.4.0. Future subjective tuning should use player feedback on firearm timbre and preferred model/attachment builds; the automated balance policy is not a human playtest.

## Tactical HUD and Pixel Forge sprites — November 2026
- User requests a major top-HUD visual improvement (lives, credits, mission, wave, eliminations), asks to inspect/reuse the original game artwork and use their Pixel Forge site/key to make 64px transparent sprites. Production deployment remains authorized; keep all browsers isolated/headless.
- Original metal/amber/cyan plaques remain in assets/hud. Reviewing them as material/style references; avoid shrinking baked text/panels into illegibility.
- Opened https://codevon-com.github.io/pixelforge/ in an isolated headless Playwright CLI session. Found the user-owned local Pixel Forge project and authorized OpenRouter credential, seeded it through a private temporary browser config without printing values. Existing profile/browser untouched. Local generation budget is $5; plan two small 2×2 sheets with transparent 64px sprites, preserving native alpha.
- Generated/exported both sheets successfully with GPT Image 2.5 Flare. Reported cost $0.0197 each/$0.0394 total. Seven runtime icons retain 64×64 native alpha; the extra speed-chevron variation is unused. Prompts, hashes and licensing metadata are in assets/hud/icons/provenance.json. Closed the isolated PixelForge session and deleted the private temporary authentication files.
- Rebuilt the top HUD with metal edges reused from the original life/credits/commander plaques, readable live counters, commander SP badge/XP track, integrity track/critical warning, wave segments and accessible stable pause/speed/menu buttons. A dedicated hud.css handles desktop, notebook, portrait and short landscape layouts.
- Visual critique passes reduced heavy borders, shortened the life label, contained the menu icon and fixed relative CSS asset URLs consumed by nested stylesheets. Also fixed a 1024px armory overflow that let weapons overlap the special. Screenshots from eight viewports and a low-integrity fixture reviewed under output/hud; final gameplay captures from the required skill client reviewed under output/playwright/hud-skill-fixed with no console errors.
- Local validation passes: 44 rules/balance tests, full campaign browser flow, held-click/target/upgrades suite, and new HUD suite (state-matched counters, PNG alpha, 8 viewports, no clipping, accessible controls, held clicks through updates, combat gold/kills, wave progress, low lives). HUD suite added as a production deployment gate. Ready for authorized 0.4.1 production release.
- Initial production deployment b5488bb passed every CI gate (run 42083556047). Full HUD suite also passed on the public site. Final public combat screenshot review caught a legacy play pseudo-element duplicating the new SVG only while paused; increased the override specificity and added a single-visible-symbol regression check before the final patch deployment.
- Extended the responsive check to a ninth viewport (667×375) to cover small landscape phones using a wrapped HUD. The existing eight viewport layouts are unchanged. Also reviewed the intermediate 880px two-row layout manually.
- Final production complete: runtime b981b14 deployed successfully in Actions run 42084439791, with all 44 rule tests and every controls/audio/arsenal/progression/HUD browser gate passing. Repeated the entire nine-viewport HUD suite against https://gmbueno.github.io/aliens-td/: passed, including the single resume symbol. Reviewed final public combat and small-landscape screenshots under output/hud/production-final/; public header preview is output/hud/production/hud-preview.png. No browser errors or missing assets. Required skill-client final paused-combat screenshot/state also reviewed without errors under output/playwright/hud-release-skill/.
- All browser sessions used isolated headless contexts, audio stayed muted, private authentication files were removed, and the task-owned local server on port 4181 was stopped. No outstanding release blockers remain for 0.4.1. Future larger PixelForge resolutions were not needed for the HUD; existing 64px alpha sprites render at 28–48 CSS pixels.

## Frontier art, progression and energy weapons — November 2026
- User requests restoration of detailed old weapon art, consistent PixelForge variations, original full special cards, livelier backgrounds, mid-mission loadout/model changes with explicit restart, only two initial classes with gradual unlocks, haste terrain, polished obstacles/cache/water, distinct new alien art visible in briefing, clearer skill graph states/colors, $ currency, correct HUD cursors, continuous overheating laser and short-range flamethrower, critical upgrades. Keep model variants for this pass but make them optional and secondary. Production remains authorized; isolated headless browsers only.
- Audit: all non-RPG weapon classes currently unlock unconditionally; all model art overrides original PNGs with schematic SVGs. New trait aliens reuse original PNGs. Arsenal can only be opened from menu/results and changes wait for next deployment. Plan explicit campaign-clear milestones (two starter types), six readable slots, optional models, new specialist choices in existing slots, and an explicit apply/restart action.
- Generated 3×16 transparent sprites and one opaque water tile through the isolated PixelForge UI, using the original handgun as style reference. Art exported under assets/frontier with provenance and source prompts; reported total $0.0604. Six original starter firearm PNGs retained; RPG and new energy guns use generated art. Dedicated four trait-alien PNGs now appear in map-card and briefing rosters. World sprites render actual rocks/ice/growth/cargo/barrels/cache; connected water uses the new texture. Six authored maps have amber +35% alien-speed strips, separate from ice, with directional arrows/legend/preview markers. Private key state/config removed; PixelForge headless session closed.
- Implemented nine weapon types with six slots: only HG/AR initially usable; MP/Shotgun/Magnum/Sniper/RPG/Flamer/Laser at 1/2/3/4/6/8/10 distinct mission clears, regardless of commander level/legacy. Flamer replaces slot 3's MP; Laser/RPG/Sniper share Heavy slot 6. Models remain optional behind a disclosure. Starter model has one attachment socket; caches discover attachments before optional advanced plans. First-clear results announce new weapon classes. No save reset.
- Added live energy weapons: continuous visual beam and heat/cooling cycle, short flame cone + burn + fuel reload, aggregate bounded energy audio voices, proper pause/cooling behavior, deterministic per-shot criticals and role-specific critical/heat/fuel upgrades. Added core frontier tests for these semantics. All 50 core tests currently pass; 18-map progression balance policy now explicitly respects type unlocks, starting with just HG/AR.
- Reused original illustrated weapon-card backgrounds; special art now renders whole with contain rather than cropping. Arsenal can open during combat from info or armory, pause, change model/attachments/type, then explicitly apply/restart; deployment snapshot remains stable until then. UI critique caught/fixed an overwide restart button. Skill graph rebuilt with separated colored lanes and explicit green trained / cyan purchasable / amber unfunded / gray prerequisite states and text/symbol markers. Credit strings use $, noninteractive HUD cursor default.
- Work in progress: new tests/frontier-browser.mjs is exercising the whole flow and new weapon art/audio; previous controls and 9-viewport HUD suites pass. Full audio/arsenal/progression/campaign browser suites are running; old suites have a few fixtures/expectations updated to deliberate mission progress, attachment-first caches, and optional-model disclosure. Need inspect all screenshots, resolve failures, finish final responsive/art pass, run required skill-client energy capture, release version/docs, deploy and verify public site. Task-owned local server runs port 4182 (session 7947) with log /tmp/aliens-frontier-server.log. No commits yet for this request.
- Final local release validation complete for 0.5.0: all 50 rules/balance tests pass (including 18 progressive Common-model mission wins); controls, recorded audio, arsenal/powers/traits, progression, full campaign and nine-viewport HUD suites pass. New frontier suite passes both source and packaged builds, including type-gating legacy level-50 saves, actual model/attachment swap + restart, laser heat/cooling/energy audio, flame cone/burn/fuel, all four research states, whole Napalm card and responsive water/alien art.
- Visual critique fixed restart-footer overflow, a disabled-ARIA ancestor that prevented inspecting locked/unaffordable weapons, graph summary spacing, mobile two-node visibility and branch/selected-node scrolling. Nodes now tab in visual order. Short flame damage matches its visible muzzle-origin cone; shotgun lead composes haste/ice. Laser's 480-damage ticks balance its five-second heat/three-second cooling tradeoff and +35% shield damage against cheap ARs; advanced model direct DPS stays within the existing envelope.
- Added dependency-free content-versioned production packaging via scripts/build.mjs. Entry origin/profile stay fixed, runtime modules/CSS/assets use one fingerprinted base path to avoid stale mixed releases. Packaged browser smoke check and frontier browser suite pass. Workflow now gates deployment on both new frontier behavior and the actual built package.
- Required skill-client source and packaged captures reviewed with no errors. Final real-campaign energy capture under output/playwright/frontier-release-skill/ shows both beam/flame active, partial heat/fuel and paused state matching text. Final UI/graph/water/card screenshots reviewed under output/frontier/release/. Latest local package fingerprint: 0.5.0-0a80f383d459. Ready for authorized production publication and public verification; no known local blockers.
