import { type NextFunction, type Request, type Response } from "express"

import { betterAuthUrl } from "@/lib/utils/environment"
import {
  oauthClientRedirectPolicySchema,
  tokenBundleSchema,
  tokenVerifySchema,
} from "@/schemas/sso"
import {
  createTokenBundle as createTokenBundleServices,
  getOAuthClientRedirectPolicy as getOAuthClientRedirectPolicyServices,
  verifyToken as verifyTokenServices,
} from "@/services/sso"

export async function getOAuthClientRedirectPolicy(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = oauthClientRedirectPolicySchema.parse(req.body)
    const allowed = await getOAuthClientRedirectPolicyServices(input)

    res.status(200).json({ allowed })
  } catch (error) {
    next(error)
  }
}

export async function createTokenBundle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = tokenBundleSchema.parse(req.body)
    const data = await createTokenBundleServices(
      input,
      req.headers,
      betterAuthUrl ?? `${req.protocol}://${req.get("host")}`
    )

    res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = tokenVerifySchema.parse(req.body)
    const data = await verifyTokenServices(
      input,
      betterAuthUrl ?? `${req.protocol}://${req.get("host")}`
    )

    res.status(200).json(data)
  } catch (error) {
    next(error)
  }
}
