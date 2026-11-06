# Aliens Tower Defense — Dual Support Update

A static HTML/CSS/JavaScript tower-defense game. [Play the production game](https://gmbueno.github.io/aliens-td/).

## Campaign and progression

- 18 authored missions, three biomes, four to nine waves. Waves start automatically after 18 seconds of initial preparation and 6-second intermissions. There is no early-launch bonus; Pause stops the timer.
- Start with **three category slots**, Handgun, Assault Rifle and Machine Pistol. Discover Shotgun after 1 different mission clear, Magnum 3, Sniper 4, RPG 6, Flamethrower 8 and Laser Array 10. Replays and commander level do not unlock more categories.
- Choose any discovered categories for your loadout. Two research ranks each add a slot. Victories in **1-4 and 2-4** each grant a permanent slot automatically. **Six slots maximum**: redundant slot research refunds 8 SP if a mission reward replaces it. Map chests have been removed; saved chest slots are preserved. New slots automatically fill with discovered weapons.
- Deploy **one tower per category** initially. Twin Emplacements allows two. Selling frees its placement allowance: full refund before the first wave, 70% afterward.
- No weapon models, rarity, attachments, license shops or Salvage currency. Old model-license SP refunds once on migration; XP, research, discovered categories and mission records survive.
- Kills and completed waves earn permanent XP; each commander level grants 10 SP. First clears and improved star records give extra XP once. Defeat keeps earned XP and combat records. Credits belong to the current mission.
- Three stars for no lost lives; two for at least 60% remaining; one for surviving. All missions remain selectable.

## Weapons, support and research

Each tower has two weapon-specific upgrade branches and a four-upgrade budget, up to three per branch (Magnum Penetrator has two ranks). Shotgun upgrades add pellets; MP upgrades strengthen/extend slow; Sniper optics increase range; Laser upgrades improve heat/cooling; Flamethrower improves burns/fuel. Critical chance/damage upgrades depend on category.

- **Magnum:** straight ballistic rounds pierce 1/2/3 aliens, hitting at most 2/3/4. Earlier hits deal full damage; the last allowed hit deals 50%. Swept collision preserves physical hit order and prevents repeat hits/tunneling.
- **Shotgun:** fires its entire three-pellet fan even at one target. Pellets stay straight and can hit a different alien crossing their path. Buckshot adds pellets.
- **Flamethrower:** hits every alien in the short flame cone, including aliens behind others. Lingering burn retains the firing tower's kill credit.
- **Laser:** continuous damage ticks, a five-second heat window and cooling before resuming.
- **Last Line:** five research ranks deploy 2/4/6/8/10 finite exit mines. Each deals 5,500 area damage.
- **Patrol UAV:** unlock one drone, then Wingman for a second. Click a drone or its shared landing pad, choose UAV 1/2, upgrade damage or range/fire rate with mission credits and choose targeting independently.
- **Targeting:** First, Last, Strongest and Nearest are free; **Finish the Weak** unlocks Weakest for all weapons and drones. Strength uses current health plus shields.
- **Combat Records:** per-tower kills appear in combat; the weapon inspector shows each selected tower's count. The mission-select records page stores lifetime category/support kills, including splash, burns, mines and artillery. Counts begin with 0.6.0; earlier history cannot be reconstructed.

The narrower sidebar is flush with the battlefield and matches its height, with two weapon cards per row and smaller full-art power cards. Prices are centered; shortcuts appear only in Command Menu → Shortcuts. The upgrade inspector leads with two clearly priced purchases, before/after stats and rank marks, followed by targeting and selling. The shared sidebar shows equipment until a tower/drone/obstacle is selected, then switches to its controls. No bottom rack or manual-wave toolbar. First-use cues remember completed upgrades, power use and research; Commander starts highlighting only after a victory. New weapon discoveries highlight Change loadout until it is opened. Reduced-motion preferences use static highlights. Pause/speed controls and the favicon have matching SVG artwork.

The commander graph has five focused tabs: Training, Deployment, Support, Artillery and Napalm. Prerequisite connections, ranks, previews and purchase states remain explicit. Nodes can be refunded for free between missions. Purchases missing SP or credits are moderately desaturated.

Artillery marks an area and launches ten shells over five seconds. Separate research adds damage, radius, lower cooldown, or duration/shells (up to twenty over ten seconds). Napalm marks a persistent fire field, igniting aliens entering later; damage, radius, cooldown and field duration have independent research. Chrono Break stops movement. Start with one power; all three are available from the start, with Chrono Break (Stasis) equipped by default. Support → Dual Support costs 12 SP after one Chrono Break rank, adding a second different power with its own cooldown. The new slot fills immediately without resetting the first power. Choose either slot in Change loadout; selecting a power already equipped swaps the two positions.

Loadout/category changes and special/support research apply on the next deployment. The battle's **Change loadout → Apply loadout & restart** action explicitly starts a new run with saved choices. Weapon training, extra weapon/power slots (with automatic selection), duplicate placement, Weakest, clearance and pontoon research apply immediately. Starting supplies and mines cannot be replenished during a run; refunds are blocked until results or mission select.

## Maps and presentation

The first three missions teach the basics with $360/$350/$350, no paid crates or speed tiles, and a gradual two-species → armored-alien introduction. Fixed wave rewards after mission 3 compensate part of the removed launch income.

Later maps include removable cargo/ice/growth, permanent rocks, water, range pads (+18%), damage pads (+15%), frost slowdown (−25%) and amber overdrive (+35% alien speed). Pontoon research allows water placement for $35 extra. Ravagers accelerate after damage; Juggernauts resist slow; Broodmothers spawn hatchlings; Menders heal allies. Briefings show each mission's actual enemy roster.

The HUD uses native-alpha PixelForge icons and original metal plaques. Original detailed firearm artwork and full illustrated power cards are retained. Dedicated alien, obstacle, water and energy-weapon art lives under `assets/frontier/`, with provenance and generation costs. Pointer placement previews show the actual weapon, range and destination tile.

Firearms use self-hosted CC0 recordings with alternate samples, subtle pitch/gain variation, short reflections, the approved artillery layer and a bounded mixer. Energy weapons use bounded hum/hiss voices. Pause/mute/menu stop audio. Audio sources, licenses, hashes and preparation scripts are in `assets/audio/` and `scripts/`.

## Controls

- Click/tap a category then a free tile. Click a placed tower to inspect/upgrade/target/sell, a UAV/base to manage drones, or an obstacle to clear it.
- **1–6** select equipped weapons; **Space** pauses/resumes; **Q/E** use the primary/secondary powers (then click the map for Artillery/Napalm).
- **Escape** cancels/closes menus; **F** toggles fullscreen. Hidden tabs pause automatically.
- Cooldowns and power duration use combat time and game speed, freeze on pause and do not recover during preparation.

## Development and verification

```bash
npm run serve
npm test
npm run test:balance
npm ci
npx playwright install chromium
GAME_URL=http://localhost:4173 npm run test:browser
GAME_URL=http://localhost:4173 npm run test:controls
GAME_URL=http://localhost:4173 npm run test:audio
GAME_URL=http://localhost:4173 npm run test:arsenal
GAME_URL=http://localhost:4173 npm run test:support
GAME_URL=http://localhost:4173 npm run test:progression
GAME_URL=http://localhost:4173 npm run test:hud
GAME_URL=http://localhost:4173 npm run test:frontier
GAME_URL=http://localhost:4173 npm run test:placement
npm run build
```

Use Node 22. Browser suites use isolated headless contexts with OS-muted audio and save screenshots under ignored `output/`. Unit tests cover physics, rewards, saves, research and the full campaign; balance uses legal loadouts/duplicates and a modest repeatable placement/upgrade policy, without powers or support. It is a regression benchmark rather than a guarantee for every strategy. The first mission remains winnable with a new profile; later untrained missions remain difficult.

`src/game.js` coordinates simulation/rendering/UI; `src/data/levels/` contains explicit authored schedules; `src/data/weapons.js`, `enemies.js`, `skills.js` hold tuning. `src/systems/` holds persistence, targeting, composed stats, support and audio. `docs/design-notes.md` records earlier design research.

Pushing `main` runs `.github/workflows/deploy-pages.yml`: rules/campaign, controls, audio, category loadouts, dual-power combinations and deck layout, research/UAV/records, HUD, energy/art, all18 pointer-placement cases and three complete introductory UI missions and their learning flow must pass. `npm run build` packages a versioned runtime and a packaged browser smoke test gates GitHub Pages deployment. The entry origin/profile key stay fixed while a fingerprinted base prevents stale mixed releases. Tests/docs/development dependencies are excluded from the public bundle.
