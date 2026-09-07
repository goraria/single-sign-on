import { type NextFunction, type Request, type Response } from "express"

import {
  adminIdParamsSchema,
  adminSsoApplicationListQuerySchema,
  adminSsoApplicationPatchSchema,
  adminSsoApplicationPayloadSchema,
  adminUserListQuerySchema,
  adminUserPatchSchema,
  adminUserPayloadSchema,
} from "@/schemas/admin"
import {
  createSsoApplication as createSsoApplicationServices,
  createUser as createUserServices,
  deleteSsoApplication as deleteSsoApplicationServices,
  getSsoApplication as getSsoApplicationServices,
  getUserById as getUserByIdServices,
  listOAuthConsents as listOAuthConsentsServices,
  listOAuthResources as listOAuthResourcesServices,
  listSessions as listSessionsServices,
  listSsoApplications as listSsoApplicationsServices,
  listUsers as listUsersServices,
  updateSsoApplication as updateSsoApplicationServices,
  updateUser as updateUserServices,
} from "@/services/admin"

export async function listSsoApplications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const options = adminSsoApplicationListQuerySchema.parse(req.query)
    const data = await listSsoApplicationsServices(options)

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function getSsoApplication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = adminIdParamsSchema.parse(req.params)
    const data = await getSsoApplicationServices(id)

    res.status(200).json({ data })
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
    const input = adminSsoApplicationPayloadSchema.parse(req.body)
    const data = await createSsoApplicationServices(input)

    res.status(200).json({ data, message: "SSO application created" })
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
    const { id } = adminIdParamsSchema.parse(req.params)
    const input = adminSsoApplicationPatchSchema.parse(req.body)
    const data = await updateSsoApplicationServices(id, input)

    res.status(200).json({ data, message: "SSO application updated" })
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
    const { id } = adminIdParamsSchema.parse(req.params)
    const data = await deleteSsoApplicationServices(id)

    res.status(200).json({ data, message: "SSO application deleted" })
  } catch (error) {
    next(error)
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const options = adminUserListQuerySchema.parse(req.query)
    const data = await listUsersServices(options)

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = adminIdParamsSchema.parse(req.params)
    const data = await getUserByIdServices(id)

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = adminUserPayloadSchema.parse(req.body)
    const data = await createUserServices(input)

    res.status(200).json({ data, message: "User created" })
  } catch (error) {
    next(error)
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = adminIdParamsSchema.parse(req.params)
    const input = adminUserPatchSchema.parse(req.body)
    const data = await updateUserServices(id, input)

    res.status(200).json({ data, message: "User updated" })
  } catch (error) {
    next(error)
  }
}

export async function listSessions(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listSessionsServices()

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function listOAuthResources(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listOAuthResourcesServices()

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function listOAuthConsents(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await listOAuthConsentsServices()

    res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}
