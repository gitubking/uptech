import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Si les clés Supabase ne sont pas encore configurées, laisser passer
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url' || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes publiques — pas besoin d'authentification
  const publicRoutes = ['/login', '/register', '/forgot-password', '/update-password', '/api/']
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    supabaseResponse.headers.set('x-pathname', pathname)
    return supabaseResponse
  }

  // Rediriger vers login si non authentifié
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rediriger vers dashboard si déjà connecté et sur la racine ou /login
  if (user && (pathname === '/login' || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Ajouter x-pathname pour que le layout puisse lire le chemin actuel
  supabaseResponse.headers.set('x-pathname', pathname)

  // TOUJOURS retourner supabaseResponse pour propager les cookies rafraîchis
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
