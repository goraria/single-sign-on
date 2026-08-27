import { Router } from "express"
import { me, splat } from "@/controllers/auth"

const router = Router()

router.get("/me", me)
router.all("/*splat", splat)

export default router
