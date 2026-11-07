# Aliens Tower Defense — Tactical Frontier Update

A static HTML/CSS/JavaScript tower-defense game. [Play the production game](https://gmbueno.github.io/aliens-td/).

## Campaign and progression

- 18 authored missions, three biomes, four to nine waves. Waves start automatically after 18 seconds of initial preparation and 6-second intermissions. There is no early-launch bonus; Pause stops the timer.
- Start with **three category slots**, Handgun, Assault Rifle and Machine Pistol. Discover Shotgun after 1 different mission clear, Magnum 3, Sniper 4, RPG 6, Flamethrower 8 and Laser Array 10. Replays and commander level do not unlock more categories.
- Choose any discovered categories for your loadout. Two research ranks each add a slot. Victories in **1-4 and 2-4** each grant a permanent slot automatically. **Six slots maximum**: redundant slot research refunds 8 SP if a mission reward replaces it. Map chests have been removed; saved chest slots are preserved. New slots automatically fill with discovered weapons.
- Deploy **two towers per category** initially. Extra Emplacements has three ranks, allowing three, four and five. Selling frees its placement allowance: full refund before the first wave, 70% afterward.
- No weapon models, rarity, attachments, license shops or Salvage currency. Old model-license SP refunds once on migration; XP, research, discovered categories and mission records survive.
- Kills and completed waves earn permanent XP; each commander level grants 10 SP. First clears and improved star records give extra XP once. Defeat keeps earned XP and combat records. Credits belong to the current mission.
- Three stars for no lost lives; two for at least 60% remaining; one for surviving. All missions remain selectable.

## Weapons, support and research

Each tower has two weapon-specific upgrade branches and a four-upgrade budget, up to three per branch (Magnum Penetrator has two ranks). Shotgun upgrades add pellets; MP Suppression first unlocks slow, then strengthens/extends it; Sniper optics increase range; Laser upgrades improve heat/cooling; Flamethrower improves burns/fuel. Critical chance/damage upgrades depend on category.

- **Magnum:** a fixed rectangular firing lane; rotate 90° with R before placement or the inspector button after placement. It never tracks enemies by rotating during fire. straight ballistic rounds pierce 1/2/3 aliens, hitting at most 2/3/4. Earlier hits deal full damage; the last allowed hit deals 50%. Swept collision preserves physical hit order and prevents repeat hits/tunneling.
- **Shotgun:** fires its entire three-pellet fan even at one target. Pellets stay straight and can hit a different alien crossing their path. Buckshot adds pellets.
- **Flamethrower:** hits every alien in the short flame cone, including aliens behind others. Lingering burn retains the firing tower's kill credit.
- **Laser:** base tick damage increased 30% (480→624); continuous damage ticks, a five-second heat window and cooling before resuming.
- **Last Line:** five research ranks deploy 2/4/6/8/10 finite exit mines. Each deals 5,500 area damage.
- **Hunter UAV:** unlock one drone, then Wingman for a second. Drones follow their First/Last/Strongest/Nearest/Weakest/Fastest priority target across the map and return to their base when no target remains. Each drone reserves its own landing tile. Damage is doubled (400/520/640 base per shot); Motors increases firing rate only. Cryo and Incendiary are mutually exclusive specializations per drone, three ranks each, separate from its four core upgrades. Click a drone or its landing pad, choose UAV 1/2, upgrade damage or range/fire rate with mission credits and choose targeting independently.
- **Radar Beacon:** unlock after two mission clears. Its circular aura gives nearby weapons +10% range and attack speed; Fire Control adds damage, Signal Amplifier extends and strengthens the aura. Overlaps use the strongest bonus rather than stacking. Allies and placement/upgrade previews reflect the actual buffs. Circular weapon range uses a disk of whole cells; acquisition and the visible footprint use identical cell-center membership.
- **Targeting:** First, Last, Strongest and Nearest are free; Rapid Intercept unlocks **Fastest**, based on current movement speed; **Finish the Weak** unlocks Weakest for all weapons and drones. Strength uses current health plus shields.
- **Combat Records:** per-tower kills appear in combat; the weapon inspector shows each selected tower's count. The mission-select records page stores lifetime category/support kills, including splash, burns, mines and artillery. Counts begin with 0.6.0; earlier history cannot be reconstructed.

Weapon cards now use compact metal tiles, retaining the original sprites. The narrower sidebar is flush with the battlefield and matches its height, with two weapon cards per row and smaller full-art power cards. Prices are centered; shortcuts appear only in Command Menu → Shortcuts. The upgrade inspector leads with two clearly priced purchases, before/after stats and rank marks, followed by targeting and selling. The shared sidebar shows equipment until a tower/drone/obstacle is selected, then switches to its controls. No bottom rack or manual-wave toolbar. First-use cues remember completed upgrades, power use and research; Commander starts highlighting only after a victory. New weapon discoveries highlight Change loadout until it is opened. Reduced-motion preferences use static highlights. Pause/speed controls and the favicon have matching SVG artwork.

The commander graph has six focused tabs: Training, Deployment, Support, Artillery, Napalm and Time Stop, with PixelForge symbols in connected diamond nodes. Prerequisite connections, ranks, previews and purchase states remain explicit. Nodes can be refunded for free between missions. Purchases missing SP or credits are moderately desaturated.

Artillery marks an area and launches ten shells over five seconds. Separate research adds damage, radius, lower cooldown, or duration/shells (up to twenty over ten seconds). Napalm marks a persistent fire field, igniting aliens entering later; damage, radius, cooldown and field duration have independent research. Chrono Break stops movement. Start with one power; all three are available from the start, with Chrono Break (Stasis) equipped by default. Support → Dual Support costs 12 SP after one Last Line rank, adding a second different power with its own cooldown. The new slot fills immediately without resetting the first power. Choose either slot in Change loadout; selecting a power already equipped swaps the two positions.

Loadout/category changes and special/support research apply on the next deployment. The battle's **Change loadout → Apply loadout & restart** action explicitly starts a new run with saved choices. Weapon training, extra weapon/power slots (with automatic selection), duplicate placement, Weakest, clearance and pontoon research apply immediately. Starting supplies and mines cannot be replenished during a run; refunds are blocked until results or mission select.

## Maps and presentation

The first three missions teach the basics with $575/$560/$560, no paid crates or speed tiles, and a gradual two-species → armored-alien introduction. Later missions provide much larger starting funds, 50% more spawn entries, 20% higher health, and larger wave payouts. Weapon prices rise about35%; field upgrade multipliers are54% of their former values; kill credits rise60%. This funds and demands a larger army while preserving the opening learning curve.

Later maps include removable cargo/ice/growth, permanent rocks, water, range pads (+18%), damage pads (+15%), sprite-based range/damage floor overlays, sprite-based researched exit mines, frost slowdown (−25%) and amber overdrive (+35% alien speed). Pontoon research allows water placement for $35 extra. Ravagers accelerate after damage; Juggernauts resist slow; Broodmothers spawn hatchlings; Menders heal allies. Briefings show each mission's actual enemy roster.

Olive armor, distressed brass and cream text now extend through menus, HUD, inspector, loadout and background. The HUD retains native-alpha PixelForge icons and original metal plaques. Original firearm sprites are retained; RPG, Flamethrower and Laser now use512px art. PixelForge-generated full illustrated power cards use1024px source art. Dedicated alien, obstacle, water and energy-weapon art lives under `assets/frontier/`, with provenance and generation costs. Pointer placement previews show the actual weapon, range and destination tile.

Firearms use self-hosted CC0 recordings with alternate samples, subtle pitch/gain variation, short reflections, the approved artillery layer and a bounded mixer. Energy weapons use bounded hum/hiss voices. Pause/mute/menu stop audio. Audio sources, licenses, hashes and preparation scripts are in `assets/audio/` and `scripts/`.

## Controls

- Click/tap a category then a free tile. Click a placed tower to inspect/upgrade/target/sell, a UAV/base to manage drones, or an obstacle to clear it.
- **1–6** select equipped weapons; **Space** pauses/resumes; **R** rotates a selected Magnum or placement preview; **Q/E** use the primary/secondary powers (then click the map for Artillery/Napalm).
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
GAME_URL=http://localhost:4173 npm run test:pads
GAME_URL=http://localhost:4173 npm run test:tactics
GAME_URL=http://localhost:4173 npm run test:expansion
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

## Free play and command art

Victory offers **Free play** on the same map, retaining towers, upgrades, lives, credits and power cooldowns. Subsequent waves are deterministically generated per mission/round, increasing health, count and roster variety with bosses every fifth round. Only the current generated wave is retained; at most180 spawns per wave, with health continuing to grow after count/spacing cap. Combat XP and kill records continue; mission stars, first-clear XP and slot rewards are awarded only by the campaign victory. Preparation and first-spawn delays appear at IN and freeze on pause.

PixelForge created32 individual talent symbols and four128px field sprites through the user-owned studio; source prompts, model and collection hashes are in `assets/command/provenance.json`. Native alpha, CC0. The drone symbol uses the field drone art. Schema7 migrates legacy Stasis cooldown benefits into its separate node once. Talent refunds preserve the normal between-mission restrictions.

## Tactical economy, terrain and targeting

- **Credit Factory** (2 mission clears): $15 every8 combat seconds, four base payouts per wave. High-yield Press adds$12 per payout per rank; Automation shortens the cycle and adds payout capacity. No income while paused, between waves or after results.
- **Siege Missile** (5 clears): place, then click an impact tile within range. Continually launches at that location during a wave, with ammo/reload and delayed blast damage. Move the point from its inspector; automatic priorities never steer it.
- **Mine Foundry** (4 clears): produces finite persistent mines on nearby path tiles, retained across waves until ground aliens cross. Upgrades improve damage/blast or active capacity/rate. Maximum120 field mines bounds storage.
- **Gas Emitter** (7 clears): damages all ground aliens in its cell footprint, consumes fuel and refills. Flying aliens bypass gas and ground mines.
- **Infested cargo:** optional free-clearing positions after the three training missions. Opening releases three real aliens which join the nearest track point. Their kills grant normal credits/XP; escaped aliens damage the base. Each crate opens once and its cell remains buildable.
- **Sky Wraith:** introduced gradually from mission1-5 and later free-play rounds. Flies directly from entry to exit, with progress comparable to ground aliens for First/Last. All aiming weapons can intercept it; ground hazards do not.
- Click an alien to inspect HP, shields, current speed and traits. Research **Priority Mark** in Training to mark it; eligible aiming weapons/drones override automatic priorities while it is alive and in range. Click again to cancel; defeat or escape automatically clears the mark. Fixed-point missiles and area/trap weapons keep their manual behavior.

`assets/tactics/provenance.json` records PixelForge prompts, models, hashes and original dimensions. New field sprites retain256px per cell, weapons512px and power cards1024px; exported originals avoid the editor's128px reduction. All generated art uses the studio's CC0 export. [Tactical design notes](docs/tactical-design.md) explain the Bloons-inspired specialization and eight distinct future directions.

Machine Pistol has no innate slow. Suppression ranks give25% for0.7s,35% for1.3s,45% for1.9s; damage-only upgrades never grant slow. Range/power pad overlays render below towers, and exit mines retain their existing damage, stock and trigger positions. PixelForge source provenance is in `assets/pads/`. Proposed future control identities are in [control-options](docs/control-options.md), pending player/user choice.
