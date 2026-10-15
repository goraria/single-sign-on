import { PgDialect } from "drizzle-orm/pg-core"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import z from "@gorth/structure/cores/zod"
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  missing: false,
  role: "admin",
  authenticated: true,
  statements: [] as {
    kind: string
    table: unknown
    where?: unknown
    values?: unknown
    selection?: unknown
    limit?: number
    offset?: number
  }[],
  revokeSession: vi.fn(),
  revokeSessions: vi.fn(),
  transaction: vi.fn(),
  failUpdate: false,
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({ isProduction: true }))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    api: {
      revokeUserSession: state.revokeSession,
      revokeUserSessions: state.revokeSessions,
      getSession: async () =>
        state.authenticated
          ? { user: { id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed" } }
          : null,
    },
  },
}))
vi.mock("@/database", async () => {
  const schema = await import("@/database/schema")
  function select(selection: unknown) {
    const statement: (typeof state.statements)[number] = {
      kind: "select",
      table: null,
      selection,
    }
    state.statements.push(statement)
    function rows() {
      if (state.missing) return []
      if (selection && typeof selection === "object" && "total" in selection)
        return [{ total: 7 }]
      if (statement.table === schema.session)
        return [
          {
            id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
            token: "fixture-session-token",
          },
        ]
      if (statement.table === schema.oauthConsent)
        return [
          {
            userId: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
            clientId: "client-one",
          },
        ]
      if (statement.table === schema.user)
        return [
          {
            id: "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed",
            role: state.role,
            name: "Admin",
            email: "admin@example.com",
          },
        ]
      return []
    }
    const query = {
      from(table: unknown) {
        statement.table = table
        return query
      },
      where(value: unknown) {
        statement.where = value
        return query
      },
      innerJoin() {
        return query
      },
      leftJoin() {
        return query
      },
      orderBy() {
        return query
      },
      limit(value: number) {
        statement.limit = value
        return query
      },
      offset(value: number) {
        statement.offset = value
        return query
      },
      for() {
        return query
      },
      then(
        resolve: (value: unknown) => unknown,
        reject: (error: unknown) => unknown
      ) {
        return Promise.resolve(rows()).then(resolve, reject)
      },
    }
    return query
  }
  const database = {
    select,
    insert: () => ({ values: async () => undefined }),
    update(table: unknown) {
      return {
        set(values: unknown) {
          return {
            where: async (where: unknown) => {
              if (state.failUpdate) throw new Error("fixture-write-failed")
              state.statements.push({ kind: "update", table, values, where })
            },
          }
        },
      }
    },
    delete(table: unknown) {
      return {
        where: async (where: unknown) => {
          state.statements.push({ kind: "delete", table, where })
        },
      }
    },
    transaction: state.transaction,
  }
  state.transaction.mockImplementation(
    async (fn: (tx: typeof database) => unknown) => fn(database)
  )
  return { database }
})

import {
  auditLog,
  oauthAccessToken,
  oauthConsent,
  oauthRefreshToken,
} from "@/database/schema"
import {
  listAuditLogs,
  listOAuthConsents,
  listSessions,
  revokeAdminSession,
  revokeAdminUserSessions,
  revokeOAuthConsent,
} from "@/services/admin-security"
import {
  adminAuditQuerySchema,
  adminConsentQuerySchema,
  adminSessionQuerySchema,
  adminSessionSelection,
} from "@/schemas/admin-security"
import adminRoutes from "@/routes/admin"
const id = "c50d1ac3-bc90-4b7d-8efa-c81b67f0c3ed"
const headers = new Headers({ cookie: "fixture-admin-session" })
function params(where: unknown) {
  return new PgDialect().sqlToQuery(
    where as Parameters<PgDialect["sqlToQuery"]>[0]
  ).params
}
beforeEach(() => {
  state.statements = []
  state.missing = false
  state.failUpdate = false
  state.role = "admin"
  state.authenticated = true
  state.revokeSession.mockReset().mockResolvedValue({ success: true })
  state.revokeSessions.mockReset().mockResolvedValue({ success: true })
})
describe("admin session and grant operations", () => {
  it("uses native Better Auth revocation without sending tokens to the browser", async () => {
    expect(adminSessionSelection).not.toHaveProperty("token")
    expect(await revokeAdminSession(id, headers)).toEqual({ id })
    expect(state.revokeSession).toHaveBeenCalledWith({
      headers,
      body: { sessionToken: "fixture-session-token" },
    })
    expect(await revokeAdminUserSessions(id, headers)).toEqual({ userId: id })
    expect(state.revokeSessions).toHaveBeenCalledWith({
      headers,
      body: { userId: id },
    })
  })
  it("does not invoke native revocation for missing targets", async () => {
    state.missing = true
    await expect(revokeAdminSession(id, headers)).rejects.toThrow(
      "session_not_found"
    )
    await expect(revokeAdminUserSessions(id, headers)).rejects.toThrow(
      "user_not_found"
    )
    expect(state.revokeSession).not.toHaveBeenCalled()
    expect(state.revokeSessions).not.toHaveBeenCalled()
  })
  it("revokes the entire user/client grant in a transaction, clearing rotation replay data", async () => {
    const result = await revokeOAuthConsent(id)
    expect(result.jwtAccessTokensValidUntilExpiry).toBe(true)
    expect(state.transaction).toHaveBeenCalled()
    const writes = state.statements.filter((entry) => entry.kind !== "select")
    expect(writes.map((entry) => entry.table)).toEqual([
      oauthRefreshToken,
      oauthAccessToken,
      oauthConsent,
    ])
    for (const write of writes)
      expect(params(write.where)).toEqual([id, "client-one"])
    expect(writes[0].values).toMatchObject({
      revoked: expect.any(Date),
      rotationReplayResponse: null,
      rotationReplayExpiresAt: null,
    })
  })
  it("does not delete consent if a token update fails", async () => {
    state.failUpdate = true
    await expect(revokeOAuthConsent(id)).rejects.toThrow("fixture-write-failed")
    expect(state.statements.some((entry) => entry.kind === "delete")).toBe(
      false
    )
  })
  it("applies identical bounded filters to item and count queries", async () => {
    expect(
      (await listSessions({ page: 2, limit: 10, search: "hello", userId: id }))
        .total
    ).toBe(7)
    const queries = state.statements.filter((entry) => entry.kind === "select")
    expect(params(queries[0].where)).toEqual(params(queries[1].where))
    expect(queries[0]).toMatchObject({ limit: 10, offset: 10 })
    state.statements = []
    await listOAuthConsents({
      page: 1,
      limit: 10,
      search: "hello",
      clientId: "client-one",
      userId: id,
    })
    expect(params(state.statements[0].where)).toEqual(
      params(state.statements[1].where)
    )
    state.statements = []
    await listAuditLogs({
      page: 1,
      limit: 10,
      search: "hello",
      outcome: "failure",
      from: "2026-10-15T00:00:00Z",
    })
    expect(state.statements[0].table).toBe(auditLog)
    expect(params(state.statements[0].where)).toEqual(
      params(state.statements[1].where)
    )
    expect(state.statements[0].selection).not.toHaveProperty("metadata")
  })
  it("validates paging, identifiers and date ranges", () => {
    expect(adminSessionQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 10,
    })
    expect(adminSessionQuerySchema.safeParse({ limit: 101 }).success).toBe(
      false
    )
    expect(adminConsentQuerySchema.safeParse({ userId: "bad" }).success).toBe(
      false
    )
    expect(
      adminAuditQuerySchema.safeParse({
        from: "2026-10-16T00:00:00Z",
        to: "2026-10-15T00:00:00Z",
      }).success
    ).toBe(false)
    expect(
      adminAuditQuerySchema.parse({ resourceType: "user,session" }).resourceType
    ).toEqual(["user", "session"])
  })
  it.each(["/session/", "/user/"])(
    "denies non-admin session mutations at %s",
    async (path) => {
      state.role = "user"
      const app = new Hono()
        .route("/admin", adminRoutes)
        .onError((error, ctx) =>
          error instanceof HTTPException
            ? error.getResponse()
            : error instanceof z.ZodError
              ? ctx.json({}, 400)
              : ctx.json({}, 500)
        )
      const endpoint = `/admin${path}${id}${path === "/user/" ? "/session" : ""}`
      expect(
        (await app.request(endpoint, { method: "DELETE", headers })).status
      ).toBe(403)
      expect(state.revokeSession).not.toHaveBeenCalled()
      expect(state.revokeSessions).not.toHaveBeenCalled()
    }
  )
})
