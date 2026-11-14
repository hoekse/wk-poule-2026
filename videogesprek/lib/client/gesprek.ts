// De gesprekslogica, los van React: bellen, begroeten, luisteren, het juiste
// antwoord kiezen en afspelen, ophangen.

import type { KeuzeAntwoord } from '@/lib/antwoorden';
import { startBeltoon } from './beltoon';
import { bronVoor, laadClips } from './clips';
import { kiesOpnameFormaat, Luisteraar, type Niveau } from './luisteraar';
import { ontgrendel, speelClip } from './videolaag';
import { WebSpraak, webSpraakBeschikbaar } from './webspraak';

export type Clips = {
  idle: string;
  begroeting: string;
  onbekend: string;
  antwoorden: Record<string, string>;
};

export type Fase = 'klaar' | 'bellen' | 'gesprek' | 'opgehangen';
export type Status = 'verbinden' | 'spreekt' | 'luistert' | 'denkt' | 'gedempt';

export type Staat = {
  fase: Fase;
  status: Status;
  gedempt: boolean;
  melding: string | null;
  gestartOp: number | null;
  duur: number;
  laatste: KeuzeAntwoord | null;
  niveau: Niveau | null;
  modus: Modus | null;
};

type Modus = 'server' | 'browser';

/** Minimale beltijd: hij neemt op tijdens de tweede kiestoon. */
const MIN_BELTIJD_MS = 4600;
/** Korte pauze na zijn antwoord voordat de microfoon weer luistert (naklank). */
const NA_ANTWOORD_MS = 250;
const MICROFOON: MediaTrackConstraints = {
  // Bewust uit: de app luistert niet terwijl hij praat, en op iPhone maakt
  // spraakverwerking het afspeelgeluid zachter.
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

const BEGIN: Staat = {
  fase: 'klaar',
  status: 'verbinden',
  gedempt: false,
  melding: null,
  gestartOp: null,
  duur: 0,
  laatste: null,
  niveau: null,
  modus: null,
};

const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Gesprek {
  staat: Staat = BEGIN;
  private generatie = 0;
  private laden: Promise<unknown>;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private luisteraar: Luisteraar | null = null;
  private webspraak: WebSpraak | null = null;
  private modus: Modus | null = null;
  private stopBeltoon: (() => void) | null = null;
  private clipAfbreker: AbortController | null = null;
  private vraagAfbreker: AbortController | null = null;
  private wakeLock: { release(): Promise<void> } | null = null;
  private laatsteNiveau = 0;

  constructor(
    private clips: Clips,
    private spraakApi: boolean,
    private videos: { idle: HTMLVideoElement; antwoord: HTMLVideoElement },
    private onStaat: (s: Staat) => void,
    private debug = false,
  ) {
    // Meteen beginnen met laden: tijdens het belscherm en de kiestoon is er tijd genoeg.
    this.laden = laadClips([clips.idle, clips.begroeting, clips.onbekend, ...Object.values(clips.antwoorden)]);
  }

  private zet(deel: Partial<Staat>) {
    this.staat = { ...this.staat, ...deel };
    this.onStaat(this.staat);
  }

  private kiesModus(): Modus | null {
    const kanOpnemen =
      typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!kiesOpnameFormaat();
    if (this.spraakApi && kanOpnemen) return 'server';
    if (webSpraakBeschikbaar()) return 'browser';
    return null;
  }

  /** Moet synchroon vanuit de tik op de belknop worden aangeroepen (iPhone-geluidsregels). */
  bel() {
    if (this.staat.fase !== 'klaar') return;
    const generatie = ++this.generatie;

    const modus = this.kiesModus();
    if (!modus) {
      this.zet({ melding: 'Deze browser kan geen spraak herkennen. Open de app in Safari of Chrome.' });
      return;
    }
    this.modus = modus;

    // Alles wat geluid of beeld start, gebeurt hier binnen de tik.
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new AudioCtx();
    void this.ctx.resume();
    const { idle, antwoord } = this.videos;
    idle.muted = true;
    idle.loop = true;
    idle.src = bronVoor(this.clips.idle);
    idle.play().catch(() => {});
    ontgrendel(antwoord, bronVoor(this.clips.idle));
    this.stopBeltoon = startBeltoon(this.ctx);

    this.zet({ ...BEGIN, fase: 'bellen', modus });
    void this.verbind(generatie, modus);
  }

  private async verbind(generatie: number, modus: Modus) {
    const begin = performance.now();

    if (modus === 'server') {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: MICROFOON });
      } catch (fout) {
        if (generatie !== this.generatie) return;
        const naam = (fout as Error).name;
        this.afbreken(
          naam === 'NotAllowedError' || naam === 'SecurityError'
            ? 'Geef de app toegang tot je microfoon en bel opnieuw. Op iPhone: Instellingen › Safari › Microfoon.'
            : 'De microfoon kon niet worden gestart. Probeer het opnieuw.',
        );
        return;
      }
      if (generatie !== this.generatie) return this.stopStream();
      this.maakLuisteraar(generatie);
    } else {
      this.webspraak = new WebSpraak(
        (tekst) => void this.verwerkTekst(tekst, generatie),
        () => this.afbreken('Geef de app toegang tot je microfoon en spraakherkenning en bel opnieuw.'),
      );
    }

    await this.laden;
    await wacht(Math.max(0, MIN_BELTIJD_MS - (performance.now() - begin)));
    if (generatie !== this.generatie) return;

    // Hij neemt op.
    this.stopBeltoon?.();
    this.stopBeltoon = null;
    void this.houdScherminAan();
    this.zet({ fase: 'gesprek', status: 'spreekt', gestartOp: Date.now() });
    await this.speel(this.clips.begroeting, generatie);
  }

  private maakLuisteraar(generatie: number) {
    if (!this.stream || !this.ctx) return;
    this.luisteraar?.sluit();
    this.luisteraar = new Luisteraar(this.stream, this.ctx, {
      onVraag: (opname) => void this.verwerkOpname(opname, generatie),
      onNiveau: this.debug ? (n) => this.toonNiveau(n) : undefined,
    });
  }

  private toonNiveau(n: Niveau) {
    const nu = performance.now();
    if (nu - this.laatsteNiveau < 100) return;
    this.laatsteNiveau = nu;
    this.zet({ niveau: n });
  }

  private async speel(url: string, generatie: number) {
    this.pauzeerLuisteren();
    this.zet({ status: 'spreekt' });
    this.clipAfbreker = new AbortController();
    await speelClip(this.videos.antwoord, bronVoor(url), this.clipAfbreker.signal);
    if (generatie !== this.generatie) return;
    await wacht(NA_ANTWOORD_MS);
    if (generatie !== this.generatie || this.staat.status !== 'spreekt') return;
    this.luister();
  }

  private luister() {
    if (this.staat.fase !== 'gesprek' || document.hidden) return;
    if (this.staat.gedempt) {
      this.zet({ status: 'gedempt' });
      return;
    }
    this.zet({ status: 'luistert' });
    if (this.modus === 'server') this.luisteraar?.luister();
    else this.webspraak?.luister();
  }

  private pauzeerLuisteren() {
    this.luisteraar?.pauzeer();
    this.webspraak?.pauzeer();
  }

  private async verwerkOpname(opname: Blob, generatie: number) {
    if (generatie !== this.generatie) return;
    this.zet({ status: 'denkt' });
    const form = new FormData();
    form.append('audio', opname, 'vraag');
    const res = await this.vraagServer('/api/vraag', { method: 'POST', body: form });

    // Geen spraak-API op de server: overstappen op de herkenning van de browser.
    if (res === 'geen-spraak-api' && webSpraakBeschikbaar()) {
      this.luisteraar?.sluit();
      this.luisteraar = null;
      this.stopStream();
      this.modus = 'browser';
      this.webspraak = new WebSpraak(
        (tekst) => void this.verwerkTekst(tekst, generatie),
        () => this.afbreken('Geef de app toegang tot je microfoon en spraakherkenning en bel opnieuw.'),
      );
      this.zet({ modus: 'browser' });
      // Deze vraag is niet verstaan: laat hem vragen of je het nog een keer zegt.
      await this.speel(this.clips.onbekend, generatie);
      return;
    }
    await this.reageer(res, generatie);
  }

  private async verwerkTekst(tekst: string, generatie: number) {
    if (generatie !== this.generatie) return;
    this.zet({ status: 'denkt' });
    const res = await this.vraagServer('/api/kies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tekst }),
    });
    await this.reageer(res, generatie);
  }

  private async vraagServer(pad: string, init: RequestInit): Promise<KeuzeAntwoord | 'geen-spraak-api' | null> {
    this.vraagAfbreker = new AbortController();
    const signaal = AbortSignal.any
      ? AbortSignal.any([this.vraagAfbreker.signal, AbortSignal.timeout(15_000)])
      : this.vraagAfbreker.signal;
    try {
      const res = await fetch(pad, { ...init, signal: signaal });
      if (res.status === 503) return 'geen-spraak-api';
      if (!res.ok) return null;
      return (await res.json()) as KeuzeAntwoord;
    } catch {
      return null;
    }
  }

  private async reageer(res: KeuzeAntwoord | 'geen-spraak-api' | null, generatie: number) {
    if (generatie !== this.generatie || this.staat.fase !== 'gesprek') return;
    if (res && res !== 'geen-spraak-api') this.zet({ laatste: res });
    // App staat op de achtergrond: niet afspelen, bij terugkomst gewoon weer luisteren.
    if (document.hidden) {
      this.zet({ status: 'luistert' });
      return;
    }

    if (res && res !== 'geen-spraak-api' && res.soort === 'stil') {
      this.luister();
      return;
    }
    const url =
      res && res !== 'geen-spraak-api' && res.soort === 'antwoord'
        ? (this.clips.antwoorden[res.id] ?? this.clips.onbekend)
        : this.clips.onbekend;
    await this.speel(url, generatie);
  }

  wisselDempen() {
    if (this.staat.fase !== 'gesprek') return;
    const gedempt = !this.staat.gedempt;
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = !gedempt));
    this.zet({ gedempt });
    if (gedempt && this.staat.status === 'luistert') {
      this.pauzeerLuisteren();
      this.zet({ status: 'gedempt' });
    } else if (!gedempt && this.staat.status === 'gedempt') {
      this.luister();
    }
  }

  hangOp() {
    const fase = this.staat.fase;
    if (fase !== 'bellen' && fase !== 'gesprek') return;
    const duur = this.staat.gestartOp ? Date.now() - this.staat.gestartOp : 0;
    this.opruimen();
    if (fase === 'bellen') {
      this.zet({ ...BEGIN });
      return;
    }
    this.zet({ ...BEGIN, fase: 'opgehangen', duur });
    const generatie = this.generatie;
    setTimeout(() => {
      if (this.generatie === generatie && this.staat.fase === 'opgehangen') this.zet({ ...BEGIN });
    }, 1800);
  }

  private afbreken(melding: string) {
    this.opruimen();
    this.zet({ ...BEGIN, melding });
  }

  private opruimen() {
    this.generatie++;
    this.stopBeltoon?.();
    this.stopBeltoon = null;
    this.clipAfbreker?.abort();
    this.vraagAfbreker?.abort();
    this.luisteraar?.sluit();
    this.luisteraar = null;
    this.webspraak?.pauzeer();
    this.webspraak = null;
    this.stopStream();
    const { idle, antwoord } = this.videos;
    idle.pause();
    antwoord.pause();
    antwoord.style.opacity = '0';
    void this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
  }

  private stopStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private async houdScherminAan() {
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } })
        .wakeLock;
      this.wakeLock = (await wl?.request('screen')) ?? null;
    } catch {
      this.wakeLock = null;
    }
  }

  /** App naar de achtergrond en terug. */
  async zichtbaarheid() {
    if (this.staat.fase !== 'gesprek') return;
    if (document.hidden) {
      this.clipAfbreker?.abort();
      this.pauzeerLuisteren();
      return;
    }
    const generatie = this.generatie;
    void this.ctx?.resume();
    this.videos.idle.play().catch(() => {});
    void this.houdScherminAan();

    // iOS kan de microfoon stoppen als de app op de achtergrond staat.
    if (this.modus === 'server' && this.stream?.getAudioTracks().every((t) => t.readyState === 'ended')) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: MICROFOON });
        if (generatie !== this.generatie) return this.stopStream();
        this.stream.getAudioTracks().forEach((t) => (t.enabled = !this.staat.gedempt));
        this.maakLuisteraar(generatie);
      } catch {
        this.afbreken('De microfoon is gestopt. Bel opnieuw.');
        return;
      }
    }
    if (this.staat.status !== 'denkt') this.luister();
  }

  sluit() {
    this.opruimen();
  }
}
