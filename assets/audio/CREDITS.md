# Recorded weapon sounds

The gunshot recordings are from **The Free Firearm Sound Library**, created and recorded by **Ben Jaszczak, Brian Nelson, Kevin Heras, and Matthew Nanney** and released under **CC0 1.0 Universal**.

- Original publication and license: https://opengameart.org/content/the-free-firearm-sound-library
- Preserved source recordings and metadata: https://github.com/buddingmonkey/FreeFirearmsSFXLibrary
- License text: LICENSE-CC0.txt in this directory.

Sources used from `Prepared SFX/`:

| Game weapon | Recording | Source firearm |
| --- | --- | --- |
| Handgun | Walther PPQ/X_39P.wav | Walther PPQ, 9mm |
| Assault Rifle | AR-15/D_32P.wav | AR-15/M4, 5.56mm |
| Machine Pistol | Carl Gustav M45/G_31P.wav | Carl Gustav M45, 9mm |
| Magnum | Smith & Wesson 642/V_27P.wav | S&W 642 revolver, .38 Special |
| Shotgun | Nova/O_21P.wav | Benelli Nova, 12 gauge |
| Sniper | Tikka/W_29P.wav | Tikka T3, .30-06 |

These recordings represent the game's fictional towers; model names do not imply endorsement or exact weapon simulation. No audio was extracted from Call of Duty or another commercial game.

## Current firearm mix (Command update)

Each gun report layers the original full-band firearm recording with a short, caliber-scaled portion of the approved `effects/artillery.mp3` report. The recording keeps its crack; the artillery layer supplies low/mid-frequency body. Edits include 60–65Hz cleanup, a low-pass on the body layer, short 43/79ms reflections, gentle compression, peak limiting and MP3 encoding. Two or three original takes alternate with small pitch/gain variation. Models add a modest caliber-based pitch/gain adjustment. The runtime power bus retains the approved artillery processing separately from the new firearm bus.

Exact original offsets, source/output hashes, artillery-body source hash and editing notes are in `recordings.json`. The repeatable preparation recipe is `scripts/prepare_doctrine_audio.py`, using ffmpeg and the six source WAVs listed above. No audio was extracted from Call of Duty or League of Legends.

## Power reports and original effects

`effects/impact.mp3`, `effects/rocket-launch.mp3` and `effects/artillery.mp3` derive from **Explosions** by **EZduzziteh**, CC0: https://opengameart.org/content/explosions-4 — source `explosion1_0.ogg`. Edits: trim, pitch variation, bass shelf, low-pass, limiter, fade and MP3 encoding. The launch sound is a stylized adaptation, not a recording of a specific launcher. These five power/effect files are unchanged from the approved 0.3 release.

`effects/napalm.mp3` and `effects/chrono.mp3` are original project-designed rendered effects (fire whoosh and layered stasis chime), also dedicated to CC0. Effect source/output hashes are in `effects.json`.

There are 14 firearm takes and 5 power/effect files. The UAV reuses the first Machine Pistol take at low gain; the runtime decodes 20 sources from these 19 unique files.
