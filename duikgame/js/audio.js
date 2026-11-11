/* Diepblauw — geluid, volledig gesynthetiseerd met WebAudio (geen bestanden nodig) */
(function (DG) {
  'use strict';
  const A = (DG.Audio = { ctx: null, on: true, musicOn: true });
  let master, sfx, amb, mus, noiseBuf, ambNodes = null, musicTimer = null, crackleTimer = null;

  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.ctx = new AC();
    } catch (e) { return; }
    const c = A.ctx;
    master = c.createGain(); master.gain.value = A.on ? 0.9 : 0; master.connect(c.destination);
    sfx = c.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    amb = c.createGain(); amb.gain.value = 0; amb.connect(master);
    mus = c.createGain(); mus.gain.value = 0; mus.connect(master);
    const len = c.sampleRate * 2;
    noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // bruine ruis
      d[i] = i % 2 ? w * 0.6 : last * 3.5;
    }
  };

  A.setSound = function (on) {
    A.on = on;
    if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, A.ctx.currentTime, 0.05);
  };
  A.setMusic = function (on) {
    A.musicOn = on;
    if (!on) A.music(false);
  };

  function noise(dest, dur, type, freq, q, gain, attack, release, t0) {
    if (!A.ctx) return;
    const c = A.ctx, t = t0 || c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (release || 0.1));
    src.connect(f); f.connect(g); g.connect(dest || sfx);
    src.start(t, Math.random());
    src.stop(t + dur + (release || 0.1) + 0.05);
    return f;
  }
  function tone(freq, dur, type, gain, dest, t0, glideTo) {
    if (!A.ctx) return;
    const c = A.ctx, t = t0 || c.currentTime;
    const o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function bell(freq, t0, gain, dur) {
    tone(freq, dur || 1.4, 'sine', gain || 0.12, sfx, t0);
    tone(freq * 2.76, (dur || 1.4) * 0.5, 'sine', (gain || 0.12) * 0.25, sfx, t0);
  }

  // Onderwater-ambiance met krakende knalgarnalen
  A.ambience = function (on, level) {
    if (!A.ctx) return;
    const c = A.ctx;
    if (on && !ambNodes) {
      const src = c.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
      const g = c.createGain(); g.gain.value = 0.35;
      src.connect(f); f.connect(g); g.connect(amb);
      src.start();
      ambNodes = { src, f, g };
      crackleTimer = setInterval(() => {
        if (!A.ctx || !ambNodes) return;
        const t = A.ctx.currentTime;
        const n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) noise(amb, 0.004, 'highpass', 3500 + Math.random() * 3000, 1, 0.05 * (level || 1), 0.001, 0.01, t + Math.random() * 0.12);
      }, 130);
    }
    if (on) amb.gain.setTargetAtTime(0.55, c.currentTime, 0.6);
    if (!on && ambNodes) {
      amb.gain.setTargetAtTime(0, c.currentTime, 0.3);
      const n = ambNodes; ambNodes = null;
      clearInterval(crackleTimer);
      setTimeout(() => { try { n.src.stop(); } catch (e) { /* al gestopt */ } }, 1200);
    }
  };

  A.breathIn = function (gain) {
    noise(sfx, 0.9, 'bandpass', 1700, 0.9, 0.05 * (gain || 1), 0.35, 0.3);
    noise(sfx, 0.9, 'lowpass', 300, 0.7, 0.05 * (gain || 1), 0.3, 0.3);
  };
  A.breathOut = function (gain) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    noise(sfx, 1.0, 'lowpass', 500, 0.8, 0.08 * (gain || 1), 0.05, 0.4);
    for (let i = 0; i < 14; i++) {
      const f = 260 + Math.random() * 520;
      tone(f, 0.06, 'sine', 0.05 * (gain || 1), sfx, t + 0.05 + i * 0.07 + Math.random() * 0.05, f * 2.4);
    }
  };
  A.shutter = function () {
    noise(sfx, 0.02, 'highpass', 2500, 0.7, 0.25, 0.002, 0.03);
    tone(2200, 0.05, 'square', 0.03, sfx, A.ctx ? A.ctx.currentTime + 0.05 : 0);
  };
  A.strobe = function () { tone(3800, 0.25, 'sine', 0.03, sfx, 0, 1200); };
  A.spot = function () { if (!A.ctx) return; const t = A.ctx.currentTime; bell(988, t, 0.08, 0.9); bell(1319, t + 0.12, 0.07, 1.0); };
  A.newSpecies = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    [784, 988, 1175, 1568].forEach((f, i) => bell(f, t + i * 0.11, 0.09, 1.3));
  };
  A.beep = function () { tone(3100, 0.07, 'square', 0.035); };
  A.alarm = function () { if (!A.ctx) return; const t = A.ctx.currentTime; for (let i = 0; i < 3; i++) tone(2800, 0.08, 'square', 0.04, sfx, t + i * 0.13); };
  A.kaching = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    noise(sfx, 0.08, 'bandpass', 3000, 2, 0.12, 0.002, 0.08, t);
    bell(2093, t + 0.05, 0.08, 0.8); bell(2637, t + 0.12, 0.07, 1.0);
  };
  A.click = function () { tone(1400, 0.03, 'triangle', 0.04); };
  A.splash = function () { noise(sfx, 0.5, 'lowpass', 1400, 0.7, 0.25, 0.01, 0.5); noise(sfx, 0.3, 'highpass', 3000, 0.7, 0.05, 0.01, 0.4); };
  A.whistle = function () {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    const f = 4000 + Math.random() * 3000;
    tone(f, 0.35, 'sine', 0.025, sfx, t, f * (Math.random() < 0.5 ? 1.6 : 0.6));
  };
  A.engine = function (dur) { noise(sfx, dur || 2.5, 'lowpass', 160, 1.5, 0.18, 0.4, 0.6); };
  A.plane = function (dur) { noise(sfx, dur || 2.5, 'bandpass', 900, 0.5, 0.08, 0.8, 0.8); };

  // Rustige ambient-muziek voor kaart en winkel
  A.music = function (on) {
    if (!A.ctx) return;
    const c = A.ctx;
    if (on && A.musicOn && !musicTimer) {
      mus.gain.setTargetAtTime(0.5, c.currentTime, 1);
      const chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 392]];
      const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5];
      let i = 0;
      const play = () => {
        const t = c.currentTime + 0.05;
        const ch = chords[i % chords.length];
        ch.forEach((f) => {
          const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f / 2;
          const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 1.6);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 6.4);
          o.connect(lp); lp.connect(g); g.connect(mus);
          o.start(t); o.stop(t + 6.6);
        });
        for (let k = 0; k < 3; k++) {
          if (Math.random() < 0.7) tone(scale[Math.floor(Math.random() * scale.length)], 1.6, 'sine', 0.025, mus, t + 0.8 + k * 1.7);
        }
        i++;
      };
      play();
      musicTimer = setInterval(play, 6000);
    } else if (!on && musicTimer) {
      clearInterval(musicTimer); musicTimer = null;
      mus.gain.setTargetAtTime(0, c.currentTime, 0.5);
    }
  };
})(window.DG);
