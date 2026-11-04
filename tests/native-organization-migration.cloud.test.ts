import { beforeAll, afterAll, expect, it } from "vitest"
import nextEnv from "@next/env"
import pg from "@gorth-io/structure/cores/pg"
import { readFile } from "node:fs/promises"
const { Pool } = pg
let pool: InstanceType<typeof Pool>, source: string, old: boolean
beforeAll(async () => {
  nextEnv.loadEnvConfig(process.cwd())
  const { databaseUrl } = await import("@/utils/environment")
  pool = new Pool({ connectionString: databaseUrl, max: 1 })
  source = await readFile(
    new URL(
      "../database/migrations/20261104-native-organization.sql",
      import.meta.url,
    ),
    "utf8",
  )
  old = (
    await pool.query(
      "SELECT to_regclass('public.auth_team') IS NOT NULL AS old",
    )
  ).rows[0].old
})
afterAll(async () => {
  await pool?.end()
})
it("preserves populated native IDs, memberships, invitations and event data through cutover and retry", async (ctx) => {
  if (!old) return ctx.skip()
  const c = await pool.connect(),
    u = crypto.randomUUID(),
    org = crypto.randomUUID(),
    t = crypto.randomUUID(),
    membership = crypto.randomUUID(),
    inv = crypto.randomUUID(),
    event = crypto.randomUUID()
  try {
    await c.query("BEGIN")
    await c.query('INSERT INTO "user"(id,name,email) VALUES($1,$2,$3)', [
      u,
      "Migration fixture",
      u + "@fixture.invalid",
    ])
    await c.query(
      "INSERT INTO organization(id,name,slug) VALUES($1::uuid,$2,$1::text)",
      [org, "Migration fixture"],
    )
    await c.query(
      "INSERT INTO auth_team(id,name,organization_id,member_count) VALUES($1,$2,$3,1)",
      [t, "Preserved team", org],
    )
    await c.query(
      "INSERT INTO auth_team_member(id,team_id,user_id,role) VALUES($1,$2,$3,'manager')",
      [membership, t, u],
    )
    await c.query(
      "INSERT INTO invitation(id,organization_id,email,team_id,inviter_id,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')",
      [inv, org, u + "@fixture.invalid", t, u],
    )
    await c.query(
      "INSERT INTO authentication_event(id,user_id,type) VALUES($1,$2,'sign_in')",
      [event, u],
    )
    await c.query(source)
    await c.query(source)
    expect(
      (
        await c.query('SELECT id,role FROM "teamMember" WHERE id=$1', [
          membership,
        ])
      ).rows[0],
    ).toMatchObject({ id: membership, role: "manager" })
    expect(
      (await c.query("SELECT team_id FROM invitation WHERE id=$1", [inv]))
        .rows[0].team_id,
    ).toBe(t)
    expect(
      (await c.query("SELECT id FROM event_log WHERE id=$1", [event])).rows[0]
        .id,
    ).toBe(event)
    expect(
      (await c.query("SELECT member_count FROM team WHERE id=$1", [t])).rows[0]
        .member_count,
    ).toBe(1)
  } finally {
    await c.query("ROLLBACK")
    c.release()
  }
})
it("refuses to discard any legacy team data", async (ctx) => {
  if (!old) return ctx.skip()
  const c = await pool.connect(),
    org = crypto.randomUUID()
  try {
    await c.query("BEGIN")
    await c.query(
      "INSERT INTO organization(id,name,slug) VALUES($1::uuid,'Legacy guard',$1::text)",
      [org],
    )
    await c.query(
      "INSERT INTO team(id,organization_id,name,slug) VALUES($1::uuid,$2,'Legacy fixture',$1::text)",
      [crypto.randomUUID(), org],
    )
    await expect(c.query(source)).rejects.toMatchObject({
      message: "nonempty_legacy_team_requires_explicit_data_migration",
    })
  } finally {
    await c.query("ROLLBACK")
    c.release()
  }
})
it("rolls back rather than cascading an unexpected dependency", async (ctx) => {
  if (!old) return ctx.skip()
  const c = await pool.connect(),
    name = "migration_dependency_" + crypto.randomUUID().replaceAll("-", "")
  try {
    await c.query("BEGIN")
    await c.query(
      'CREATE TABLE public."' +
        name +
        '"(team_id uuid REFERENCES public.team(id))',
    )
    await expect(c.query(source)).rejects.toMatchObject({ code: "2BP01" })
  } finally {
    await c.query("ROLLBACK")
    c.release()
  }
})
