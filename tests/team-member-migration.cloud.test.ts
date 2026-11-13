import { expect, it } from "vitest"
import nextEnv from "@next/env"
import pg from "@gorth-io/structure/cores/pg"
import { readFile } from "node:fs/promises"

it("keeps the rename idempotent with the same rows and physical table identity", async () => {
  nextEnv.loadEnvConfig(process.cwd())
  const { databaseUrl } = await import("@/utils/environment")
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 })
  const connection = await pool.connect()
  try {
    await connection.query("BEGIN")
    await connection.query("SET LOCAL lock_timeout='5s'")
    await connection.query("SELECT pg_advisory_xact_lock(hashtext('sso-team-member-snake-case'))")
    await connection.query("LOCK TABLE public.team_member IN ACCESS EXCLUSIVE MODE")
    const fingerprint = async () => (await connection.query("SELECT count(*)::int count, md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY id),'')) digest FROM public.team_member t")).rows[0]
    const before = await fingerprint()
    const source = await readFile(new URL("../database/migrations/20261113-team-member-snake-case.sql", import.meta.url), "utf8")
    await connection.query(source)
    await connection.query(source)
    expect(await fingerprint()).toEqual(before)
    const names = (await connection.query("SELECT to_regclass('public.\"teamMember\"') IS NULL old_removed, to_regclass('public.team_member') IS NOT NULL current_exists, to_regclass('public.team_member_team_id_idx') IS NOT NULL team_index, to_regclass('public.team_member_user_id_idx') IS NOT NULL user_index")).rows[0]
    expect(names).toEqual({ old_removed: true, current_exists: true, team_index: true, user_index: true })
  } finally {
    await connection.query("ROLLBACK")
    connection.release()
    await pool.end()
  }
})
