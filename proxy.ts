import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"
import {
  adminRoutes,
  protectedRoutes,
  sharedRoutes,
  viceRoutes,
} from "@/utils/constant"
import { cookiePrefix } from "@/utils/environment"
import { isPublicRoute, isRouteMatch } from "@/utils/client/formatter"

const authRoute = "/auth"
const authenticatedRoutes = [...protectedRoutes, ...adminRoutes, ...viceRoutes]

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some((route) => isRouteMatch(pathname, route))
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(getSessionCookie(request, { cookiePrefix }))
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = hasSessionCookie(request)

  if (
    isPublicRoute(pathname, sharedRoutes) ||
    isRouteMatch(pathname, authRoute)
  ) {
    return NextResponse.next()
  }

  if (matchesRoute(pathname, authenticatedRoutes) && !hasSession) {
    const signInUrl = new URL("/auth/sign-in", request.url)
    signInUrl.searchParams.set("redirect", `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
