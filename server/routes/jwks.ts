import { Hono } from "hono"

import {
  oauthAuthorizationServerMetadata,
  openIdConfigurationMetadata,
} from "@/controllers/auth"

const router = new Hono()

router.get("/oauth-authorization-server/auth", oauthAuthorizationServerMetadata)
router.get("/oauth-authorization-server", oauthAuthorizationServerMetadata)
router.get("/openid-configuration", openIdConfigurationMetadata)

export default router
