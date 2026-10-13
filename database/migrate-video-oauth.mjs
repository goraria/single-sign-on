import nextEnv from "@next/env"
import { Pool } from "@gorth/structure/cores/pg"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const clientId = "gorth-video-streaming-platform"
const oldAudience = "http://localhost:5051"
const newAudience = "http://localhost:3031"
let connection
try {
  connection = await pool.connect()
  await connection.query("BEGIN")
  await connection.query("SELECT pg_advisory_xact_lock(hashtextextended('gorth:video-oauth-migration', 0))")
  const registered = await connection.query(
    "SELECT redirect_uris, to_jsonb(c) - 'redirect_uris' AS unchanged FROM oauth_client c WHERE client_id = $1 FOR UPDATE",
    [clientId]
  )
  if (registered.rows.length !== 1) throw new Error("Expected one Video client")
  const record = registered.rows[0]
  if (!Array.isArray(record.redirect_uris) || !record.redirect_uris.length)
    throw new Error("Missing callbacks")
  const callbacks = record.redirect_uris.map(value => {
    const url = new URL(value)
    if (url.pathname === "/auth/exchange") url.pathname = "/auth/callback/gorth"
    else if (url.pathname !== "/auth/callback/gorth") throw new Error("Unexpected callback")
    return url.href
  })
  const resources = await connection.query(
    "SELECT identifier, name, allowed_scopes, disabled, dpop_bound_access_tokens_required FROM oauth_resource WHERE identifier = ANY($1::text[]) FOR UPDATE",
    [[oldAudience, newAudience]]
  )
  const old = resources.rows.find(row => row.identifier === oldAudience)
  const target = resources.rows.find(row => row.identifier === newAudience)
  const grants = await connection.query(
    "SELECT client_id, resource_id FROM oauth_client_resource WHERE resource_id = ANY($1::text[])",
    [[oldAudience, newAudience]]
  )
  if ((!old && !target) || grants.rows.length !== 1 || grants.rows[0].client_id !== clientId)
    throw new Error("Unexpected resource grants")
  if (old && target && (target.name !== newAudience || target.allowed_scopes !== null || target.disabled || target.dpop_bound_access_tokens_required))
    throw new Error("Target already has a custom policy")
  if (old && target) {
    const copied = await connection.query(
      `UPDATE oauth_resource AS target SET
         name = source.name, access_token_ttl = source.access_token_ttl,
         refresh_token_ttl = source.refresh_token_ttl,
         signing_algorithm = source.signing_algorithm, signing_key_id = source.signing_key_id,
         allowed_scopes = source.allowed_scopes, custom_claims = source.custom_claims,
         dpop_bound_access_tokens_required = source.dpop_bound_access_tokens_required,
         disabled = source.disabled, metadata = source.metadata,
         policy_version = GREATEST(source.policy_version, target.policy_version) + 1, updated_at = NOW()
       FROM oauth_resource AS source
       WHERE source.identifier = $1 AND target.identifier = $2 AND target.allowed_scopes IS NULL`,
      [oldAudience, newAudience]
    )
    if (copied.rowCount !== 1) throw new Error("Policy transfer failed")
    await connection.query("UPDATE oauth_client_resource SET resource_id = $1 WHERE client_id = $2 AND resource_id = $3", [newAudience, clientId, oldAudience])
    const removed = await connection.query("DELETE FROM oauth_resource WHERE identifier = $1", [oldAudience])
    if (removed.rowCount !== 1) throw new Error("Resource migration failed")
  } else if (old) {
    const moved = await connection.query(
      "UPDATE oauth_resource SET identifier = $1, updated_at = NOW(), policy_version = policy_version + 1 WHERE identifier = $2",
      [newAudience, oldAudience]
    )
    if (moved.rowCount !== 1) throw new Error("Resource update failed")
  }
  await connection.query("UPDATE oauth_client SET redirect_uris = $1::text[] WHERE client_id = $2", [callbacks, clientId])
  const checked = await connection.query("SELECT redirect_uris, to_jsonb(c) - 'redirect_uris' AS unchanged FROM oauth_client c WHERE client_id = $1", [clientId])
  const binding = await connection.query("SELECT count(*)::int AS count FROM oauth_client_resource WHERE client_id = $1 AND resource_id = $2", [clientId, newAudience])
  const obsolete = await connection.query("SELECT count(*)::int AS count FROM oauth_resource WHERE identifier = $1", [oldAudience])
  if (JSON.stringify(record.unchanged) !== JSON.stringify(checked.rows[0].unchanged) ||
      JSON.stringify(callbacks) !== JSON.stringify(checked.rows[0].redirect_uris) ||
      binding.rows[0].count !== 1 || obsolete.rows[0].count !== 0)
    throw new Error("Registration verification failed")
  await connection.query("COMMIT")
  console.log(JSON.stringify({ clientId, callback: "/auth/callback/gorth", audience: newAudience, otherClientFieldsPreserved: true, resourcePolicyPreserved: true }))
} catch {
  if (connection) await connection.query("ROLLBACK")
  console.error("Video OAuth migration failed; transaction rolled back. No credentials logged.")
  process.exitCode = 1
} finally {
  connection?.release()
  await pool.end()
}
