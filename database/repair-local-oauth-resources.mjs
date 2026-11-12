import nextEnv from "@next/env"
import { Pool } from "@gorth-io/structure/cores/pg"
import { randomUUID } from "node:crypto"
import {
  localOAuthApplications,
  planLocalOAuthResources,
} from "../utils/oauth-local-client.ts"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const apply = process.argv.includes("--apply")
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 15000,
})
const connection = await pool.connect()
const requestId = randomUUID()
async function snapshot() {
  return (
    await connection.query(`SELECT
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(c) ORDER BY client_id)::text,'[]')) FROM oauth_client c) AS clients,
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(r)-ARRAY['allowed_scopes','policy_version','updated_at'] ORDER BY identifier)::text,'[]')) FROM oauth_resource r) AS resource_identity`)
  ).rows[0]
}
async function records() {
  const clients = (
    await connection.query(
      "SELECT client_id,redirect_uris,scopes,disabled,public,require_pkce,token_endpoint_auth_method,metadata->>'environment' AS environment,client_secret IS NOT NULL AS has_secret FROM oauth_client WHERE client_id=ANY($1::text[])",
      [localOAuthApplications.map((a) => a.clientId)]
    )
  ).rows
  const resources = (
    await connection.query(
      "SELECT identifier,disabled,allowed_scopes FROM oauth_resource"
    )
  ).rows
  const links = (
    await connection.query(
      "SELECT client_id,resource_id FROM oauth_client_resource ORDER BY client_id,resource_id"
    )
  ).rows
  return { clients, resources, links }
}
try {
  await connection.query("BEGIN ISOLATION LEVEL SERIALIZABLE")
  await connection.query("SET LOCAL lock_timeout='10s'")
  await connection.query(
    "SELECT pg_advisory_xact_lock(hashtext('sso:local-oauth-resource-repair'))"
  )
  if (apply)
    await connection.query(
      "LOCK TABLE oauth_client,oauth_resource,oauth_client_resource IN SHARE ROW EXCLUSIVE MODE"
    )
  const before = await snapshot(),
    initial = await records()
  const plan = planLocalOAuthResources(
    initial.clients,
    initial.resources,
    initial.links
  )
  if (!apply) {
    await connection.query("ROLLBACK")
    console.info(JSON.stringify({ applied: false, ...plan }))
  } else {
    for (const p of plan.policies) {
      await connection.query(
        "UPDATE oauth_resource SET allowed_scopes=(SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(allowed_scopes||$2::text[]) s),policy_version=policy_version+1,updated_at=now() WHERE identifier=$1 AND NOT disabled AND allowed_scopes IS NOT NULL",
        [p.identifier, p.addedScopes]
      )
      await connection.query(
        "INSERT INTO audit_log(actor_user_id,action,outcome,resource_type,resource_id,metadata) VALUES(NULL,'oauth-local.resource-policy.extend','success','oauth-resource',$1,$2::jsonb)",
        [
          p.identifier,
          JSON.stringify({
            actorType: "database-operator",
            requestId,
            addedScopes: p.addedScopes,
          }),
        ]
      )
    }
    for (const link of plan.links) {
      await connection.query(
        "INSERT INTO oauth_client_resource(client_id,resource_id) VALUES($1,$2) ON CONFLICT(client_id,resource_id) DO NOTHING",
        [link.client_id, link.resource_id]
      )
      await connection.query(
        "INSERT INTO audit_log(actor_user_id,action,outcome,resource_type,resource_id,metadata) VALUES(NULL,'oauth-local.resource.link','success','oauth-client',$1,$2::jsonb)",
        [
          link.client_id,
          JSON.stringify({
            actorType: "database-operator",
            requestId,
            resource: link.resource_id,
          }),
        ]
      )
    }
    const after = await snapshot(),
      current = await records()
    const remaining = planLocalOAuthResources(
      current.clients,
      current.resources,
      current.links
    )
    if (
      before.clients !== after.clients ||
      before.resource_identity !== after.resource_identity ||
      remaining.links.length ||
      remaining.policies.length ||
      current.links.length !== initial.links.length + plan.links.length ||
      initial.links.some(
        (l) =>
          !current.links.some(
            (c) =>
              c.client_id === l.client_id && c.resource_id === l.resource_id
          )
      )
    )
      throw new Error("registry_preservation_failed")
    await connection.query("COMMIT")
    console.info(
      JSON.stringify({
        applied: true,
        addedLinks: plan.links.length,
        extendedPolicies: plan.policies,
        clientRecordsPreserved: true,
        existingLinksPreserved: true,
        remaining,
      })
    )
  }
} catch (error) {
  await connection.query("ROLLBACK").catch(() => {})
  console.error("Local OAuth repair failed; transaction rolled back", {
    code: error.code ?? "registry_repair_failed",
    reason:
      /^(local_client|local_callback|client_scope|resource)_requires_review:/.test(
        error.message
      )
        ? error.message
        : undefined,
  })
  process.exitCode = 1
} finally {
  connection.release()
  await pool.end()
}
