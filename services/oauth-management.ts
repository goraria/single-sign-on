import "server-only"
import { eq } from "drizzle-orm"
import { database } from "@/database"
import { oauthClient, user } from "@/database/schema"
import { oauthManagementReference } from "@/utils/oauth-management"
import { checkSsoApplicationExists } from "@/services/helper"

export async function getOAuthAdministratorRole(userId: string | undefined) {
  if (!userId) return null
  const [actor] = await database
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return actor && ["admin", "master"].includes(actor.role) ? actor.role : null
}

export async function adoptOAuthClient(id: string) {
  await checkSsoApplicationExists(id)
  // Better Auth has no ownership-transfer endpoint. Only the audited, master-
  // guarded gateway calls this explicit transfer; no credentials/policies change.
  await database
    .update(oauthClient)
    .set({
      userId: null,
      referenceId: oauthManagementReference,
      updatedAt: new Date(),
    })
    .where(eq(oauthClient.id, id))
  return { id }
}
