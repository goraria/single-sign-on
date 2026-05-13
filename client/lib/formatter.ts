import { redirectUrl } from "@/lib/environment"
import { NextRequest, NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

const allowedRedirectOrigins = redirectUrl!

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export const getAllowedOrigins = () =>
  allowedRedirectOrigins
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin))

export const resolveRedirect = (value: string | null) => {
  if (!value) {
    return null
  }

  try {
    const target = new URL(value)
    if (!['http:', 'https:'].includes(target.protocol)) {
      return null
    }

    if (!getAllowedOrigins().includes(target.origin)) {
      return null
    }

    return target.toString()
  } catch {
    return null
  }
}


export function isAbsoluteHttpUrl(value: string | null) {
  if (!value) {
    return false
  }

  try {
    const target = new URL(value)
    return ['http:', 'https:'].includes(target.protocol)
  } catch {
    return false
  }
}

export function buildAppExchangeUrl(
  redirect: string,
  tokens: { access_token: string; refresh_token?: string }
) {
  const target = new URL(redirect)
  const next = `${target.pathname}${target.search}${target.hash}` || "/"

  target.pathname = "/auth/exchange"
  target.search = ""
  target.hash = ""
  target.searchParams.set("token", tokens.access_token)
  if (tokens.refresh_token) {
    target.searchParams.set("refresh_token", tokens.refresh_token)
  }
  target.searchParams.set("next", next)

  return target.toString()
}
