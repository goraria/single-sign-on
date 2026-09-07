import { Router } from "express"
import { splat } from "@/controllers/auth"

const router = Router()

router.all("/*splat", splat)

export default router
