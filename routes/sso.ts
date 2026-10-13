import { Hono } from "hono"
import { getOAuthClientRedirectPolicy } from "@/controllers/sso"
import { requireSsoClient } from "@/middlewares/sso"

const router = new Hono()
router.post("/oauth-client/redirect-policy", requireSsoClient(), getOAuthClientRedirectPolicy)
export default router
