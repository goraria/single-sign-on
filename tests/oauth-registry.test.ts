import { beforeEach, describe, expect, it, vi } from "vitest"
import { oauthClient } from "@/database/schema"
import { onceAsync } from "@/utils/server/once"
import { oauthScopePublicationSchema } from "@/schemas/oauth-registry"
import { assertOAuthClientEnvironment } from "@/schemas/oauth-client-policy"

const state = vi.hoisted(() => ({
  unbounded: false,
  revision: 1,
  rows: [
    {
      revision: 1,
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        "storage:sso:credential",
      ],
    },
  ],
  insert: vi.fn(),
  lock: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  get oauthScopeRevision() {
    return state.revision
  },
}))
vi.mock("@/database", () => {
  const tx = {
    execute: state.lock,
    select: () => {
      let latest = false
      let client = false
      const query = {
        from: (table: unknown) => {
          client = table === oauthClient
          return query
        },
        where: () => query,
        orderBy: () => {
          latest = true
          return query
        },
        limit: () =>
          Object.assign(
            Promise.resolve(
              client
                ? state.unbounded
                  ? [{ id: "unbounded-client" }]
                  : []
                : latest
                  ? state.rows.slice(-1)
                  : state.rows.filter((row) => row.revision === state.revision)
            ),
            {
              for: async () => state.rows.slice(-1),
            }
          ),
      }
      return query
    },
    insert: () => ({
      values: (row: { revision: number; scopes: string[] }) => ({
        returning: async () => {
          state.insert(row)
          state.rows.push(row)
          return [row]
        },
      }),
    }),
  }
  return {
    database: {
      ...tx,
      transaction: async (fn: (value: typeof tx) => unknown) => fn(tx),
    },
  }
})
import {
  loadOAuthScopeRevision,
  publishOAuthScopeRevision,
} from "@/services/oauth-registry"

beforeEach(() => {
  state.unbounded = false
  state.revision = 1
  state.rows = [
    {
      revision: 1,
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        "storage:sso:credential",
      ],
    },
  ]
  state.insert.mockClear()
  state.lock.mockClear()
})

it("initializes once for concurrent requests and retries failed initialization", async () => {
  const initialize = vi
    .fn()
    .mockRejectedValueOnce(new Error("DB unavailable"))
    .mockResolvedValue({ revision: 1 })
  const get = onceAsync(initialize)
  await expect(get()).rejects.toThrow("DB unavailable")
  const results = await Promise.all([get(), get(), get()])
  expect(initialize).toHaveBeenCalledTimes(2)
  expect(results[0]).toBe(results[2])
})

it("publishes an immutable next revision without activating it", async () => {
  const active = await loadOAuthScopeRevision()
  const next = await publishOAuthScopeRevision(
    { baseRevision: 1, scopes: [...active.scopes, "new-app:read"] },
    "master"
  )
  expect(next.revision).toBe(2)
  expect(state.lock).toHaveBeenCalledOnce()
  expect((await loadOAuthScopeRevision()).scopes).not.toContain("new-app:read")
  state.revision = 2
  expect((await loadOAuthScopeRevision()).scopes).toContain("new-app:read")
})

it("rejects stale publication, removal and missing revisions without a fallback", async () => {
  await expect(
    publishOAuthScopeRevision(
      { baseRevision: 2, scopes: state.rows[0].scopes },
      "master"
    )
  ).rejects.toThrow("conflict")
  await expect(
    publishOAuthScopeRevision({ baseRevision: 1, scopes: ["openid"] }, "master")
  ).rejects.toThrow("removal_requires_migration")
  expect(state.insert).not.toHaveBeenCalled()
  state.revision = 99
  await expect(loadOAuthScopeRevision()).rejects.toThrow("not_found")
  state.revision = NaN
  await expect(loadOAuthScopeRevision()).rejects.toThrow(
    "invalid_oauth_scope_revision"
  )
})

it.each(["space name", 'quote"name', "back\\slash", "new\nline", ""])(
  "rejects invalid scope syntax %j",
  (scope) => {
    expect(
      oauthScopePublicationSchema.safeParse({
        baseRevision: 1,
        scopes: [...state.rows[0].scopes, scope],
      }).success
    ).toBe(false)
  }
)

describe("separate client environments", () => {
  it("accepts exact localhost callbacks even on a deployed SSO", () => {
    expect(() =>
      assertOAuthClientEnvironment({
        environment: "local",
        redirectUris: ["http://localhost:5503/auth/callback/gorth"],
      })
    ).not.toThrow()
  })
  it("rejects mixed environments and public clients with machine privileges", () => {
    expect(() =>
      assertOAuthClientEnvironment({
        environment: "production",
        redirectUris: [
          "https://app.example/auth/callback",
          "http://localhost:5503/auth/callback",
        ],
      })
    ).toThrow("environment_mismatch")
    expect(() =>
      assertOAuthClientEnvironment({
        environment: "local",
        redirectUris: ["http://localhost:5503/auth/callback"],
        backchannelLogoutUri: "https://app.example/auth/backchannel-logout",
      })
    ).toThrow("environment_mismatch")
    expect(() =>
      assertOAuthClientEnvironment({
        redirectUris: ["https://app.example/callback"],
        clientCredentialsScopes: ["new-app:read"],
        tokenEndpointAuthMethod: "none",
      })
    ).toThrow("confidential_client")
  })
})

it("does not widen an existing client's unrestricted scope ceiling when publishing", async () => {
  state.unbounded = true
  await expect(
    publishOAuthScopeRevision(
      { baseRevision: 1, scopes: [...state.rows[0].scopes, "new-app:read"] },
      "master"
    )
  ).rejects.toThrow("scope_ceiling_required")
  expect(state.insert).not.toHaveBeenCalled()
})
