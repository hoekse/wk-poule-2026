// Luistert naar de microfoon en neemt één vraag op: begint bij spraak en
// stopt na ongeveer 700 ms stilte. De drempel past zich aan het
// achtergrondgeluid aan, zodat het ook in een rumoerige ruimte werkt.

const MEET_MS = 30;
/** Zo lang moet het stil zijn voordat de vraag als klaar geldt. */
const STILTE_MS = 700;
/** Zo lang moet er geluid boven de drempel zijn voordat het als spraak telt. */
const SPRAAK_START_MS = 120;
/** Kortere geluiden (kuchje, tik) worden genegeerd. */
const MIN_SPRAAK_MS = 300;
/** Langere vragen worden na deze tijd afgekapt en verstuurd. */
const MAX_VRAAG_MS = 12_000;
/** Zolang niemand praat, wordt de opname af en toe ververst zodat hij klein blijft. */
const VERVERS_MS = 10_000;
const MIN_NIVEAU = 0.006;

export type Niveau = { niveau: number; drempel: number; spreekt: boolean };

type Opties = {
  onVraag: (opname: Blob) => void;
  onNiveau?: (n: Niveau) => void;
};

export function kiesOpnameFormaat(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const kandidaten = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return kandidaten.find((t) => MediaRecorder.isTypeSupported(t));
}

export class Luisteraar {
  private analyser: AnalyserNode;
  private bron: MediaStreamAudioSourceNode;
  private buffer: Float32Array<ArrayBuffer>;
  private formaat = kiesOpnameFormaat();
  private recorder: MediaRecorder | null = null;
  private stukken: Blob[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  private ruisvloer = 0;
  private gemeten = 0;
  private boven = 0;
  private onder = 0;
  private spraakMs = 0;
  private spreekt = false;
  private opnameStart = 0;

  constructor(
    private stream: MediaStream,
    ctx: AudioContext,
    private opties: Opties,
  ) {
    this.bron = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.bron.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  get actief() {
    return this.timer !== null;
  }

  /** Begin te luisteren naar een nieuwe vraag. */
  luister() {
    if (this.timer) return;
    this.resetSpraak();
    this.startOpname();
    this.timer = setInterval(() => this.meet(), MEET_MS);
  }

  /** Stop met luisteren; een halve opname wordt weggegooid. */
  pauzeer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stopOpname(false);
  }

  sluit() {
    this.pauzeer();
    this.bron.disconnect();
  }

  private resetSpraak() {
    this.boven = 0;
    this.onder = 0;
    this.spraakMs = 0;
    this.spreekt = false;
  }

  private startOpname() {
    this.stukken = [];
    this.opnameStart = performance.now();
    try {
      this.recorder = new MediaRecorder(this.stream, this.formaat ? { mimeType: this.formaat } : undefined);
    } catch {
      this.recorder = new MediaRecorder(this.stream);
    }
    const recorder = this.recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.stukken.push(e.data);
    };
    recorder.start();
  }

  private stopOpname(versturen: boolean) {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder || recorder.state === 'inactive') return;
    const stukken = this.stukken;
    recorder.onstop = () => {
      if (!versturen || stukken.length === 0) return;
      this.opties.onVraag(new Blob(stukken, { type: recorder.mimeType || this.formaat || 'audio/webm' }));
    };
    recorder.stop();
  }

  private meet() {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let som = 0;
    for (let i = 0; i < this.buffer.length; i++) som += this.buffer[i] * this.buffer[i];
    const niveau = Math.sqrt(som / this.buffer.length);

    // Eerste 300 ms: alleen het achtergrondgeluid meten.
    if (this.gemeten < 300) {
      this.ruisvloer = this.gemeten === 0 ? niveau : this.ruisvloer * 0.8 + niveau * 0.2;
      this.gemeten += MEET_MS;
      return;
    }

    const startDrempel = Math.max(MIN_NIVEAU, this.ruisvloer * 3);
    const stopDrempel = Math.max(MIN_NIVEAU * 0.8, this.ruisvloer * 2);
    this.opties.onNiveau?.({ niveau, drempel: this.spreekt ? stopDrempel : startDrempel, spreekt: this.spreekt });

    if (!this.spreekt) {
      // Achtergrondgeluid langzaam bijhouden zolang er niet gepraat wordt.
      if (niveau < startDrempel) this.ruisvloer = this.ruisvloer * 0.97 + niveau * 0.03;
      this.boven = niveau > startDrempel ? this.boven + MEET_MS : 0;
      if (this.boven >= SPRAAK_START_MS) {
        this.spreekt = true;
        this.spraakMs = this.boven;
        this.onder = 0;
      } else if (performance.now() - this.opnameStart > VERVERS_MS) {
        this.stopOpname(false);
        this.startOpname();
      }
      return;
    }

    this.spraakMs += MEET_MS;
    this.onder = niveau < stopDrempel ? this.onder + MEET_MS : 0;
    const klaar = this.onder >= STILTE_MS || this.spraakMs >= MAX_VRAAG_MS;
    if (!klaar) return;

    const echteSpraak = this.spraakMs - this.onder >= MIN_SPRAAK_MS;
    this.resetSpraak();
    if (echteSpraak) {
      // Vraag is klaar: niet verder luisteren tot de app weer luister() roept.
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.stopOpname(true);
    } else {
      this.stopOpname(false);
      this.startOpname();
    }
  }
}
