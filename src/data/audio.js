// Self-hosted, CC0 firearm recordings. Provenance and edits: assets/audio/CREDITS.md.
const clips = (key, count) => Array.from({ length: count }, (_, index) =>
  new URL(`../../assets/audio/weapons/${key}-${index + 1}.mp3?v=arsenal-20261105`, import.meta.url).href);

const effect = name => [new URL(`../../assets/audio/effects/${name}.mp3?v=arsenal-20261105`, import.meta.url).href];
export const weaponAudio = {
  handgun: { files: clips('handgun', 3), gain: 0.6 },
  assault_rifle: { files: clips('assault_rifle', 2), gain: 0.32 },
  machine_pistol: { files: clips('machine_pistol', 3), gain: 0.26 },
  magnum: { files: clips('magnum', 2), gain: 0.7 },
  shotgun: { files: clips('shotgun', 2), gain: 0.8 },
  rocket_launcher: { files: effect('rocket-launch'), gain: .85 },
  impact: { files: effect('impact'), gain: .8 },
  artillery: { files: effect('artillery'), gain: .7 },
  napalm: { files: effect('napalm'), gain: .85 },
  chrono: { files: effect('chrono'), gain: .7 },
  sniper: { files: clips('sniper', 2), gain: 0.8 },
};
