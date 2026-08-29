import type { BetterAuthUser, SsoUser } from "@/lib/utils/interface"
import type { AuthUser } from "@/hooks/use-auth"

export const displayNameFormats = [
  "first-last",
  "last-first",
  "first",
  "last",
  "username",
] as const

export const userRoles = ["user", "admin", "vice", "master"] as const

export type DisplayNameFormat = (typeof displayNameFormats)[number]
export type UserRole = (typeof userRoles)[number]

export function isAdminRole(role: unknown) {
  return role === "admin" || role === "master"
}

export interface ProfileNameValues {
  firstName: string
  lastName: string
  username: string
}

export interface AccountProfileDefaults extends ProfileNameValues {
  nameFormat: DisplayNameFormat
  email: string
  image: string
}

export interface JsonSource {
  json(): Promise<unknown>
}

export function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
}

export function sanitizeUsernameInput(value: string) {
  return value.replace(/[^a-z0-9._]/g, "")
}

export function capitalizeFirstLetter(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value
}

export function formatUsernameLabel(value: string, fallback = "") {
  return capitalizeFirstLetter(value.trim().toLowerCase()) || fallback
}

export function formatDate(value: Date | string | number, locales = "en-US") {
  return new Date(value).toLocaleDateString(locales)
}

export function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

export function matchesSearchQuery(value: string, query: string) {
  return value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
}

export function compareText(
  left: string,
  right: string,
  direction: "asc" | "desc" = "asc"
) {
  const result = left.localeCompare(right)
  return direction === "asc" ? result : -result
}

export function parseSpaceSeparatedValues(value: string) {
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function resolveInternalPath(value: unknown, fallback = "/") {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : fallback
}

export function getFormErrorMessage(error: unknown): string | null {
  if (typeof error === "string") return error
  if (!error || typeof error !== "object") return null

  if ("message" in error && typeof error.message === "string") {
    return error.message
  }

  if ("issues" in error && Array.isArray(error.issues)) {
    return error.issues.map(getFormErrorMessage).find(Boolean) ?? null
  }

  return (
    Object.values(error)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(getFormErrorMessage)
      .find(Boolean) ?? null
  )
}

export function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null

  return "code" in error && typeof error.code === "string" ? error.code : null
}

export function formatDisplayName(
  format: DisplayNameFormat,
  values: ProfileNameValues
) {
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const username = values.username

  switch (format) {
    case "last-first":
      return `${lastName} ${firstName}`.trim()
    case "first":
      return firstName
    case "last":
      return lastName
    case "username":
      return formatUsernameLabel(username)
    default:
      return `${firstName} ${lastName}`.trim()
  }
}

export function resolveDisplayNameFormat(
  name: string | undefined,
  values: ProfileNameValues
): DisplayNameFormat {
  return (
    displayNameFormats.find(
      (format) => formatDisplayName(format, values) === name
    ) ?? "first-last"
  )
}

export function getAccountProfileDefaults(
  account: AuthUser | null
): AccountProfileDefaults {
  const values = {
    username: account?.username ?? "",
    firstName: account?.firstName ?? "",
    lastName: account?.lastName ?? "",
  }

  return {
    ...values,
    nameFormat:
      values.firstName && values.lastName
        ? resolveDisplayNameFormat(account?.name, values)
        : "username",
    email: account?.email ?? "",
    image: account?.image ?? "",
  }
}

export function parseHttpUrl(
  value: string | null | undefined,
  base?: string | URL
) {
  if (!value) return null

  try {
    const target = base ? new URL(value, base) : new URL(value)
    return ["http:", "https:"].includes(target.protocol) ? target : null
  } catch {
    return null
  }
}

export function normalizeOrigin(value: string) {
  return parseHttpUrl(value)?.origin ?? null
}

export function requireUrl(value: string | null | undefined, name: string) {
  const target = parseHttpUrl(value)
  if (!target) throw new Error(`Missing or invalid ${name}`)
  return target
}

export function resolveOrigin(
  value: string | null | undefined,
  fallback: string
) {
  return parseHttpUrl(value)?.origin ?? new URL(fallback).origin
}

export function getForwardedOrigin(request: Request, fallback: string) {
  const host = request.headers.get("x-forwarded-host")
  if (!host) return new URL(fallback).origin

  const protocol = request.headers.get("x-forwarded-proto") ?? "https"
  return (
    parseHttpUrl(`${protocol}://${host}`)?.origin ?? new URL(fallback).origin
  )
}

export function getRedirectValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function isAbsoluteHttpUrl(value: string | null) {
  return Boolean(parseHttpUrl(value))
}

export function isRouteMatch(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

export function hasSearchParameters(
  searchParams: URLSearchParams,
  parameters: readonly string[]
) {
  return parameters.every((parameter) => searchParams.has(parameter))
}

export function copyUrlSearch(source: URL, target: URL) {
  target.search = source.search
  return target
}

export async function readJsonObject(source: JsonSource) {
  try {
    const value = await source.json()
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export function getStringProperty(
  value: Record<string, unknown>,
  property: string,
  trim = false
) {
  const result = value[property]
  if (typeof result !== "string") return ""
  return trim ? result.trim() : result
}

export function getRequestParameter(
  request: Request,
  requestBody: string | undefined,
  parameter: string
) {
  const queryValue = new URL(request.url).searchParams.get(parameter)
  if (queryValue || !requestBody) return queryValue

  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const body: unknown = JSON.parse(requestBody)
      if (body && typeof body === "object" && parameter in body) {
        const value = body[parameter as keyof typeof body]
        return typeof value === "string" ? value : null
      }
    } catch {
      return null
    }
  }

  return new URLSearchParams(requestBody).get(parameter)
}

export function getSetCookieValues(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies = headers.getSetCookie?.() ?? []
  const fallback = response.headers.get("set-cookie")

  return cookies.length > 0 ? cookies : fallback ? [fallback] : []
}

export function normalizeClientCookie(cookie: string) {
  let value = cookie
    .replace(/;\s*Domain=[^;]*/gi, "")
    .replace(/;\s*Partitioned/gi, "")

  if (!/;\s*Path=/i.test(value)) value += "; Path=/"
  return value
}

export function appendResponseCookies(
  target: Headers,
  source: Response,
  normalize = false
) {
  const cookies = getSetCookieValues(source)

  for (const cookie of cookies) {
    target.append(
      "set-cookie",
      normalize ? normalizeClientCookie(cookie) : cookie
    )
  }

  return cookies.length
}

export function withResponseCookies<T extends Response>(
  target: T,
  source: Response,
  normalize = false
) {
  appendResponseCookies(target.headers, source, normalize)
  return target
}

export function getNoStoreHeaders(headers: HeadersInit = {}) {
  return new Headers({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    ...Object.fromEntries(new Headers(headers)),
  })
}

export function encodePathSegments(path: string) {
  return path.split("/").map(encodeURIComponent).join("/")
}

export async function getResponseErrorMessage(
  response: Response,
  fallback: string
) {
  const contentType = response.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      const payload = await readJsonObject(response)
      if (!payload) return fallback
      return (
        getStringProperty(payload, "message") ||
        getStringProperty(payload, "error") ||
        fallback
      )
    }

    return (await response.text()) || fallback
  } catch {
    return fallback
  }
}

export async function getResponseErrorDetail(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      return (await readJsonObject(response)) ?? undefined
    }

    const message = await response.text()
    return message ? { message } : undefined
  } catch {
    return undefined
  }
}

export function buildAppExchangeCodeUrl(redirect: string, code: string) {
  const target = new URL(redirect)
  const state = target.searchParams.get("auth_state")

  target.searchParams.delete("auth_state")

  const next = target.pathname + target.search + target.hash || "/"

  target.pathname = "/auth/exchange"
  target.search = ""
  target.hash = ""
  target.searchParams.set("code", code)
  target.searchParams.set("next", next)

  if (state) {
    target.searchParams.set("state", state)
  }

  return target.toString()
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return typeof value === "string" ? value : null
}

export function toSsoUser(user: BetterAuthUser): SsoUser {
  const updatedAt = toIsoString(user.updatedAt)
  const createdAt = toIsoString(user.createdAt)
  const emailVerifiedAt = user.emailVerified ? (updatedAt ?? createdAt) : null

  return {
    id: user.id,
    aud: "authenticated",
    email: user.email,
    email_confirmed_at: emailVerifiedAt,
    confirmed_at: emailVerifiedAt,
    phone: null,
    role: "authenticated",
    updated_at: updatedAt,
    created_at: createdAt,
    app_metadata: {
      provider: "better-auth",
    },
    user_metadata: {
      username: user.username ?? null,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      name: user.name,
      full_name: user.name,
      avatar_url: user.image ?? null,
      picture: user.image ?? null,
    },
  }
}
