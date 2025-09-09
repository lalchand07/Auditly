import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createClient(request)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // Define public routes
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/public/free-audit']

    // If the user is not logged in and trying to access a protected route
    if (!session && !publicRoutes.includes(pathname) && !pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If the user is logged in and trying to access login/signup, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
