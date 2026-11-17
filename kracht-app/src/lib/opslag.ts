import type { Staat } from './types';

/**
 * Alles staat lokaal op de telefoon in IndexedDB (met localStorage als reserve).
 * Een app op het beginscherm van een iPhone valt niet onder de 7-dagenregel van Safari,
 * maar maak toch regelmatig een back-up (Meer → Back-up).
 */
const DB = 'kracht';
const STORE = 'staat';
const FOTOS = 'fotos';
const SLEUTEL = 'staat';
const LS = 'kracht-staat';

function open(): Promise<IDBDatabase> {
  return new Promise((ok, fout) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(FOTOS)) db.createObjectStore(FOTOS);
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fout(req.error);
  });
}

export async function laadStaat(): Promise<Staat | null> {
  try {
    const db = await open();
    const waarde = await new Promise<unknown>((ok, fout) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(SLEUTEL);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => fout(req.error);
    });
    db.close();
    if (waarde) return waarde as Staat;
  } catch {
    /* val terug op localStorage */
  }
  try {
    const tekst = localStorage.getItem(LS);
    return tekst ? (JSON.parse(tekst) as Staat) : null;
  } catch {
    return null;
  }
}

export async function bewaarStaat(staat: Staat): Promise<void> {
  let gelukt = false;
  try {
    const db = await open();
    await new Promise<void>((ok, fout) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(staat, SLEUTEL);
      tx.oncomplete = () => ok();
      tx.onerror = () => fout(tx.error);
    });
    db.close();
    gelukt = true;
  } catch {
    /* probeer localStorage */
  }
  try {
    // Kleine reservekopie, ook als IndexedDB werkt.
    localStorage.setItem(LS, JSON.stringify(staat));
  } catch {
    if (!gelukt) throw new Error('Opslaan is mislukt. Maak direct een back-up via Meer → Back-up.');
  }
}

/** Vraag de browser om de gegevens nooit automatisch op te ruimen. */
export async function vraagBlijvendeOpslag(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

// ── Voortgangsfoto's: de afbeeldingen zelf, los van de rest van de gegevens ──

async function fotoActie<T>(modus: IDBTransactionMode, actie: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((ok, fout) => {
      const req = actie(db.transaction(FOTOS, modus).objectStore(FOTOS));
      req.onsuccess = () => ok(req.result);
      req.onerror = () => fout(req.error);
    });
  } finally {
    db.close();
  }
}

export const bewaarFoto = (id: string, blob: Blob) => fotoActie('readwrite', (s) => s.put(blob, id)).then(() => undefined);
export const laadFoto = (id: string) => fotoActie<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const verwijderFoto = (id: string) => fotoActie('readwrite', (s) => s.delete(id)).then(() => undefined);
