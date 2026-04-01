import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Note: Standard Next.js Middleware doesn't easily have access to Firebase Auth.
// We'll use a Client-side protection for the MVP instead to keep it simple and reliable.
// However, we can still use this to redirect from basic paths if needed.

export function middleware(request: NextRequest) {
  // Pass-through for now, Client-side hooks will handle redirect in layout/page
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth page)
     * - feedback (public feedback page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth|feedback|public).*)',
  ],
}
