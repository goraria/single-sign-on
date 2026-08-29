import { NextRequest, NextResponse } from "next/server"
import { ssoPublicUrl } from "@/lib/utils/environment"
import {
  getResponseErrorDetail,
  resolveOrigin,
  withResponseCookies,
} from "@/lib/utils/formatter"
import { getCorsHeaders, resolveRedirect } from "@/lib/utils/redirect"
import { signOutRouteSession } from "@/services/route"

function getPublicOrigin(request: NextRequest) {
  return resolveOrigin(ssoPublicUrl, request.nextUrl.origin)
}

async function signOut(request: NextRequest) {
  const origin = getPublicOrigin(request)
  return signOutRouteSession({
    cookie: request.headers.get("cookie"),
    origin,
  })
}

export async function GET(request: NextRequest) {
  const signOutResponse = await signOut(request)

  const returnTo = resolveRedirect(
    new URL(request.url).searchParams.get("returnTo")
  )

  return withResponseCookies(
    NextResponse.redirect(
      returnTo ?? new URL("/auth/sign-in", request.url).toString()
    ),
    signOutResponse
  )
}

export async function POST(request: NextRequest) {
  const signOutResponse = await signOut(request)
  const headers = getCorsHeaders(request)

  if (!signOutResponse.ok) {
    return withResponseCookies(
      NextResponse.json(
        {
          ok: false,
          error: "sso_sign_out_failed",
          status: signOutResponse.status,
          detail: await getResponseErrorDetail(signOutResponse),
        },
        { status: signOutResponse.status, headers }
      ),
      signOutResponse
    )
  }

  return withResponseCookies(
    NextResponse.json({ ok: true }, { headers }),
    signOutResponse
  )
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
}
