import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from './types/authInterface';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value; // better to use cookies

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based (optional)
  if (isDashboard && token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (request.nextUrl.pathname.startsWith('/dashboard/admin') && decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};