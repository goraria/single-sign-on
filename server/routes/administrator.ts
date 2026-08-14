import { Router } from "express"

import {
  createSsoApplication,
  deleteSsoApplication,
  listSsoApplications,
  requireAdministrator,
  updateSsoApplication,
} from "@/controllers/administrator"

const router = Router()

router.use(requireAdministrator)
router.get("/sso-applications", listSsoApplications)
router.post("/sso-applications", createSsoApplication)
router.patch("/sso-applications/:id", updateSsoApplication)
router.delete("/sso-applications/:id", deleteSsoApplication)

export default router
