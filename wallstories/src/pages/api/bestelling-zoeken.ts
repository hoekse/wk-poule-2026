/** POST /api/bestelling-zoeken/ – status opvragen met bestelnummer + e-mailadres (beide moeten kloppen). */
import type { APIRoute } from 'astro';
import { db, json, geconfigureerd } from '@/lib/server';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const b = await request.json().catch(() => ({}));
  const nr = String(b.nr ?? '').toUpperCase(); const email = String(b.email ?? '').trim().toLowerCase();
  if (!/^WS-\d{6}-[A-Z0-9]{4}$/.test(nr) || !/^\S+@\S+\.\S+$/.test(email)) return json({ fout: 'Controleer je bestelnummer en e-mailadres.' }, 400);
  if (!geconfigureerd()) return json({ fout: 'Bestellingen opzoeken is nog niet actief (demo-modus).' }, 503);
  try {
    const [r] = await db<any[]>(`bestellingen?bestelnummer=eq.${nr}&email=eq.${encodeURIComponent(email)}&select=bestelnummer,status,productie_status,track_trace`);
    return r ? json(r) : json({ fout: 'We kunnen geen bestelling vinden met deze gegevens.' }, 404);
  } catch { return json({ fout: 'Er ging iets mis. Probeer het later opnieuw.' }, 502); }
};
