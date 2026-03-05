import { NextResponse, type NextRequest } from 'next/server'
import { proxy } from './proxy'

export async function middleware(request: NextRequest) {
  const response = await proxy(request)

  // Ajouter le pathname dans les headers pour que le layout puisse le lire
  const newResponse = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        'x-pathname': request.nextUrl.pathname,
      }),
    },
  })

  // Copier les cookies de la réponse proxy
  response.cookies.getAll().forEach((cookie) => {
    newResponse.cookies.set(cookie)
  })

  // Si c'est une redirection, la conserver
  if (response.status === 307 || response.status === 308 || response.status === 301 || response.status === 302) {
    return response
  }

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
