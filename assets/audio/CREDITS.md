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

Edits for this game: individual shots isolated with 12ms onset padding, 45Hz high-pass, gain trim, peak limiting, short natural tails, 100ms fade-out, mono 44.1kHz / 128kbps MP3 encoding. Each weapon has two or three separately recorded shots. Exact source offsets, durations and output hashes are listed in recordings.json. Playback adds subtle pitch/gain variation and modest left/right positioning; the recorded transient remains intact.

## Arsenal update (November 2026)

Gunshot edits now include 45Hz high-pass cleanup, a parallel low-pitched recorded body layer, a +6dB shelf at 160Hz, a −4dB cut at 3.3kHz, a 9.5kHz low-pass, transient-preserving compression and longer fades/tails. This keeps the original recordings' attack while reducing harshness. Runtime adds a mild low shelf, presence cut, bounded voice mixing and slower compressor attack.

`effects/impact.mp3`, `effects/rocket-launch.mp3` and `effects/artillery.mp3` derive from **Explosions** by **EZduzziteh**, CC0: https://opengameart.org/content/explosions-4 — source `explosion1_0.ogg`. Edits: trim, pitch variation, bass shelf, low-pass, limiter, fade and MP3 encoding. The launch sound is a stylized adaptation of the explosion, rather than a recording of a specific launcher.

`effects/napalm.mp3` and `effects/chrono.mp3` are original project-designed rendered effects (noise/fire whoosh and a layered stasis chime). They use no commercial-game audio. All effect source/output hashes are recorded in effects.json. These original effects are also dedicated to CC0.
