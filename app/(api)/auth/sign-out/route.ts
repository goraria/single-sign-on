import { NextRequest, NextResponse } from "next/server"
import { withResponseCookies } from "@/utils/client/formatter"
import { getCorsHeaders } from "@/utils/redirect"
import { signOutRouteSession } from "@/services/route"

const responseHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
}

export async function GET(request: NextRequest) {
  // A link/navigation must never revoke sessions, especially all device slots.
  return NextResponse.redirect(new URL("/auth/select-account", request.url), {
    headers: responseHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    const cors = new Headers(await getCorsHeaders(request))
    const origin = request.headers.get("origin")
    if (!origin || cors.get("Access-Control-Allow-Origin") !== origin) {
      return NextResponse.json(
        { error: "invalid_origin" },
        { status: 403, headers: responseHeaders }
      )
    }
    const headers = new Headers(responseHeaders)
    cors.forEach((value, name) => headers.set(name, value))
    // Forward the actual validated Origin; do not manufacture a trusted one.
    const signOutResponse = await signOutRouteSession({
      cookie: request.headers.get("cookie"),
      origin,
    })
    return withResponseCookies(
      NextResponse.json(
        signOutResponse.ok ? { ok: true } : { error: "sso_sign_out_failed" },
        { status: signOutResponse.ok ? 200 : signOutResponse.status, headers }
      ),
      signOutResponse
    )
  } catch {
    return NextResponse.json(
      { error: "sso_sign_out_failed" },
      { status: 503, headers: responseHeaders }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: await getCorsHeaders(request),
  })
}
