import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import z from "@gorth/structure/cores/zod"

const state = vi.hoisted(() => ({
  role: "admin",
  authenticated: true,
  currentRole: "admin",
  missingResource: false,
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  resourceId: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({ isProduction: true }))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    api: {
      getSession: async () =>
        state.authenticated
          ? { user: { id: "admin-id", role: state.role } }
          : null,
      adminCreateOAuthResource: state.create,
      adminUpdateOAuthResource: state.update,
      adminDeleteOAuthResource: state.remove,
    },
  },
}))
vi.mock("@/database", async () => {
  const { oauthResource } = await import("@/database/schema")
  return {
    database: {
      insert: () => ({ values: async () => undefined }),
      select: () => {
        let resource = false
        let filter: unknown
        const query = {
          from(table: unknown) {
            resource = table === oauthResource
            return query
          },
          where(value: unknown) {
            filter = value
            return query
          },
          limit: async () => {
            if (!resource) return [{ id: "admin-id", role: state.currentRole }]
            const params = new PgDialect().sqlToQuery(
              filter as Parameters<PgDialect["sqlToQuery"]>[0]
            ).params
            if (state.missingResource || params[0] !== state.resourceId)
              return []
            return [
              {
                id: state.resourceId,
                identifier: "https://service.example/resource%20name",
                name: "Service",
                allowedScopes: ["task:read"],
              },
            ]
          },
        }
        return query
      },
    },
  }
})

import adminRoutes from "@/routes/admin"
import {
  adminOAuthResourcePayloadSchema,
  adminOAuthResourceSelection,
} from "@/schemas/admin"
import {
  createOAuthResource,
  deleteOAuthResource,
  updateOAuthResource,
} from "@/services/admin"

const headers = new Headers({
  cookie: "admin-session",
  origin: "https://sso.example",
})
const payload = () => ({
  identifier: "https://service.example/resource%20name",
  name: "Service",
  accessTokenTtl: 600,
  refreshTokenTtl: null,
  signingAlgorithm: null,
  signingKeyId: null,
  allowedScopes: ["task:read"],
  dpopBoundAccessTokensRequired: false,
  disabled: false,
})
function router() {
  return new Hono().route("/admin", adminRoutes).onError((error, context) => {
    if (error instanceof HTTPException) return error.getResponse()
    if (error instanceof z.ZodError)
      return context.json({ error: "invalid_request" }, 400)
    return context.json({ error: "unexpected_failure" }, 500)
  })
}
function request(method: string, body?: unknown, id = state.resourceId) {
  const path = method === "POST" ? "" : `/${id}`
  return new Request(`https://sso.example/admin/oauth-resource${path}`, {
    method,
    headers: {
      cookie: "admin-session",
      origin: "https://sso.example",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
beforeEach(() => {
  state.role = state.currentRole = "admin"
  state.authenticated = true
  state.missingResource = false
  state.create.mockReset().mockResolvedValue({ id: state.resourceId })
  state.update.mockReset().mockResolvedValue({ id: state.resourceId })
  state.remove.mockReset().mockResolvedValue({ deleted: true })
})

describe("OAuth resource administration", () => {
  it("delegates mutations to Better Auth with the admin session and encoded audience", async () => {
    await createOAuthResource(payload(), headers)
    expect(state.create).toHaveBeenCalledWith({ headers, body: payload() })
    await updateOAuthResource(state.resourceId, payload(), headers)
    const { identifier, ...policy } = payload()
    expect(state.update).toHaveBeenCalledWith({
      headers,
      params: { identifier: encodeURIComponent(identifier) },
      body: policy,
    })
    await deleteOAuthResource(state.resourceId, headers)
    expect(state.remove).toHaveBeenCalledWith({
      headers,
      params: { identifier: encodeURIComponent(identifier) },
    })
  })
  it("rejects an audience rename before invoking native mutation", async () => {
    await expect(
      updateOAuthResource(
        state.resourceId,
        { ...payload(), identifier: "https://another.example" },
        headers
      )
    ).rejects.toThrow("resource_identifier_immutable")
    expect(state.update).not.toHaveBeenCalled()
  })
  it("does not mutate missing resources", async () => {
    state.missingResource = true
    await expect(
      deleteOAuthResource(state.resourceId, headers)
    ).rejects.toThrow("oauth_resource_not_found")
    expect(state.remove).not.toHaveBeenCalled()
  })
  it("validates policy while omitting private metadata from read and write contracts", () => {
    expect(
      adminOAuthResourcePayloadSchema.parse({
        ...payload(),
        metadata: { accessKey: "fixture-private-value" },
      })
    ).not.toHaveProperty("metadata")
    expect(adminOAuthResourceSelection).not.toHaveProperty("metadata")
    expect(adminOAuthResourceSelection).not.toHaveProperty("customClaims")
  })
  it.each([
    { identifier: "https://user:password@service.example" },
    { identifier: "https://service.example/#fragment" },
    { identifier: "not-a-url" },
    { identifier: "https://service.example/#" },
    { identifier: "javascript:alert(1)" },
    { identifier: "http://public.example" },
    { accessTokenTtl: 0 },
    { refreshTokenTtl: -1 },
    { accessTokenTtl: 1.5 },
    { accessTokenTtl: 2147483648 },
    { signingAlgorithm: "HS256" },
  ])("rejects unsafe or unsupported resource policy %j", (change) => {
    expect(
      adminOAuthResourcePayloadSchema.safeParse({ ...payload(), ...change })
        .success
    ).toBe(false)
  })
  it("supports localhost service audiences even when SSO is deployed", () => {
    expect(
      adminOAuthResourcePayloadSchema.safeParse({
        ...payload(),
        identifier: "http://localhost:5052",
      }).success
    ).toBe(true)
  })
  it.each(["GET", "POST", "PATCH", "DELETE"])(
    "guards %s with the live database role before mutation",
    async (method) => {
      state.role = "admin" // A stale cookie must not retain administrative privileges.
      state.currentRole = "user"
      expect(
        (
          await router().fetch(
            request(
              method,
              ["POST", "PATCH"].includes(method) ? payload() : undefined
            )
          )
        ).status
      ).toBe(403)
      expect(state.create).not.toHaveBeenCalled()
      expect(state.update).not.toHaveBeenCalled()
      expect(state.remove).not.toHaveBeenCalled()
      state.authenticated = false
      expect(
        (
          await router().fetch(
            request(
              method,
              ["POST", "PATCH"].includes(method) ? payload() : undefined
            )
          )
        ).status
      ).toBe(401)
    }
  )
  it.each(["admin", "master"])(
    "lets %s read/create/edit/delete through protected routes",
    async (role) => {
      state.currentRole = role
      const app = router()
      expect((await app.fetch(request("GET"))).status).toBe(200)
      expect((await app.fetch(request("POST", payload()))).status).toBe(201)
      expect((await app.fetch(request("PATCH", payload()))).status).toBe(200)
      expect((await app.fetch(request("DELETE"))).status).toBe(200)
      expect(state.create.mock.calls[0][0].headers.get("cookie")).toBe(
        "admin-session"
      )
    }
  )
  it("rejects invalid UUIDs and invalid bodies before native calls", async () => {
    expect(
      (await router().fetch(request("PATCH", payload(), "not-a-uuid"))).status
    ).toBe(400)
    expect(
      (
        await router().fetch(
          request("POST", { ...payload(), accessTokenTtl: -5 })
        )
      ).status
    ).toBe(400)
    expect(state.create).not.toHaveBeenCalled()
    expect(state.update).not.toHaveBeenCalled()
  })
})
