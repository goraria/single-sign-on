import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "@gorth/structure/cores/auth/cookies/index"
import { isAdminRole, isRouteMatch } from "@/lib/utils/formatter"
import { getRouteSession } from "@/services/route"

const sharedRoutes = new Set(["/", "/demo", "/terms", "/privacy-policy"])
const authenticationPageRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/verify",
  "/auth/reset-password",
  "/auth/change-password",
]
function isSharedRoute(path: string) {
  return (
    sharedRoutes.has(path) ||
    path.startsWith("/auth/") ||
    path.startsWith("/.well-known/")
  )
}

function isAuthenticationPageRoute(path: string) {
  return authenticationPageRoutes.some((route) => isRouteMatch(path, route))
}

function isAdminRoute(path: string) {
  return isRouteMatch(path, "/admin")
}

async function getSession(request: NextRequest) {
  try {
    return await getRouteSession(request.headers.get("cookie") ?? "")
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const hasSession = Boolean(
    getSessionCookie(request, { cookiePrefix: "gorth" })
  )

  if (!hasSession && !isSharedRoute(path)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (hasSession && isAdminRoute(path)) {
    const session = await getSession(request)

    if (!session?.user) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.redirect(new URL("/settings", request.url))
    }
  }

  if (hasSession && isAuthenticationPageRoute(path)) {
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
