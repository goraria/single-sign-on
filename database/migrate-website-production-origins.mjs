import nextEnv from "@next/env"
import { Pool } from "@gorth-io/structure/cores/pg"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const targets = [
  { id: "gorth-browser-website", origin: "https://gorth-browser.vercel.app" },
  { id: "gorth-launcher-website", origin: "https://gorth-launcher.vercel.app" },
]
const pool = new Pool({ connectionString: databaseUrl, max: 1 })
let client
try {
  client = await pool.connect()
  await client.query("BEGIN")
  const records = await client.query(
    "SELECT client_id, redirect_uris, post_logout_redirect_uris, public, require_pkce FROM oauth_client WHERE client_id = ANY($1::text[]) FOR UPDATE",
    [targets.map((target) => target.id)]
  )
  if (records.rows.length !== targets.length)
    throw new Error("Expected exactly two registered website clients")
  for (const target of targets) {
    const record = records.rows.find((row) => row.client_id === target.id)
    if (!record?.public || !record.require_pkce || !Array.isArray(record.redirect_uris))
      throw new Error("Website client configuration requires review")
    const redirects = [...new Set([...record.redirect_uris, target.origin + "/auth/callback/gorth"])]
    const logoutRedirects = [...new Set([...(record.post_logout_redirect_uris ?? []), target.origin])]
    await client.query(
      "UPDATE oauth_client SET redirect_uris = $1::text[], post_logout_redirect_uris = $2::text[], updated_at = NOW() WHERE client_id = $3",
      [redirects, logoutRedirects, target.id]
    )
  }
  const verified = await client.query(
    "SELECT client_id, redirect_uris, post_logout_redirect_uris FROM oauth_client WHERE client_id = ANY($1::text[]) ORDER BY client_id",
    [targets.map((target) => target.id)]
  )
  for (const target of targets) {
    const row = verified.rows.find((record) => record.client_id === target.id)
    if (!row?.redirect_uris.includes(target.origin + "/auth/callback/gorth") || !row.post_logout_redirect_uris?.includes(target.origin))
      throw new Error("Production redirect verification failed")
  }
  await client.query("COMMIT")
  // Print only public registration fields, never client secrets or connection data.
  console.info(JSON.stringify(verified.rows))
} catch {
  if (client) await client.query("ROLLBACK").catch(() => {})
  console.error("Website production URL migration failed; no credentials were logged.")
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
