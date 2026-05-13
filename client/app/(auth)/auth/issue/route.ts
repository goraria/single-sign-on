import { NextRequest, NextResponse } from "next/server"
import { resolveRedirect, buildAppExchangeUrl } from "@/lib/formatter"
import { createServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

async function getCurrentSessionTokens() {
  const sessionClient = await createServer()
  const {
    data: { session },
  } = await sessionClient.auth.getSession()
  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser()

  if (userError || !user?.email || !session?.access_token) {
    return { error: "unauthorized" as const }
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  }
}

export async function GET(request: NextRequest) {
  const redirect = resolveRedirect(request.nextUrl.searchParams.get("redirect"))

  if (!redirect) {
    return NextResponse.json({ error: "invalid_redirect" }, { status: 400 })
  }

  const result = await getCurrentSessionTokens()

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 401 }
    )
  }

  return NextResponse.redirect(buildAppExchangeUrl(redirect, result))
}

export async function POST() {
  const result = await getCurrentSessionTokens()

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: 401 }
    )
  }

  return NextResponse.json(result)
}
