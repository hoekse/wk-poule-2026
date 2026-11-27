/**
 * Productconfigurator: leest het formulier, toont live prijs + preview en voegt toe aan de winkelwagen.
 * Elke configuratie wordt gevalideerd met prijsVoor() – dezelfde functie die de server gebruikt.
 */
import { prijsVoor, m2, aantalBanen, euro, PrijsFout, tarieven, type Config } from '@/lib/prijs';
import { winkelwagen } from './winkelwagen';

const fmtM2 = (n: number) => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function leesConfig(form: HTMLFormElement): Config {
  const f = new FormData(form);
  const type = form.dataset.type as Config['type'];
  const naamAan = form.querySelector<HTMLInputElement>('[name="naam-aan"]');
  const naam = !naamAan || naamAan.checked ? String(f.get('naam') ?? '').trim() || undefined : undefined;
  switch (type) {
    case 'fotobehang':
      return { type, breedte: Math.round(Number(f.get('breedte'))), hoogte: Math.round(Number(f.get('hoogte'))), materiaal: f.get('materiaal') as any, naam, uitsnede: Number(f.get('uitsnede') ?? 50) };
    case 'behangcirkel': return { type, maat: f.get('maat') as any };
    case 'poster': return { type, maat: f.get('maat') as any, naam };
    case 'muursticker': return { type, maat: f.get('maat') as any };
    case 'naamsticker': return { type, naam: naam ?? '', kleur: f.get('kleur') as any };
    default: return { type: 'proefstaal' };
  }
}

function initFormulier(form: HTMLFormElement) {
  const prijsEl = form.querySelector<HTMLElement>('[data-prijs]');
  const detailEl = form.querySelector<HTMLElement>('[data-detail]');
  const foutEl = form.querySelector<HTMLElement>('[data-fout]');
  const knop = form.querySelector<HTMLButtonElement>('[data-toevoegen]');
  const scope = form.closest<HTMLElement>('[data-product]') ?? document.body;
  const preview = scope.querySelector<HTMLElement>('[data-preview]');
  const naamVeld = form.querySelector<HTMLElement>('[data-naamveld]');
  const naamAan = form.querySelector<HTMLInputElement>('[name="naam-aan"]');
  const schuif = form.querySelector<HTMLElement>('[data-schuifveld]');

  const update = () => {
    if (naamVeld && naamAan) naamVeld.hidden = !naamAan.checked;
    let cfg: Config;
    try {
      cfg = leesConfig(form);
      const p = prijsVoor(cfg);
      if (prijsEl) prijsEl.textContent = euro(p.cent);
      if (foutEl) foutEl.textContent = '';
      if (knop) knop.disabled = false;
      if (cfg.type === 'fotobehang' && detailEl) {
        const opp = m2(cfg.breedte, cfg.hoogte);
        const echt = (cfg.breedte * cfg.hoogte) / 10000;
        detailEl.innerHTML = `${fmtM2(opp)} m² × ${euro(tarieven.fotobehang.materialen[cfg.materiaal].m2Cent)}${cfg.naam ? ` + naam ${euro(tarieven.fotobehang.naamCent)}` : ''} · ${cfg.materiaal === 'textiel-naadloos' ? 'naadloos in één stuk' : `${aantalBanen(cfg.breedte, cfg.materiaal)} banen van 53 cm`}${echt < tarieven.fotobehang.minM2 ? ' · minimaal 3 m²' : ''}`;
      }
    } catch (e) {
      if (foutEl) foutEl.textContent = e instanceof PrijsFout ? e.message : 'Controleer je invoer.';
      if (knop) knop.disabled = true;
      return;
    }
    if (preview) tekenPreview(preview, cfg, schuif);
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const cfg = leesConfig(form);
      prijsVoor(cfg);
      winkelwagen.voegToe({ key: form.dataset.key!, naam: form.dataset.naam!, url: form.dataset.url!, thumb: form.dataset.thumb ?? '', config: cfg });
      knop?.classList.add('toegevoegd');
      setTimeout(() => knop?.classList.remove('toegevoegd'), 1600);
      window.dispatchEvent(new CustomEvent('winkelwagen:open'));
    } catch (err) {
      if (foutEl) foutEl.textContent = err instanceof PrijsFout ? err.message : 'Er ging iets mis. Probeer het opnieuw.';
    }
  });
  update();
}

/** Tekent de wand-preview: verhouding, uitsnede, baannaden en naam. */
function tekenPreview(el: HTMLElement, cfg: Config, schuif: HTMLElement | null) {
  if (cfg.type === 'fotobehang') {
    const wand = el.querySelector<HTMLElement>('[data-wand]');
    const beeldRatio = Number(el.dataset.ratio || 1.79);
    if (!wand) return;
    const ratio = cfg.breedte / cfg.hoogte;
    const kaderEl = wand.parentElement!;
    const cs = getComputedStyle(kaderEl);
    const maxB = kaderEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxH = Math.max(200, Math.min(maxB * 0.75, 460));
    let b = maxB, h = maxB / ratio;
    if (h > maxH) { h = maxH; b = h * ratio; }
    wand.style.width = `${Math.round(b)}px`;
    wand.style.height = `${Math.round(h)}px`;
    const breder = ratio > beeldRatio; // muur breder dan beeld → verticaal schuiven
    const pos = cfg.uitsnede ?? 50;
    wand.style.backgroundPosition = breder ? `50% ${pos}%` : `${pos}% 50%`;
    const baanCm = tarieven.fotobehang.materialen[cfg.materiaal].baanCm;
    wand.classList.toggle('naadloos', !baanCm);
    if (baanCm) wand.style.setProperty('--baan', `${(baanCm / cfg.breedte) * 100}%`);
    const naam = el.querySelector<HTMLElement>('[data-naam-preview]');
    if (naam) { naam.textContent = cfg.naam ?? ''; naam.hidden = !cfg.naam; naam.style.fontSize = `${Math.max(18, Math.min(h * 0.16, b * 0.09))}px`; }
    el.querySelector('[data-maat-b]')!.textContent = `${cfg.breedte} cm`;
    el.querySelector('[data-maat-h]')!.textContent = `${cfg.hoogte} cm`;
    const label = schuif?.querySelector('[data-schuif-label]');
    if (label) label.textContent = breder ? 'Uitsnede verschuiven (omhoog / omlaag)' : 'Uitsnede verschuiven (links / rechts)';
  }
  if (cfg.type === 'behangcirkel') {
    const c = el.querySelector<HTMLElement>('.pb-cirkel');
    if (c) c.style.width = `${(Number(cfg.maat) / 125) * 66}%`;
    const lbl = el.querySelector('[data-maat-label]'); if (lbl) lbl.textContent = `Ø ${cfg.maat} cm`;
  }
  if (cfg.type === 'poster') {
    const lijst = el.querySelector<HTMLElement>('.pb-lijst');
    const breedtes: Record<string, number> = { '30x40': 30, '50x70': 40, '70x100': 50 };
    if (lijst) lijst.style.width = `${breedtes[cfg.maat]}%`;
    const naam = el.querySelector<HTMLElement>('[data-naam-preview]');
    if (naam) { naam.textContent = cfg.naam ?? ''; naam.hidden = !cfg.naam; }
  }
  if (cfg.type === 'naamsticker') {
    const n = el.querySelector<HTMLElement>('.pb-naam');
    const kleuren: Record<string, string> = { 'diep-groen': '#18403A', koraal: '#F08A76', 'zon-geel': '#F0B44D', lichtblauw: '#9DC4E0', munt: '#A8C5B3' };
    if (n) { n.textContent = cfg.naam || 'Noor'; n.style.color = kleuren[cfg.kleur]; }
  }
}

document.querySelectorAll<HTMLFormElement>('form[data-configurator]').forEach(initFormulier);

// Proefstaal-knoppen
document.querySelectorAll<HTMLButtonElement>('[data-proefstaal]').forEach((b) =>
  b.addEventListener('click', () => {
    winkelwagen.voegToe({ key: b.dataset.key!, naam: `Proefstaal – ${b.dataset.naam}`, url: b.dataset.url!, thumb: b.dataset.thumb ?? '', config: { type: 'proefstaal' } });
    window.dispatchEvent(new CustomEvent('winkelwagen:open'));
  }),
);
window.addEventListener('resize', () => document.querySelectorAll<HTMLFormElement>('form[data-configurator]').forEach((f) => f.dispatchEvent(new Event('change'))));
