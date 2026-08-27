import { NextResponse, type NextRequest } from "next/server"

const sessionCookieName = "gorth.session_token"
const sharedRoutes = new Set(["/", "/demo"])
const authenticationPageRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/otp",
  "/auth/change-password",
]
const ssoServerUrl =
  process.env.SSO_SERVER_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080"

interface SessionResponse {
  user?: {
    role?: string
  }
}

function isSharedRoute(path: string) {
  return (
    sharedRoutes.has(path) ||
    path === "/api/auth" ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/auth/") ||
    path.startsWith("/.well-known/")
  )
}

function isAuthenticationPageRoute(path: string) {
  return authenticationPageRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  )
}

function isAdministratorRoute(path: string) {
  return path === "/admin" || path.startsWith("/admin/")
}

async function getSession(request: NextRequest) {
  try {
    const response = await fetch(new URL("/auth/get-session", ssoServerUrl), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    })

    if (!response.ok) return null
    return (await response.json()) as SessionResponse | null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value)

  if (!hasSession && !isSharedRoute(path)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (hasSession && isAdministratorRoute(path)) {
    const session = await getSession(request)

    if (!session?.user) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (session.user.role !== "administrator") {
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
