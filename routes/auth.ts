import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"

import { splat, prepareOAuthTimeout } from "@/controllers/auth"

const router = new Hono()

router.post(
  "/oauth-timeout",
  bodyLimit({ maxSize: 16384 }),
  prepareOAuthTimeout
)
router.all("/*", splat)

export default router
