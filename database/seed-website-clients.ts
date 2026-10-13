import { eq, inArray } from "drizzle-orm"
import { database, pool } from "@/database"
import { oauthClient } from "@/database/schema"
import seeds from "@/database/seeds/oauth-clients.json"

// Explicit, narrowly scoped administrative action. Never seed the whole registry.
const ids = ["gorth-browser-website", "gorth-launcher-website"]
async function registerWebsiteClients() {
  const clients = seeds.filter((client) => ids.includes(client.client_id))
  if (clients.length !== 2) throw new Error("Missing website OAuth seeds")
  await database.transaction(async (tx) => {
    for (const client of clients) {
      const [existing] = await tx
        .select()
        .from(oauthClient)
        .where(eq(oauthClient.clientId, client.client_id))
        .limit(1)
      if (existing) {
        if (
          existing.disabled ||
          existing.clientSecret !== null ||
          !existing.public ||
          !existing.requirePKCE ||
          existing.applicationType !== "web" ||
          existing.tokenEndpointAuthMethod !== "none" ||
          !existing.enableEndSession ||
          JSON.stringify(existing.redirectUris) !==
            JSON.stringify(client.redirect_uris) ||
          JSON.stringify(existing.postLogoutRedirectUris) !==
            JSON.stringify(client.post_logout_redirect_uris) ||
          existing.backchannelLogoutUri !== client.backchannel_logout_uri ||
          !client.scopes.every((scope) => existing.scopes?.includes(scope)) ||
          !existing.grantTypes?.includes("authorization_code") ||
          !existing.grantTypes?.includes("refresh_token") ||
          !existing.responseTypes?.includes("code")
        ) {
          throw new Error(
            "Existing website client needs administrator review: " +
              client.client_id
          )
        }
        continue
      }
      await tx.insert(oauthClient).values({
        clientId: client.client_id,
        clientSecret: null,
        name: client.name,
        uri: client.uri,
        disabled: false,
        public: true,
        requirePKCE: true,
        skipConsent: true,
        enableEndSession: true,
        applicationType: "web",
        tokenEndpointAuthMethod: "none",
        grantTypes: ["authorization_code", "refresh_token"],
        responseTypes: ["code"],
        scopes: client.scopes,
        redirectUris: client.redirect_uris,
        postLogoutRedirectUris: client.post_logout_redirect_uris,
        backchannelLogoutUri: client.backchannel_logout_uri,
        backchannelLogoutSessionRequired: true,
        referenceId: client.reference_id,
        metadata: client.metadata,
      })
    }
  })
  const registered = await database
    .select({
      clientId: oauthClient.clientId,
      redirectUris: oauthClient.redirectUris,
      requirePKCE: oauthClient.requirePKCE,
      public: oauthClient.public,
      scopes: oauthClient.scopes,
      grantTypes: oauthClient.grantTypes,
    })
    .from(oauthClient)
    .where(inArray(oauthClient.clientId, ids))
  if (registered.length !== 2)
    throw new Error("Website client verification failed")
  console.info(JSON.stringify(registered))
}
registerWebsiteClients()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error && error.message.startsWith("Existing website")
        ? error.message
        : "Website client registration failed; no credentials or database details were logged."
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
