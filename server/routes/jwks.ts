import { Router } from "express"

import {
  oauthAuthorizationServerMetadata,
  openIdConfigurationMetadata,
} from "@/controllers/auth"

const router = Router()

router.get(
  "/oauth-authorization-server/auth",
  oauthAuthorizationServerMetadata
)
router.get(
  "/oauth-authorization-server",
  oauthAuthorizationServerMetadata,
)
router.get(
  "/openid-configuration",
  openIdConfigurationMetadata
)

export default router
