import { redirectUrl } from "@/lib/utils/environment"
import { normalizeOrigin } from "@/lib/utils/formatter"

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
  if (!value) {
    return null
  }

  try {
    const target = new URL(value)
    if (!["http:", "https:"].includes(target.protocol)) {
      return null
    }

    if (
      !getAllowedOrigins().includes(target.origin) &&
      !isLocalDevelopmentOrigin(target)
    ) {
      return null
    }

    return target.toString()
  } catch {
    return null
  }
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
