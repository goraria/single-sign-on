import { beforeEach, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"

const state = vi.hoisted(() => ({
  production: true,
  limit: vi.fn(),
  where: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  get isProduction() {
    return state.production
  },
}))
vi.mock("@/database", () => ({
  database: {
    select: () => ({
      from: () => {
        const query = {
          innerJoin: () => query,
          where: (condition: unknown) => {
            state.where(condition)
            return { limit: state.limit }
          },
        }
        return query
      },
    }),
  },
}))
import { getSsoMediaRegistration } from "@/services/media-registration"

function registration() {
  return {
    identifier: "https://media.example",
    clientDisabled: false,
    resourceDisabled: false,
    scopes: ["openid", "profile", "email", "sso:read", "sso:write"],
    allowedScopes: ["sso:read", "sso:write"],
    dpopRequired: false,
    ttl: null,
    algorithm: null,
    keyId: null,
  }
}
beforeEach(() => {
  state.production = true
  state.where.mockClear()
  state.limit.mockReset().mockResolvedValue([registration()])
})

it("discovers the linked resource by existing application metadata, not name or env", async () => {
  expect(await getSsoMediaRegistration()).toEqual({
    identifier: "https://media.example",
    ttl: 120,
    algorithm: null,
    keyId: null,
  })
  const query = new PgDialect().sqlToQuery(state.where.mock.calls[0][0])
  expect(query.params).toEqual(["gorth-single-sign-on"])
  expect(query.sql).toContain('"oauth_resource"."metadata"')
  expect(query.sql).toContain("->>'application' = 'shared-media-storage'")
  expect(state.limit).toHaveBeenCalledWith(2)
})
it.each([{ rows: [] }, { rows: [registration(), registration()] }])(
  "rejects missing or ambiguous registrations (%j)",
  async ({ rows }) => {
    state.limit.mockResolvedValueOnce(rows)
    await expect(getSsoMediaRegistration()).rejects.toThrow(
      "sso_media_registration_required"
    )
  }
)
it.each([
  { clientDisabled: true },
  { resourceDisabled: true },
  { dpopRequired: true },
  { scopes: ["openid", "profile", "email", "sso:read"] },
  { allowedScopes: ["sso:read"] },
])("rejects unusable or unauthorized registry policy (%j)", async (policy) => {
  state.limit.mockResolvedValueOnce([{ ...registration(), ...policy }])
  await expect(getSsoMediaRegistration()).rejects.toThrow(
    "sso_media_registration_required"
  )
})
it.each([
  "http://media.example",
  "http://localhost:7077",
  "ftp://media.example",
  "https://media.example/path",
  "https://media.example/",
  "https://media.example?query=1",
  "https://media.example#fragment",
  "https://user:password@media.example",
  "not-a-url",
])(
  "rejects non-canonical or unsafe resource identifier %s",
  async (identifier) => {
    state.limit.mockResolvedValueOnce([{ ...registration(), identifier }])
    await expect(getSsoMediaRegistration()).rejects.toThrow()
  }
)
it("allows an exact localhost origin only outside production", async () => {
  state.production = false
  state.limit.mockResolvedValueOnce([
    { ...registration(), identifier: "http://localhost:7077" },
  ])
  expect((await getSsoMediaRegistration()).identifier).toBe(
    "http://localhost:7077"
  )
  state.limit.mockResolvedValueOnce([
    { ...registration(), identifier: "http://media.example" },
  ])
  await expect(getSsoMediaRegistration()).rejects.toThrow(
    "invalid_media_resource_identifier"
  )
})
it("honors a shorter token lifetime and signing key policy", async () => {
  state.limit.mockResolvedValueOnce([
    { ...registration(), ttl: 45, algorithm: "ES256", keyId: "registered-key" },
  ])
  expect(await getSsoMediaRegistration()).toMatchObject({
    ttl: 45,
    algorithm: "ES256",
    keyId: "registered-key",
  })
})
it("rejects unsupported signing algorithms and invalid lifetime", async () => {
  state.limit.mockResolvedValueOnce([{ ...registration(), algorithm: "HS256" }])
  await expect(getSsoMediaRegistration()).rejects.toThrow(
    "unsupported_media_signing_policy"
  )
  state.limit.mockResolvedValueOnce([{ ...registration(), ttl: 0 }])
  await expect(getSsoMediaRegistration()).rejects.toThrow(
    "invalid_media_token_lifetime"
  )
})
