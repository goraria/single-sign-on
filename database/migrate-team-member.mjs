import nextEnv from "@next/env"
import pg from "@gorth-io/structure/cores/pg"
import { readFile } from "node:fs/promises"
nextEnv.loadEnvConfig(process.cwd())
const { databaseUrl } = await import("../utils/environment.ts")
if (!databaseUrl) throw new Error("DATABASE_URL is required")
const pool = new pg.Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 15000 })
const connection = await pool.connect()
try {
  await connection.query("BEGIN")
  await connection.query("SET LOCAL lock_timeout='5s'")
  await connection.query("SELECT pg_advisory_xact_lock(hashtext('sso-team-member-snake-case'))")
  const names = (await connection.query("SELECT to_regclass('public.\"teamMember\"') IS NOT NULL old, to_regclass('public.team_member') IS NOT NULL current")).rows[0]
  if (names.old && names.current) throw new Error("both_team_member_tables_require_review")
  if (!names.old && !names.current) throw new Error("team_member_table_missing")
  const oldName = names.old ? 'public."teamMember"' : 'public.team_member'
  await connection.query(`LOCK TABLE ${oldName} IN ACCESS EXCLUSIVE MODE`)
  const fingerprint = async name => (await connection.query(`SELECT count(*)::int AS count, md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) AS digest FROM ${name} t`)).rows[0]
  const before = await fingerprint(oldName)
  await connection.query(await readFile(new URL("migrations/20261113-team-member-snake-case.sql", import.meta.url), "utf8"))
  const after = await fingerprint("public.team_member")
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("team_member_data_changed")
  const applied = process.argv.includes("--apply")
  await connection.query(applied ? "COMMIT" : "ROLLBACK")
  console.log(JSON.stringify({ migration: "team-member-snake-case", applied, renamed: names.old, preservedRows: after.count }))
} catch (error) {
  await connection.query("ROLLBACK")
  console.error(JSON.stringify({ error: /^[a-z_]+$/.test(error?.message ?? "") ? error.message : "team_member_migration_failed" }))
  process.exitCode = 1
} finally {
  connection.release()
  await pool.end()
}
