# Aliens Tower Defense — Frontier Campaign

A static HTML/CSS/JavaScript tower-defense game. Play at **https://gmbueno.github.io/aliens-td/**.

## Campaign

- 18 individually authored missions across the Outpost, Frozen Frontier, and Hive.
- Five to nine waves per mission, visible incoming enemy compositions, and manual preparation or optional auto waves.
- Clearable cargo/ice/growth obstacles, permanent rocks, sensor pads (+18% range), power pads (+15% damage), and frost tiles (25% enemy slowdown).
- Six complementary weapons: budget defense, sustained fire, suppression, armor penetration, crowd damage, and long-range armor-piercing shots.
- Two tower upgrade branches: Firepower and Control. Four upgrades total per tower, with at most three in a branch. First/Last/Strongest/Nearest targeting.
- Sell towers for a full refund before the first wave, or 70% of the total investment afterward.
- Three active abilities with an equipped loadout: Chrono Break, Rocket Launcher, Napalm.
- Persistent XP, 10 skill points per commander level, free skill refunds, mission records, and first-clear/new-star bonuses. Existing profiles migrate automatically.

Mission difficulty is fixed. Investing in permanent skills makes earlier maps easier; later maps add stronger enemies and more demanding wave compositions. All missions are selectable so players can experiment without replay gates. Gold is local to each run; skills and records persist in this browser.

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
```

The unit/campaign tests use Node 22 without dependencies. The browser suite uses Playwright and saves screenshots under ignored `output/`. The balance runner uses a repeatable placement policy, reinvests between waves, and deliberately does not use active abilities. It is a regression benchmark, not a promise that every strategy wins.

## Controls

- Click/tap a weapon, then a free tile to build. Click a placed tower to inspect, upgrade, change targeting, or sell.
- Click a clearable obstacle to buy the position.
- **1–6** select weapons; **Space** launches the next wave or pauses/resumes; **Q** uses the equipped ability.
- **Escape** cancels selection, closes a popup, or opens the command menu; **F** toggles fullscreen.
- Auto waves, speed, sound, and the skill tree are available in the interface. Hidden browser tabs pause the mission.

Abilities and cooldowns advance with combat time and game speed, stop while paused, and do not recharge during preparation. Changing the equipped active applies on the next mission; permanent tower skills update existing towers immediately.

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
