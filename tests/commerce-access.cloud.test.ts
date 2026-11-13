import { beforeAll, afterAll, expect, it, vi } from "vitest"
import nextEnv from "@next/env"
vi.mock("server-only", () => ({}))
let db: typeof import("@/database"),
  services: typeof import("@/services/commerce-access")
const ids = Array.from({ length: 5 }, () => crypto.randomUUID()),
  [owner, manager, staff, orphan, outsider] = ids as [
    string,
    string,
    string,
    string,
    string,
  ]
const org = crypto.randomUUID(),
  otherOrg = crypto.randomUUID(),
  teamA = crypto.randomUUID(),
  teamB = crypto.randomUUID(),
  resource = "https://commerce-cloud.fixture.invalid"
beforeAll(async () => {
  nextEnv.loadEnvConfig(process.cwd())
  db = await import("@/database")
  services = await import("@/services/commerce-access")
  for (const id of ids)
    await db.pool.query('INSERT INTO "user"(id,email,name) VALUES($1,$2,$3)', [
      id,
      id + "@fixture.invalid",
      "Commerce authority fixture",
    ])
  for (const id of [org, otherOrg])
    await db.pool.query(
      "INSERT INTO organization(id,name,slug) VALUES($1,$2,$3)",
      [id, "Commerce fixture", id],
    )
  for (const id of ids)
    await db.pool.query(
      "INSERT INTO member(organization_id,user_id,role) VALUES($1,$2,$3)",
      [id === outsider ? otherOrg : org, id, id === owner ? "owner" : "member"],
    )
  for (const id of [teamA, teamB])
    await db.pool.query(
      "INSERT INTO team(id,organization_id,name) VALUES($1,$2,$3)",
      [id, org, "Commerce branch fixture"],
    )
  await db.pool.query(
    `INSERT INTO team_member(team_id,user_id,role) VALUES($1,$2,'manager'),($3,$2,'staff'),($1,$4,'member')`,
    [teamA, manager, teamB, staff],
  )
})
afterAll(async () => {
  if (!db) return
  try {
    for (const id of ids)
      await db.pool.query(
        "DELETE FROM audit_log WHERE actor_user_id=$1 AND action='commerce.team-role.update'",
        [id],
      )
    for (const id of [org, otherOrg])
      await db.pool.query("DELETE FROM organization WHERE id=$1", [id])
    for (const id of ids)
      await db.pool.query('DELETE FROM "user" WHERE id=$1 AND email=$2', [
        id,
        id + "@fixture.invalid",
      ])
  } finally {
    await db.pool.end()
  }
})
it("owner needs no team row and gets access to all real teams", async () => {
  const r = await services.getCommerceAuthorization(owner, resource)
  expect(r.authorization_details).toHaveLength(3)
  expect(r.authorization_details).toContainEqual({
    type: "commerce",
    locations: [resource],
    organization_id: org,
    actions: ["*"],
  })
  expect(
    (
      await db.pool.query('SELECT 1 FROM team_member WHERE user_id=$1', [
        owner,
      ])
    ).rowCount,
  ).toBe(0)
})
it("one user has independent roles in two branches", async () => {
  const r = await services.getCommerceAuthorization(manager, resource)
  expect(r.authorization_details).toHaveLength(2)
  expect(
    r.authorization_details.find((d) => d.team_id === teamA)!.actions,
  ).toContain("manage")
  expect(
    r.authorization_details.find((d) => d.team_id === teamB)!.actions,
  ).not.toContain("manage")
})
it("org membership without branch assignment grants no business authority", async () => {
  expect(
    (await services.getCommerceAuthorization(orphan, resource))
      .authorization_details,
  ).toEqual([])
  expect(
    (await services.getCommerceAuthorization(outsider, resource))
      .authorization_details,
  ).toEqual([])
})
it("manager cannot self-promote or assign another manager", async () => {
  await expect(
    services.updateCommerceTeamRole(manager, {
      teamId: teamA,
      userId: manager,
      role: "manager",
    }),
  ).rejects.toMatchObject({ status: 403 })
  await expect(
    services.updateCommerceTeamRole(manager, {
      teamId: teamA,
      userId: staff,
      role: "manager",
    }),
  ).rejects.toMatchObject({ status: 403 })
})
it("role changes and membership revocation affect the next snapshot", async () => {
  await services.updateCommerceTeamRole(manager, {
    teamId: teamA,
    userId: staff,
    role: "inventory",
  })
  expect(
    (await services.getCommerceAuthorization(staff, resource))
      .authorization_details[0]!.actions,
  ).toContain("inventory:write")
  await db.pool.query(
    `DELETE FROM team_member WHERE user_id=$1 AND team_id=$2`,
    [staff, teamA],
  )
  expect(
    (await services.getCommerceAuthorization(staff, resource))
      .authorization_details,
  ).toEqual([])
  await db.pool.query(
    "DELETE FROM member WHERE user_id=$1 AND organization_id=$2",
    [manager, org],
  )
  expect(
    (await services.getCommerceAuthorization(manager, resource))
      .authorization_details,
  ).toEqual([])
})
it("live ban/status overrides otherwise valid OAuth identity", async () => {
  await db.pool.query('UPDATE "user" SET banned=true WHERE id=$1', [owner])
  await expect(
    services.getCommerceAuthorization(owner, resource),
  ).rejects.toMatchObject({ status: 403 })
  await db.pool.query(
    "UPDATE \"user\" SET banned=false,status='suspended' WHERE id=$1",
    [owner],
  )
  await expect(
    services.getCommerceAuthorization(owner, resource),
  ).rejects.toMatchObject({ status: 403 })
})
