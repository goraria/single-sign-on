import { eq } from "drizzle-orm"

import { database } from "@/database"
import { user } from "@/database/schema"

export async function getUserProfileClaims(userId: string) {
  const [profile] = await database
    .select({
      name: user.name,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      status: user.status,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  if (!profile) return {}

  return {
    name: profile.name,
    preferred_username: profile.username,
    given_name: profile.firstName,
    family_name: profile.lastName,
    picture: profile.image,
    status: profile.status,
  }
}
