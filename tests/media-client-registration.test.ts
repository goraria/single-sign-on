import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({
  rows: [] as unknown[][],
  getSession: vi.fn(),
  createClient: vi.fn(),
  createResource: vi.fn(),
  updateResource: vi.fn(),
  link: vi.fn(),
  deleteClient: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({
  database: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.rows.shift() ?? [] }),
      }),
    }),
  },
}))
vi.mock("@/utils/environment", () => ({
  betterAuthUrl: "https://sso.example",
  isProduction: true,
}))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    api: {
      getSession: state.getSession,
      adminCreateOAuthClient: state.createClient,
      adminCreateOAuthResource: state.createResource,
      adminUpdateOAuthResource: state.updateResource,
      adminLinkClientResource: state.link,
      deleteOAuthClient: state.deleteClient,
    },
  },
}))
import { POST } from "@/app/(api)/admin/media-client/route"
function request(origin = "https://sso.example") {
  return new Request("https://sso.example/admin/media-client", {
    method: "POST",
    headers: { origin, cookie: "master-session" },
  })
}
beforeEach(() => {
  state.rows = []
  for (const fn of [
    state.getSession,
    state.createClient,
    state.createResource,
    state.updateResource,
    state.link,
    state.deleteClient,
  ])
    fn.mockReset()
  state.getSession.mockResolvedValue({ user: { id: "master", role: "master" } })
  state.createClient.mockResolvedValue({
    client_id: "native-client-id",
    client_secret: "native-client-secret",
  })
})
it("provisions only a machine client and exact resource through native Better Auth APIs", async () => {
  const response = await POST(request())
  expect(response.status).toBe(201)
  expect(response.headers.get("cache-control")).toContain("no-store")
  expect(await response.json()).toEqual({
    clientId: "native-client-id",
    clientSecret: "native-client-secret",
    resource: "https://sso.example/internal/storage/credential",
  })
  expect(state.createClient).toHaveBeenCalledWith(
    expect.objectContaining({
      body: expect.objectContaining({
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["client_credentials"],
        client_credentials_scopes: ["storage:sso:credential"],
      }),
    })
  )
  expect(state.createResource).toHaveBeenCalledWith(
    expect.objectContaining({
      body: expect.objectContaining({ accessTokenTtl: 120 }),
    })
  )
  expect(state.link).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        identifier: "https://sso.example/internal/storage/credential",
        client_id: "native-client-id",
      },
    })
  )
})
it("denies CSRF, guests and all roles other than master before provisioning", async () => {
  expect((await POST(request("https://attacker.example"))).status).toBe(403)
  for (const role of ["user", "vice", "admin"]) {
    state.getSession.mockResolvedValueOnce({ user: { id: "user", role } })
    expect((await POST(request())).status).toBe(403)
  }
  state.getSession.mockResolvedValueOnce(null)
  expect((await POST(request())).status).toBe(401)
  expect(state.createClient).not.toHaveBeenCalled()
})
it("never rotates or duplicates an existing client implicitly", async () => {
  state.rows = [[{ id: "existing" }]]
  expect((await POST(request())).status).toBe(409)
  expect(state.createClient).not.toHaveBeenCalled()
})
it("removes failed provisioning using Better Auth without exposing provider errors", async () => {
  state.link.mockRejectedValueOnce(
    new Error("native-client-secret private-provider-error")
  )
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).not.toMatch(
    /native-client-secret|private-provider-error/
  )
  expect(state.deleteClient).toHaveBeenCalledWith(
    expect.objectContaining({ body: { client_id: "native-client-id" } })
  )
})
