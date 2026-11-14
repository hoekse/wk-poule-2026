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
