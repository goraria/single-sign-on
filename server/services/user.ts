import { eq } from "drizzle-orm"

import { database } from "@/database"
import { users } from "@/database/schema"

export async function getUserProfileClaims(userId: string) {
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
}
