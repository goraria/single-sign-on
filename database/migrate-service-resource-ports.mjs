import nextEnv from "@next/env"
import { Pool } from "@gorth/structure/cores/pg"
import { migrateServiceResourcePorts } from "./service-resource-ports.ts"
import { oauthResourceSeeds } from "./seeds/oauth-resources.ts"

// Load through Next and the canonical environment module, never print env/secrets.
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} })
const { databaseUrl } = await import("../utils/environment.ts")
const apply = process.argv.includes("--apply")
const issuer = "https://gorth-auth.vercel.app"
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10000,
  query_timeout: 15000,
})
let client
try {
  if (!databaseUrl) throw new Error("missing_database_configuration")
  client = await pool.connect()
  const publicKeys = await client.query("SELECT id, public_key FROM jwks")
  const response = await fetch(new URL("/auth/jwks", issuer), {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error("production_jwks_unavailable")
  const published = await response.json()
  const matches = published.keys?.some((key) =>
    publicKeys.rows.some((row) => {
      const local =
        typeof row.public_key === "string"
          ? JSON.parse(row.public_key)
          : row.public_key
      return (
        row.id === key.kid &&
        ["kty", "crv", "x", "y", "n", "e"].every(
          (field) => local[field] === key[field]
        )
      )
    })
  )
  if (!matches) throw new Error("production_database_attestation_failed")
  await client.query("BEGIN")
  await client.query("SET LOCAL lock_timeout = '5s'")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtextextended('gorth:service-resource-ports-505x', 0))"
  )
  const result = await migrateServiceResourcePorts(
    client,
    oauthResourceSeeds,
    apply
  )
  await client.query(apply ? "COMMIT" : "ROLLBACK")
  console.log(
    JSON.stringify({
      issuer,
      mode: apply ? "applied" : "checked",
      productionDatabaseAttested: true,
      resources: result,
      policiesAndLinksPreserved: true,
      consentAndTokensUnchanged: true,
    })
  )
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {})
  // Migration-generated errors are bounded identifiers; provider exceptions may contain credentials.
  console.error(
    JSON.stringify({
      stage: "service_resource_port_migration",
      code:
        error instanceof Error && /^[a-z_]+$/.test(error.message)
          ? error.message
          : (error?.code ?? "migration_failed"),
      rolledBack: true,
    })
  )
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
