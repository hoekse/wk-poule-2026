/** GET /api/bestelling-status/?nr=…&t=… – status voor de bedankpagina (token voorkomt dat anderen bestellingen opvragen). */
import type { APIRoute } from 'astro';
import { db, json, geconfigureerd } from '@/lib/server';
export const prerender = false;
export const GET: APIRoute = async ({ url }) => {
  const nr = url.searchParams.get('nr') ?? ''; const t = url.searchParams.get('t') ?? '';
  if (!/^WS-\d{6}-[A-Z0-9]{4}$/.test(nr) || !/^[0-9a-f-]{36}$/.test(t)) return json({ fout: 'Onbekende bestelling' }, 404);
  if (!geconfigureerd()) return json({ status: 'onbekend' });
  try {
    const [b] = await db<any[]>(`bestellingen?bestelnummer=eq.${nr}&token=eq.${t}&select=status,totaal_cent`);
    return b ? json({ status: b.status, totaal: b.totaal_cent }) : json({ fout: 'Onbekende bestelling' }, 404);
  } catch { return json({ status: 'onbekend' }); }
};
