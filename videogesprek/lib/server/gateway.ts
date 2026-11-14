import 'server-only';
import { getVercelOidcToken } from '@vercel/oidc';

// Vercel AI Gateway: Claude en spraakherkenning zonder eigen API-sleutels.
// Op Vercel logt de app automatisch in met het OIDC-token van de deployment;
// de kosten gaan via het AI Gateway-tegoed van het Vercel-team.

export const GATEWAY_URL = 'https://ai-gateway.vercel.sh';

/** Sleutel voor de AI Gateway: AI_GATEWAY_API_KEY, anders het OIDC-token van dit verzoek. */
export async function gatewaySleutel(): Promise<string | null> {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    return (await getVercelOidcToken()) || null;
  } catch {
    return null; // lokaal zonder `vercel env pull`
  }
}

export const gatewayMogelijk = () => Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL);

/** Weigert de dienst ons (geen tegoed, geen creditcard, geen toegang)? Dan heeft opnieuw proberen geen zin. */
export function geweigerd(fout: unknown): boolean {
  const f = fout as { statusCode?: number; status?: number } | null;
  const code = f?.statusCode ?? f?.status;
  return code === 401 || code === 402 || code === 403;
}
