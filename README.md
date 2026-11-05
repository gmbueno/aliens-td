# Aliens Tower Defense — Frontier Campaign

A static HTML/CSS/JavaScript tower-defense game. Play at **https://gmbueno.github.io/aliens-td/**.

## Campaign

- 18 individually authored missions across the Outpost, Frozen Frontier, and Hive.
- Five to nine waves per mission, visible incoming enemy compositions, and manual preparation or optional auto waves.
- Clearable cargo/ice/growth obstacles, permanent rocks, sensor pads (+18% range), power pads (+15% damage), and frost tiles (25% enemy slowdown).
- Six deployment slots. Five fixed classes plus a Heavy slot that selects Sniper or RPG (RPG unlocks at commander Lv 4).
- Two distinct upgrade branches per weapon: Buckshot / Choke & pump, Suppression, Devastator, Long-range optics and more. Four upgrades total per tower, at most three per branch. First/Last/Strongest/Nearest targeting stays freely accessible.
- Sell towers for a full refund before the first wave, or 70% of the total investment afterward.
- Commander graph: Armament, Logistics and Support, with visible prerequisites, before/after previews and free node refunds between missions. Research clearance discounts, starting supplies, pontoon construction, automatic exit mines and an automatic patrol UAV.
- Water appears on five missions. Pontoon Engineering lets a weapon deploy on a raft for 35 extra credits; no extra battle slot.
- Three active abilities with an equipped loadout: Chrono Break, Artillery Strike (ten impacts across five seconds), Napalm.
- Four distinct models per class: semi-auto, automatic, burst, pump, double-barrel and heavy variants, with different damage/range/magazines and individual silhouettes. Common models are free; Rare licenses cost 8 SP, Epic plans come from midpoint caches, and Legendary plans come from elite drops or sector caches. Rarity gives 0/1/1/2 attachment slots.
- Persistent Salvage buys four attachments (40/60/80/100). First midpoint cache per mission gives 30 Salvage and an advanced plan; first clears give 25 Salvage, replays 8. Elite drops: Juggernaut/Broodmother 4%, bosses 18%, guaranteed within 20 eligible kills. Duplicate plans become extra Salvage.
- Ravagers accelerate after a hit, Juggernauts resist slow, and Broodmothers release small aliens over time and on death. Their traits appear in wave intel. Menders from mission 12 heal nearby allies.
- Persistent XP, 10 skill points per commander level, free commander-node refunds between missions, mission records, and first-clear/new-star bonuses. Existing profiles migrate automatically.

Mission difficulty is fixed. Investing in permanent skills makes earlier maps easier; later maps add stronger enemies and more demanding wave compositions. All missions are selectable so players can experiment without replay gates. Credits are local to each run; SP, Salvage, plans, attachments and records persist in this browser. New profiles start with locked specials; existing unlocked abilities and models are preserved.

Stars: 3 for no lost lives, 2 for at least 60% remaining, 1 for surviving. First-clear and newly earned star bonuses only pay once; kills, completed waves, and the ordinary clear reward remain repeatable. Defeat keeps earned XP.

## Run and test

```bash
npm run serve
```

Open http://localhost:4173. Alternatively, `python3 -m http.server 4175`.

```bash
npm test
npm run test:balance
npm ci
npx playwright install chromium
GAME_URL=http://localhost:4173 npm run test:browser
GAME_URL=http://localhost:4173 npm run test:controls
GAME_URL=http://localhost:4173 npm run test:audio
GAME_URL=http://localhost:4173 npm run test:arsenal
GAME_URL=http://localhost:4173 npm run test:progression
GAME_URL=http://localhost:4173 npm run test:hud
```

The unit/campaign tests use Node 22 without dependencies. The browser suite uses Playwright and saves screenshots under ignored `output/`. The balance runner uses a repeatable placement policy, reinvests between waves, and deliberately does not use active abilities. It is a regression benchmark, not a promise that every strategy wins.

## Controls

- Click/tap a weapon, then a free tile to build. Click a placed tower to inspect, upgrade, change targeting, or sell.
- Click a clearable obstacle to buy the position.
- **1–6** select weapons; **Space** launches the next wave or pauses/resumes; **Q** uses the equipped ability.
- **Escape** cancels selection, closes a popup, or opens the command menu; **F** toggles fullscreen.
- Auto waves, speed, sound, and the skill tree are available in the interface. Hidden browser tabs pause the mission.

Abilities and cooldowns advance with combat time and game speed, stop while paused, and do not recharge during preparation. Changing models, attachments, the Heavy slot, active ranks or automatic support applies on the next deployment. Tower training and clearance/pontoon research affect current purchases immediately. Starting supplies and finite mines cannot be replenished mid-run; commander refunds are available from mission select/results. Rare licenses stay owned and their SP cost is not refunded by the commander-node reset.

## Structure and deployment

- `src/game.js`: simulation, rendering, and UI coordination.
- `src/data/levels/level1.js` … `level18.js`: explicit mission tracks, obstacles, pads, and spawn schedules. No runtime random wave generation.
- `src/data/weapons.js`, `enemies.js`, `skills.js`: tuning data.
- `src/systems/profile.js`, `weaponStats.js`: persistence/rewards and composed skill/tower bonuses.
- `src/data/assets.js`: centralized art paths.
- `docs/design-notes.md`: research rationale and balance methodology.

Pushing `main` runs `.github/workflows/deploy-pages.yml`: campaign tests must pass, then only runtime files are packaged and deployed to GitHub Pages. Tests, documentation, and development dependencies are excluded from the public bundle.

## Interaction update (November 2026)

Target and upgrade controls keep their DOM identity while gold/ammo updates. The controls regression suite holds the pointer down across several HUD refreshes and live kills, checks all four priorities, purchases upgrades, and distinguishes insufficient funds from branch/tower upgrade caps. Weapon selection uses native keyboard-accessible buttons with separate info actions.

## Recorded sound and shotgun ballistics

Weapon audio uses 14 self-hosted gun recordings from The Free Firearm Sound Library (CC0), plus five launch/power/impact clips. Sources, editing notes, license and output hashes are under `assets/audio/`. Two or three recorded shots per weapon alternate without immediate repeats, with small pitch/gain variation, restrained stereo positioning, a short layer from the approved artillery report, full-band recorded crack, short room reflections, model-specific pitch/gain and transient-preserving compression and a 24-voice ceiling. Audio unlocks after player interaction, stops on pause/mute/menu, and is never queued to play later. The approved power mix is kept on its own audio bus. The drone reuses a quieter firearm sample (20 decoded sources, 19 unique clips). No oscillator sound generator is used.

The shotgun starts with three physical pellets per shell in a fixed cone; Buckshot increases this to four, five and six. It aims before firing, then each pellet travels straight, can hit any live alien crossing its path, and survives the original target's death. Swept collision picks the first physical impact and prevents tunneling at 2x speed. Other weapons retain their guided shots. Close positioning is rewarded because more pellets connect.

`npm run test:audio` runs an isolated, OS-muted headless browser while testing real sample decoding/playback, variation, mute/pause behavior and a visible shotgun volley. It does not play through the user's speakers.

The arsenal browser suite checks unlocks, socket caps, saved loadouts, six-slot Heavy selection, RPG area impacts, all power sounds/visuals, pause behavior and new enemy traits. Its enemy-only scenario explicitly supplies a controlled spawn schedule; the loadout, RPG and ability scenarios exercise the unchanged production campaign. All browser suites use isolated, headless browsers with OS audio muted.

## Command update (0.4.0)

The commander graph is keyboard-accessible, uses selectable nodes and a persistent inspector, and keeps close/refund controls reachable on small screens. Four firing archetypes per weapon are described before purchase; battle cards show class, model, mode, rarity and cost. Bursts consume individual rounds, retarget between rounds, and respect reload/ammo boundaries.

A cache is visible on every map and opens automatically after the midpoint wave. Its contents persist even after defeat. The first cache is one-time per mission; repeat clears still earn Salvage. New weapon licenses and attachment purchases persist across reload and commander respec. Existing 0.3 saves retain their previously available unlocks.

The new browser suite covers graph prerequisites, research, purchases/refunds, locked fresh-profile specials, persistent Rare licenses/attachments, clear model identity, water deployment/raft charges, discounted clearance and automatic mines/UAV. All browser work uses isolated headless contexts and OS-muted audio. The source-based audio preparation recipe is in `scripts/prepare_doctrine_audio.py`; source hashes must match the provenance manifest.

## Tactical HUD (0.4.1)

The top console combines native-alpha 64px PixelForge sprites with the edges of
the original metal plaques. Live text keeps lives, credits, mission and combat
counts readable. Integrity, XP and segmented wave tracks show progress; low
integrity has a warning marker and available SP has its own badge. The HUD adapts
to phone, landscape and notebook layouts without replacing control buttons
during updates. The notebook armory also keeps the special above the weapons.

`test:hud` checks counter accuracy, transparent assets, eight viewport sizes,
labels, held clicks, game controls, combat rewards, wave progress and low lives.
It is required by the deployment workflow. Sprite prompts, provenance and the
reported US$0.0394 generation cost are in `assets/hud/icons/`.
