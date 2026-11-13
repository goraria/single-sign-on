import { beforeAll, afterAll, expect, it, vi } from "vitest"
import nextEnv from "@next/env"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins/organization"
import type { commerceTeamAccess } from "@/lib/auth/server/commerce-access"
vi.mock("server-only", () => ({}))
let db: typeof import("@/database"),
  auth: ReturnType<typeof createFixture>,
  ownerHeaders: Headers,
  inviteeHeaders: Headers,
  ownerId: string,
  inviteeId: string,
  orgId: string,
  teamA: string,
  teamB: string,
  inviteId: string
const fixture = crypto.randomUUID(),
  emails = [
    fixture + "-owner@fixture.invalid",
    fixture + "-invitee@fixture.invalid",
  ],
  eventId = crypto.randomUUID()
function createFixture(
  database: typeof import("@/database").database,
  schema: typeof import("@/database/schema").betterAuthSchema,
  extension: ReturnType<typeof commerceTeamAccess>,
) {
  return betterAuth({
    baseURL: "https://native-org.fixture.invalid",
    basePath: "/auth",
    secret: "native-cloud-fixture-secret-only-not-a-real-secret-2026",
    database: drizzleAdapter(database, { provider: "pg", schema }),
    advanced: { database: { generateId: false } },
    emailAndPassword: { enabled: true },
    plugins: [organization({ teams: { enabled: true } }), extension],
    logger: { disabled: true },
  })
}
function headers(r: Response) {
  return new Headers({
    Cookie: r.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
    Origin: "https://native-org.fixture.invalid",
  })
}
beforeAll(async () => {
  nextEnv.loadEnvConfig(process.cwd())
  db = await import("@/database")
  const { commerceTeamAccess } =
    await import("@/lib/auth/server/commerce-access")
  const { betterAuthSchema } = await import("@/database/schema")
  auth = createFixture(db.database, betterAuthSchema, commerceTeamAccess())
  const people = []
  for (const email of emails) {
    const r = await auth.api.signUpEmail({
      asResponse: true,
      body: {
        email,
        name: "Native org fixture",
        password: "Fixture-only-password-123",
      },
    })
    expect(r.ok).toBe(true)
    const p = await r.json()
    people.push({ id: p.user.id, headers: headers(r) })
  }
  ownerId = people[0]!.id
  ownerHeaders = people[0]!.headers
  inviteeId = people[1]!.id
  inviteeHeaders = people[1]!.headers
  await db.pool.query(
    'UPDATE "user" SET email_verified=true WHERE id=ANY($1::uuid[])',
    [[ownerId, inviteeId]],
  )
})
afterAll(async () => {
  if (!db) return
  try {
    await db.pool.query("DELETE FROM event_log WHERE id=$1", [eventId])
    if (orgId)
      await db.pool.query("DELETE FROM organization WHERE id=$1", [orgId])
    await db.pool.query('DELETE FROM "user" WHERE email=ANY($1)', [emails])
  } finally {
    await db.pool.end()
  }
})
it("native Organization APIs create teams in the final two tables", async () => {
  const org = await auth.api.createOrganization({
    headers: ownerHeaders,
    body: { name: "Native org fixture", slug: "fixture-" + fixture },
  })
  orgId = org!.id
  teamA = (
    await auth.api.createTeam({
      headers: ownerHeaders,
      body: { name: "Branch A", organizationId: orgId },
    })
  ).id
  teamB = (
    await auth.api.createTeam({
      headers: ownerHeaders,
      body: { name: "Branch B", organizationId: orgId },
    })
  ).id
  expect(
    (
      await db.pool.query("SELECT id FROM team WHERE id=ANY($1::uuid[])", [
        [teamA, teamB],
      ])
    ).rowCount,
  ).toBe(2)
  expect(
    (
      await db.pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN('auth_team','auth_team_member','teamMember','authentication_event')",
      )
    ).rows,
  ).toEqual([])
})
it("native invitation persists multiple teams as text", async () => {
  const inv = await auth.api.createInvitation({
    headers: ownerHeaders,
    body: {
      organizationId: orgId,
      email: emails[1]!,
      role: "member",
      teamId: [teamA, teamB],
    },
  })
  inviteId = inv.id
  expect(
    (
      await db.pool.query("SELECT team_id FROM invitation WHERE id=$1", [
        inviteId,
      ])
    ).rows[0].team_id
      .split(",")
      .sort(),
  ).toEqual([teamA, teamB].sort())
})
it("native acceptance creates both memberships with the default member role", async () => {
  await auth.api.acceptInvitation({
    headers: inviteeHeaders,
    body: { invitationId: inviteId },
  })
  const r = await db.pool.query(
    'SELECT team_id,role,membership_key FROM team_member WHERE user_id=$1 AND team_id=ANY($2::uuid[])',
    [inviteeId, [teamA, teamB]],
  )
  expect(r.rows).toHaveLength(2)
  expect(
    r.rows.every(
      (r: { role: string; membership_key: string | null }) =>
        r.role === "member" && r.membership_key,
    ),
  ).toBe(true)
  for (const t of [teamA, teamB])
    expect(
      (await db.pool.query("SELECT member_count FROM team WHERE id=$1", [t]))
        .rows[0].member_count,
    ).toBeGreaterThan(0)
})
it("native active organization/team uses the existing SSO session", async () => {
  await auth.api.setActiveOrganization({
    headers: inviteeHeaders,
    body: { organizationId: orgId },
  })
  await auth.api.setActiveTeam({
    headers: inviteeHeaders,
    body: { teamId: teamB },
  })
  const s = await auth.api.getSession({
    headers: inviteeHeaders,
    query: { disableCookieCache: true },
  })
  expect(s?.session).toMatchObject({
    activeOrganizationId: orgId,
    activeTeamId: teamB,
  })
})
it("event_log retains the existing event fields and user foreign key", async () => {
  await db.pool.query(
    "INSERT INTO event_log(id,user_id,type,success) VALUES($1,$2,'sign_in',true)",
    [eventId, ownerId],
  )
  expect(
    (
      await db.pool.query(
        "SELECT user_id,type,success FROM event_log WHERE id=$1",
        [eventId],
      )
    ).rows[0],
  ).toMatchObject({ user_id: ownerId, type: "sign_in", success: true })
  await expect(
    db.pool.query("INSERT INTO event_log(user_id,type) VALUES($1,'sign_in')", [
      crypto.randomUUID(),
    ]),
  ).rejects.toMatchObject({ code: "23503" })
})
