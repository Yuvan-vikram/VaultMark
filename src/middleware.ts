import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const password = process.env.VAULTMARK_PASSWORD
  // If no password set, allow everything
  if (!password) return NextResponse.next()

  // Allow the login page and its API
  if (req.nextUrl.pathname.startsWith('/api/login')) return NextResponse.next()

  // Check session cookie
  const session = req.cookies.get('vaultmark_session')
  if (session?.value === password) return NextResponse.next()

  // Not authenticated — redirect to login
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
