import "server-only"
import { eq } from "drizzle-orm"
import { database } from "@/database"
import { oauthClientResource } from "@/database/schema"
import { getAuth } from "@/lib/auth/server/index"
import {
  checkOAuthResourceExists,
  checkSsoApplicationExists,
} from "@/services/helper"

export async function listOAuthClientResources(id: string) {
  const client = await checkSsoApplicationExists(id)
  return database
    .select({ resourceIdentifier: oauthClientResource.resourceId })
    .from(oauthClientResource)
    .where(eq(oauthClientResource.clientId, client.clientId))
}

export async function linkOAuthClientResource(
  id: string,
  resourceId: string,
  headers: Headers
) {
  const [client, resource] = await Promise.all([
    checkSsoApplicationExists(id),
    checkOAuthResourceExists(resourceId),
  ])
  return (await getAuth()).api.adminLinkClientResource({
    headers,
    params: {
      identifier: encodeURIComponent(resource.identifier),
      client_id: client.clientId,
    },
  })
}

export async function unlinkOAuthClientResource(
  id: string,
  resourceId: string,
  headers: Headers
) {
  const [client, resource] = await Promise.all([
    checkSsoApplicationExists(id),
    checkOAuthResourceExists(resourceId),
  ])
  return (await getAuth()).api.adminUnlinkClientResource({
    headers,
    params: {
      identifier: encodeURIComponent(resource.identifier),
      client_id: client.clientId,
    },
  })
}
