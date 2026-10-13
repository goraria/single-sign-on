import { eq, inArray } from "drizzle-orm"
import { database, pool } from "@/database"
import { oauthClient } from "@/database/schema"
import seeds from "@/database/seeds/oauth-clients.json"

// Explicit administrative command, never run as a server startup side effect.
async function seedDesktopClients() {
  const sessionBindingOnly = process.argv.includes("--session-binding-only")
  const clients = seeds.filter((client) =>
    ["gorth-browser", "gorth-launcher"].includes(client.client_id)
  )
  if (clients.length !== 2)
    throw new Error("Missing desktop OAuth client seeds")
  await database.transaction(async (tx) => {
    for (const client of clients) {
      const [existing] = await tx
        .select()
        .from(oauthClient)
        .where(eq(oauthClient.clientId, client.client_id))
        .limit(1)
        .for("update")
      if (existing) {
        if (
          existing.disabled ||
          existing.clientSecret !== null ||
          existing.applicationType !== "native" ||
          !existing.responseTypes?.includes("code") ||
          !existing.public ||
          !existing.requirePKCE ||
          existing.tokenEndpointAuthMethod !== "none" ||
          JSON.stringify(existing.redirectUris) !==
            JSON.stringify(client.redirect_uris) ||
          !client.scopes.every((scope) => existing.scopes?.includes(scope)) ||
          !existing.grantTypes?.includes("authorization_code") ||
          !existing.grantTypes?.includes("refresh_token")
        ) {
          throw new Error(
            "Existing client needs administrator review: " + client.client_id
          )
        }
        // Upgrade only the session-binding capability after all other security
        // metadata matches. Never overwrite secrets, callbacks or scopes.
        if (!existing.enableEndSession) {
          const [updated] = await tx
            .update(oauthClient)
            .set({ enableEndSession: true })
            .where(eq(oauthClient.clientId, client.client_id))
            .returning()
          if (!updated || !updated.enableEndSession)
            throw new Error("Desktop client session-binding update failed")
          const unchangedFields = [
            "clientSecret",
            "redirectUris",
            "postLogoutRedirectUris",
            "scopes",
            "grantTypes",
            "responseTypes",
            "tokenEndpointAuthMethod",
            "public",
            "requirePKCE",
            "applicationType",
            "disabled",
          ] as const
          for (const field of unchangedFields) {
            if (
              JSON.stringify(existing[field]) !== JSON.stringify(updated[field])
            )
              throw new Error("Desktop client protected metadata changed")
          }
        }
        continue
      }
      if (sessionBindingOnly)
        throw new Error(
          "Desktop client is missing; session-binding-only mode does not create clients"
        )
      await tx.insert(oauthClient).values({
        clientId: client.client_id,
        name: client.name,
        public: true,
        requirePKCE: true,
        disabled: false,
        skipConsent: false,
        enableEndSession: true,
        applicationType: "native",
        tokenEndpointAuthMethod: "none",
        grantTypes: ["authorization_code", "refresh_token"],
        responseTypes: ["code"],
        scopes: client.scopes,
        redirectUris: client.redirect_uris,
        postLogoutRedirectUris: [],
        clientCredentialsScopes: [],
        referenceId: client.reference_id,
        metadata: client.metadata,
      })
    }
  })
  console.info(
    "Desktop OAuth clients are registered with session binding; secrets, callbacks and scopes were not overwritten."
  )
  const registered = await database
    .select({
      clientId: oauthClient.clientId,
      redirectUris: oauthClient.redirectUris,
      public: oauthClient.public,
      requirePKCE: oauthClient.requirePKCE,
      enableEndSession: oauthClient.enableEndSession,
      tokenEndpointAuthMethod: oauthClient.tokenEndpointAuthMethod,
    })
    .from(oauthClient)
    .where(
      inArray(
        oauthClient.clientId,
        clients.map((client) => client.client_id)
      )
    )
  if (
    registered.length !== 2 ||
    registered.some((client) => !client.enableEndSession)
  )
    throw new Error("Desktop client verification failed")
  console.info(JSON.stringify(registered))
}

seedDesktopClients()
  .catch((error: unknown) => {
    // Do not log database connection details or raw query errors.
    console.error(
      error instanceof Error && error.message.startsWith("Existing client")
        ? error.message
        : "Could not register desktop OAuth clients. Check database access and client configuration."
    )
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
