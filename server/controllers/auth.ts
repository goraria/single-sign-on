import type { Context } from "hono"
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@gorth/structure/cores/auth/server/oap"

import { auth } from "@/lib/auth"

const oauthAuthServerMetadata = oauthProviderAuthServerMetadata(auth)
const openIdConfigMetadata = oauthProviderOpenIdConfigMetadata(auth)

export function splat(context: Context) {
  return auth.handler(context.req.raw)
}

export function oauthAuthorizationServerMetadata(context: Context) {
  return oauthAuthServerMetadata(context.req.raw)
}

export function openIdConfigurationMetadata(context: Context) {
  return openIdConfigMetadata(context.req.raw)
}
