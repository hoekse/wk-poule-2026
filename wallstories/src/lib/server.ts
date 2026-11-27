/** Server-only helpers: Supabase (REST), Mollie en e-mail (Resend). Nooit in client-code importeren. */
import { merk } from '@/config';

export const env = (k: string): string | undefined => (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];
export const siteUrl = () => (env('SITE_URL') ?? 'http://localhost:4321').replace(/\/$/, '');
export const geconfigureerd = () => !!(env('MOLLIE_API_KEY') && env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY'));

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function db<T = any>(pad: string, init: RequestInit = {}): Promise<T> {
  const url = env('SUPABASE_URL'); const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase is niet geconfigureerd');
  const res = await fetch(`${url}/rest/v1/${pad}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const tekst = await res.text();
  return (tekst ? JSON.parse(tekst) : null) as T;
}

export async function mollie<T = any>(pad: string, init: RequestInit = {}): Promise<T> {
  const key = env('MOLLIE_API_KEY');
  if (!key) throw new Error('Mollie is niet geconfigureerd');
  const res = await fetch(`https://api.mollie.com/v2/${pad}`, { ...init, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mollie ${res.status}: ${body?.detail ?? 'onbekende fout'}`);
  return body as T;
}

/** Verstuurt een e-mail via Resend als RESEND_API_KEY is gezet; anders stil overslaan. */
export async function mail(opts: { aan: string; onderwerp: string; html: string; antwoordAan?: string }) {
  const key = env('RESEND_API_KEY');
  if (!key) return false;
  const bcc = env('MAIL_BCC');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('MAIL_FROM') ?? `${merk.naam} <${merk.email}>`, to: [opts.aan], bcc: bcc ? [bcc] : undefined, subject: opts.onderwerp, html: opts.html, reply_to: opts.antwoordAan ?? merk.email }),
  });
  return res.ok;
}

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Bestelnummer: WS-JJMMDD-XXXX (zonder verwarrende tekens). */
export function bestelnummer(d = new Date()) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = crypto.getRandomValues(new Uint8Array(4));
  const code = [...r].map((b) => abc[b % abc.length]).join('');
  const p = (n: number) => String(n).padStart(2, '0');
  return `WS-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${code}`;
}
