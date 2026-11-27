/** Bewaarlijst (favorieten) in localStorage – werkt zonder account. */
const SLEUTEL = 'ws-favorieten-v1';
const EVENT = 'favorieten:wijziging';
export const favorieten = {
  lijst(): string[] { try { const x = JSON.parse(localStorage.getItem(SLEUTEL) || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } },
  heeft(key: string) { return this.lijst().includes(key); },
  wissel(key: string) {
    const l = this.lijst(); const i = l.indexOf(key);
    if (i >= 0) l.splice(i, 1); else l.unshift(key);
    try { localStorage.setItem(SLEUTEL, JSON.stringify(l.slice(0, 60))); } catch {}
    window.dispatchEvent(new CustomEvent(EVENT));
  },
  bijWijziging(fn: () => void) { window.addEventListener(EVENT, fn); window.addEventListener('storage', (e) => e.key === SLEUTEL && fn()); },
};
function init() {
  const update = () => {
    const l = favorieten.lijst();
    document.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((b) => {
      const aan = l.includes(b.dataset.fav!);
      b.setAttribute('aria-pressed', String(aan));
      b.setAttribute('aria-label', `${aan ? 'Verwijder uit' : 'Bewaar in'} je bewaarlijst`);
    });
    document.querySelectorAll<HTMLElement>('[data-fav-aantal]').forEach((e) => { e.textContent = String(l.length); e.hidden = l.length === 0; });
  };
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-fav]');
    if (b) { e.preventDefault(); favorieten.wissel(b.dataset.fav!); }
  });
  favorieten.bijWijziging(update); update();
}
init();
