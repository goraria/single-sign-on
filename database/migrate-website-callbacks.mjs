import nextEnv from "@next/env"
import { Pool } from "@gorth/structure/cores/pg"

nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const client = await pool.connect()
try {
  await client.query("BEGIN")
  const records = await client.query(
    "SELECT client_id, redirect_uris FROM oauth_client WHERE client_id = ANY($1::text[]) FOR UPDATE",
    [["gorth-browser-website", "gorth-launcher-website"]]
  )
  if (records.rows.length !== 2)
    throw new Error("Expected exactly two registered website clients")
  for (const record of records.rows) {
    const previous = record.redirect_uris
    if (!Array.isArray(previous) || !previous.length)
      throw new Error("Invalid registered callback list")
    const updated = previous.map((value) => {
      const url = new URL(value)
      if (url.pathname === "/auth/exchange")
        url.pathname = "/auth/callback/gorth"
      else if (url.pathname !== "/auth/callback/gorth")
        throw new Error("Unexpected callback; no changes applied")
      return url.href
    })
    await client.query(
      "UPDATE oauth_client SET redirect_uris = $1::text[] WHERE client_id = $2",
      [updated, record.client_id]
    )
  }
  await client.query("COMMIT")
  console.log(
    "Updated only the callback paths of the two registered website clients."
  )
} catch (error) {
  await client.query("ROLLBACK")
  console.error(
    error instanceof Error ? error.message : "Callback migration failed"
  )
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
