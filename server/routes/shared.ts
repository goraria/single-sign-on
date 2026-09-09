// import path from "path"
import { Router } from "express"

import favicon from "@/assets/favicon.ico?inline"
import globalsCss from "@/assets/globals.css?raw"
import indexHtml from "@/assets/index.html?raw"

const router = Router()

router.get("/favicon.ico", (req, res) => {
  const base64 = favicon.replace(/^data:image\/x-icon;base64,/, "")

  res
    .status(200)
    .type("image/x-icon")
    .send(Buffer.from(base64, "base64"))
})

router.get("/globals.css", (req, res) => {
  res
    .status(200)
    .type("text/css")
    .send(globalsCss)
})

router.get("/", (req, res) => {
  res
    .status(200)
    .type("html")
    .send(indexHtml)
})

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

router.get("/param/:param", (req, res) => {
  const { param } = req.params

  res.status(200).json({
    param,
  })
})

router.get("/query", (req, res) => {
  const { query } = req.query

  res.status(200).json({
    query,
  })
})

// const assetsRoot = path.resolve(process.cwd(), "assets")

// router.get("/favicon.ico", (req, res) => {
//   res.sendFile("favicon.ico", { root: assetsRoot })
// })

// router.get("/globals.css", (req, res) => {
//   res.sendFile("globals.css", { root: assetsRoot })
// })

// router.get("/", (req, res) => {
//   res.sendFile("index.html", { root: assetsRoot })
// })

// router.get("/health", (req, res) => {
//   res.status(200).json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     memory: process.memoryUsage(),
//   })
// })

// router.get("/param/:param", (req, res) => {
//   const { param } = req.params

//   res.status(200).json({
//     param,
//   })
// })

// router.get("/query", (req, res) => {
//   const { query } = req.query

//   res.status(200).json({
//     query,
//   })
// })

export default router
