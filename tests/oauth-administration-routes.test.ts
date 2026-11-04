import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { beforeEach, expect, it, vi } from "vitest"
import z from "@gorth-io/structure/cores/zod"

const state = vi.hoisted(() => ({
  role: "master",
  authenticated: true,
  publish: vi.fn(),
  adopt: vi.fn(),
  link: vi.fn(),
  unlink: vi.fn(),
  audit: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/database", () => ({ database: {} }))
vi.mock("@/services/admin", () => ({
  requireAdminSession: async () => {
    if (!state.authenticated) throw new HTTPException(401)
    if (!["admin", "master"].includes(state.role)) throw new HTTPException(403)
    return { id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed", role: state.role }
  },
}))
vi.mock("@/services/oauth-registry", () => ({
  listOAuthScopeRevisions: async () => ({
    active: { revision: 1, scopes: ["openid"] },
    revisions: [],
  }),
  publishOAuthScopeRevision: state.publish,
}))
vi.mock("@/services/oauth-management", () => ({
  adoptOAuthClient: state.adopt,
}))
vi.mock("@/services/oauth-client-resource", () => ({
  listOAuthClientResources: async () => [],
  linkOAuthClientResource: state.link,
  unlinkOAuthClientResource: state.unlink,
}))
vi.mock("@/services/audit", () => ({
  recordAdminAudit: state.audit,
  newAuditRequestId: () => "fixture",
}))
import routes from "@/routes/admin"
const id = "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed"
const app = new Hono()
  .route("/admin", routes)
  .onError((error, ctx) =>
    error instanceof HTTPException
      ? error.getResponse()
      : error instanceof z.ZodError
        ? ctx.json({ error: "invalid_request" }, 400)
        : ctx.json({ error: "unexpected" }, 500)
  )
const request = (path: string, method = "GET", body?: unknown) =>
  app.request("/admin/" + path, {
    method,
    headers: { "content-type": "application/json", cookie: "fixture-session" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
beforeEach(() => {
  state.role = "master"
  state.authenticated = true
  state.publish.mockReset().mockResolvedValue({ revision: 2 })
  state.adopt.mockReset().mockResolvedValue({ id })
  state.link.mockReset().mockResolvedValue({ linked: true })
  state.unlink.mockReset().mockResolvedValue({ unlinked: true })
  state.audit.mockReset().mockResolvedValue(undefined)
})
it("requires authentication and master approval for publication and ownership transfer", async () => {
  const payload = {
    baseRevision: 1,
    scopes: ["openid", "profile", "email", "offline_access", "new:read"],
  }
  state.authenticated = false
  expect((await request("oauth-scope")).status).toBe(401)
  state.authenticated = true
  state.role = "user"
  expect((await request("oauth-scope")).status).toBe(403)
  state.role = "admin"
  expect((await request("oauth-scope")).status).toBe(200)
  expect((await request("oauth-scope", "POST", payload)).status).toBe(403)
  expect(
    (await request(`sso-application/${id}/management`, "POST")).status
  ).toBe(403)
  expect(state.publish).not.toHaveBeenCalled()
  expect(state.adopt).not.toHaveBeenCalled()
  state.role = "master"
  expect((await request("oauth-scope", "POST", payload)).status).toBe(201)
  expect(
    (await request(`sso-application/${id}/management`, "POST")).status
  ).toBe(200)
})
it("validates publication and links, and fails closed when audit intent cannot be stored", async () => {
  expect(
    (
      await request("oauth-scope", "POST", {
        baseRevision: 1,
        scopes: ["bad scope"],
      })
    ).status
  ).toBe(400)
  expect(state.publish).not.toHaveBeenCalled()
  expect(
    (await request(`sso-application/${id}/resource/not-a-uuid`, "POST")).status
  ).toBe(400)
  expect(state.link).not.toHaveBeenCalled()
  const path = `sso-application/${id}/resource/${id}`
  expect((await request(path, "POST")).status).toBe(200)
  expect(state.link.mock.calls[0].slice(0, 2)).toEqual([id, id])
  expect((await request(path, "DELETE")).status).toBe(200)
  state.audit.mockRejectedValue(new HTTPException(503))
  state.link.mockClear()
  expect((await request(path, "POST")).status).toBe(503)
  expect(state.link).not.toHaveBeenCalled()
})
