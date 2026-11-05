import { weaponAudio } from '../data/audio.js';

// Keep audio outside the deterministic simulation. One recorded shot per shell,
// not per pellet; a bounded voice pool prevents large armies from overloading it.
export function createWeaponAudio() {
  let context = null, master = null, compressor = null, body = null, powerBody = null;
  let muted = false, paused = true, decoding = null;
  let played = 0, suppressed = 0, errors = 0, lastShot = null;
  const voices = new Set();
  const buffers = new Map();
  const previousVariant = new Map();
  const lastFired = new Map();
  // Fetch early without opening an AudioContext (or asking for autoplay).
  const downloads = Object.entries(weaponAudio).flatMap(([key, config]) =>
    config.files.map((url, index) => ({ key, index, data: fetch(url).then(response => {
      if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
      return response.arrayBuffer();
    }).catch(() => { errors += 1; return null; }) })));

  function silence() {
    if (!context) return;
    for (const voice of voices) {
      voice.gain.gain.cancelScheduledValues(context.currentTime);
      voice.gain.gain.setTargetAtTime(0, context.currentTime, 0.004);
      voice.source.stop(context.currentTime + 0.02);
    }
    voices.clear();
  }

  function setEnabledState(nextMuted, nextPaused) {
    if (muted === nextMuted && paused === nextPaused) return;
    muted = nextMuted; paused = nextPaused;
    if (muted || paused) silence();
    if (master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(muted || paused ? 0 : 0.72, context.currentTime, 0.008);
    }
  }

  async function unlock() {
    if (!context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      context = new Context();
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 12;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.02;
      compressor.release.value = 0.1;
      master = context.createGain();
      master.gain.value = muted || paused ? 0 : 0.72;
      body = context.createBiquadFilter(); body.type = 'lowshelf'; body.frequency.value = 150; body.gain.value = 1;
      const presence = context.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 3200; presence.Q.value = .7; presence.gain.value = -0.5;
      body.connect(presence); presence.connect(compressor);
      compressor.connect(master);
      // Keep the approved power mix; the new firearm bus preserves more crack.
      powerBody=context.createBiquadFilter();powerBody.type='lowshelf';powerBody.frequency.value=150;powerBody.gain.value=3;
      const powerPresence=context.createBiquadFilter();powerPresence.type='peaking';powerPresence.frequency.value=3200;powerPresence.Q.value=.7;powerPresence.gain.value=-2;
      const powerCompressor=context.createDynamicsCompressor();powerCompressor.threshold.value=-13;powerCompressor.knee.value=12;powerCompressor.ratio.value=3;powerCompressor.attack.value=.015;powerCompressor.release.value=.1;
      powerBody.connect(powerPresence);powerPresence.connect(powerCompressor);powerCompressor.connect(master);
      master.connect(context.destination);
    }
    if (context.state === 'suspended') await context.resume().catch(() => {});
    if (!decoding) decoding = Promise.all(downloads.map(async ({key, index, data}) => {
      const bytes = await data;
      if (!bytes) return;
      try {
        const buffer = await context.decodeAudioData(bytes);
        if (!buffers.has(key)) buffers.set(key, []);
        buffers.get(key)[index] = buffer;
      } catch { errors += 1; }
    }));
    await decoding;
  }

  function play(key, x = 640, width = 1280, options = {}) {
    const config = weaponAudio[key];
    const available = buffers.get(key)?.map((buffer, index) => buffer ? index : null).filter(index => index !== null) || [];
    if (!context || context.state !== 'running' || muted || paused || !config || !available.length) return false;
    const now = context.currentTime;
    // Preserve the cadence of individual guns; coalesce near-simultaneous copies.
    if (now - (lastFired.get(key) ?? -Infinity) < 0.018 || voices.size >= 24 || [...voices].filter(v => v.key === key).length >= 6) {
      suppressed += 1; return false;
    }
    const choices = available.filter(index => index !== previousVariant.get(key));
    const index = choices[Math.floor(Math.random() * choices.length)] ?? available[0];
    previousVariant.set(key, index); lastFired.set(key, now);
    const source = context.createBufferSource();
    source.buffer = buffers.get(key)[index];
    const rate = (options.pitch ?? 1)*(0.975 + Math.random() * 0.05);
    source.playbackRate.value = rate;
    const gain = context.createGain();
    const amplitude = config.gain * (options.gain ?? 1) * (0.94 + Math.random() * 0.12);
    gain.gain.value = amplitude;
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-0.6, Math.min(0.6, (x / width - 0.5) * 1.2));
    source.connect(gain); gain.connect(panner); panner.connect(config.power?powerBody:body);
    const voice = { key, source, gain };
    voices.add(voice);
    source.onended = () => { voices.delete(voice); source.disconnect(); gain.disconnect(); panner.disconnect(); };
    source.start(now);
    played += 1;
    lastShot = { sequence: played, weapon: key, model: options.model || null, variant: index + 1, rate: Number(rate.toFixed(4)), gain: Number(amplitude.toFixed(4)) };
    return true;
  }

  return {
    unlock,
    play,
    sync: (nextMuted, nextPaused) => setEnabledState(Boolean(nextMuted), Boolean(nextPaused)),
    diagnostics: () => ({
      mode: 'recorded', state: context?.state || 'locked', muted, paused,
      loadedClips: [...buffers.values()].reduce((total, clips) => total + clips.filter(Boolean).length, 0),
      totalClips: downloads.length, activeVoices: voices.size, played, suppressed, errors, lastShot,
    }),
  };
}
