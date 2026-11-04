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
const changed = [
  "team",
  "team_member",
  "auth_team",
  "auth_team_member",
  "teamMember",
  "invitation",
  "authentication_event",
  "event_log",
]
function identifier(name) {
  if (!/^[A-Za-z_][A-Za-z_0-9]*$/.test(name))
    throw new Error("unexpected_identifier")
  return '"' + name + '"'
}
async function fingerprint(name) {
  return (
    await client.query(
      `SELECT count(*)::int count,md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) fingerprint FROM public.${identifier(name)} t`,
    )
  ).rows[0]
}
async function protectedSnapshot() {
  const columns = (
    await client.query(
      "SELECT table_schema,table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema NOT IN('pg_catalog','information_schema') AND NOT(table_schema='public' AND table_name=ANY($1)) ORDER BY table_schema,table_name,ordinal_position",
      [changed],
    )
  ).rows
  const tables = (
    await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND NOT(table_name=ANY($1)) ORDER BY table_name",
      [changed],
    )
  ).rows
  const data = {}
  for (const { table_name } of tables)
    data[table_name] = await fingerprint(table_name)
  return { columns, data }
}
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ")
  await client.query("SET LOCAL lock_timeout='5s'")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('sso-native-organization'))",
  )
  const before = await protectedSnapshot()
  const old = (
    await client.query(
      "SELECT to_regclass('public.auth_team') IS NOT NULL AS old",
    )
  ).rows[0].old
  const names = old
    ? ["auth_team", "auth_team_member", "authentication_event", "invitation"]
    : ["team", "teamMember", "event_log", "invitation"]
  const preserved = []
  for (const name of names) preserved.push(await fingerprint(name))
  await client.query(
    await readFile(
      new URL("migrations/20261104-native-organization.sql", import.meta.url),
      "utf8",
    ),
  )
  const finalNames = ["team", "teamMember", "event_log", "invitation"]
  const after = []
  for (const name of finalNames) after.push(await fingerprint(name))
  if (JSON.stringify(preserved) !== JSON.stringify(after))
    throw new Error("target_data_changed")
  if (JSON.stringify(before) !== JSON.stringify(await protectedSnapshot()))
    throw new Error("unrelated_schema_or_data_changed")
  const applied = process.argv.includes("--apply")
  await client.query(applied ? "COMMIT" : "ROLLBACK")
  console.log(
    JSON.stringify({
      migration: "native-organization",
      committed: applied,
      preservedRows: Object.fromEntries(
        finalNames.map((name, i) => [name, after[i].count]),
      ),
      unrelatedSchemaAndDataPreserved: true,
    }),
  )
} catch (error) {
  await client.query("ROLLBACK")
  console.error("SSO native organization migration rolled back", {
    reason: /^[a-z_]+$/.test(error?.message ?? "") ? error.message : undefined,
    code: /^[A-Z0-9_]+$/.test(error?.code ?? "")
      ? error.code
      : "migration_error",
  })
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
