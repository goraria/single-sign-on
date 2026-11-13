import { randomBytes } from "node:crypto"
import { expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider"

vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  betterAuthUrl: "https://sso.example",
  appUrl: "https://sso.example",
  isProduction: false,
  cookiePrefix: "fixture",
  googleClientId: "",
  googleClientSecret: undefined,
}))
vi.mock("@/database", () => ({ database: {} }))
vi.mock("@/services/oauth-management", () => ({
  getOAuthAdministratorRole: async () => "master",
}))
vi.mock("@/services/oauth-client", () => ({
  getOAuthClientOrigins: async () => ["https://sso.example"],
}))
vi.mock("@/services/audit", () => ({
  recordAdminAudit: async () => {},
  newAuditRequestId: () => "fixture",
}))
import { createAuth } from "@/lib/auth/server/index"
import { withRequestedOAuthClientId } from "@/utils/oauth-client-credentials"

it("uses DB-supplied scopes and native shared ownership, exact redirects and per-client resource links", async () => {
  const scopes = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "new-app:read",
  ]
  const options = createAuth(scopes).options
  const auth = betterAuth({
    ...options,
    secret: randomBytes(48).toString("base64url"),
    database: memoryAdapter({
      user: [],
      account: [],
      session: [],
      verification: [],
      jwks: [],
      oauthClient: [],
      oauthResource: [],
      oauthClientResource: [],
      oauthAccessToken: [],
      oauthRefreshToken: [],
      oauthConsent: [],
      organization: [],
      member: [],
    }),
    advanced: { ...options.advanced, database: { generateId: "uuid" } },
    emailAndPassword: {
      ...options.emailAndPassword,
      requireEmailVerification: false,
    },
    emailVerification: { sendOnSignUp: false, sendOnSignIn: false },
    rateLimit: { enabled: false },
    socialProviders: {},
    logger: { disabled: true },
  })
  const signup = await auth.api.signUpEmail({
    body: {
      name: "Admin",
      email: "admin@example.test",
      password: "Fixture-password-only-2026!",
    },
    asResponse: true,
  })
  const headers = new Headers({
    cookie: signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; "),
  })
  const client = await auth.api.adminCreateOAuthClient({
    headers,
    body: {
      client_name: "New application",
      token_endpoint_auth_method: "none",
      require_pkce: true,
      redirect_uris: ["https://new-app.example/auth/callback"],
      scope: "openid new-app:read",
      skip_consent: true,
    },
  })
  const createChosen = () => withRequestedOAuthClientId("admin-selected-fixture", () => auth.api.adminCreateOAuthClient({
    headers,
    body: { client_name: "Chosen ID", token_endpoint_auth_method: "client_secret_basic", require_pkce: true,
      redirect_uris: ["https://new-app.example/auth/callback"], scope: "openid new-app:read" },
  }))
  const chosen = await createChosen()
  expect(chosen.client_id).toBe("admin-selected-fixture")
  expect(chosen.client_secret).toMatch(/^[A-Za-z0-9]{32}$/)
  const rotated = await auth.api.rotateClientSecret({ headers, body: { client_id: chosen.client_id } })
  expect(rotated.client_id).toBe(chosen.client_id)
  expect(rotated.client_secret).toMatch(/^[A-Za-z0-9]{32}$/)
  expect(rotated.client_secret).not.toBe(chosen.client_secret)
  const context = await auth.$context
  const stored = await context.adapter.findOne<{ referenceId: string }>({
    model: "oauthClient",
    where: [{ field: "clientId", value: client.client_id }],
  })
  expect(stored?.referenceId).toBe("sso-administration")
  await auth.api.adminUpdateOAuthClient({
    headers,
    body: {
      client_id: client.client_id,
      update: {
        client_uri: "https://new-app.example",
        backchannel_logout_uri:
          "https://new-app.example/auth/backchannel-logout",
      },
    },
  })
  await auth.api.adminCreateOAuthResource({
    headers,
    body: {
      identifier: "https://api.new-app.example",
      allowedScopes: ["new-app:read"],
    },
  })
  const authorize = (
    resource: string,
    redirect = "https://new-app.example/auth/callback"
  ) =>
    auth.handler(
      new Request(
        `https://sso.example/auth/oauth2/authorize?${new URLSearchParams({
          client_id: client.client_id,
          redirect_uri: redirect,
          response_type: "code",
          scope: "openid new-app:read",
          resource,
          code_challenge: "a".repeat(43),
          code_challenge_method: "S256",
          state: "fixture-state",
        })}`,
        { headers }
      )
    )
  const mismatch = await authorize(
    "https://api.new-app.example",
    "https://new-app.example/auth/callback-evil"
  )
  expect(mismatch.headers.get("location") ?? "").not.toContain("callback-evil")
  const denied = await authorize("https://api.new-app.example")
  expect(
    (denied.headers.get("location") ?? "") + (await denied.text())
  ).toContain("invalid_target")
  const params = {
    identifier: encodeURIComponent("https://api.new-app.example"),
    client_id: client.client_id,
  }
  await auth.api.adminLinkClientResource({ headers, params })
  const allowed = await authorize("https://api.new-app.example")
  const allowedOutput =
    (allowed.headers.get("location") ?? "") + (await allowed.text())
  expect(allowedOutput).not.toContain("invalid_target")
  expect(allowedOutput).toContain("code=")
  await auth.api.adminUnlinkClientResource({ headers, params })
  const revoked = await authorize("https://api.new-app.example")
  expect(
    (revoked.headers.get("location") ?? "") + (await revoked.text())
  ).toContain("invalid_target")
  const metadata = await oauthProviderOpenIdConfigMetadata(auth)(
    new Request("https://sso.example/.well-known/openid-configuration")
  )
  expect((await metadata.json()).scopes_supported).toContain("new-app:read")
})
