import { database } from "@/database"
import { oauthResource } from "@/database/schema"
import type { OAuthResourceSeed } from "@/database/seeds/oauth-resources"

export async function bootstrapOAuthResources(resources: OAuthResourceSeed[]) {
  for (const resource of resources) {
    await database
      .insert(oauthResource)
      .values({
        ...resource,
        dpopBoundAccessTokensRequired: false,
        disabled: false,
        policyVersion: 1,
      })
      .onConflictDoNothing({ target: oauthResource.identifier })
  }
  // Never restore links or re-enable resources from an old manifest.
}
