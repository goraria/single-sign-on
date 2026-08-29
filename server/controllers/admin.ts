import type { NextFunction, Request, Response } from "express"

import {
  createSsoApplication as createSsoApplicationService,
  deleteSsoApplication as deleteSsoApplicationService,
  listSsoApplications as listSsoApplicationsService,
  listUsers as listUsersService,
  requireAdminSession,
  updateSsoApplication as updateSsoApplicationService,
} from "@/services/admin"

interface AdminRequest extends Request {
  adminUserId?: string
}

function sendData(res: Response, data: unknown, message?: string) {
  res.status(200).json({
    data,
    ...(message ? { message } : {}),
  })
}

export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await requireAdminSession(req.headers)
    req.adminUserId = user.id
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

export async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    sendData(res, await listUsersService())
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
