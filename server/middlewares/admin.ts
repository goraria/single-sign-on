import { type NextFunction, type Request, type Response } from "express"

import { requireAdminSession } from "@/services/admin"

export function requireAdmin() {
  return async function requireAdminMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    try {
      await requireAdminSession(req.headers)
      next()
    } catch (error) {
      next(error)
    }
  }
}
