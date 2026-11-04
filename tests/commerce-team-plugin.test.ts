import { beforeAll, beforeEach, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { organization } from "better-auth/plugins"
import { HTTPException } from "hono/http-exception"
const update = vi.hoisted(() => vi.fn())
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  betterAuthUrl: "https://sso-plugin.test",
}))
vi.mock("@/services/commerce-access", () => ({
  getCommerceRegistration: vi.fn(),
  updateCommerceTeamRole: update,
}))
vi.mock("@/services/helper", async () => {
  const { HTTPException } = await import("hono/http-exception")
  return {
    createServiceError: (message: string, status: any) =>
      new HTTPException(status, { message }),
  }
})
import { commerceTeamAccess } from "@/lib/auth/server/commerce-access"
const data: Record<string, any[]> = {
  user: [],
  session: [],
  account: [],
  verification: [],
  organization: [],
  member: [],
  team: [],
  teamMember: [],
}
const auth = betterAuth({
  baseURL: "https://sso-plugin.test",
  basePath: "/auth",
  secret: "test-only-commerce-plugin-secret-over-32-characters",
  database: memoryAdapter(data),
  emailAndPassword: { enabled: true },
  plugins: [organization({ teams: { enabled: true } }), commerceTeamAccess()],
})
const body = {
  teamId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  role: "staff",
}
let cookie = ""
beforeAll(async () => {
  const r = await auth.api.signUpEmail({
    asResponse: true,
    body: {
      email: "plugin@fixture.invalid",
      password: "Fixture-password-123",
      name: "Fixture",
    },
  })
  expect(r.ok).toBe(true)
  cookie = r.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
  expect(cookie).not.toBe("")
})
beforeEach(() => {
  update.mockReset().mockResolvedValue(body)
})
function request(authenticated = true, p: Record<string, unknown> = body) {
  return auth.handler(
    new Request(
      "https://sso-plugin.test/auth/organization/update-team-member-role",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://sso-plugin.test",
          ...(authenticated ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(p),
      },
    ),
  )
}
it("native session middleware denies anonymous callers before the service", async () => {
  expect((await request(false)).status).toBe(401)
  expect(update).not.toHaveBeenCalled()
})
it("native plugin dispatch returns business permission denial as 403", async () => {
  update.mockRejectedValue(
    new HTTPException(403, { message: "org_admin_required" }),
  )
  expect((await request()).status).toBe(403)
})
it("dispatches with the native session user and validates the body", async () => {
  const r = await request()
  expect(r.status).toBe(200)
  expect(await r.json()).toEqual(body)
  expect(update).toHaveBeenCalledWith(expect.any(String), body)
})
it("does not accept an owner role through the extension", async () => {
  const r = await request(true, { ...body, role: "owner" })
  expect(r.status).toBeGreaterThanOrEqual(400)
  expect(r.status).toBeLessThan(500)
  expect(update).not.toHaveBeenCalled()
})
