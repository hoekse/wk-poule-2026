/** JSON-LD helpers (schema.org). Alleen echte gegevens – geen verzonnen reviews of ratings. */
import { merk, winkel } from '@/config';

export const absoluut = (site: URL | undefined, pad: string) => new URL(pad, site ?? 'https://www.wallstories.nl').toString();

export function organisatie(site?: URL) {
  return {
    '@type': 'Organization',
    '@id': absoluut(site, '/#organisatie'),
    name: merk.naam,
    alternateName: merk.korteNaam,
    url: absoluut(site, '/'),
    logo: absoluut(site, '/icon-512.png'),
    slogan: merk.tagline,
    email: merk.email,
    sameAs: Object.values(merk.social),
  };
}

export function website(site?: URL) {
  return {
    '@type': 'WebSite',
    '@id': absoluut(site, '/#website'),
    url: absoluut(site, '/'),
    name: merk.naam,
    inLanguage: 'nl-NL',
    publisher: { '@id': absoluut(site, '/#organisatie') },
  };
}

export function kruimelpad(site: URL | undefined, items: { naam: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.naam, item: absoluut(site, it.url) })),
  };
}

export function verzendDetails() {
  return {
    '@type': 'OfferShippingDetails',
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NL' },
    shippingRate: { '@type': 'MonetaryAmount', value: (winkel.verzendkostenCent / 100).toFixed(2), currency: 'EUR' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
    },
  };
}

export function retourBeleid(maatwerk: boolean) {
  return maatwerk
    ? { '@type': 'MerchantReturnPolicy', applicableCountry: 'NL', returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' }
    : { '@type': 'MerchantReturnPolicy', applicableCountry: 'NL', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 14, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnShippingFees' };
}

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
