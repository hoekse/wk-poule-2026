// Terugvaloptie: spraakherkenning van de browser zelf (Web Speech API).
// Alleen gebruikt als er geen server-side spraak-API is ingesteld of de
// browser niet kan opnemen. Op iPhone minder betrouwbaar.

type Herkenner = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

type HerkennerKlasse = new () => Herkenner;

function klasse(): HerkennerKlasse | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: HerkennerKlasse; webkitSpeechRecognition?: HerkennerKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const webSpraakBeschikbaar = () => Boolean(klasse());

export class WebSpraak {
  private herkenner: Herkenner | null = null;
  private actief = false;

  constructor(
    private onTekst: (tekst: string) => void,
    private onGeweigerd: () => void,
  ) {}

  luister() {
    const Klasse = klasse();
    if (!Klasse || this.actief) return;
    this.actief = true;
    const h = new Klasse();
    h.lang = 'nl-NL';
    h.continuous = false;
    h.interimResults = false;
    h.maxAlternatives = 1;
    h.onresult = (e) => {
      const laatste = e.results[e.results.length - 1];
      if (!laatste?.isFinal) return;
      const tekst = laatste[0]?.transcript?.trim() ?? '';
      if (!tekst) return;
      this.pauzeer();
      this.onTekst(tekst);
    };
    h.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.pauzeer();
        this.onGeweigerd();
      }
    };
    // Na stilte of een time-out stopt de herkenner vanzelf: dan opnieuw starten.
    h.onend = () => {
      if (this.herkenner !== h) return;
      this.herkenner = null;
      if (this.actief) {
        this.actief = false;
        setTimeout(() => this.luister(), 150);
      }
    };
    this.herkenner = h;
    try {
      h.start();
    } catch {
      this.actief = false;
      this.herkenner = null;
    }
  }

  pauzeer() {
    this.actief = false;
    const h = this.herkenner;
    this.herkenner = null;
    h?.abort();
  }
}
