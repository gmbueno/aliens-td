// Self-hosted, CC0 firearm recordings. Provenance and edits: assets/audio/CREDITS.md.
const clips = (key, count) => Array.from({ length: count }, (_, index) =>
  new URL(`../../assets/audio/weapons/${key}-${index + 1}.mp3?v=doctrine-20261105`, import.meta.url).href);

const effect = name => [new URL(`../../assets/audio/effects/${name}.mp3?v=doctrine-20261105`, import.meta.url).href];
export const weaponAudio = {
  drone: {files:clips('machine_pistol',1),gain:.1},
  handgun: { files: clips('handgun', 3), gain: .8 },
  assault_rifle: { files: clips('assault_rifle', 2), gain: .44 },
  machine_pistol: { files: clips('machine_pistol', 3), gain: .3 },
  magnum: { files: clips('magnum', 2), gain: .95 },
  shotgun: { files: clips('shotgun', 2), gain: .95 },
  rocket_launcher: { power: true, files: effect('rocket-launch'), gain: .85 },
  impact: { power: true, files: effect('impact'), gain: .8 },
  artillery: { power: true, files: effect('artillery'), gain: .7 },
  napalm: { power: true, files: effect('napalm'), gain: .85 },
  chrono: { power: true, files: effect('chrono'), gain: .7 },
  sniper: { files: clips('sniper', 2), gain: .95 },
};
