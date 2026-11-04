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
const commerce = "http://localhost:5059",
  restaurant = "gorth-restaurant-chain-management",
  marketplace = "gorth-online-marketplace-solution"
const scopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "restaurant:read",
  "restaurant:write",
]
try {
  await client.query("BEGIN")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('sso:commerce-registry'))"
  )
  const previous = (
    await client.query(
      "SELECT revision,scopes FROM oauth_scope_revision ORDER BY revision DESC LIMIT 1 FOR UPDATE"
    )
  ).rows[0]
  if (!previous)
    throw Object.assign(Error(), { code: "scope_revision_missing" })
  const additions = ["restaurant:read", "restaurant:write"]
  let revision = previous.revision
  if (additions.some((s) => !previous.scopes.includes(s))) {
    revision++
    await client.query(
      "INSERT INTO oauth_scope_revision(revision,scopes) VALUES($1,$2)",
      [revision, [...new Set([...previous.scopes, ...additions])].sort()]
    )
  }
  const existing = (
    await client.query(
      "SELECT client_id FROM oauth_client WHERE client_id=$1 AND NOT disabled",
      [marketplace]
    )
  ).rows
  if (!existing.length)
    throw Object.assign(Error(), { code: "marketplace_client_missing" })
  // No secret is created: the existing app uses public Generic OAuth with PKCE.
  await client.query(
    `INSERT INTO oauth_client(client_id,name,scopes,redirect_uris,post_logout_redirect_uris,token_endpoint_auth_method,grant_types,response_types,application_type,public,require_pkce,enable_end_session,backchannel_logout_uri,backchannel_logout_session_required,metadata)
 VALUES($1,'Gorth Restaurant',$2,$3,$4,'none',ARRAY['authorization_code','refresh_token']::oauth_grant_type_enum[],ARRAY['code']::oauth_response_type_enum[],'web',true,true,true,$5,true,'{"application":"restaurant"}'::jsonb)
 ON CONFLICT(client_id) DO NOTHING`,
    [
      restaurant,
      scopes,
      ["http://localhost:3036/auth/callback/gorth"],
      ["http://localhost:3036"],
      "http://localhost:3036/auth/backchannel-logout",
    ]
  )
  const registration = (
    await client.query(
      "SELECT redirect_uris,scopes,public,require_pkce,token_endpoint_auth_method FROM oauth_client WHERE client_id=$1",
      [restaurant]
    )
  ).rows[0]
  if (
    !registration?.public ||
    !registration.require_pkce ||
    registration.token_endpoint_auth_method !== "none" ||
    !registration.redirect_uris.includes(
      "http://localhost:3036/auth/callback/gorth"
    ) ||
    !scopes.every((s) => registration.scopes?.includes(s))
  )
    throw Object.assign(Error(), { code: "restaurant_client_requires_review" })
  await client.query(
    `INSERT INTO oauth_resource(identifier,name,access_token_ttl,allowed_scopes,metadata) VALUES($1,'Gorth Commerce Business API',600,$2,'{"application":"commerce"}'::jsonb)
 ON CONFLICT(identifier) DO UPDATE SET allowed_scopes=(SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(coalesce(oauth_resource.allowed_scopes,ARRAY[]::text[])||EXCLUDED.allowed_scopes) s),metadata=coalesce(oauth_resource.metadata,'{}'::jsonb)||EXCLUDED.metadata,updated_at=now(),policy_version=oauth_resource.policy_version+1`,
    [commerce, [...scopes, "marketplace:read", "marketplace:write"]]
  )
  await client.query(
    `INSERT INTO oauth_resource(identifier,name,access_token_ttl,allowed_scopes,metadata) VALUES('http://localhost:3036','Gorth Restaurant API',600,$1,'{"application":"restaurant"}'::jsonb) ON CONFLICT(identifier) DO NOTHING`,
    [scopes]
  )
  const services = Array.from(
    { length: 8 },
    (_, i) => "http://localhost:" + (5052 + i)
  )
  for (const resource of services) {
    const result = await client.query(
      "UPDATE oauth_resource SET allowed_scopes=CASE WHEN allowed_scopes IS NULL THEN NULL ELSE (SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(allowed_scopes||$2::text[]) s) END,updated_at=now() WHERE identifier=$1 AND NOT disabled RETURNING identifier",
      [resource, additions]
    )
    if (!result.rows.length)
      throw Object.assign(Error(), { code: "service_resource_missing" })
  }
  for (const resource of ["http://localhost:3036", ...services])
    await client.query(
      "INSERT INTO oauth_client_resource(client_id,resource_id) VALUES($1,$2) ON CONFLICT(client_id,resource_id) DO NOTHING",
      [restaurant, resource]
    )
  for (const resource of [commerce, "http://localhost:5058"])
    await client.query(
      "INSERT INTO oauth_client_resource(client_id,resource_id) VALUES($1,$2) ON CONFLICT(client_id,resource_id) DO NOTHING",
      [marketplace, resource]
    )
  const marketplaceMissing = (
    await client.query(
      "SELECT x.resource FROM unnest($1::text[]) x(resource) WHERE NOT EXISTS(SELECT 1 FROM oauth_client_resource cr WHERE cr.client_id=$2 AND cr.resource_id=x.resource)",
      [services, marketplace]
    )
  ).rows.map((r) => r.resource)
  await client.query("COMMIT")
  console.log(
    JSON.stringify({
      scopeRevision: revision,
      restaurantClient: restaurant,
      commerceResource: commerce,
      restaurantResourceBindings: 9,
      marketplaceMissing,
    })
  )
} catch (error) {
  await client.query("ROLLBACK")
  console.error("Registry transaction rolled back", {
    code: error.code ?? "registry_failed",
  })
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
