import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from "@gorth/structure/cores/auth/cookies/index"

const protectedRoutes = ['x'] // ['/dashboard', '/account']
const publicRoutes = ['/sign-in', '/sign-up', '/', '/dashboard', '/account']

export async function proxy(request: NextRequest) {
  // if (!sessionCookie) {
  //   return NextResponse.redirect(new URL("/", request.url))
  // }

  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some(r => path.startsWith(r))
  const isPublic = publicRoutes.includes(path)

  const sessionCookie = getSessionCookie(request)

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  if (isPublic && sessionCookie && path !== '/') {
    return NextResponse.redirect(new URL('/setting', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    // "/setting/:path*", "/account/:path*",
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

// export default clerkMiddleware(async (auth, req) => {
//   if (!isPublicRoute(req)) {
//     await auth.protect()
//   }
// })

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }
