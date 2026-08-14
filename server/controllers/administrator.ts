import type { NextFunction, Request, Response } from "express"

import {
  createSsoApplication as createSsoApplicationService,
  deleteSsoApplication as deleteSsoApplicationService,
  listSsoApplications as listSsoApplicationsService,
  requireAdministratorSession,
  updateSsoApplication as updateSsoApplicationService,
} from "@/services/administrator"

interface AuthorizedRequest extends Request {
  administratorUserId?: string
}

function sendData(res: Response, data: unknown, message?: string) {
  res.status(200).json({
    data,
    ...(message ? { message } : {}),
  })
}

export async function requireAdministrator(
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await requireAdministratorSession(req.headers)
    req.administratorUserId = user.id
    next()
  } catch (error) {
    next(error)
  }
}

export async function listSsoApplications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    sendData(res, await listSsoApplicationsService())
  } catch (error) {
    next(error)
  }
}

export async function createSsoApplication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    sendData(
      res,
      await createSsoApplicationService(req.body),
      "SSO application created"
    )
  } catch (error) {
    next(error)
  }
}

export async function updateSsoApplication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : ""

    sendData(
      res,
      await updateSsoApplicationService(id, req.body),
      "SSO application updated"
    )
  } catch (error) {
    next(error)
  }
}

export async function deleteSsoApplication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : ""

    sendData(
      res,
      await deleteSsoApplicationService(id),
      "SSO application deleted"
    )
  } catch (error) {
    next(error)
  }
}
