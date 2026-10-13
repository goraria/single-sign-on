import { database, pool } from "@/database"
import { oauthClientResource, oauthResource } from "@/database/schema"
import {
  oauthClientResourceSeeds,
  oauthResourceSeeds,
} from "@/database/seeds/oauth-resources"

async function seedOAuthResources() {
  for (const resource of oauthResourceSeeds) {
    await database
      .insert(oauthResource)
      .values({
        ...resource,
        dpopBoundAccessTokensRequired: false,
        disabled: false,
        policyVersion: 1,
      })
      .onConflictDoUpdate({
        target: oauthResource.identifier,
        set: {
          name: resource.name,
          accessTokenTtl: resource.accessTokenTtl,
          allowedScopes: resource.allowedScopes,
          metadata: resource.metadata,
          disabled: false,
          updatedAt: new Date(),
        },
      })
  }

  for (const client of oauthClientResourceSeeds) {
    for (const resourceId of client.resourceIds) {
      await database
        .insert(oauthClientResource)
        .values({ clientId: client.clientId, resourceId })
        .onConflictDoNothing()
    }
  }

  console.info(
    `Seeded ${oauthResourceSeeds.length} OAuth resources and linked ${oauthClientResourceSeeds.length} clients`
  )
}

seedOAuthResources()
  .catch((error: unknown) => {
    console.error(
      "[oauth-resource-seed-error]",
      error instanceof Error ? error.message : "Unknown database error"
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
