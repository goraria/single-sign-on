import "server-only"
import { and, eq, sql } from "drizzle-orm"
import { database } from "@/database"
import {
  oauthClient,
  oauthClientResource,
  oauthResource,
} from "@/database/schema"
import {
  awsAccessKeyId,
  awsSecretAccessKey,
  awsEndpointUrlS3,
  awsRegion,
  awsBucket,
} from "@/utils/environment"
import { storageConfigurationSchema } from "@/schemas/storage-credential"
import { createServiceError } from "@/services/helper"

export function getStorageConfiguration() {
  const config = storageConfigurationSchema.safeParse({
    endpoint: awsEndpointUrlS3,
    region: awsRegion,
    bucketName: awsBucket,
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  })
  if (!config.success) throw createServiceError("storage_not_configured", 503)
  return config.data
}

// Signature verification is native Better Auth; this is current registry authorization.
export async function authorizeStorageClient(
  clientId: string,
  audience: string
) {
  const [client] = await database
    .select({
      disabled: oauthClient.disabled,
      authMethod: oauthClient.tokenEndpointAuthMethod,
      grants: oauthClient.grantTypes,
      machineScopes: oauthClient.clientCredentialsScopes,
      resourceDisabled: oauthResource.disabled,
      allowedScopes: oauthResource.allowedScopes,
      dpop: oauthResource.dpopBoundAccessTokensRequired,
      ttl: oauthResource.accessTokenTtl,
      purpose: sql<string>`${oauthClient.metadata}->>'purpose'`,
    })
    .from(oauthClient)
    .innerJoin(
      oauthClientResource,
      eq(oauthClient.clientId, oauthClientResource.clientId)
    )
    .innerJoin(
      oauthResource,
      eq(oauthResource.identifier, oauthClientResource.resourceId)
    )
    .where(
      and(
        eq(oauthClient.clientId, clientId),
        eq(oauthResource.identifier, audience)
      )
    )
    .limit(1)
  if (
    !client ||
    client.disabled ||
    client.resourceDisabled ||
    client.dpop ||
    client.purpose !== "media-storage-credential-reader" ||
    client.authMethod !== "client_secret_post" ||
    client.grants?.length !== 1 ||
    client.grants[0] !== "client_credentials" ||
    !client.machineScopes?.includes("storage:sso:credential") ||
    !client.allowedScopes?.includes("storage:sso:credential") ||
    !client.ttl ||
    client.ttl > 120
  ) {
    throw createServiceError("forbidden_storage_client", 403)
  }
}

export function getStorageCredential(bucketName: string) {
  const config = getStorageConfiguration()
  if (bucketName !== config.bucketName)
    throw createServiceError("forbidden_storage_bucket", 403)
  return config
}
