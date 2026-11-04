import { beforeEach, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { organization } from "better-auth/plugins/organization"
import { commerceOrganization } from "@/lib/auth/server/commerce-organization"
import { getOrganizationOperation } from "@/schemas/commerce-organization"

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  verify: vi.fn(),
  auth: null as any,
}))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({ database: { execute: mocks.execute } }))
vi.mock("@/lib/auth/server", () => ({ getAuth: async () => mocks.auth }))
vi.mock("@/lib/auth/server/commerce-access", () => ({
  requireCommerceUser: mocks.verify,
}))
vi.mock("@/services/commerce-access", () => ({
  updateCommerceTeamRole: vi.fn(),
  getCommerceTeamUsers: async (ids: string[]) =>
    ids.map((id) => ({
      id,
      name: "Branch member",
      email: "member@fixture.invalid",
      image: null,
    })),
}))
import { executeCommerceOrganization } from "@/services/commerce-organization"

const owner = "10000000-0000-4000-8000-000000000001",
  outsider = "10000000-0000-4000-8000-000000000002",
  sid = "20000000-0000-4000-8000-000000000001",
  org = "30000000-0000-4000-8000-000000000001"
let db: Record<string, any[]>
beforeEach(() => {
  const now = new Date()
  db = {
    user: [owner, outsider].map((id) => ({
      id,
      name: id,
      email: id + "@example.test",
      emailVerified: true,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })),
    session: [
      {
        id: sid,
        userId: owner,
        token: "private-native-session-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: now,
        updatedAt: now,
      },
    ],
    organization: [
      { id: org, name: "Business", slug: "business", createdAt: now },
    ],
    member: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        organizationId: org,
        userId: owner,
        role: "owner",
        createdAt: now,
      },
    ],
    team: [],
    teamMember: [],
    invitation: [],
  }
  mocks.auth = betterAuth({
    secret: "organization-test-only-secret-at-least-32-characters",
    baseURL: "https://sso.example.test",
    database: memoryAdapter(db),
    user: {
      additionalFields: { status: { type: "string", defaultValue: "active" } },
    },
    plugins: [
      organization({ teams: { enabled: true } }),
      commerceOrganization(),
    ],
    advanced: { database: { generateId: "uuid" } },
    logger: { disabled: true },
  })
  mocks.verify.mockReset().mockResolvedValue({
    subject: owner,
    resource: "https://commerce.test",
    sessionId: sid,
  })
  mocks.auth.api.oauth2UserInfo = vi.fn(async () => ({ sub: owner }))
  mocks.execute.mockReset().mockImplementation(async () => ({
    rows: [{ token: "private-native-session-token", id: owner }],
  }))
})
function request(method = "GET") {
  return new Request(
    "https://sso.example.test/auth/commerce/organization/list",
    { method, headers: { authorization: "Bearer verified-only-in-this-test" } }
  )
}
it("delegates to the real Organization plugin without cookies or changing native sessions", async () => {
  const result = await executeCommerceOrganization(request(), "list", {})
  expect(result).toMatchObject([{ id: org }])
  expect(JSON.stringify(result)).not.toContain("private-native-session-token")
  expect(db.session).toHaveLength(1)
})
it("runs the native owner permission check for team creation", async () => {
  const result = await executeCommerceOrganization(
    request("POST"),
    "team-create",
    { organizationId: org, name: "Branch A" }
  )
  expect(result).toMatchObject({ name: "Branch A", organizationId: org })
})
it("rejects an OAuth subject that does not own the live SSO session", async () => {
  mocks.verify.mockResolvedValue({
    subject: outsider,
    resource: "https://commerce.test",
    sessionId: sid,
  })
  await expect(
    executeCommerceOrganization(request(), "list", {})
  ).rejects.toThrow("invalid_user_token")
})
it("rejects a revoked OAuth grant through native userinfo before executing a mutation", async () => {
  mocks.auth.api.oauth2UserInfo.mockRejectedValue(
    new Error("revoked_native_grant")
  )
  await expect(
    executeCommerceOrganization(request("POST"), "team-create", {
      organizationId: org,
      name: "Denied",
    })
  ).rejects.toThrow("revoked_native_grant")
  expect(db.team).toHaveLength(0)
})
it("requires a still-live session and never authorizes a machine token", async () => {
  mocks.verify.mockResolvedValue({
    subject: owner,
    resource: "https://commerce.test",
  })
  await expect(
    executeCommerceOrganization(request(), "list", {})
  ).rejects.toThrow("session_required")
  mocks.verify.mockResolvedValue({
    subject: owner,
    resource: "https://commerce.test",
    sessionId: sid,
  })
  mocks.execute.mockResolvedValue({ rows: [] })
  await expect(
    executeCommerceOrganization(request(), "list", {})
  ).rejects.toThrow("session_revoked")
})
it("requires write scopes for mutations, rejects caller userId and unknown dispatch", async () => {
  await expect(
    executeCommerceOrganization(request("POST"), "create", {
      name: "Attack",
      slug: "attack",
      userId: outsider,
    })
  ).rejects.toThrow()
  expect(mocks.verify).toHaveBeenCalledWith(expect.any(Request), true)
  await expect(
    executeCommerceOrganization(request(), "addMember", {})
  ).rejects.toThrow("not_found")
  expect(getOrganizationOperation("__proto__")).toBeNull()
})
it("does not leak delegation to subsequent unauthenticated native API calls", async () => {
  await executeCommerceOrganization(request(), "list", {})
  await expect(
    mocks.auth.api.listOrganizations({ headers: new Headers() })
  ).rejects.toThrow()
})
it("preserves native last-owner protections", async () => {
  await expect(
    executeCommerceOrganization(request("POST"), "member-remove", {
      organizationId: org,
      memberIdOrEmail: db.member[0].id,
    })
  ).rejects.toThrow()
  expect(db.member).toHaveLength(1)
})
it.each([
  ["team-create", { organizationId: org, name: "Denied branch" }],
  [
    "invitation-create",
    { organizationId: org, email: "invite@fixture.invalid", role: "member" },
  ],
  [
    "member-remove",
    {
      organizationId: org,
      memberIdOrEmail: "40000000-0000-4000-8000-000000000001",
    },
  ],
])(
  "keeps native organization permissions for a team manager: %s",
  async (operation, body) => {
    db.member[0].role = "member"
    db.team.push({
      id: "50000000-0000-4000-8000-000000000001",
      organizationId: org,
      name: "Assigned",
      createdAt: new Date(),
    })
    db.teamMember.push({
      id: "60000000-0000-4000-8000-000000000001",
      teamId: db.team[0].id,
      userId: owner,
      role: "manager",
      createdAt: new Date(),
    })
    await expect(
      executeCommerceOrganization(request("POST"), operation, body)
    ).rejects.toThrow()
    expect(db.team).toHaveLength(1)
    expect(db.member).toHaveLength(1)
    expect(db.invitation).toHaveLength(0)
  }
)
it("projects team member names after native team access checks without exposing sessions", async () => {
  const teamId = "50000000-0000-4000-8000-000000000001"
  db.team.push({
    id: teamId,
    organizationId: org,
    name: "Assigned",
    createdAt: new Date(),
  })
  db.teamMember.push({
    id: "60000000-0000-4000-8000-000000000001",
    teamId,
    userId: owner,
    role: "manager",
    createdAt: new Date(),
  })
  const result = await executeCommerceOrganization(request(), "team-member", {
    teamId,
  })
  expect(result).toMatchObject([
    { userId: owner, user: { id: owner, name: "Branch member" } },
  ])
  expect(JSON.stringify(result)).not.toContain("private-native-session-token")
})
