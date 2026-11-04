import nextEnv from "@next/env"
import { Pool } from "@gorth-io/structure/cores/pg"
import { readFile } from "node:fs/promises"
nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 15000,
})
const client = await pool.connect()
try {
  await client.query("BEGIN")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('sso-commerce-authorization'))",
  )
  const normalized = (
    await client.query(
      `SELECT to_regclass('public."teamMember"') IS NOT NULL AS present`,
    )
  ).rows[0].present
  if (normalized) {
    const role = await client.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teamMember' AND column_name='role' AND is_nullable='NO' AND column_default IS NOT NULL",
    )
    if (!role.rows.length) throw new Error("canonical_team_role_missing")
    // Historical migration already represented by the normalized schema.
    // Never recreate retired auth_team_member after the table-name cutover.
    await client.query("ROLLBACK")
    console.log(
      "Commerce team role is already present in native teamMember; no changes.",
    )
  } else {
    const snapshot = () =>
      client.query(
        "SELECT table_schema,table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema NOT IN('pg_catalog','information_schema') AND NOT(table_schema='public' AND table_name='auth_team_member') ORDER BY table_schema,table_name,ordinal_position",
      )
    const before = await snapshot()
    await client.query(
      await readFile(
        new URL("migrations/20261104-commerce-team-role.sql", import.meta.url),
        "utf8",
      ),
    )
    if (JSON.stringify(before.rows) !== JSON.stringify((await snapshot()).rows))
      throw new Error("unrelated_schema_changed")
    if (process.argv.includes("--apply")) {
      await client.query("COMMIT")
      console.log(
        "SSO commerce team role migration applied; unrelated schema preserved.",
      )
    } else {
      await client.query("ROLLBACK")
      console.log(
        "SSO commerce team role migration rehearsal passed; rolled back.",
      )
    }
  }
} catch (error) {
  await client.query("ROLLBACK")
  console.error("SSO commerce migration failed", {
    code: /^[A-Z0-9_]+$/.test(error?.code ?? "")
      ? error.code
      : "migration_error",
  })
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
