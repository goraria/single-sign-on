import { NextRequest, NextResponse } from "next/server"
import { clientUrl, isDevelopment } from "@/lib/utils/environment"
import {
  getForwardedOrigin,
  hasSearchParameters,
  isAbsoluteHttpUrl,
  resolveOrigin,
  resolveInternalPath,
} from "@/lib/utils/formatter"
import { resolveRedirect } from "@/lib/utils/redirect"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const isOAuthProviderFlow = hasSearchParameters(searchParams, [
    "client_id",
    "redirect_uri",
    "response_type",
  ])

  if (isOAuthProviderFlow) {
    return NextResponse.redirect(
      `${origin}/auth/oauth2/authorize?${searchParams.toString()}`
    )
  }

  const next = searchParams.get("next")
  const publicOrigin = resolveOrigin(clientUrl, origin)
  const externalTarget = await resolveRedirect(next, publicOrigin)

  if (externalTarget) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=legacy_sso_issue_disabled`
    )
  }

  if (isAbsoluteHttpUrl(next)) {
    return NextResponse.redirect(`${origin}/auth/error?error=invalid_redirect`)
  }

  const relativeNext = resolveInternalPath(next)
  const redirectOrigin = isDevelopment
    ? origin
    : getForwardedOrigin(request, origin)

  return NextResponse.redirect(`${redirectOrigin}${relativeNext}`)
}
