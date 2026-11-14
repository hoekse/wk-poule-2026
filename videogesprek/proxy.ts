import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, heeftToegang } from '@/lib/server/toegang';

// Alles achter de toegangscode, ook de clips en de foto.
export async function proxy(request: NextRequest) {
  if (await heeftToegang(request.cookies.get(COOKIE)?.value)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/') || pathname.startsWith('/clips/')) {
    return new NextResponse('Geen toegang', { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/toegang';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Niet voor de toegangspagina zelf, Next-bestanden, manifest, iconen en robots.txt.
    '/((?!toegang|api/toegang|_next/static|_next/image|manifest.webmanifest|icons/|robots.txt|favicon.ico).*)',
  ],
};
