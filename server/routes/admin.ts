import { Router } from "express"

import {
  createUser,
  createSsoApplication,
  deleteSsoApplication,
  getSsoApplication,
  getUserById,
  listOAuthConsents,
  listOAuthResources,
  listSessions,
  listSsoApplications,
  listUsers,
  updateUser,
  updateSsoApplication,
} from "@/controllers/admin"
import { requireAdmin } from "@/middlewares/admin"

const router = Router()

router.get("/users", requireAdmin(), listUsers)
router.get("/users/:id", requireAdmin(), getUserById)
router.post("/users", requireAdmin(), createUser)
router.patch("/users/:id", requireAdmin(), updateUser)
router.get("/sessions", requireAdmin(), listSessions)
router.get("/oauth-resources", requireAdmin(), listOAuthResources)
router.get("/oauth-consents", requireAdmin(), listOAuthConsents)
router.get("/sso-applications", requireAdmin(), listSsoApplications)
router.get("/sso-applications/:id", requireAdmin(), getSsoApplication)
router.post("/sso-applications", requireAdmin(), createSsoApplication)
router.patch("/sso-applications/:id", requireAdmin(), updateSsoApplication)
router.delete("/sso-applications/:id", requireAdmin(), deleteSsoApplication)

export default router
