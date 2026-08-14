function camelToSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase())
}

function normalizeMetadataValue(value: unknown) {
  if (value === undefined) return null
  if (value === null) return null
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  return value
}

export function buildUserMetadataFromDB(dbUser: Record<string, any>): Record<string, any> {
  const reservedFields = new Set([
    "id",
    "supabaseUserId",
    "email",
    "emailNormalized",
    "emailVerifiedAt",
    "phone",
    "phoneCode",
    "phoneNumber",
    "createdAt",
    "updatedAt",
    "publicMetadata",
    "privateMetadata",
    "externalAccounts",
    "role",
    "locked",
    "lockoutExpiresInSeconds",
    "deleteSelfEnabled",
  ])

  const metadata: Record<string, any> = {}

  for (const [key, value] of Object.entries(dbUser)) {
    if (reservedFields.has(key) || value === null || value === undefined) {
      continue
    }

    const snakeKey = camelToSnakeCase(key)

    if (key === "emailVerifiedAt") metadata.email_verified_at = value
    else if (key === "phoneVerifiedAt") metadata.phone_verified_at = value
    else if (key === "dateOfBirth") metadata.date_of_birth = value
    else if (key === "lastSignInAt") metadata.last_sign_in_at = value
    else if (key === "lastProvider") metadata.last_provider = value
    else if (key === "avatarUrl") metadata.avatar_url = value
    else if (key === "activityStatus") metadata.activity_status = value
    else if (key === "isOnline") metadata.is_online = value
    else if (key === "totalOrders") metadata.total_orders = value
    else if (key === "totalSpent") metadata.total_spent = value?.toString?.() || value
    else if (key === "loyaltyPoints") metadata.loyalty_points = value
    else if (key === "lastActivityAt") metadata.last_activity_at = value
    else if (key === "lastSeenAt") metadata.last_seen_at = value
    else if (key === "firstName") metadata.first_name = value
    else if (key === "lastName") metadata.last_name = value
    else if (key === "fullName") metadata.name = value
    else if (typeof value === "object" && !Array.isArray(value)) continue
    else metadata[snakeKey] = value
  }

  return metadata
}

export function buildUserMetadataFromDBFull(dbUser: Record<string, any>): Record<string, any> {
  const reservedKeys = new Set([
    "id",
    "supabaseUserId",
    "role",
    "publicMetadata",
    "privateMetadata",
    "externalAccounts",
  ])
  const reservedSnakeKeys = new Set([
    "id",
    "supabase_user_id",
    "role",
    "public_metadata",
    "private_metadata",
    "external_accounts",
  ])
  const metadata: Record<string, any> = {}

  for (const [key, value] of Object.entries(dbUser)) {
    if (reservedKeys.has(key)) {
      continue
    }

    const snakeKey = camelToSnakeCase(key)
    if (reservedSnakeKeys.has(snakeKey)) {
      continue
    }

    metadata[snakeKey] = normalizeMetadataValue(value)
  }

  const fullNameRaw =
    dbUser.fullName ?? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ")
  const fullName = fullNameRaw && String(fullNameRaw).trim().length > 0 ? fullNameRaw : null

  metadata.first_name = dbUser.firstName ?? null
  metadata.last_name = dbUser.lastName ?? null
  metadata.full_name = fullName
  metadata.name = fullName

  return metadata
}

export function buildAppMetadataFromDB(params: {
  user: any
  organization?: { id: string; name: string; logoUrl?: string | null } | null
  restaurant?: { id: string; name: string; logoUrl?: string | null } | null
  supplier?: { id: string; name: string } | null
}) {
  const { user, organization, restaurant, supplier } = params

  return {
    sub: user?.id ?? null,
    role: user?.role ?? null,
    organization_id: organization?.id ?? null,
    restaurant_id: restaurant?.id ?? null,
    supplier_id: supplier?.id ?? null,
  }
}

export async function getUserOrgRestaurant(userId: string) {
  void userId

  return {
    organization: null as { id: string; name: string; logoUrl?: string | null } | null,
    restaurant: null as { id: string; name: string; logoUrl?: string | null } | null,
    supplier: null as { id: string; name: string } | null,
  }
}
