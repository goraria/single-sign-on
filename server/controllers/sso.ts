import type { Context } from "hono"
import type { IncomingHttpHeaders } from "node:http"

import { betterAuthUrl } from "@/lib/utils/environment"
import {
  oauthClientRedirectPolicySchema,
  tokenBundleSchema,
  tokenVerifySchema,
} from "@/schemas/sso"
import {
  createTokenBundle as createTokenBundleServices,
  getOAuthClientRedirectPolicy as getOAuthClientRedirectPolicyServices,
  verifyToken as verifyTokenServices,
} from "@/services/sso"

function getIssuer(context: Context) {
  return betterAuthUrl ?? new URL(context.req.url).origin
}

export async function getOAuthClientRedirectPolicy(context: Context) {
  const input = oauthClientRedirectPolicySchema.parse(await context.req.json())
  const allowed = await getOAuthClientRedirectPolicyServices(input)
  return context.json({ allowed })
}

export async function createTokenBundle(context: Context) {
  const input = tokenBundleSchema.parse(await context.req.json())
  const data = await createTokenBundleServices(
    input,
    context.req.header() as IncomingHttpHeaders,
    getIssuer(context),
  )
  return context.json(data)
}

export async function verifyToken(context: Context) {
  const input = tokenVerifySchema.parse(await context.req.json())
  return context.json(await verifyTokenServices(input, getIssuer(context)))
}
