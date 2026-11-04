import nextEnv from "@next/env"
import pg from "@gorth-io/structure/cores/pg"
nextEnv.loadEnvConfig(process.cwd(), true)
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw Error("DATABASE_URL required")
const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
})
const client = await pool.connect()
const clientId = "gorth-media-storage"
const resources = [
  {
    identifier: "http://localhost:3035/internal/storage/credential",
    scope: "storage:marketplace:credential",
    name: "Marketplace storage credentials",
  },
  {
    identifier: "http://localhost:3036/internal/storage/credential",
    scope: "storage:restaurant:credential",
    name: "Restaurant storage credentials",
  },
]
try {
  await client.query("BEGIN")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('sso:media-storage-registry'))"
  )
  const matches = (
    await client.query(
      "SELECT id,client_id,disabled,public,token_endpoint_auth_method,client_credentials_scopes FROM oauth_client WHERE client_id=$1 OR (reference_id='sso-administration' AND metadata->>'storageCredentialReader'='commerce-applications') FOR UPDATE",
      [clientId]
    )
  ).rows
  if (matches.length > 1)
    throw Object.assign(Error(), {
      code: "ambiguous_media_client_requires_review",
    })
  const old = (
    await client.query(
      "SELECT revision,scopes FROM oauth_scope_revision ORDER BY revision DESC LIMIT 1 FOR UPDATE"
    )
  ).rows[0]
  if (!old) throw Object.assign(Error(), { code: "scope_revision_missing" })
  const scopes = resources.map((r) => r.scope)
  let revision = old.revision
  if (scopes.some((s) => !old.scopes.includes(s))) {
    revision++
    await client.query(
      "INSERT INTO oauth_scope_revision(revision,scopes) VALUES($1,$2)",
      [revision, [...new Set([...old.scopes, ...scopes])].sort()]
    )
  }
  // No secret is generated, printed or stored by this script. The native SSO
  // admin form initializes and rotates it, then the operator enables the client.
  if (!matches.length)
    await client.query(
      `INSERT INTO oauth_client(client_id,name,disabled,public,require_pkce,redirect_uris,post_logout_redirect_uris,token_endpoint_auth_method,grant_types,response_types,scopes,client_credentials_scopes,reference_id,metadata)
 VALUES($1,'Media storage credential reader',true,false,false,ARRAY[]::text[],ARRAY[]::text[],'client_secret_post',ARRAY['client_credentials']::oauth_grant_type_enum[],ARRAY[]::oauth_response_type_enum[],$2,$2,'sso-administration','{"application":"media","environment":"local"}'::jsonb) ON CONFLICT(client_id) DO NOTHING`,
      [clientId, scopes]
    )
  const registered =
    matches[0] ??
    (
      await client.query(
        "SELECT id,client_id,disabled,public,token_endpoint_auth_method,client_credentials_scopes FROM oauth_client WHERE client_id=$1",
        [clientId]
      )
    ).rows[0]
  if (
    !registered ||
    registered.public ||
    registered.token_endpoint_auth_method !== "client_secret_post" ||
    !scopes.every((s) => registered.client_credentials_scopes.includes(s))
  )
    throw Object.assign(Error(), {
      code: "existing_media_client_requires_review",
    })
  for (const r of resources) {
    await client.query(
      `INSERT INTO oauth_resource(identifier,name,access_token_ttl,allowed_scopes,metadata) VALUES($1,$2,120,$3,'{"application":"storage"}'::jsonb) ON CONFLICT(identifier) DO UPDATE SET access_token_ttl=120,allowed_scopes=EXCLUDED.allowed_scopes,updated_at=now()`,
      [r.identifier, r.name, [r.scope]]
    )
    await client.query(
      "INSERT INTO oauth_client_resource(client_id,resource_id) VALUES($1,$2) ON CONFLICT(client_id,resource_id) DO NOTHING",
      [registered.client_id, r.identifier]
    )
  }
  await client.query("COMMIT")
  console.log(
    JSON.stringify({
      scopeRevision: revision,
      clientId: registered.client_id,
      disabled: registered.disabled,
      editPath: "/admin/oauth/client/edit/" + registered.id,
      secretGenerated: false,
      resources: resources.map((r) => r.identifier),
    })
  )
} catch (error) {
  await client.query("ROLLBACK")
  console.error("Media registry transaction rolled back", {
    code: error.code ?? "registry_failed",
  })
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
