// Kiestoon zoals bij bellen in Nederland: 425 Hz, 1 seconde aan, 4 seconden uit.
// Opgewekt met Web Audio, dus geen geluidsbestand nodig.

export function startBeltoon(ctx: AudioContext): () => void {
  const uit = ctx.createGain();
  uit.gain.value = 0;
  uit.connect(ctx.destination);

  const toon = ctx.createOscillator();
  toon.type = 'sine';
  toon.frequency.value = 425;
  toon.connect(uit);

  const t0 = ctx.currentTime + 0.05;
  const volume = 0.18;
  for (let i = 0; i < 12; i++) {
    const begin = t0 + i * 5;
    uit.gain.setValueAtTime(0, begin);
    uit.gain.linearRampToValueAtTime(volume, begin + 0.02);
    uit.gain.setValueAtTime(volume, begin + 0.98);
    uit.gain.linearRampToValueAtTime(0, begin + 1);
  }
  toon.start(t0);

  let gestopt = false;
  return () => {
    if (gestopt) return;
    gestopt = true;
    const nu = ctx.currentTime;
    uit.gain.cancelScheduledValues(nu);
    uit.gain.setValueAtTime(uit.gain.value, nu);
    uit.gain.linearRampToValueAtTime(0, nu + 0.03);
    toon.stop(nu + 0.05);
    setTimeout(() => uit.disconnect(), 200);
  };
}
