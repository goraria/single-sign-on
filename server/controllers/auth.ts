import type { Request, Response } from "express"
import { toNodeHandler, fromNodeHeaders } from "@/lib/structure/auth/server"
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@/lib/structure/auth/oap"
import { auth } from "@/lib/auth"

export const splat = toNodeHandler(auth)
const oauthAuthServerMetadata = oauthProviderAuthServerMetadata(auth)
const openIdConfigMetadata = oauthProviderOpenIdConfigMetadata(auth)

function getRequestUrl(req: Request) {
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`
}

async function sendWebResponse(res: Response, response: globalThis.Response) {
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.status(response.status)
  res.send(await response.text())
}

export async function me(req: Request, res: Response) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  return res.json(session)
}

export async function oauthAuthorizationServerMetadata(
  req: Request,
  res: Response,
) {
  const response = await oauthAuthServerMetadata(
    new Request(getRequestUrl(req), {
      method: req.method,
      headers: fromNodeHeaders(req.headers),
    }),
  )

  return sendWebResponse(res, response)
}

export async function openIdConfigurationMetadata(req: Request, res: Response) {
  const response = await openIdConfigMetadata(
    new Request(getRequestUrl(req), {
      method: req.method,
      headers: fromNodeHeaders(req.headers),
    }),
  )

  return sendWebResponse(res, response)
}
