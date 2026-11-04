import { expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { jwt } from "better-auth/plugins/jwt"
import { oauthProvider } from "@better-auth/oauth-provider"
vi.mock("server-only", () => ({}))
it("registers, disables and rotates a confidential client with native Better Auth only", async () => {
  const now = new Date(),
    db: Record<string, any[]> = {
      user: [],
      account: [],
      session: [],
      verification: [],
      jwks: [],
      oauthClient: [
        {
          id: crypto.randomUUID(),
          clientId: "media-native-fixture",
          clientSecret: null,
          public: false,
          disabled: true,
          requirePKCE: false,
          referenceId: "sso-administration",
          name: "Media fixture",
          redirectUris: [],
          responseTypes: [],
          grantTypes: ["client_credentials"],
          scopes: ["storage:fixture:credential"],
          clientCredentialsScopes: ["storage:fixture:credential"],
          tokenEndpointAuthMethod: "client_secret_post",
          createdAt: now,
          updatedAt: now,
        },
      ],
    }
  const auth = betterAuth({
    baseURL: "https://sso.test",
    secret: "test-secret-native-credential-at-least-32-characters",
    database: memoryAdapter(db),
    emailAndPassword: { enabled: true },
    plugins: [
      jwt(),
      oauthProvider({
        loginPage: "/sign-in",
        consentPage: "/consent",
        scopes: ["openid", "storage:fixture:credential"],
        clientReference: async () => "sso-administration",
        clientPrivileges: async () => true,
      }),
    ],
    advanced: { database: { generateId: "uuid" } },
    logger: { disabled: true },
  })
  const signed = await auth.api.signUpEmail({
    body: {
      name: "Operator fixture",
      email: "operator@fixture.invalid",
      password: "test-password-native-only-12345",
    },
    returnHeaders: true,
  })
  const headers = new Headers({
    cookie: signed.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
  })
  const created = await auth.api.adminCreateOAuthClient({
    headers,
    body: {
      client_name: "Media",
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["client_credentials"],
      response_types: [],
      scope: "storage:fixture:credential",
      client_credentials_scopes: ["storage:fixture:credential"],
    },
  })
  const native = db.oauthClient.find((c) => c.clientId === created.client_id)!
  const before = native.clientSecret
  expect(typeof before).toBe("string")
  expect(created.client_secret).toBeTruthy()
  expect(before).not.toBe(created.client_secret)
  await (
    await auth.$context
  ).adapter.update({
    model: "oauthClient",
    where: [{ field: "clientId", value: created.client_id }],
    update: { disabled: true },
  })
  const result = await auth.api.rotateClientSecret({
    headers,
    body: { client_id: created.client_id },
  })
  expect(result.client_secret!.length).toBeGreaterThanOrEqual(32)
  const saved = db.oauthClient.find((c) => c.clientId === created.client_id)!
  expect(saved.clientSecret).not.toBe(result.client_secret)
  expect(saved.clientSecret).not.toBe(before)
  expect(saved.disabled).toBe(true)
  await expect(
    auth.api.rotateClientSecret({
      headers: new Headers(),
      body: { client_id: created.client_id },
    })
  ).rejects.toThrow()
})
