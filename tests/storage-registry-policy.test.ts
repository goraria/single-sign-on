import { beforeEach, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
const state = vi.hoisted(() => ({
  rows: [] as unknown[],
  filter: vi.fn(),
  secret: "storage-private-key",
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  awsEndpointUrlS3: "https://neon.example",
  awsRegion: "ap-southeast-1",
  awsBucket: "sso-avatar",
  awsAccessKeyId: "storage-id",
  get awsSecretAccessKey() {
    return state.secret
  },
}))
vi.mock("@/database", () => ({
  database: {
    select() {
      const query = {
        from: () => query,
        innerJoin: () => query,
        where(filter: unknown) {
          state.filter(filter)
          return query
        },
        limit: async () => state.rows,
      }
      return query
    },
  },
}))
import {
  authorizeStorageClient,
  getStorageCredential,
  getStorageConfiguration,
} from "@/services/storage-credential"
const audience = "https://sso.example/internal/storage/credential"
const policy = () => ({
  purpose: "media-storage-credential-reader",
  disabled: false,
  resourceDisabled: false,
  authMethod: "client_secret_post",
  grants: ["client_credentials"],
  machineScopes: ["storage:sso:credential"],
  allowedScopes: ["storage:sso:credential"],
  dpop: false,
  ttl: 120,
})
beforeEach(() => {
  state.rows = [policy()]
  state.filter.mockReset()
  state.secret = "storage-private-key"
})
it("checks the exact current client/resource link instead of trusting JWT alone", async () => {
  await authorizeStorageClient("registered-media-client", audience)
  const sql = new PgDialect().sqlToQuery(state.filter.mock.calls[0]![0])
  expect(sql.params).toEqual(["registered-media-client", audience])
})
it.each([
  { disabled: true },
  { resourceDisabled: true },
  { authMethod: "none" },
  { grants: ["authorization_code", "client_credentials"] },
  { machineScopes: [] },
  { allowedScopes: [] },
  { ttl: null },
  { ttl: 600 },
  { dpop: true },
  { purpose: "another-service" },
])("denies unsafe, disabled or withdrawn machine policy %j", async (change) => {
  state.rows = [{ ...policy(), ...change }]
  await expect(authorizeStorageClient("media", audience)).rejects.toThrow(
    "forbidden_storage_client"
  )
})
it("refuses missing links and cross-bucket requests", async () => {
  state.rows = []
  await expect(authorizeStorageClient("media", audience)).rejects.toThrow()
  expect(() => getStorageCredential("foreign-avatar")).toThrow(
    "forbidden_storage_bucket"
  )
  expect(getStorageCredential("sso-avatar").secretAccessKey).toBe(
    "storage-private-key"
  )
})
it("fails closed on missing private configuration without leaking validation values", () => {
  state.secret = ""
  expect(() => getStorageConfiguration()).toThrow("storage_not_configured")
})
