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
      role: user.role,
      status: user.status,
      banned: user.banned,
      banExpires: user.banExpires,
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
    role: profile.role,
    status:
      profile.banned &&
      (!profile.banExpires || profile.banExpires.getTime() > Date.now())
        ? "suspended"
        : profile.status,
  }
}
