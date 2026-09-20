import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "@gorth/structure/cores/auth/cookies/index"
import {
  adminRoute,
  authenticationPageRoutes,
  publicPrefixes,
} from "@/lib/utils/constant"
import { sessionData, sessionToken } from "@/lib/utils/environment"
import {
  isAdminRole,
  isPublicRoute,
  isRouteMatch,
  parseCookieOptions,
} from "@/lib/utils/formatter"
import { getRouteSession } from "@/services/route"

async function getSession(request: NextRequest) {
  try {
    return await getRouteSession(request.headers.get("cookie") ?? "")
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const sessionTokenCookie = parseCookieOptions(sessionToken)
  const sessionDataCookie = parseCookieOptions(sessionData)
  const sessionCookie =
    sessionTokenCookie &&
    sessionDataCookie &&
    sessionTokenCookie.cookiePrefix === sessionDataCookie.cookiePrefix
      ? {
        cookiePrefix: sessionTokenCookie.cookiePrefix,
        cookieName: sessionDataCookie.cookieName,
      }
      : null
  const hasSession = Boolean(
    sessionCookie && getSessionCookie(request, sessionCookie)
  )

  if (!hasSession && !isPublicRoute(path, publicPrefixes)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (hasSession && isRouteMatch(path, adminRoute)) {
    const session = await getSession(request)

    if (!session?.user) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  if (
    hasSession &&
    authenticationPageRoutes.some((route) => isRouteMatch(path, route))
  ) {
    const session = await getSession(request)

    if (session?.user) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
