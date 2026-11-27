/**
 * Winkelwagen-store (localStorage) + rendering van de lade en de winkelwagenpagina.
 * Prijzen worden altijd opnieuw berekend met dezelfde logica als de server (src/lib/prijs.ts).
 */
import { prijsVoor, verzendkosten, euro, type Config } from '@/lib/prijs';
import { winkel } from '@/config';

export type Item = { id: string; key: string; naam: string; url: string; thumb: string; config: Config; aantal: number };

const SLEUTEL = 'ws-winkelwagen-v1';
const EVENT = 'winkelwagen:wijziging';

function lees(): Item[] {
  try {
    const ruw = JSON.parse(localStorage.getItem(SLEUTEL) || '[]');
    return Array.isArray(ruw) ? ruw.filter((i) => { try { prijsVoor(i.config); return true; } catch { return false; } }) : [];
  } catch { return []; }
}
function schrijf(items: Item[]) {
  try { localStorage.setItem(SLEUTEL, JSON.stringify(items)); } catch { /* privémodus: alleen in geheugen */ }
  geheugen = items;
  window.dispatchEvent(new CustomEvent(EVENT));
}
let geheugen: Item[] | null = null;
const items = () => geheugen ?? (geheugen = lees());

const idVan = (key: string, config: Config) => `${key}|${JSON.stringify(config)}`;

export const winkelwagen = {
  items,
  voegToe(i: Omit<Item, 'id' | 'aantal'> & { aantal?: number }) {
    const { config } = prijsVoor(i.config); // valideert + normaliseert
    const id = idVan(i.key, config);
    const lijst = [...items()];
    const bestaand = lijst.find((x) => x.id === id);
    if (bestaand) bestaand.aantal = Math.min(20, bestaand.aantal + (i.aantal ?? 1));
    else lijst.push({ ...i, config, id, aantal: i.aantal ?? 1 });
    schrijf(lijst);
  },
  zetAantal(id: string, aantal: number) {
    schrijf(items().map((x) => (x.id === id ? { ...x, aantal: Math.max(1, Math.min(20, aantal)) } : x)));
  },
  verwijder(id: string) { schrijf(items().filter((x) => x.id !== id)); },
  leeg() { schrijf([]); },
  totalen() {
    const subtotaal = items().reduce((s, x) => s + prijsVoor(x.config).cent * x.aantal, 0);
    const verzend = verzendkosten(subtotaal);
    return { subtotaal, verzend, totaal: subtotaal + verzend, aantal: items().reduce((s, x) => s + x.aantal, 0) };
  },
  bijWijziging(fn: () => void) { window.addEventListener(EVENT, fn); window.addEventListener('storage', (e) => { if (e.key === SLEUTEL) { geheugen = null; fn(); } }); },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Rendert de regels in een container (lade of pagina). */
export function renderRegels(el: HTMLElement) {
  const lijst = items();
  if (!lijst.length) {
    el.innerHTML = `<div class="ww-leeg"><p><b>Je winkelwagen is nog leeg.</b></p><p class="zacht klein">Welke wereld past bij jouw kleine dromer?</p><a class="knop knop--rand knop--klein" href="/werelden/">Ontdek de werelden</a></div>`;
    return;
  }
  el.innerHTML = `<ul class="ww-regels">${lijst.map((x) => {
    const p = prijsVoor(x.config);
    return `<li class="ww-regel" data-id="${esc(x.id)}">
      <a href="${esc(x.url)}" class="ww-thumb">${x.thumb ? `<img src="${esc(x.thumb)}" alt="" width="80" height="80" loading="lazy">` : ''}</a>
      <div class="ww-info">
        <a href="${esc(x.url)}" class="ww-naam">${esc(x.naam)}</a>
        <ul class="ww-details">${p.regels.map((r) => `<li>${esc(r)}</li>`).join('')}${p.maatwerk ? '<li class="ww-maatwerk">Maatwerk – geen herroepingsrecht</li>' : ''}</ul>
        <div class="ww-acties">
          <div class="stepper" role="group" aria-label="Aantal">
            <button type="button" data-actie="min" aria-label="Eén minder"${x.aantal <= 1 ? ' disabled' : ''}>−</button>
            <span aria-live="polite">${x.aantal}</span>
            <button type="button" data-actie="plus" aria-label="Eén meer">+</button>
          </div>
          <button type="button" class="ww-verwijder" data-actie="verwijder">Verwijderen</button>
        </div>
      </div>
      <p class="ww-prijs prijs">${euro(p.cent * x.aantal)}</p>
    </li>`;
  }).join('')}</ul>`;
}

export function renderTotalen(el: HTMLElement) {
  const t = winkelwagen.totalen();
  const rest = winkel.gratisVerzendingVanafCent - t.subtotaal;
  const pct = Math.min(100, Math.round((t.subtotaal / winkel.gratisVerzendingVanafCent) * 100));
  el.innerHTML = t.aantal ? `
    <div class="ww-verzendbalk" aria-hidden="${rest <= 0}">
      <p class="klein">${rest > 0 ? `Nog <b>${euro(rest)}</b> tot gratis verzending` : '<b>Je verzending is gratis</b>'}</p>
      <div class="balk"><span style="width:${pct}%"></span></div>
    </div>
    <dl class="ww-som">
      <div><dt>Subtotaal</dt><dd>${euro(t.subtotaal)}</dd></div>
      <div><dt>Verzending (NL)</dt><dd>${t.verzend ? euro(t.verzend) : 'Gratis'}</dd></div>
      <div class="ww-totaal"><dt>Totaal <small>incl. btw</small></dt><dd>${euro(t.totaal)}</dd></div>
    </dl>` : '';
}

/** Koppelt klikacties (aantal/verwijderen) aan een container. */
export function koppelActies(el: HTMLElement) {
  el.addEventListener('click', (e) => {
    const knop = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-actie]');
    const regel = knop?.closest<HTMLElement>('[data-id]');
    if (!knop || !regel) return;
    const id = regel.dataset.id!;
    const item = items().find((x) => x.id === id);
    if (!item) return;
    if (knop.dataset.actie === 'plus') winkelwagen.zetAantal(id, item.aantal + 1);
    if (knop.dataset.actie === 'min') winkelwagen.zetAantal(id, item.aantal - 1);
    if (knop.dataset.actie === 'verwijder') winkelwagen.verwijder(id);
  });
}

// ---- Lade (op elke pagina) ----
function init() {
  const lade = document.querySelector<HTMLDialogElement>('[data-ww-lade]');
  const regels = document.querySelector<HTMLElement>('[data-ww-regels]');
  const totalen = document.querySelector<HTMLElement>('[data-ww-totalen]');
  const voet = document.querySelector<HTMLElement>('[data-ww-voet]');
  const tellers = document.querySelectorAll<HTMLElement>('[data-ww-aantal]');
  const update = () => {
    const t = winkelwagen.totalen();
    tellers.forEach((b) => { b.textContent = String(t.aantal); b.hidden = t.aantal === 0; });
    if (regels) renderRegels(regels);
    if (totalen) renderTotalen(totalen);
    if (voet) voet.hidden = t.aantal === 0;
  };
  if (regels) koppelActies(regels);
  winkelwagen.bijWijziging(update);
  update();
  document.querySelectorAll('[data-ww-open]').forEach((b) => b.addEventListener('click', () => lade?.showModal()));
  lade?.querySelector('[data-ww-sluit]')?.addEventListener('click', () => lade.close());
  lade?.addEventListener('click', (e) => { if (e.target === lade) lade.close(); });
  window.addEventListener('winkelwagen:open', () => lade?.showModal());
}
init();
