import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/update-password', '/_next', '/favicon', '/logo', '/api/auth']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Transmettre le pathname au layout via un header personnalisé
  response.headers.set('x-pathname', request.nextUrl.pathname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit la session si nécessaire (renouvelle le access_token via le refresh_token)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rediriger vers /login si non authentifié et page protégée
  if (!user && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rediriger vers /dashboard si déjà authentifié et sur une page auth
  if (user && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
