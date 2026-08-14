import { Router } from "express"
import {
  me,
  splat,
  oauthAuthorizationServerMetadata,
  openIdConfigurationMetadata,
} from "@/controllers/auth"

const router = Router()

// router.all("/api/auth/*", toNodeHandler(auth)); // For ExpressJS v4
// router.all("/api/auth/*splat", toNodeHandler(auth)); // For ExpressJS v5
router.get("/me", me)
router.all("/*splat", splat) // For ExpressJS v5

router.get(
  "/.well-known/oauth-authorization-server",
  oauthAuthorizationServerMetadata
)
router.get(
  "/.well-known/openid-configuration",
  openIdConfigurationMetadata
)

export default router
