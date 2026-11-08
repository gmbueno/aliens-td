# Frontier Campaign design notes

## Research applied

George Fan's [GDC 2012 talk about Plants vs. Zombies](https://media.gdcvault.com/gdc2012/slides/Design%20Track/Fan_George_How%20I%20Got.pdf) emphasizes teaching through play, spreading new mechanics across the game, using visual explanations, and keeping instructions unobtrusive. This informed the safe preparation phase, brief contextual messages, visible route arrows, incoming enemy intel, and gradual introduction of fast, armored, shielded, and boss enemies.

Ninja Kiwi's [Bloons TD 6 description](https://store.steampowered.com/app/960090/Bloons_TD_6/) presents upgrade paths, diverse maps, boss challenges, and permanent knowledge upgrades as core features. The [official Netflix gameplay guide](https://help.netflix.com/en/node/718990757024356) also describes tower placement, upgrading, selling, and career progression. These informed the two tower branches, target selection, reversible opening placements, map-specific tactical positions, and persistent skill growth. These are design inspirations, not claims of equivalent depth or empirically proven retention gains.

## Decisions

- Keep the existing alien art and combat identity; turn the plain mission grid into a map atlas with terrain previews and briefings.
- Double the campaign from 9 to 18 missions, with 3 sectors and 6 missions per sector. Each route and spawn schedule lives explicitly in its owning file.
- Use fixed mission strength instead of scaling enemies to the player's level. The player should feel the benefit of investing points and returning to a difficult mission.
- Start with readable scout waves, then add fast enemies, armor, shields, and bosses. The first missions of each biome provide breathing room before later spikes.
- Obstacles constrain placement rather than line of sight. Some can be removed for gold. Routes and build tiles have no special speed, range or damage modifiers.
- Make weapon roles mechanical: suppression slows; heavy rounds pierce armor; shotgun pellets distribute over a cluster. Homing shots respect selected targets and avoid unreliable collision misses at 2x.
- Offer Firepower (+40% damage/rank) and Control (+12% range, +15% fire rate/rank). Four upgrades total, maximum three per branch, creates a meaningful specialization tradeoff.
- Reward kills, completed waves, surviving, first clears, and better star records. Permanent training is free to redistribute. Do not introduce paid continues, idle waiting, or a mandatory grind gate.
- Ability cooldowns recover only during combat. Preparation is unlimited and safe, and cannot be exploited to recharge abilities between every wave.
- Keep the event attribution as a static Vibe Jam link: its remote widget was returning invalid JavaScript (`var rank = null, total = 943 a.textContent...`) during validation.

## Balance and validation

The deterministic runner in `tests/balance.mjs` compares untrained profiles with a rising passive-training curve. Its heuristic chooses coverage and damage value, spends between waves, and uses no active ability. It does not simulate human reaction time or explore every strategy.

The initial run exposed excessive opening pressure in sectors 2/3. Starting funds and early wave sizes were adjusted, while later mixed waves retained their pressure. The final boss's base health was reduced after a fully trained benchmark reached it but could not kill it. Each of the 18 trained benchmark runs now wins, while several later missions defeat the untrained policy. The first mission remains winnable from a fresh profile.

Automated checks cover mission geometry, placement, obstacles, upgrade/refund accounting, armor/shields, paused and 2x ability timing, profile migration, one-time rewards, full victories and defeat. Browser checks use the real interface for purchases, skill respec, abilities, next-mission flow, reload persistence, and 390px portrait / 844px landscape / desktop layouts. Screenshots are manually inspected.

The game exposes `render_game_to_text()` and `advanceTime(ms)` for reproducible browser testing. Future balance adjustments should use actual play feedback alongside these deterministic checks, especially for weapon variety and difficulty spikes.


## Arsenal expansion — November 2026

Research: the [official BTD6 description](https://store.steampowered.com/app/960090/Bloons_TD_6/) and [official Netflix gameplay guide](https://help.netflix.com/en/node/718990757024356) emphasize towers with distinct upgrade paths and progression unlocks. This update adapts those principles to two clear paths per gun and a compact loadout; it does not reproduce BTD6's full path tree.

- Keep six battle slots. Five fixed classes plus Heavy = Sniper or RPG; never expand the combat toolbar to seven cards. RPG unlocks at Lv 4 and trades slow fire / short magazines for splash.
- Model unlocks: Common at 1, Rare at 3, Epic at 6, Legendary at 10. Rare emphasizes cadence, Epic damage, Legendary versatility. Every model retains the same deployment cost. Choosing a higher rarity is optional; the campaign benchmark uses Common models without attachments or actives.
- Attachment capacity is 0/1/1/2 by rarity. Incendiary unlocks at 3, Cryo at 4, Concussive at 6, Blast at 8. Free deterministic choices, no loot rolls, item inventory, duplicate drops, crafting, separate currency or stat rerolls. Direct-hit effects do not stack per-pellet burns; the strongest burning DPS/slow prevails. RPG Blast trades the small secondary hit for +12 radius.
- Arsenal swaps are next-deployment only. A mission snapshots its arsenal so later XP/unlocks and skill changes cannot silently alter models or attachments on deployed towers. Commander passive skills still update live.
- Battlefield paths: Handgun stopping power/quickdraw; AR heavy rounds/extended magazine; MP hot barrel/suppression; Magnum devastator/speed loader; Shotgun buckshot/choke & pump; Sniper anti-materiel/long-range optics; RPG high explosive/rapid loader. Preserve four total upgrades and three per branch. Shotgun begins at 3 pellets and power ranks add one each (4/5/6), with independent swept ballistic collision.
- Keep all targeting modes available. Gating previously available targeting would remove a familiar usability control without adding a clear, enjoyable progression choice.
- Artillery replaces the old single rocket active: ten shells at 0.25s then every 0.5s, ending at five seconds. An outer target ring indicates the barrage zone; individual explosions have smaller impact radii. Pause and game speed affect the entire barrage. Old equipped-active and invested SP ranks migrate.
- Chrono uses a golden shockwave and stasis silhouettes; Napalm has falling trails and flame particles; RPG/artillery have launch reports, expanding shockwaves, sparks and smoke. No assets were extracted from CoD or LoL.
- New enemy traits arrive gradually: Ravager from mission 5, Juggernaut from 8, Broodmother from 10. Spawns are explicit in authored wave data, and intel explains their counters. Broodmothers release at most three hatchlings over time plus three on death; hatchlings grant zero gold/XP to avoid farming loops.
- Gunshots retain recorded transients, with a low-pitched parallel recording layer, 45Hz cleanup, 160Hz body boost, 3.3kHz reduction, longer tails and gentler runtime compression. The measured ratio of sub-500Hz energy to above-2.5kHz energy increased 1.5–2.3× across the 14 clips versus 0.2.2 (first 350ms). This verifies tonal change, not subjective listening preference. Explosion adaptations are [EZduzziteh CC0 recordings](https://opengameart.org/content/explosions-4); fire/stasis are original rendered effects. Provenance ships under assets/audio/.

Validation: the established automated policy still wins all 18 missions at the campaign training curve with Common models, no attachments and no actives. Fresh players can finish mission 1; a fixed later map becomes easier through commander training. This is a repeatable regression benchmark, not a human playtest or a guarantee for every build. Optional player feedback should guide later adjustments to RPG value, attachment combinations and subjective sound balance.


## Command graph and expedition economy (0.4.0)

This supersedes 0.3's global rarity-level unlock schedule. The [official Black Ops 7 equipment guide](https://www.callofduty.com/blog/2025/11/call-of-duty-black-ops-7-ready-for-launch-weapons-equipment) documents semi-auto/automatic/burst pistol archetypes, burst/automatic rifles and pump/double-barrel/automatic shotguns. We adapted the behavior into four fictional models per class, retaining six deployment slots. Names, silhouettes and sounds are our game's assets, not extracted COD content.

- One commander graph, three color-coded branches, 12 nodes, a free command root, an inspector showing prerequisites and exact effects, and mobile scrolling/branch shortcuts. No separate graph per weapon. Entry choices: weapon training, reload, clearance, or mines. Actives require research for new players. Old active/model unlocks are grandfathered without deleting SP, equipment, XP or mission records.
- Logistics: clearance costs −15% per rank (max −45%); starting funds +25/rank (max +75); Pontoon Engineering permits 35-credit water rafts. Five authored maps contain water; paths remain dry and buildable land alternatives remain viable. Water changes valid build positions, rather than adding another weapon slot.
- Automatic support: Last Line gives 5/10 finite mines near the exit, 1,100 damage / 48-radius blasts, no refill within a mission. A researched UAV reserves a small visible base and patrols/shoots automatically; ranks improve damage and coverage. Support/supplies and active loadouts/ranks snapshot at deployment. Training and clearance/pontoon research apply live. Node refunds are free between missions, preventing a deploy-with-support / refund-into-training exploit.
- Resource roles: Credits buy run defense and clearance; SP buys commander nodes and 8-SP Rare licenses; persistent Salvage buys attachments once (40/60/80/100). Weapon licenses are permanent and excluded from commander-node refunds. The wallet and acquisition labels explain these roles before purchase.
- Every authored map has an automatic midpoint cache, with no extra battle button. First cache per map: 30 Salvage plus an Epic plan, or a Legendary plan on sector finales. Already-owned advanced plans turn into an extra 20 Salvage. First clears award 25 Salvage, replays 8. Cache/drop rewards persist after defeat.
- Eligible drops: Juggernauts and Broodmothers 4%; Overseers/Motherships 18%; a guaranteed drop on the 20th eligible kill without one. Only unowned Legendary plans are selected; after completion, drops yield Salvage. Hatchlings never produce rewards. Randomness changes collections only; the campaign remains beatable with Common plans and no power/support perks.
- Models have class-specific cadence, magazine, damage, range, pellet and burst properties. Burst rounds are actually queued, spend separate ammo, re-evaluate targeting and stop at reload boundaries. Model art, class, name and mode are visible on field cards and inspection panels. Model-aware upgrades add to each model's pellet/slow baseline.
- Menders appear from mission 12 and heal other nearby living aliens by up to 500 HP every 2s; no self-heal or revival. These give focused fire another purpose without adding damage-type charts.
- Gun sound now layers each original firearm take with a scaled piece of the approved artillery report and short reflections. Keep the recorded crack instead of relying on more EQ alone; give heavier/lighter models subtly different pitch/gain. Preserve the approved power-report files and power processing bus. Decode/variation, pause/mute/menu cleanup and finite voice counts are verified in OS-muted browsers; subjective timbre remains a player listening judgment.
