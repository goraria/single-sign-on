import { Hono } from "hono"

import {
  createSsoApplication,
  createUser,
  deleteSsoApplication,
  getSsoApplication,
  getUserById,
  listOAuthConsents,
  listOAuthResources,
  listSessions,
  listSsoApplications,
  listUsers,
  updateSsoApplication,
  updateUser,
} from "@/controllers/admin"
import { requireAdmin } from "@/middlewares/admin"

const router = new Hono()

router.get("/user", requireAdmin(), listUsers)
router.get("/user/:id", requireAdmin(), getUserById)
router.post("/user", requireAdmin(), createUser)
router.patch("/user/:id", requireAdmin(), updateUser)
router.get("/session", requireAdmin(), listSessions)
router.get("/oauth-resource", requireAdmin(), listOAuthResources)
router.get("/oauth-consent", requireAdmin(), listOAuthConsents)
router.get("/sso-application", requireAdmin(), listSsoApplications)
router.get("/sso-application/:id", requireAdmin(), getSsoApplication)
router.post("/sso-application", requireAdmin(), createSsoApplication)
router.patch("/sso-application/:id", requireAdmin(), updateSsoApplication)
router.delete("/sso-application/:id", requireAdmin(), deleteSsoApplication)

export default router
