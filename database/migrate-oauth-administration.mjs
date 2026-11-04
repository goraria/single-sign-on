import nextEnv from "@next/env"
import { Pool } from "@gorth-io/structure/cores/pg"
import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { isDeepStrictEqual } from "node:util"
import { planOAuthClientMigration } from "../utils/oauth-client-migration.ts"
import { oauthManagementReference } from "../utils/oauth-management.ts"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const apply = process.argv.includes("--apply")
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 15000,
})
const requestId = randomUUID()
let connection

const mutableColumns = [
  "uri",
  "redirect_uris",
  "post_logout_redirect_uris",
  "backchannel_logout_uri",
  "reference_id",
  "metadata",
  "updated_at",
]
const rowSelection = `SELECT to_jsonb(c) - 'client_secret' AS record,
  c.client_secret IS NOT NULL AS has_secret,
  md5(((to_jsonb(c) - ARRAY['uri','redirect_uris','post_logout_redirect_uris','backchannel_logout_uri','reference_id','metadata','updated_at']) ||
    jsonb_build_object('metadata', coalesce(c.metadata, '{}'::jsonb) - 'environment'))::text) AS protected_fingerprint
  FROM oauth_client c`

function patchMatches(row, patch) {
  return Object.entries(patch).every(([key, value]) =>
    isDeepStrictEqual(row[key], value)
  )
}
function identifier(value) {
  if (!/^[a-z_]+$/.test(value)) throw new Error("unexpected_schema_column")
  return '"' + value + '"'
}
async function audit(action, resourceId, metadata) {
  await connection.query(
    "INSERT INTO audit_log(actor_user_id, action, outcome, resource_type, resource_id, metadata) VALUES(NULL, $1, 'success', 'oauth-administration', $2, $3::jsonb)",
    [
      action,
      resourceId,
      JSON.stringify({
        actorType: "database-operator",
        requestId,
        phase: "completed",
        ...metadata,
      }),
    ]
  )
}
async function protectedCounts() {
  const names = [
    "user",
    "account",
    "session",
    "oauth_access_token",
    "oauth_refresh_token",
    "oauth_consent",
    "jwks",
    "oauth_resource",
  ]
  const result = {}
  for (const name of names)
    result[name] = (
      await connection.query(
        `SELECT count(*)::integer AS count FROM ${identifier(name)}`
      )
    ).rows[0].count
  return result
}

try {
  connection = await pool.connect()
  await connection.query("BEGIN ISOLATION LEVEL SERIALIZABLE")
  await connection.query("SET LOCAL lock_timeout = '10s'")
  await connection.query("SET LOCAL statement_timeout = '30s'")
  await connection.query("SELECT pg_advisory_xact_lock(1936946032)")
  await connection.query(
    "LOCK TABLE oauth_client, oauth_client_resource IN SHARE ROW EXCLUSIVE MODE"
  )
  const beforeCounts = await protectedCounts()
  const beforeResources = (
    await connection.query(
      "SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY identifier)::text, '[]')) AS fingerprint FROM oauth_resource r"
    )
  ).rows[0].fingerprint
  const originalLinks = (
    await connection.query("SELECT * FROM oauth_client_resource ORDER BY id")
  ).rows
  const before = (
    await connection.query(rowSelection + " ORDER BY c.client_id FOR UPDATE")
  ).rows
  const existingIds = new Set(before.map(({ record }) => record.client_id))
  const plans = before.map((row) => ({
    row,
    plan: planOAuthClientMigration(
      row.record,
      row.has_secret,
      oauthManagementReference
    ),
  }))
  for (const { plan } of plans)
    if (plan?.local && existingIds.has(plan.local.client_id))
      throw new Error("local_client_collision")

  // Drizzle owns schema creation. This reviewed SQL only initializes missing revision 1.
  if (
    !(
      await connection.query(
        "SELECT to_regclass('public.oauth_scope_revision') AS name"
      )
    ).rows[0].name
  )
    throw new Error("run_drizzle_push_before_migration")
  const hadRevision =
    (
      await connection.query(
        "SELECT 1 FROM oauth_scope_revision WHERE revision = 1"
      )
    ).rowCount > 0
  const bootstrap = await readFile(
    new URL("./setup-oauth-registry.sql", import.meta.url),
    "utf8"
  )
  await connection.query(
    bootstrap.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "")
  )
  const catalog = (
    await connection.query(
      "SELECT scopes FROM oauth_scope_revision WHERE revision = 1"
    )
  ).rows[0].scopes
  if (catalog.length !== 31) throw new Error("unexpected_initial_scope_catalog")
  if (!hadRevision)
    await audit("oauth-scope.bootstrap", "1", {
      revision: 1,
      scopeCount: catalog.length,
    })

  const columns = (
    await connection.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'oauth_client' ORDER BY ordinal_position"
    )
  ).rows.map((row) => row.column_name)
  const changes = []
  for (const { row, plan } of plans) {
    if (!plan) continue
    const source = row.record
    if (!source.scopes.every((scope) => catalog.includes(scope)))
      throw new Error("client_scope_not_in_revision_one")
    if (plan.local) {
      const local = plan.local
      const parameters = [
        source.client_id,
        local.client_id,
        local.name,
        local.uri,
        local.redirect_uris,
        local.post_logout_redirect_uris,
        local.backchannel_logout_uri,
        oauthManagementReference,
        JSON.stringify(local.metadata),
      ]
      const overrides = {
        id: "gen_random_uuid()",
        client_id: "$2",
        name: "$3",
        uri: "$4",
        redirect_uris: "$5::text[]",
        post_logout_redirect_uris: "$6::text[]",
        backchannel_logout_uri: "$7",
        reference_id: "$8",
        metadata: "$9::jsonb",
        created_at: "now()",
        updated_at: "now()",
        user_id: "NULL",
        client_secret: "NULL",
      }
      const expressions = columns.map(
        (column) => overrides[column] ?? `c.${identifier(column)}`
      )
      const created = await connection.query(
        `INSERT INTO oauth_client (${columns.map(identifier).join(",")}) SELECT ${expressions.join(",")} FROM oauth_client c WHERE c.client_id = $1 RETURNING id`,
        parameters
      )
      if (created.rowCount !== 1)
        throw new Error("local_client_creation_failed")
      const linked = await connection.query(
        "INSERT INTO oauth_client_resource(client_id, resource_id, metadata) SELECT $1, resource_id, metadata FROM oauth_client_resource WHERE client_id = $2 RETURNING resource_id",
        [local.client_id, source.client_id]
      )
      await audit("oauth-client.create-local", created.rows[0].id, {
        clientId: local.client_id,
        sourceClientId: source.client_id,
        environment: "local",
        resourceLinkCount: linked.rowCount,
      })
    }
    if (!patchMatches(source, plan.patch)) {
      const patch = plan.patch
      await connection.query(
        "UPDATE oauth_client SET uri=$1, redirect_uris=$2::text[], post_logout_redirect_uris=$3::text[], backchannel_logout_uri=$4, reference_id=$5, metadata=$6::jsonb, updated_at=now() WHERE client_id=$7",
        [
          patch.uri,
          patch.redirect_uris,
          patch.post_logout_redirect_uris,
          patch.backchannel_logout_uri,
          patch.reference_id,
          JSON.stringify(patch.metadata),
          source.client_id,
        ]
      )
      await audit("oauth-client.adopt-and-partition", source.id, {
        clientId: source.client_id,
        environment: patch.metadata.environment,
        localClientId: plan.local?.client_id ?? null,
      })
      changes.push({
        clientId: source.client_id,
        environment: patch.metadata.environment,
        localClientId: plan.local?.client_id ?? null,
      })
    }
  }

  const after = (await connection.query(rowSelection + " ORDER BY c.client_id"))
    .rows
  for (const { row, plan } of plans) {
    const current = after.find(
      ({ record }) => record.client_id === row.record.client_id
    )
    if (!current || current.protected_fingerprint !== row.protected_fingerprint)
      throw new Error("protected_client_fields_changed")
    if (plan && !patchMatches(current.record, plan.patch))
      throw new Error("client_partition_verification_failed")
    if (!plan && !isDeepStrictEqual(current.record, row.record))
      throw new Error("unmanaged_client_changed")
    if (plan?.local) {
      const local = after.find(
        ({ record }) => record.client_id === plan.local.client_id
      )
      if (!local || local.has_secret || !patchMatches(local.record, plan.local))
        throw new Error("local_client_verification_failed")
      for (const column of columns.filter(
        (name) =>
          ![
            ...mutableColumns,
            "id",
            "client_id",
            "name",
            "created_at",
          ].includes(name)
      )) {
        if (!isDeepStrictEqual(local.record[column], row.record[column]))
          throw new Error("local_client_policy_changed")
      }
      const sourceLinks = originalLinks
        .filter((link) => link.client_id === row.record.client_id)
        .map(({ resource_id, metadata }) => ({ resource_id, metadata }))
      const localLinks = (
        await connection.query(
          "SELECT resource_id, metadata FROM oauth_client_resource WHERE client_id=$1 ORDER BY resource_id",
          [plan.local.client_id]
        )
      ).rows
      const sort = (links) =>
        links.sort((a, b) => a.resource_id.localeCompare(b.resource_id))
      if (!isDeepStrictEqual(sort(sourceLinks), sort(localLinks)))
        throw new Error("local_client_links_changed")
    }
  }
  const preservedLinks = (
    await connection.query(
      "SELECT * FROM oauth_client_resource WHERE client_id = ANY($1::text[]) ORDER BY id",
      [before.map(({ record }) => record.client_id)]
    )
  ).rows
  if (!isDeepStrictEqual(originalLinks, preservedLinks))
    throw new Error("existing_resource_links_changed")
  const afterResources = (
    await connection.query(
      "SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY identifier)::text, '[]')) AS fingerprint FROM oauth_resource r"
    )
  ).rows[0].fingerprint
  if (
    beforeResources !== afterResources ||
    !isDeepStrictEqual(beforeCounts, await protectedCounts())
  )
    throw new Error("protected_data_changed")
  if (
    after.length !==
    before.length + plans.filter(({ plan }) => plan?.local).length
  )
    throw new Error("unexpected_client_count")
  await connection.query(apply ? "COMMIT" : "ROLLBACK")
  console.info(
    JSON.stringify(
      {
        mode: apply ? "applied" : "dry-run-rolled-back",
        revision: 1,
        scopeCount: catalog.length,
        originalClients: before.length,
        resultingClients: after.length,
        changes,
        protectedDataPreserved: true,
        originalLinksPreserved: originalLinks.length,
      },
      null,
      2
    )
  )
} catch (error) {
  await connection?.query("ROLLBACK").catch(() => {})
  // Never print connection errors, SQL parameters, policy metadata or credentials.
  const reason =
    error instanceof Error && /^[a-z_]+$/.test(error.message)
      ? error.message
      : "database_operation_failed"
  console.error(
    JSON.stringify({
      error: "oauth_administration_migration_failed",
      reason,
      requestId,
    })
  )
  process.exitCode = 1
} finally {
  connection?.release()
  await pool.end()
}
