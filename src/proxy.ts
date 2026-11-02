import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Standardize hostname by removing port if present
  const hostname = host.split(':')[0].toLowerCase();

  // Root platform domains (adjust via NEXT_PUBLIC_ROOT_DOMAIN in env)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost';

  // Determine subdomain
  let currentHost: string | null = null;

  if (process.env.NODE_ENV === 'production') {
    // In production, match against root domain (e.g. platform.com)
    if (hostname.endsWith(`.${rootDomain}`)) {
      currentHost = hostname.replace(`.${rootDomain}`, '');
    } else if (hostname !== rootDomain && hostname !== `www.${rootDomain}`) {
      // Custom domain support (e.g., physics-academy.com)
      currentHost = `custom-${hostname}`;
    }
  } else {
    // In development: handle localhost or custom subdomains like physics.localhost
    if (hostname.endsWith('.localhost')) {
      currentHost = hostname.replace('.localhost', '');
    }
  }

  // Fallback query param for easy local testing (?tenant=physics-pro)
  const tenantQueryParam = url.searchParams.get('tenant');
  if (!currentHost && tenantQueryParam) {
    currentHost = tenantQueryParam;
  }

  // Safeguard default landing page endpoints (main platform home, app dashboard, www)
  if (!currentHost || currentHost === 'www' || currentHost === 'app') {
    return NextResponse.next();
  }

  // Intercept and rewrite towards tenant-specific dynamic route
  // e.g., physics.localhost:3000/courses -> /tenants/physics/courses
  url.pathname = `/tenants/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}
