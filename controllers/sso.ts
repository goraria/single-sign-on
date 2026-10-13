import type { Context } from "hono"
import { oauthClientRedirectPolicySchema } from "@/schemas/sso"
import { getOAuthClientRedirectPolicy as getOAuthClientRedirectPolicyServices } from "@/services/sso"

export async function getOAuthClientRedirectPolicy(context: Context) {
  const input = oauthClientRedirectPolicySchema.parse(await context.req.json())
  const allowed = await getOAuthClientRedirectPolicyServices(input)
  return context.json({ allowed })
}
