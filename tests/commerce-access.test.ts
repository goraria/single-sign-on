import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({
  rows: [] as unknown[][],
  execute: vi.fn(),
  verify: vi.fn(),
  registration: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({
  database: {
    execute: state.execute,
    transaction: async (fn: any) => fn({ execute: state.execute }),
  },
}))
vi.mock("@/utils/environment", () => ({ betterAuthUrl: "https://sso.test" }))
import {
  getCommerceAuthorization,
  updateCommerceTeamRole,
  getCommerceRegistration,
} from "@/services/commerce-access"
import { commerceTeamRoleInput } from "@/schemas/commerce-access"
beforeEach(() => {
  state.rows = []
  state.execute
    .mockReset()
    .mockImplementation(async () => ({ rows: state.rows.shift() ?? [] }))
})
it("derives org-wide authority for owner/admin without team membership", async () => {
  state.rows = [
    [{ id: "u" }],
    [
      {
        organization_id: "o",
        org_role: "owner",
        team_id: "t",
        team_role: null,
      },
      {
        organization_id: "o",
        org_role: "owner",
        team_id: "t2",
        team_role: null,
      },
    ],
  ]
  expect(
    await getCommerceAuthorization("u", "https://commerce.test"),
  ).toMatchObject({
    subject: "u",
    authorization_details: [
      { organization_id: "o", actions: ["*"] },
      { organization_id: "o", team_id: "t", actions: ["manage"] },
      { organization_id: "o", team_id: "t2", actions: ["manage"] },
    ],
  })
})
it("limits a member to each live team role, excludes orphan and unknown roles", async () => {
  state.rows = [
    [{ id: "u" }],
    [
      {
        organization_id: "o",
        org_role: "member",
        team_id: "a",
        team_role: "manager",
      },
      {
        organization_id: "o",
        org_role: "member",
        team_id: "b",
        team_role: "staff",
      },
      {
        organization_id: "o",
        org_role: "member",
        team_id: "c",
        team_role: null,
      },
      {
        organization_id: "o",
        org_role: "member",
        team_id: "d",
        team_role: "invalid",
      },
    ],
  ]
  const r = await getCommerceAuthorization("u", "https://commerce.test")
  expect(r.authorization_details).toHaveLength(2)
  expect(r.authorization_details.every((d) => d.team_id)).toBe(true)
  expect(r.authorization_details[0]!.actions).toContain("manage")
  expect(r.authorization_details[1]!.actions).not.toContain("manage")
})
it("denies inactive users and refuses truncated authority snapshots", async () => {
  await expect(getCommerceAuthorization("u", "r")).rejects.toMatchObject({
    status: 403,
  })
  state.rows = [[{ id: "u" }], Array(1001).fill({})]
  await expect(getCommerceAuthorization("u", "r")).rejects.toMatchObject({
    status: 503,
  })
})
it("requires a live resource/client registry binding", async () => {
  await expect(getCommerceRegistration("r", "c")).rejects.toMatchObject({
    status: 403,
  })
  state.rows = [[{ identifier: "r", referenceId: "sso-administration", metadata: {}, scopes: ["marketplace:read"] }]]
  expect(await getCommerceRegistration("r", "any-new-client-id")).toBe("marketplace")
})
it("rechecks database policy on every call rather than caching an ID allowlist", async () => {
  state.rows = [[{ metadata: { commerceApplication: "restaurant" }, referenceId: "sso-administration", scopes: ["restaurant:read"] }], []]
  expect(await getCommerceRegistration("r", "any-generated-id")).toBe("restaurant")
  await expect(getCommerceRegistration("r", "any-generated-id")).rejects.toMatchObject({ status: 403 })
})
const input = {
  teamId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  role: "staff" as const,
}
it("allows org admin to assign a team manager", async () => {
  state.rows = [
    [{ organization_id: "o" }],
    [{ role: "admin" }],
    [{ id: "m", role: "staff", org_role: "member" }],
    [],
  ]
  expect(
    await updateCommerceTeamRole("caller", { ...input, role: "manager" }),
  ).toMatchObject({ role: "manager" })
})
it.each(["manager", "staff"])(
  "prevents team manager from promoting/replacing a manager (%s)",
  async (targetRole) => {
    state.rows = [
      [{ organization_id: "o" }],
      [{ role: "member", team_role: "manager" }],
      [{ id: "m", role: targetRole, org_role: "member" }],
    ]
    await expect(
      updateCommerceTeamRole("caller", { ...input, role: "manager" }),
    ).rejects.toMatchObject({ status: 403 })
  },
)
it("allows manager to change ordinary roles but denies self-escalation and outsiders", async () => {
  state.rows = [
    [{ organization_id: "o" }],
    [{ role: "member", team_role: "manager" }],
    [{ id: "m", role: "member", org_role: "member" }],
    [],
  ]
  expect(await updateCommerceTeamRole("caller", input)).toMatchObject({
    role: "staff",
  })
  state.rows = [
    [{ organization_id: "o" }],
    [{ role: "member", team_role: "manager" }],
    [{ id: "m", role: "staff", org_role: "member" }],
  ]
  await expect(
    updateCommerceTeamRole(input.userId, input),
  ).rejects.toMatchObject({ status: 403 })
  state.rows = [
    [{ organization_id: "o" }],
    [{ role: "member", team_role: "staff" }],
  ]
  await expect(updateCommerceTeamRole("caller", input)).rejects.toMatchObject({
    status: 403,
  })
})
it("validates team-role updates strictly", () => {
  expect(
    commerceTeamRoleInput.safeParse({ ...input, role: "owner" }).success,
  ).toBe(false)
  expect(
    commerceTeamRoleInput.safeParse({
      ...input,
      organizationId: crypto.randomUUID(),
    }).success,
  ).toBe(false)
})
