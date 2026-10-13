import nextEnv from "@next/env"
import { Pool } from "@gorth/structure/cores/pg"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const client = await pool.connect()
const clientId = "gorth-interactive-messaging-portal"
try {
  await client.query("BEGIN")
  const records = await client.query(
    "SELECT redirect_uris, to_jsonb(c) - 'redirect_uris' AS unchanged FROM oauth_client c WHERE client_id = $1 FOR UPDATE",
    [clientId]
  )
  if (records.rows.length !== 1) throw new Error("Expected one Chat OAuth client")
  const record = records.rows[0]
  if (!Array.isArray(record.redirect_uris) || !record.redirect_uris.length)
    throw new Error("Invalid callback registration")
  const updated = record.redirect_uris.map((value) => {
    const url = new URL(value)
    if (url.pathname === "/auth/exchange") url.pathname = "/auth/callback/gorth"
    else if (url.pathname !== "/auth/callback/gorth")
      throw new Error("Unexpected callback; rollback")
    return url.href
  })
  await client.query(
    "UPDATE oauth_client SET redirect_uris = $1::text[] WHERE client_id = $2",
    [updated, clientId]
  )
  const verified = await client.query(
    "SELECT redirect_uris, to_jsonb(c) - 'redirect_uris' AS unchanged FROM oauth_client c WHERE client_id = $1",
    [clientId]
  )
  if (
    verified.rows.length !== 1 ||
    JSON.stringify(verified.rows[0].unchanged) !== JSON.stringify(record.unchanged) ||
    JSON.stringify(verified.rows[0].redirect_uris) !== JSON.stringify(updated)
  ) throw new Error("Unexpected OAuth registration change; rollback")
  await client.query("COMMIT")
  console.log(JSON.stringify({ clientId, callbackPathsUpdated: updated.length, otherFieldsPreserved: true }))
} catch {
  await client.query("ROLLBACK")
  console.error("Chat callback migration failed; transaction rolled back. No credentials logged.")
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
