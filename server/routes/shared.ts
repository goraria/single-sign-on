import { Hono } from "hono"

const router = new Hono()

router.get("/health", (context) =>
  context.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }),
)

router.get("/param/:param", (context) =>
  context.json({ param: context.req.param("param") }),
)

router.get("/query", (context) =>
  context.json({ query: context.req.query("query") }),
)

export default router
