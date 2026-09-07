import { type Request, type Response } from "express"
import { toNodeHandler, fromNodeHeaders } from "@/lib/structure/auth/server"
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@/lib/structure/auth/oap"
import { auth } from "@/lib/auth"

export const splat = toNodeHandler(auth)
const oauthAuthServerMetadata = oauthProviderAuthServerMetadata(auth)
const openIdConfigMetadata = oauthProviderOpenIdConfigMetadata(auth)

export async function oauthAuthorizationServerMetadata(
  req: Request,
  res: Response
) {
  const response = await oauthAuthServerMetadata(
    new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
      method: req.method,
      headers: fromNodeHeaders(req.headers),
    })
  )

  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.status(response.status).send(await response.text())
}

export async function openIdConfigurationMetadata(req: Request, res: Response) {
  const response = await openIdConfigMetadata(
    new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
      method: req.method,
      headers: fromNodeHeaders(req.headers),
    })
  )

  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.status(response.status).send(await response.text())
}
