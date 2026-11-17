import { useEffect, useMemo, useState } from 'react';
import { langDatum, kortDatum, vandaag } from '../lib/datum';
import { fmt1, uurMin } from '../lib/herstel';
import { duurInUren, getal, leesWillekeurig, type DagInvoer, type ImportResultaat } from '../lib/importeren';
import { voegDagdataToe } from '../lib/staat';
import type { Bron, Dagdata, Datum } from '../lib/types';
import { useWinkel } from '../lib/winkel';
import { Blad, Schaal, Schakelaar } from './Basis';
import { IcoonKlembord, IcoonLet, IcoonUpload } from './Iconen';

const BRON_NAAM: Record<Bron, string> = {
  apple: 'Apple Health',
  hae: 'Health Auto Export',
  sleephq: 'SleepHQ',
  prisma: 'prisma APP',
  csv: 'CSV',
  handmatig: 'zelf ingevuld',
};

export function bronNaam(b?: Bron): string {
  return b ? BRON_NAAM[b] : '';
}

// ── Ochtendcheck: gevoel + prisma-waarden + eventueel slaap ──

export function OchtendCheck({ open, sluit, datum = vandaag() }: { open: boolean; sluit: () => void; datum?: Datum }) {
  const { staat, wijzig, melding } = useWinkel();
  const oud: Partial<Dagdata> = staat.dagdata[datum] ?? {};
  const [slaap, setSlaap] = useState('');
  const [cpap, setCpap] = useState('');
  const [ahi, setAhi] = useState('');
  const [lek, setLek] = useState('');
  const [energie, setEnergie] = useState<number | undefined>();
  const [spierpijn, setSpierpijn] = useState<number | undefined>();
  const [stress, setStress] = useState<number | undefined>();
  const [werkdag, setWerkdag] = useState(false);
  const [pijn, setPijn] = useState('');

  useEffect(() => {
    if (!open) return;
    setSlaap(oud.slaapUren != null ? uurMin(oud.slaapUren) : '');
    setCpap(oud.cpapUren != null ? uurMin(oud.cpapUren) : '');
    setAhi(oud.ahi != null ? fmt1(oud.ahi) : '');
    setLek(oud.lekkage != null ? fmt1(oud.lekkage) : '');
    setEnergie(oud.energie);
    setSpierpijn(oud.spierpijn);
    setStress(oud.stress);
    setWerkdag(!!oud.zwareWerkdag);
    setPijn(oud.pijn ?? '');
  }, [open, datum]);

  const opslaan = () => {
    const invoer: DagInvoer = { datum };
    const zet = <K extends keyof Dagdata>(k: K, nieuw: Dagdata[K] | undefined) => {
      if (nieuw !== oud[k]) (invoer as Record<string, unknown>)[k] = nieuw ?? null;
    };
    const slaapU = slaap.trim() ? duurInUren(slaap) : undefined;
    const cpapU = cpap.trim() ? duurInUren(cpap) : undefined;
    const r2 = (n?: number) => (n == null ? undefined : Math.round(n * 100) / 100);
    zet('slaapUren', r2(slaapU));
    zet('cpapUren', r2(cpapU));
    zet('ahi', ahi.trim() ? getal(ahi) : undefined);
    zet('lekkage', lek.trim() ? getal(lek) : undefined);
    zet('energie', energie);
    zet('spierpijn', spierpijn);
    zet('stress', stress);
    zet('zwareWerkdag', werkdag || undefined);
    zet('pijn', pijn.trim() || undefined);
    // Waarden uit de prisma APP markeren we als 'prisma', de rest als handmatig.
    const prismaVelden: DagInvoer = { datum };
    for (const k of ['cpapUren', 'ahi', 'lekkage'] as const) {
      if (k in invoer) {
        (prismaVelden as Record<string, unknown>)[k] = invoer[k];
        delete invoer[k];
      }
    }
    wijzig((s) => {
      let st = voegDagdataToe(s, [invoer], 'handmatig').staat;
      if (Object.keys(prismaVelden).length > 1) st = voegDagdataToe(st, [prismaVelden], 'prisma').staat;
      return st;
    });
    melding('Ochtendcheck opgeslagen');
    sluit();
  };

  return (
    <Blad titel="Ochtendcheck" open={open} sluit={sluit}>
      <p className="dun klein">{langDatum(datum)}. Kost 20 seconden en bepaalt hoe zwaar je vandaag traint.</p>

      <div className="sectie">
        <span className="label">prisma APP (CPAP)</span>
        <div className="velden">
          <label className="veld">
            <span>Masker op</span>
            <input id="oc-cpap" className="invoer getal" inputMode="text" placeholder="7u30" value={cpap} onChange={(e) => setCpap(e.target.value)} />
          </label>
          <label className="veld">
            <span>AHI</span>
            <input id="oc-ahi" className="invoer getal" inputMode="decimal" placeholder="bijv. 2,4" value={ahi} onChange={(e) => setAhi(e.target.value)} />
          </label>
          <label className="veld">
            <span>Lekkage (l/min)</span>
            <input id="oc-lek" className="invoer getal" inputMode="decimal" placeholder="optioneel" value={lek} onChange={(e) => setLek(e.target.value)} />
          </label>
        </div>
      </div>

      <label className="veld">
        <span>
          Slaap{oud.bronnen?.slaapUren && oud.bronnen.slaapUren !== 'handmatig' ? ` (uit ${bronNaam(oud.bronnen.slaapUren)})` : ''}
        </span>
        <input id="oc-slaap" className="invoer getal" placeholder="bijv. 7u15 – leeg laten als Apple Health het weet" value={slaap} onChange={(e) => setSlaap(e.target.value)} />
      </label>

      <Schaal label="Energie" waarde={energie} zet={setEnergie} laag="leeg" hoog="topfit" />
      <Schaal label="Spierpijn" waarde={spierpijn} zet={setSpierpijn} laag="geen" hoog="veel" />
      <Schaal label="Stress" waarde={stress} zet={setStress} laag="ontspannen" hoog="veel" />
      <Schakelaar id="oc-werkdag" aan={werkdag} zet={setWerkdag}>
        Gisteren een fysiek zware werkdag (steigers, ladders, sjouwen)
      </Schakelaar>
      <label className="veld">
        <span>Pijn of blessure?</span>
        <input id="oc-pijn" className="invoer" placeholder="bijv. linkerschouder bij drukken" value={pijn} onChange={(e) => setPijn(e.target.value)} />
      </label>
      <button className="knop primair groot" onClick={opslaan}>
        Ochtendcheck opslaan
      </button>
    </Blad>
  );
}

// ── Importeren: Apple Health via Opdrachten, Health Auto Export, SleepHQ-CSV ──

const VELD_NAMEN: Partial<Record<keyof Dagdata, [string, (n: number) => string]>> = {
  slaapUren: ['slaap', uurMin],
  cpapUren: ['CPAP', uurMin],
  ahi: ['AHI', fmt1],
  lekkage: ['lek', fmt1],
  hrv: ['HRV', (n) => `${Math.round(n)} ms`],
  rustHartslag: ['rust-HS', (n) => `${Math.round(n)}`],
  stappen: ['stappen', (n) => Math.round(n).toLocaleString('nl-NL')],
  actieveKcal: ['kcal', (n) => `${Math.round(n)}`],
  gewicht: ['gewicht', (n) => `${fmt1(n)} kg`],
  vetPct: ['vet', (n) => `${fmt1(n)}%`],
  slaapDiep: ['diep', uurMin],
  slaapRem: ['REM', uurMin],
};

export function samenvatting(d: DagInvoer): string {
  return Object.entries(VELD_NAMEN)
    .filter(([k]) => typeof (d as Record<string, unknown>)[k] === 'number')
    .map(([k, [naam, f]]) => `${naam} ${f((d as unknown as Record<string, number>)[k])}`)
    .join(' · ');
}

export function ImportBlad({ open, sluit, metOpdracht = true }: { open: boolean; sluit: () => void; metOpdracht?: boolean }) {
  const { staat, wijzig, melding } = useWinkel();
  const [tekst, setTekst] = useState('');
  const [nachtDatum, setNachtDatum] = useState(true);
  const [fout, setFout] = useState('');

  useEffect(() => {
    if (open) {
      setTekst('');
      setFout('');
    }
  }, [open]);

  const resultaat = useMemo<ImportResultaat | null>(() => {
    if (!tekst.trim()) return null;
    try {
      return leesWillekeurig(tekst, vandaag(), nachtDatum);
    } catch {
      return { bron: 'apple', dagen: [], meldingen: ['Deze tekst kan ik niet lezen. Verwacht JSON uit de opdracht of een CSV-bestand.'] };
    }
  }, [tekst, nachtDatum]);

  const plak = async () => {
    setFout('');
    try {
      const t = await navigator.clipboard.readText();
      if (!t.trim()) setFout('Het klembord is leeg. Voer eerst de opdracht uit.');
      setTekst(t);
    } catch {
      setFout('Plakken is niet toegestaan. Houd je vinger in het tekstvak hieronder en kies Plak.');
    }
  };

  const kiesBestand = async (f: File | undefined) => {
    if (!f) return;
    setFout('');
    setTekst(await f.text());
  };

  const opslaan = () => {
    if (!resultaat?.dagen.length) return;
    let aantal = 0;
    wijzig((s) => {
      const r = voegDagdataToe(s, resultaat.dagen, resultaat.bron);
      aantal = r.aantal;
      return r.staat;
    });
    melding(`${resultaat.dagen.length} ${resultaat.dagen.length === 1 ? 'dag' : 'dagen'} bijgewerkt`);
    void aantal;
    sluit();
  };

  const isCsv = !!tekst.trim() && !tekst.trim().startsWith('{') && !tekst.trim().startsWith('[');
  const opdrachtUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(staat.instellingen.opdrachtNaam)}`;

  return (
    <Blad titel="Gezondheidsgegevens ophalen" open={open} sluit={sluit}>
      {metOpdracht && (
        <ol className="stappen klein">
          <li>
            Tik op <b>Opdracht uitvoeren</b>. De opdracht “{staat.instellingen.opdrachtNaam}” leest Apple Health en kopieert het resultaat.
          </li>
          <li>Ga terug naar deze app (linksboven ◀) en tik op <b>Plakken</b>.</li>
        </ol>
      )}
      <div className="knoprij">
        {metOpdracht && (
          <a className="knop" href={opdrachtUrl}>
            Opdracht uitvoeren
          </a>
        )}
        <button className="knop primair" onClick={plak}>
          <IcoonKlembord /> Plakken
        </button>
        <label className="knop">
          <IcoonUpload /> Bestand
          <input className="verborgen" type="file" accept=".json,.csv,.txt,application/json,text/csv,text/plain" onChange={(e) => kiesBestand(e.target.files?.[0])} />
        </label>
      </div>
      <label className="veld">
        <span>Of plak hier de tekst</span>
        <textarea id="import-tekst" className="invoer getal" value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder='{"datum":"2026-11-17","slaap":7.2,"hrv":48}' />
      </label>
      {fout && (
        <div className="melding rood">
          <IcoonLet /> {fout}
        </div>
      )}
      {isCsv && (
        <Schakelaar id="import-nacht" aan={nachtDatum} zet={setNachtDatum}>
          Datum in het bestand is de avond waarop de nacht begon (SleepHQ, OSCAR)
        </Schakelaar>
      )}
      {resultaat && (
        <div className="sectie">
          <span className="label">
            Gevonden via {bronNaam(resultaat.bron)}: {resultaat.dagen.length} {resultaat.dagen.length === 1 ? 'dag' : 'dagen'}
          </span>
          {resultaat.meldingen.map((m) => (
            <div key={m} className="melding">
              <IcoonLet /> {m}
            </div>
          ))}
          {resultaat.dagen.length > 0 && (
            <div className="lijst">
              {resultaat.dagen.slice(-8).reverse().map((d) => (
                <div key={d.datum} className="lijstitem">
                  <div className="groei">
                    <div className="titel">{kortDatum(d.datum)}</div>
                    <div className="dun klein">{samenvatting(d) || 'geen bekende waarden'}</div>
                  </div>
                </div>
              ))}
              {resultaat.dagen.length > 8 && <div className="lijstitem dun klein">… en {resultaat.dagen.length - 8} eerdere dagen</div>}
            </div>
          )}
        </div>
      )}
      <button className="knop primair groot" disabled={!resultaat?.dagen.length} onClick={opslaan}>
        Opslaan
      </button>
    </Blad>
  );
}
