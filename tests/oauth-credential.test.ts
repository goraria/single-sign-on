import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  current: {} as any,
  select: [] as any[],
  updates: [] as any[],
  create: vi.fn(),
  rotate: vi.fn(),
  remove: vi.fn(),
  values: [] as unknown[],
}))
vi.mock("server-only", () => ({}))
vi.mock("@/services/helper", async (original) => ({
  ...(await original<object>()),
  checkSsoApplicationExists: async () => mocks.current,
}))
vi.mock("@/database", () => ({
  database: {
    select: () => ({
      from: () => ({
        where: () => {
          const rows = mocks.select.shift()
          return {
            limit: async () => rows,
            then: (resolve: (v: unknown) => void) => resolve(rows),
          }
        },
      }),
    }),
    update: () => ({
      set: (value: unknown) => {
        mocks.values.push(value)
        return {
          where: () => ({
            returning: async () => mocks.updates.shift() ?? [],
            then: (resolve: (v: unknown) => void) => resolve([]),
          }),
        }
      },
    }),
  },
}))
vi.mock("@/lib/auth/server", () => ({
  getAuth: async () => ({
    api: {
      adminCreateOAuthClient: mocks.create,
      rotateClientSecret: mocks.rotate,
      deleteOAuthClient: mocks.remove,
    },
  }),
}))
import { rotateSsoApplicationCredential } from "@/services/oauth-credential"
beforeEach(() => {
  mocks.current = {
    id: "draft",
    clientId: "gorth-media-storage",
    name: "Media",
    referenceId: "sso-administration",
    public: false,
    disabled: true,
    tokenEndpointAuthMethod: "client_secret_basic",
    grantTypes: ["client_credentials"],
    responseTypes: [],
    scopes: ["storage:fixture:credential"],
    clientCredentialsScopes: ["storage:fixture:credential"],
    redirectUris: [],
    metadata: { application: "media" },
  }
  mocks.select = [
    [{ present: false }],
    [{ identifier: "https://app.test/internal/storage/credential" }],
  ]
  mocks.updates = [[{ id: "draft" }], [{ id: "native-record" }]]
  mocks.values = []
  mocks.create
    .mockReset()
    .mockResolvedValue({
      client_id: "native-id",
      client_secret: "test-only-one-time-credential",
    })
  mocks.rotate
    .mockReset()
    .mockResolvedValue({
      client_id: "existing-id",
      client_secret: "test-only-rotated-credential",
    })
  mocks.remove.mockReset().mockResolvedValue({ success: true })
})
it("registers a machine draft through the native provider and copies its registered resources", async () => {
  expect(
    await rotateSsoApplicationCredential("draft", new Headers())
  ).toMatchObject({
    id: "native-record",
    clientId: "native-id",
    clientSecret: "test-only-one-time-credential",
  })
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({
      body: expect.objectContaining({
        resources: ["https://app.test/internal/storage/credential"],
        grant_types: ["client_credentials"],
        token_endpoint_auth_method: "client_secret_basic",
      }),
    })
  )
  expect(mocks.values).toContainEqual({ disabled: true })
  expect(mocks.remove).toHaveBeenCalledWith(
    expect.objectContaining({ body: { client_id: "gorth-media-storage" } })
  )
})
it("rotates an existing credential natively without changing its client ID or registration", async () => {
  mocks.select = [[{ present: true }]]
  const result = await rotateSsoApplicationCredential("draft", new Headers())
  expect(result.clientId).toBe("existing-id")
  expect(mocks.rotate).toHaveBeenCalledOnce()
  expect(mocks.create).not.toHaveBeenCalled()
  expect(mocks.remove).not.toHaveBeenCalled()
})
it("creates a native Basic replacement without rotating or deleting the old Post client", async () => {
  mocks.current.tokenEndpointAuthMethod = "client_secret_post"
  mocks.current.disabled = false
  mocks.current.requirePKCE = true
  mocks.current.grantTypes = ["authorization_code", "refresh_token", "client_credentials"]
  mocks.current.redirectUris = ["https://app.test/auth/callback/gorth"]
  mocks.current.postLogoutRedirectUris = ["https://app.test"]
  mocks.current.backchannelLogoutUri = "https://app.test/auth/backchannel-logout"
  mocks.select[0] = [{ present: true }]
  const result = await rotateSsoApplicationCredential("draft", new Headers())
  expect(result.clientId).toBe("native-id")
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({
    token_endpoint_auth_method: "client_secret_basic", require_pkce: true,
    redirect_uris: mocks.current.redirectUris,
    post_logout_redirect_uris: mocks.current.postLogoutRedirectUris,
    backchannel_logout_uri: mocks.current.backchannelLogoutUri,
    resources: ["https://app.test/internal/storage/credential"],
    client_credentials_scopes: mocks.current.clientCredentialsScopes,
  }) }))
  expect(mocks.rotate).not.toHaveBeenCalled()
  expect(mocks.remove).not.toHaveBeenCalled()
  expect(mocks.values).toContainEqual({ disabled: true })
})
it("provisions an explicitly marked per-service draft while preserving its own scope ceiling", async () => {
  mocks.current.clientId = "gorth-payment-backend-local"
  mocks.current.metadata = { registryDraft: true, purpose: "payment-backend" }
  mocks.current.scopes = ["commerce:payment:sync"]
  mocks.current.clientCredentialsScopes = ["commerce:payment:sync"]
  await rotateSsoApplicationCredential("draft", new Headers())
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    body: expect.objectContaining({ client_credentials_scopes: ["commerce:payment:sync"] }),
  }))
})
it("serializes provisioning attempts and refuses to return another request's credential", async () => {
  mocks.updates = [[]]
  await expect(
    rotateSsoApplicationCredential("draft", new Headers())
  ).rejects.toThrow("credential_provisioning_in_progress")
  expect(mocks.create).not.toHaveBeenCalled()
})
it("removes a new registration whose setup failed and never returns its secret", async () => {
  mocks.updates = [[{ id: "draft" }], []]
  await expect(
    rotateSsoApplicationCredential("draft", new Headers())
  ).rejects.toThrow("credential_provisioning_failed")
  expect(mocks.remove).toHaveBeenCalledWith(
    expect.objectContaining({ body: { client_id: "native-id" } })
  )
})
it("rejects public/unmanaged clients and cannot re-register a working client without a secret", async () => {
  mocks.current.public = true
  await expect(
    rotateSsoApplicationCredential("draft", new Headers())
  ).rejects.toThrow("managed_confidential_client_required")
  mocks.current.public = false
  mocks.current.disabled = false
  await expect(
    rotateSsoApplicationCredential("draft", new Headers())
  ).rejects.toThrow("disable_unprovisioned_client_first")
  expect(mocks.create).not.toHaveBeenCalled()
})
