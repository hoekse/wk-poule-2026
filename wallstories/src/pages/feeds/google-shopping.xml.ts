/** Productfeed voor Google Merchant Center (gratis vermeldingen + Shopping-advertenties). */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { producten } from '@/data/producten';
import { beelden } from '@/lib/beelden';
import { merk, winkel } from '@/config';

const x = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));

export const GET: APIRoute = async ({ site }) => {
  const items = await Promise.all(producten.map(async (p) => {
    const img = await getImage({ src: beelden[p.beeld], width: 1200, format: 'jpg', quality: 85 });
    const abs = (u: string) => new URL(u, site).toString();
    return `<item>
  <g:id>${x(p.key.replace('/', '-'))}</g:id>
  <g:title>${x(`${p.naam} – ${p.ondertitel}`)}</g:title>
  <g:description>${x(p.metaBeschrijving)}</g:description>
  <g:link>${abs(p.url)}</g:link>
  <g:image_link>${abs(img.src)}</g:image_link>
  <g:availability>in_stock</g:availability>
  <g:price>${(p.vanafCent / 100).toFixed(2)} EUR</g:price>
  ${p.type === 'fotobehang' ? '<g:unit_pricing_measure>3 sqm</g:unit_pricing_measure><g:unit_pricing_base_measure>1 sqm</g:unit_pricing_base_measure>' : ''}
  <g:brand>${x(merk.naam)}</g:brand>
  <g:condition>new</g:condition>
  <g:identifier_exists>no</g:identifier_exists>
  <g:google_product_category>Home &amp; Garden &gt; Decor</g:google_product_category>
  <g:product_type>${x(`Kinderkamer &gt; ${p.categorie.replace(/-/g, ' ')}`)}</g:product_type>
  <g:age_group>kids</g:age_group>
  <g:shipping><g:country>NL</g:country><g:price>${(winkel.verzendkostenCent / 100).toFixed(2)} EUR</g:price></g:shipping>
</item>`;
  }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
<title>${x(merk.naam)}</title><link>${new URL('/', site)}</link><description>${x(merk.tagline)}</description>
${items.join('\n')}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
