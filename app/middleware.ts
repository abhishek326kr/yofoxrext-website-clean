import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Geo-locale detection via edge headers (FEATURE-FLAGGED OFF).
 * 
 * Set GEOLOCALE_ENABLED='true' in environment to enable automatic redirects.
 * 
 * Reads x-vercel-ip-country / cf-ipcountry / CloudFront-Viewer-Country to map -> locale.
 * If user has `prefLocale` cookie, it always wins (respect manual choice).
 */
const COUNTRY_TO_LOCALE: Record<string, string> = {
  CN: 'zh', HK: 'zh', TW: 'zh',
  IN: 'hi',
  RU: 'ru',
  BR: 'pt',
  ES: 'es', MX: 'es', AR: 'es', CL: 'es',
  FR: 'fr', DE: 'de', IT: 'it',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', SG: 'en'
};

export function middleware(req: NextRequest) {
  const enabled = process.env.GEOLOCALE_ENABLED === 'true';
  if (!enabled) return NextResponse.next();

  const url = req.nextUrl;
  const cookiePref = req.cookies.get('prefLocale')?.value;
  if (cookiePref) return NextResponse.next();

  const country =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('cloudfront-viewer-country') || '';

  const locale = COUNTRY_TO_LOCALE[country] || 'en';

  // If already on localized path (e.g., /zh/...), continue.
  const pathLocaleMatch = url.pathname.split('/')[1];
  const supported = new Set(['en','zh','hi','ru','es','pt','fr','de','it']);
  if (supported.has(pathLocaleMatch)) return NextResponse.next();

  // Redirect to locale subpath (e.g., /zh/path). Append original path.
  const localized = url.clone();
  localized.pathname = `/${locale}${url.pathname}`;
  const res = NextResponse.redirect(localized, 307);
  // Set a short-lived cookie so we don't bounce repeatedly.
  res.cookies.set('prefLocale', locale, { path: '/', maxAge: 60 * 60 * 24 });
  return res;
}

export const config = {
  matcher: [
    // apply to all content pages, skip assets and api
    '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|sitemaps).*)',
  ],
};
