import { Router } from "express"

import {
  createTokenBundle,
  getOAuthClientRedirectPolicy,
  verifyToken,
} from "@/controllers/sso"
import {
  deprecateLegacySso,
  requireLegacySso,
  requireSsoClient,
} from "@/middlewares/sso"

const router = Router()

router.post(
  "/oauth-client/redirect-policy",
  requireSsoClient(),
  getOAuthClientRedirectPolicy
)
router.post(
  "/sso/token-bundle",
  requireSsoClient(),
  requireLegacySso(),
  deprecateLegacySso(),
  createTokenBundle
)
router.post(
  "/sso/verify-token",
  requireSsoClient(),
  deprecateLegacySso(),
  verifyToken
)

export default router
