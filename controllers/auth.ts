import type { Context } from "hono"
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider"

import { auth } from "@/lib/auth/server/index"
import { appUrl } from "@/utils/environment"
import { oauthTimeoutSchema } from "@/schemas/oauth-timeout"
import { prepareOAuthTimeout as prepareOAuthTimeoutServices } from "@/services/oauth-timeout"

const oauthAuthServerMetadata = oauthProviderAuthServerMetadata(auth)
const openIdConfigMetadata = oauthProviderOpenIdConfigMetadata(auth)

export function splat(context: Context) {
  return auth.handler(context.req.raw)
}

export async function prepareOAuthTimeout(context: Context) {
  context.header("Cache-Control", "no-store")
  context.header("Referrer-Policy", "no-referrer")
  try {
    if (!appUrl) throw new Error("invalid_origin")
    if (
      context.req.header("origin") !== new URL(appUrl).origin ||
      context.req.header("sec-fetch-site") === "cross-site"
    )
      throw new Error("invalid_origin")
    if (
      context.req.header("content-type")?.split(";")[0] !== "application/json"
    )
      return context.json({ error: "invalid_request" }, 415)
    if (Number(context.req.header("content-length")) > 16384)
      return context.json({ error: "invalid_request" }, 413)
    const input = oauthTimeoutSchema.parse(await context.req.json())
    return context.json(
      await prepareOAuthTimeoutServices(input.oauth_query),
      200
    )
  } catch {
    // Never echo signed queries, client secrets or arbitrary redirect targets.
    return context.json({ error: "invalid_oauth_request" }, 400)
  }
}

export function oauthAuthorizationServerMetadata(context: Context) {
  return oauthAuthServerMetadata(context.req.raw)
}

export function openIdConfigurationMetadata(context: Context) {
  return openIdConfigMetadata(context.req.raw)
}
