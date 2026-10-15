import { randomBytes } from "node:crypto"
import { beforeEach, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { jwt, signJWT } from "better-auth/plugins/jwt"
import { oauthProvider } from "@better-auth/oauth-provider"

const state = vi.hoisted(() => ({
  policy: vi.fn(),
  config: vi.fn(() => ({
    endpoint: "https://neon.example",
    region: "ap-southeast-1",
    bucketName: "sso-avatar",
    accessKeyId: "storage-id",
    secretAccessKey: "storage-secret",
  })),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  betterAuthUrl: "https://sso.example",
  isProduction: true,
}))
vi.mock("@/services/helper", async () => {
  const { HTTPException } = await import("hono/http-exception")
  return {
    createServiceError: (message: string, status: 401 | 403 | 503) =>
      new HTTPException(status, { message }),
  }
})
vi.mock("@/services/storage-credential", () => ({
  authorizeStorageClient: state.policy,
  getStorageCredential: state.config,
}))
import { POST } from "@/app/(api)/internal/storage/credential/route"
import { requireMediaStorageClient } from "@/lib/auth/server/storage-access"

const audience = "https://sso.example/internal/storage/credential"
const scope = "storage:sso:credential"
const nativeFetch = globalThis.fetch
beforeEach(() => {
  vi.unstubAllGlobals()
  state.policy.mockReset()
  state.config.mockClear()
})

async function fixture() {
  const server = betterAuth({
    baseURL: "https://sso.example",
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    logger: { disabled: true },
    rateLimit: { enabled: false },
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
    }),
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "master", input: false },
      },
    },
    emailAndPassword: { enabled: true },
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      oauthProvider({
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        scopes: [scope, "openid", "profile"],
        enforcePerClientResources: true,
        clientPrivileges: ({ action, user }) =>
          action === "configure-client-credentials-scopes"
            ? user?.role === "master"
            : Boolean(user),
      }),
    ],
  })
  const login = await server.api.signUpEmail({
    body: {
      email: "master@example.test",
      name: "Master",
      password: "Password-2026-test!",
    },
    asResponse: true,
  })
  const headers = new Headers({
    cookie: login.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; "),
  })
  const client = await server.api.adminCreateOAuthClient({
    headers,
    body: {
      client_name: "Media",
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["client_credentials"],
      client_credentials_scopes: [scope],
      metadata: { purpose: "media-storage-credential-reader" },
    },
  })
  await server.api.adminCreateOAuthResource({
    headers,
    body: { identifier: audience, allowedScopes: [scope], accessTokenTtl: 120 },
  })
  await server.api.adminLinkClientResource({
    headers,
    params: { identifier: audience, client_id: client.client_id },
  })
  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes("/auth/jwks"))
        return Response.json(await server.api.getJwks())
      return nativeFetch(input, init)
    }
  )
  const requestToken = (
    secret = client.client_secret!,
    requestedScope = scope,
    resource = audience
  ) =>
    server.handler(
      new Request("https://sso.example/auth/oauth2/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: client.client_id,
          client_secret: secret,
          scope: requestedScope,
          resource,
        }),
      })
    )
  return { server, client, headers, requestToken }
}
function request(
  token?: string,
  headers: Record<string, string> = {},
  body = { bucketName: "sso-avatar" }
) {
  return new Request(audience, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: JSON.stringify(body),
  })
}
it("uses real Better Auth client credentials and JWKS verification, not custom authentication", async () => {
  const { requestToken, client } = await fixture()
  const issued = await requestToken()
  expect(issued.status).toBe(200)
  const token = await issued.json()
  expect(token.expires_in).toBe(120)
  const response = await POST(request(token.access_token))
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toContain("no-store")
  expect(response.headers.has("access-control-allow-origin")).toBe(false)
  expect(await response.json()).toMatchObject({
    secretAccessKey: "storage-secret",
  })
  expect(state.policy).toHaveBeenCalledWith(client.client_id, audience)
})
it("native grant rejects wrong secrets, user-delegated scopes and unlinked audiences", async () => {
  const { requestToken } = await fixture()
  const invalid = await requestToken("incorrect")
  expect(invalid.status).toBe(400)
  expect(await invalid.json()).toMatchObject({ error: "invalid_client" })
  expect((await requestToken(undefined, "openid")).status).toBe(400)
  expect(
    (await requestToken(undefined, scope, "https://unregistered.example"))
      .status
  ).toBe(400)
})
it("does not accept browser cookies, origin headers or ordinary login", async () => {
  const { requestToken } = await fixture()
  const token = (await (await requestToken()).json()).access_token
  for (const headers of [
    { cookie: "gorth.session_token=user" },
    { origin: "https://sso.example" },
    { "sec-fetch-site": "none" },
  ] as Record<string, string>[]) {
    expect((await POST(request(token, headers))).status).toBe(403)
  }
  expect((await POST(request())).status).toBe(401)
  expect(state.config).not.toHaveBeenCalled()
})
it("rejects signed user tokens, wrong audiences, expired tokens and missing scopes", async () => {
  const { server, client } = await fixture()
  const ctx = await server.$context
  const now = Math.floor(Date.now() / 1000)
  for (const override of [
    { sub: "user-one", sid: "login-session" },
    { aud: "https://wrong.example" },
    { exp: now - 1 },
    { scope: "profile" },
  ]) {
    const token = await signJWT(
      { context: ctx } as Parameters<typeof signJWT>[0],
      {
        options: { disableSettingJwtHeader: true },
        header: { typ: "at+jwt" },
        payload: {
          iss: "https://sso.example/auth",
          aud: audience,
          sub: client.client_id,
          client_id: client.client_id,
          scope,
          iat: now,
          exp: now + 120,
          ...override,
        },
      }
    )
    await expect(requireMediaStorageClient()(request(token))).rejects.toThrow()
  }
  expect(state.config).not.toHaveBeenCalled()
})
it("checks live client registry and never returns credentials on policy failure", async () => {
  const { requestToken } = await fixture()
  const token = (await (await requestToken()).json()).access_token
  const { HTTPException } = await import("hono/http-exception")
  state.policy.mockRejectedValueOnce(
    new HTTPException(403, { message: "private-policy" })
  )
  const response = await POST(request(token))
  expect(response.status).toBe(403)
  expect(await response.text()).not.toMatch(/storage-secret|private-policy/)
  expect(state.config).not.toHaveBeenCalled()
})
