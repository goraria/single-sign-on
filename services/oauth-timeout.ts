import { eq } from "drizzle-orm"
import { verifyOAuthQueryParams } from "@better-auth/oauth-provider"
import { database } from "@/database"
import { oauthClient } from "@/database/schema"
import { auth } from "@/lib/auth/server/index"
import { oauthTimeoutResult } from "@/lib/auth/server/timeout"

export async function prepareOAuthTimeout(query: string) {
  const context = await auth.$context
  if (!(await verifyOAuthQueryParams(query, context.secret)))
    throw new Error("invalid_oauth_query")
  const params = new URLSearchParams(query)
  const [client] = await database
    .select({
      disabled: oauthClient.disabled,
      redirectUris: oauthClient.redirectUris,
    })
    .from(oauthClient)
    .where(eq(oauthClient.clientId, params.get("client_id") ?? ""))
    .limit(1)
  if (!client) throw new Error("invalid_client")
  return oauthTimeoutResult(params, client, context.baseURL)
}
