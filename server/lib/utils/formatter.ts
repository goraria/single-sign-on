import { AuthProvider } from "@/lib/utils/interface"
import {
  expressClientUrl,
  expressLocalUrl,
  expressMobileUrl,
  allowedRedirectOrigins,
  betterAuthUrl,
  expressServerUrl,
  googleClientId,
  googleClientSecret,
  isExpressProduction,
} from "@/lib/utils/environment"
export { formatCodeDate, formatDate } from "@/lib/utils/temp"

export function stringifyQuery(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(
      ([key, value]) =>
        encodeURIComponent(key) + "=" + encodeURIComponent(String(value))
    )
    .join("&")
}

export function mapProvider(provider?: string): AuthProvider | null {
  if (!provider) {
    return null
  }

  const value = provider.toLowerCase()
  if (value.includes("google")) return AuthProvider.google
  if (value.includes("facebook")) return AuthProvider.facebook
  if (value.includes("microsoft") || value === "azure")
    return AuthProvider.microsoft
  if (value.includes("apple")) return AuthProvider.apple
  if (value === "email") return AuthProvider.email
  if (value === "phone") return AuthProvider.phone
  return null
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function getCorsOrigins(): string[] {
  return [expressClientUrl, expressMobileUrl, expressLocalUrl].filter(
    (origin): origin is string => Boolean(origin)
  )
}

export function getStringClaim(value: unknown) {
  return typeof value === "string" && value ? value : null
}

export function getAudienceClaim(value: unknown) {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return (
      value.find(
        (audience): audience is string => typeof audience === "string"
      ) ?? null
    )
  }

  return null
}

export function normalizeOrigin(value: string | undefined | null) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function splitOrigins(value: string | undefined | null) {
  return (
    value
      ?.split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter((origin): origin is string => Boolean(origin)) ?? []
  )
}

export function getTrustedOrigins() {
  return Array.from(
    new Set([
      ...splitOrigins(betterAuthUrl),
      ...splitOrigins(expressClientUrl),
      ...splitOrigins(expressLocalUrl),
      ...splitOrigins(expressMobileUrl),
      ...splitOrigins(expressServerUrl),
      ...splitOrigins(allowedRedirectOrigins),
      ...(isExpressProduction
        ? []
        : ["http://localhost:3000", "http://127.0.0.1:3000"]),
    ])
  )
}