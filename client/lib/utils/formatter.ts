import type { BetterAuthUser, SsoUser } from "@/lib/utils/interface"
import type { AuthUser } from "@/hooks/use-auth"

export function toNavigationUser(user: AuthUser) {
  const metadata = user.user_metadata ?? {}

  return {
    name:
      user.name ??
      String(metadata.full_name ?? metadata.name ?? user.email ?? "User"),
    email: user.email ?? "",
    avatar: user.image ?? String(metadata.avatar_url ?? metadata.picture ?? ""),
  }
}

export function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function getRedirectValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function isAbsoluteHttpUrl(value: string | null) {
  if (!value) {
    return false
  }

  try {
    const target = new URL(value)
    return ["http:", "https:"].includes(target.protocol)
  } catch {
    return false
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
      name: user.name,
      full_name: user.name,
      avatar_url: user.image ?? null,
      picture: user.image ?? null,
    },
  }
}
