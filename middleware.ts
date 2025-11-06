// middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Get subdomain from hostname
  const subdomain = getSubdomain(hostname)
  
  // Skip middleware for admin routes, API routes, static files, and root route
  if (
    url.pathname === '/' ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.startsWith('/site.webmanifest') ||
    url.pathname.startsWith('/robots.txt') ||
    url.pathname.startsWith('/apple-touch-icon') ||
    url.pathname.startsWith('/android-chrome') ||
    url.pathname.startsWith('/favicon-16x16.png') ||
    url.pathname.startsWith('/favicon-32x32.png')
  ) {
    return NextResponse.next()
  }
  
  // If we have a valid subdomain, rewrite to tenant-specific route
  if (subdomain && !isReservedSubdomain(subdomain)) {
    url.pathname = `/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }
  
  // Default: continue normally
  return NextResponse.next()
}

function getSubdomain(hostname: string): string | null {
  // Handle localhost for development
  if (hostname.includes('localhost')) {
    // Format: subdomain.localhost:3000
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0]
    }
    return null
  }
  
  // Production: extract subdomain
  // Example: maria.yourdomain.com -> maria
  const parts = hostname.split('.')
  
  // Need at least 3 parts: subdomain.domain.com
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

function isReservedSubdomain(subdomain: string): boolean {
  const reserved = ['www', 'admin', 'app', 'api', 'mail', 'ftp']
  return reserved.includes(subdomain.toLowerCase())
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.png
     */
    '/((?!api|_next/static|_next/image|favicon.png).*)',
  ],
}