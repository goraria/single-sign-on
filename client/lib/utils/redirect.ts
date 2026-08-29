import { redirectUrl } from "@/lib/utils/environment"
import { normalizeOrigin, parseHttpUrl } from "@/lib/utils/formatter"

const allowedRedirectOrigins = redirectUrl ?? ""

export function getAllowedOrigins() {
  return allowedRedirectOrigins
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin))
}

function isLocalDevelopmentOrigin(target: URL) {
  if (process.env.NODE_ENV === "production") {
    return false
  }

  return (
    target.protocol === "http:" &&
    ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(target.hostname)
  )
}

export function resolveRedirect(value: string | null) {
  const target = parseHttpUrl(value)
  if (!target) return null

  if (
    !getAllowedOrigins().includes(target.origin) &&
    !isLocalDevelopmentOrigin(target)
  ) {
    return null
  }

  return target.toString()
}

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin")

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return {}
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  }
}
