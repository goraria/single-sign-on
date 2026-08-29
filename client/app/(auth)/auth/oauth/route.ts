import { NextRequest, NextResponse } from "next/server"
import {
  getForwardedOrigin,
  hasSearchParameters,
  isAbsoluteHttpUrl,
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
  const externalTarget = resolveRedirect(next)

  if (externalTarget) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=legacy_sso_issue_disabled`
    )
  }

  if (isAbsoluteHttpUrl(next)) {
    return NextResponse.redirect(`${origin}/auth/error?error=invalid_redirect`)
  }

  const relativeNext = resolveInternalPath(next)
  const redirectOrigin =
    process.env.NODE_ENV === "development"
      ? origin
      : getForwardedOrigin(request, origin)

  return NextResponse.redirect(`${redirectOrigin}${relativeNext}`)
}
