import { NextResponse } from 'next/server';

const protectedRoutes = ['/screen', '/dashboard'];
const authRoutes = ['/login', '/register'];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/screen', '/dashboard', '/login', '/register'],
};
