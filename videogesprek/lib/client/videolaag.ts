// Twee video-elementen boven elkaar: onderin de luisterlus (idle), daarboven
// de antwoordclip. Tussen de twee zit een crossfade, zodat er geen sprong te
// zien is.

export const FADE_MS = 150;

/**
 * iPhone staat geluid alleen toe op een video-element dat binnen een tik van de
 * gebruiker één keer is gestart. Roep dit synchroon aan in de klik-handler,
 * met een stille clip als bron.
 */
export function ontgrendel(video: HTMLVideoElement, stilleBron: string) {
  video.style.opacity = '0';
  video.muted = false;
  zetBron(video, stilleBron);
  video
    .play()
    .then(() => video.pause())
    .catch(() => {});
}

function zetBron(video: HTMLVideoElement, bron: string) {
  if (video.dataset.bron === bron) return;
  video.dataset.bron = bron;
  video.src = bron;
}

function eersteBeeld(video: HTMLVideoElement): Promise<void> {
  return new Promise((klaar) => {
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    const reserve = setTimeout(klaar, 120);
    if (v.requestVideoFrameCallback) {
      v.requestVideoFrameCallback(() => {
        clearTimeout(reserve);
        klaar();
      });
    }
  });
}

/** Speelt een clip af met fade in en uit. Klaar zodra het geluid is afgelopen of het signaal afbreekt. */
export async function speelClip(video: HTMLVideoElement, bron: string, signaal: AbortSignal): Promise<void> {
  if (signaal.aborted) return;
  video.style.opacity = '0';
  zetBron(video, bron);
  video.currentTime = 0;
  video.muted = false;

  try {
    await video.play();
  } catch (fout) {
    // Geen toestemming voor geluid: dan in elk geval het beeld laten bewegen.
    if ((fout as Error).name !== 'NotAllowedError') return;
    video.muted = true;
    try {
      await video.play();
    } catch {
      return;
    }
  }

  await eersteBeeld(video);
  if (signaal.aborted) {
    video.pause();
    return;
  }
  video.style.opacity = '1';

  await new Promise<void>((klaar) => {
    let raf = 0;
    let vangnet: ReturnType<typeof setTimeout> | undefined;
    const afronden = () => {
      cancelAnimationFrame(raf);
      clearTimeout(vangnet);
      video.removeEventListener('ended', afronden);
      video.removeEventListener('error', afronden);
      signaal.removeEventListener('abort', afbreken);
      video.style.opacity = '0';
      klaar();
    };
    const afbreken = () => {
      video.pause();
      afronden();
    };
    // Begin de fade iets voor het einde, zodat hij niet op een stilstaand beeld gebeurt.
    const kijk = () => {
      const rest = video.duration - video.currentTime;
      if (Number.isFinite(rest) && rest <= FADE_MS / 1000) video.style.opacity = '0';
      else raf = requestAnimationFrame(kijk);
    };
    const duur = Number.isFinite(video.duration) ? video.duration : 20;
    vangnet = setTimeout(afronden, (duur - video.currentTime) * 1000 + 1500);

    video.addEventListener('ended', afronden);
    video.addEventListener('error', afronden);
    signaal.addEventListener('abort', afbreken);
    raf = requestAnimationFrame(kijk);
  });
}
