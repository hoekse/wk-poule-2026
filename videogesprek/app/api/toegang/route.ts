import { NextResponse } from 'next/server';
import { COOKIE, toegangsCode, toegangsToken } from '@/lib/server/toegang';

export async function POST(request: Request) {
  const form = await request.formData();
  const ingevuld = String(form.get('code') ?? '').trim();
  const code = toegangsCode();
  const terug = (pad: string) => NextResponse.redirect(new URL(pad, request.url), 303);

  if (!code) return terug('/toegang?fout=geen-code');
  if (ingevuld !== code) {
    // Kleine vertraging maakt raden onaantrekkelijk.
    await new Promise((r) => setTimeout(r, 800));
    return terug('/toegang?fout=onjuist');
  }

  const response = terug('/');
  response.cookies.set(COOKIE, await toegangsToken(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
