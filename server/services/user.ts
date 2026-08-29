import { eq } from "drizzle-orm"

import { database } from "@/database"
import { users } from "@/database/schema"

export interface BetterAuthUser {
  id: string
  email: string
  name: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
  role?: string | null
  emailVerified?: boolean
  updatedAt?: Date | string | null
  createdAt?: Date | string | null
}

export interface SsoUserMetadata {
  username: string | null
  first_name: string | null
  last_name: string | null
  name: string
  full_name: string
  avatar_url: string | null
  picture: string | null
}

export interface SsoUser {
  id: string
  aud: "authenticated"
  email: string
  email_confirmed_at: string | null
  confirmed_at: string | null
  phone: null
  role: string
  updated_at: string | null
  created_at: string | null
  app_metadata: Record<string, unknown>
  user_metadata: SsoUserMetadata
}

export interface SsoUserClaims {
  id: string
  email: string
  role?: string | null
  name?: string | null
  preferredUsername?: string | null
  givenName?: string | null
  familyName?: string | null
  picture?: string | null
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  return typeof value === "string" ? value : null
}

function getDisplayName(user: {
  email: string
  name?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
}) {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username?.trim() ||
    user.email
  )
}

function getMetadata(user: {
  email: string
  name?: string | null
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  image?: string | null
}): SsoUserMetadata {
  const name = getDisplayName(user)

  return {
    username: user.username ?? null,
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
    name,
    full_name: name,
    avatar_url: user.image ?? null,
    picture: user.image ?? null,
  }
}

export function toSsoUser(user: BetterAuthUser): SsoUser {
  const updatedAt = toIsoString(user.updatedAt)
  const createdAt = toIsoString(user.createdAt)
  const emailVerifiedAt = user.emailVerified ? (updatedAt ?? createdAt) : null
  const role = user.role ?? "user"

  return {
    id: user.id,
    aud: "authenticated",
    email: user.email,
    email_confirmed_at: emailVerifiedAt,
    confirmed_at: emailVerifiedAt,
    phone: null,
    role,
    updated_at: updatedAt,
    created_at: createdAt,
    app_metadata: {
      provider: "better-auth",
      role,
    },
    user_metadata: getMetadata(user),
  }
}

export function toSsoUserFromClaims(claims: SsoUserClaims): SsoUser {
  const role = claims.role ?? "user"

  return {
    id: claims.id,
    aud: "authenticated",
    email: claims.email,
    email_confirmed_at: null,
    confirmed_at: null,
    phone: null,
    role,
    updated_at: null,
    created_at: null,
    app_metadata: {
      provider: "better-auth",
      role,
    },
    user_metadata: getMetadata({
      email: claims.email,
      name: claims.name,
      username: claims.preferredUsername,
      firstName: claims.givenName,
      lastName: claims.familyName,
      image: claims.picture,
    }),
  }
}

export async function getUserProfileClaims(userId: string) {
  try {
    const [user] = await database
      .select({
        name: users.name,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) return {}

    return {
      name: user.name,
      preferred_username: user.username,
      given_name: user.firstName,
      family_name: user.lastName,
      picture: user.image,
    }
  } catch (error) {
    throw error
  }
}
