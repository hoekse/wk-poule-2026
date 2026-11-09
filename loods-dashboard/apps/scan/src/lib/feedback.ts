// Korte piep en tril bij scannen, zodat je niet naar het scherm hoeft te kijken.
let ctx: AudioContext | null = null;

function piep(freq: number, duur: number, volume = 0.18) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = volume;
    osc.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duur);
    osc.start(t);
    osc.stop(t + duur);
  } catch {
    /* geluid is een extraatje */
  }
}

function tril(patroon: number | number[]) {
  try {
    navigator.vibrate?.(patroon);
  } catch {
    /* niet elk toestel kan trillen */
  }
}

export const feedback = {
  goed() {
    piep(1320, 0.09);
    tril(40);
  },
  fout() {
    piep(220, 0.25, 0.22);
    tril([80, 60, 80]);
  },
  klaar() {
    piep(880, 0.08);
    setTimeout(() => piep(1320, 0.12), 90);
    tril([30, 40, 60]);
  },
};
