// Self-hosted, CC0 firearm recordings. Provenance and edits: assets/audio/CREDITS.md.
const clips = (key, count) => Array.from({ length: count }, (_, index) =>
  new URL(`../../assets/audio/weapons/${key}-${index + 1}.mp3`, import.meta.url).href);

export const weaponAudio = {
  handgun: { files: clips('handgun', 3), gain: 0.6 },
  assault_rifle: { files: clips('assault_rifle', 2), gain: 0.32 },
  machine_pistol: { files: clips('machine_pistol', 3), gain: 0.26 },
  magnum: { files: clips('magnum', 2), gain: 0.7 },
  shotgun: { files: clips('shotgun', 2), gain: 0.8 },
  sniper: { files: clips('sniper', 2), gain: 0.8 },
};
