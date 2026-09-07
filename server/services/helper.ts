import { eq } from "drizzle-orm"

import { database } from "@/database"
import { oauthClients } from "@/database/schema"
import { adminSsoApplicationSelection } from "@/schemas/admin"

export function createServiceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode })
}

export function isServiceError(error: unknown) {
  return error instanceof Error && "statusCode" in error
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

export async function checkSsoApplicationExists(id: string) {
  const [application] = await database
    .select(adminSsoApplicationSelection)
    .from(oauthClients)
    .where(eq(oauthClients.id, id))
    .limit(1)

  if (!application) {
    throw createServiceError("sso_application_not_found", 404)
  }

  return application
}
