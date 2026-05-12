import { NextResponse } from "next/server"
import { createClient } from "gorth-base/cores/supabase-js"
import type { User } from "gorth-base/cores/supabase-js"
import { supabaseAnonKey, supabaseUrl } from "@/lib/environment"

export const runtime = "nodejs"

function buildUserResponse(
  user: User,
  tokens: {
    access_token?: string;
    refresh_token?: string;
  } = {}
) {
  return NextResponse.json({
    user,
    sso_sub: user.id,
    email: user.email,
    ...tokens,
  })
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim()
}

export async function POST(req: Request) {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const bodyToken =
    typeof (payload as { access_token?: unknown }).access_token === "string"
      ? (payload as { access_token: string }).access_token.trim()
      : typeof (payload as { token?: unknown }).token === "string"
        ? (payload as { token: string }).token.trim()
        : ""
  const accessToken = bodyToken || getBearerToken(req)
  const refreshToken =
    typeof (payload as { refresh_token?: unknown }).refresh_token === "string"
      ? (payload as { refresh_token: string }).refresh_token.trim()
      : ""

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken)

    if (!error && user?.email) {
      return buildUserResponse(user, {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
      })
    }
  }

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (!error && data.user?.email && data.session?.access_token) {
      return buildUserResponse(data.user, {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    }
  }

  return NextResponse.json({ error: "invalid_token" }, { status: 401 })
}
