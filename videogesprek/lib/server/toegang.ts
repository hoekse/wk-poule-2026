// Gedeeld door proxy.ts en de toegangsroute. Alleen Web Crypto, zodat het overal draait.

export const COOKIE = 'toegang';

export async function toegangsToken(code: string): Promise<string> {
  const data = new TextEncoder().encode(`videogesprek:${code}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function toegangsCode(): string | null {
  return process.env.TOEGANGSCODE?.trim() || null;
}

/** Zonder code is de app lokaal open (ontwikkelen) en in productie dicht. */
export async function heeftToegang(cookie: string | undefined): Promise<boolean> {
  const code = toegangsCode();
  if (!code) return process.env.NODE_ENV !== 'production';
  return cookie === (await toegangsToken(code));
}
