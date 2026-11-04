import "server-only"
import { desc, eq, isNull, sql } from "drizzle-orm"
import { database } from "@/database"
import { oauthClient, oauthScopeRevision } from "@/database/schema"
import { oauthScopeRevision as configuredRevision } from "@/utils/environment"
import {
  oauthScopePublicationSchema,
  type OAuthScopePublication,
} from "@/schemas/oauth-registry"
import { createServiceError } from "@/services/helper"

export async function loadOAuthScopeRevision() {
  if (!Number.isSafeInteger(configuredRevision) || configuredRevision < 1)
    throw createServiceError("invalid_oauth_scope_revision", 503)
  const [row] = await database
    .select()
    .from(oauthScopeRevision)
    .where(eq(oauthScopeRevision.revision, configuredRevision))
    .limit(1)
  if (!row) throw createServiceError("oauth_scope_revision_not_found", 503)
  const { scopes } = oauthScopePublicationSchema.parse({
    baseRevision: row.revision,
    scopes: row.scopes,
  })
  return { revision: row.revision, scopes }
}

export async function listOAuthScopeRevisions() {
  const revisions = await database
    .select()
    .from(oauthScopeRevision)
    .orderBy(desc(oauthScopeRevision.revision))
    .limit(50)
  return { active: await loadOAuthScopeRevision(), revisions }
}

export async function publishOAuthScopeRevision(
  input: OAuthScopePublication,
  actorId: string
) {
  return database.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(1936946031)`)
    // Serialize publication so a stale editor cannot overwrite another revision.
    const [latest] = await tx
      .select()
      .from(oauthScopeRevision)
      .orderBy(desc(oauthScopeRevision.revision))
      .limit(1)
      .for("update")
    if (!latest || latest.revision !== input.baseRevision)
      throw createServiceError("oauth_scope_revision_conflict", 409)
    const [unboundedClient] = await tx
      .select({ id: oauthClient.id })
      .from(oauthClient)
      .where(isNull(oauthClient.scopes))
      .limit(1)
    if (unboundedClient)
      throw createServiceError("oauth_client_scope_ceiling_required", 409)
    // Retire scopes separately after migrating clients/resources and grants.
    if (!latest.scopes.every((scope) => input.scopes.includes(scope)))
      throw createServiceError("oauth_scope_removal_requires_migration", 400)
    const [revision] = await tx
      .insert(oauthScopeRevision)
      .values({
        revision: latest.revision + 1,
        scopes: input.scopes,
        createdBy: actorId,
      })
      .returning()
    return revision
  })
}
