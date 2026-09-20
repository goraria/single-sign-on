import { Hono } from "hono"

import { splat } from "@/controllers/auth"

const router = new Hono()

router.all("/*", splat)

export default router
