import "server-only";
import { database } from "@/database";
import { oauthClient, oauthResource } from "@/database/schema";
import { betterAuthUrl } from "@/utils/environment";
import { buildApplicationDirectory, type DirectoryEnvironment } from "@/utils/application-directory";
import { HTTPException } from "hono/http-exception";

// Public projection of administrator-managed OAuth registrations. Never returns credentials,
// user records, redirect lists, arbitrary metadata, scope grants or private storage profiles.
export async function getApplicationDirectory(environment: DirectoryEnvironment) {
  if (!betterAuthUrl) throw new HTTPException(503, { message: "directory_not_configured" });
  const [clients, resources] = await Promise.all([
    database.select({
      clientId: oauthClient.clientId, uri: oauthClient.uri, disabled: oauthClient.disabled,
      referenceId: oauthClient.referenceId, scopes: oauthClient.scopes, metadata: oauthClient.metadata,
    }).from(oauthClient),
    database.select({
      identifier: oauthResource.identifier, disabled: oauthResource.disabled, metadata: oauthResource.metadata,
    }).from(oauthResource),
  ]);
  return buildApplicationDirectory(clients, resources, environment, betterAuthUrl);
}
