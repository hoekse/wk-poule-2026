// Camera-scanner voor QR-codes en streepjescodes (EAN-13/EAN-8/Code 128).
// Gebruikt @zxing/browser, dat ook op iPhone (Safari) werkt.
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { IcoonLamp, IcoonToetsenbord } from './Iconen';

type Soort = 'alles' | 'streepjescode';

interface Props {
  /** Wordt aangeroepen met de gescande of getypte code. */
  onCode: (code: string) => void;
  /** Zet op false om de camera tijdelijk te stoppen (bijv. als er een dialoog open is). */
  actief?: boolean;
  soort?: Soort;
  hint?: string;
}

const FORMATEN: Record<Soort, BarcodeFormat[]> = {
  alles: [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128],
  streepjescode: [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE],
};

const ZELFDE_CODE_PAUZE = 2500; // ms: dezelfde code niet meteen nog een keer

export function Scanner({ onCode, actief = true, soort = 'alles', hint }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const bediening = useRef<IScannerControls | null>(null);
  const laatste = useRef<{ code: string; t: number }>({ code: '', t: 0 });
  const terugroep = useRef(onCode);
  terugroep.current = onCode;

  const [status, setStatus] = useState<'starten' | 'scannen' | 'geen-toegang' | 'geen-camera'>('starten');
  const [raak, setRaak] = useState(false);
  const [lampKan, setLampKan] = useState(false);
  const [lampAan, setLampAan] = useState(false);
  const [typen, setTypen] = useState(false);
  const [getypt, setGetypt] = useState('');

  useEffect(() => {
    if (!actief || typen) return;
    let gestopt = false;
    const hints = new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, FORMATEN[soort]],
      [DecodeHintType.TRY_HARDER, true],
    ]);
    const lezer = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120, delayBetweenScanSuccess: 400 });

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('geen-camera');
      return;
    }

    lezer
      .decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        video.current ?? undefined,
        (resultaat) => {
          if (!resultaat || gestopt) return;
          const code = resultaat.getText().trim();
          const nu = Date.now();
          if (code === laatste.current.code && nu - laatste.current.t < ZELFDE_CODE_PAUZE) return;
          laatste.current = { code, t: nu };
          setRaak(true);
          setTimeout(() => setRaak(false), 350);
          terugroep.current(code);
        },
      )
      .then((c) => {
        if (gestopt) {
          c.stop();
          return;
        }
        bediening.current = c;
        setStatus('scannen');
        const spoor = (video.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
        const kan = spoor?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setLampKan(Boolean(kan?.torch));
      })
      .catch((e: unknown) => {
        if (gestopt) return;
        const naam = e instanceof Error ? e.name : '';
        setStatus(naam === 'NotAllowedError' || naam === 'SecurityError' ? 'geen-toegang' : 'geen-camera');
      });

    return () => {
      gestopt = true;
      bediening.current?.stop();
      bediening.current = null;
      setLampAan(false);
    };
  }, [actief, typen, soort]);

  async function wisselLamp() {
    const aan = !lampAan;
    try {
      const spoor = (video.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
      await spoor?.applyConstraints({ advanced: [{ torch: aan } as MediaTrackConstraintSet] });
      setLampAan(aan);
    } catch {
      setLampKan(false);
    }
  }

  function verstuurGetypt(e: React.FormEvent) {
    e.preventDefault();
    const code = getypt.trim();
    if (!code) return;
    terugroep.current(code);
    setGetypt('');
  }

  return (
    <div className="sectie">
      {typen ? (
        <form className="code-invoer" onSubmit={verstuurGetypt}>
          <label className="verborgen" htmlFor="code-typen">
            Code
          </label>
          <input
            id="code-typen"
            className="invoer groot"
            value={getypt}
            onChange={(e) => setGetypt(e.target.value)}
            placeholder={soort === 'streepjescode' ? 'Streepjescode' : 'Bijv. LA-003'}
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
            enterKeyHint="search"
          />
          <button className="knop blauw" type="submit">
            Zoeken
          </button>
        </form>
      ) : status === 'geen-toegang' || status === 'geen-camera' ? (
        <div className="scanner fout">
          <div>
            <p style={{ marginTop: 0, fontWeight: 700 }}>
              {status === 'geen-toegang' ? 'Geen toegang tot de camera.' : 'Geen camera gevonden.'}
            </p>
            <p className="uitleg">
              {status === 'geen-toegang'
                ? 'Sta de camera toe in de instellingen van je telefoon, of typ de code over.'
                : 'Typ de code over die onder de QR-code staat.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="scanner">
          <video ref={video} muted playsInline aria-label="Camerabeeld" />
          <div className={raak ? 'zoeker raak' : 'zoeker'} />
          {lampKan && (
            <button className="lamp" type="button" aria-label="Lamp" aria-pressed={lampAan} onClick={wisselLamp}>
              <IcoonLamp />
            </button>
          )}
          <div className="status">{status === 'starten' ? 'Camera starten…' : hint ?? 'Richt de camera op de code'}</div>
        </div>
      )}
      <div className="scanner-acties">
        <button className="knop rand klein" type="button" onClick={() => setTypen((t) => !t)}>
          <IcoonToetsenbord />
          {typen ? 'Camera gebruiken' : 'Code typen'}
        </button>
      </div>
    </div>
  );
}
