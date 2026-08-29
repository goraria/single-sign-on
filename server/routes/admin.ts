import { Router } from "express"

import {
  createSsoApplication,
  deleteSsoApplication,
  listSsoApplications,
  listUsers,
  requireAdmin,
  updateSsoApplication,
} from "@/controllers/admin"

const router = Router()

router.use(requireAdmin)
router.get("/users", listUsers)
router.get("/sso-applications", listSsoApplications)
router.post("/sso-applications", createSsoApplication)
router.patch("/sso-applications/:id", updateSsoApplication)
router.delete("/sso-applications/:id", deleteSsoApplication)

export default router
