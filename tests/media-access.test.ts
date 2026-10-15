import { randomBytes } from "node:crypto"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { jwt } from "better-auth/plugins/jwt"
import { oauthProvider } from "@better-auth/oauth-provider"
import { createLocalJWKSet, jwtVerify } from "@gorth/principle/cores/jose"
import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({
  status: "active",
  registration: vi.fn(async () => ({
    identifier: "https://media.example",
    ttl: 120,
    algorithm: null,
    keyId: null,
  })),
}))
vi.mock("server-only", () => ({}))
vi.mock("@/services/media-registration", () => ({
  getSsoMediaRegistration: state.registration,
}))
vi.mock("@/services/user", () => ({
  getUserProfileClaims: async () => ({ status: state.status }),
}))
import { mediaAccess } from "@/lib/auth/server/media-access"

function fixture() {
  return betterAuth({
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
      oauthConsent: [],
      oauthAccessToken: [],
      oauthRefreshToken: [],
    }),
    emailAndPassword: { enabled: true },
    session: { cookieCache: { enabled: true } },
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      mediaAccess({ disableSettingJwtHeader: true }),
      oauthProvider({
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        scopes: ["openid", "profile", "email", "sso:read", "sso:write"],
        customUserInfoClaims: async () => ({ status: state.status }),
      }),
    ],
  })
}
async function login(server: ReturnType<typeof fixture>) {
  const response = await server.api.signUpEmail({
    body: {
      email: "upload@example.test",
      password: "Test-password-2026!",
      name: "Uploader",
    },
    asResponse: true,
  })
  expect(response.status).toBe(200)
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ")
  return new Headers({ cookie })
}
beforeEach(() => {
  state.status = "active"
  state.registration.mockClear()
})

it("delegates a native session with real JWKS, strict audience, scope and short lifetime", async () => {
  const server = fixture()
  const headers = await login(server)
  const { token, resourceIdentifier } = await server.api.issueMediaAccessToken({
    headers,
  })
  expect(resourceIdentifier).toBe("https://media.example")
  const keys = await server.api.getJwks()
  const verified = await jwtVerify(token, createLocalJWKSet(keys), {
    issuer: "https://sso.example/auth",
    audience: "https://media.example",
    typ: "at+jwt",
  })
  expect(verified.payload.azp).toBe("gorth-single-sign-on")
  expect(verified.payload.scope).toBe("openid profile email sso:read sso:write")
  expect(Number(verified.payload.exp) - Number(verified.payload.iat)).toBe(120)
  expect(verified.payload.sid).toBeTruthy()
  expect(state.registration).toHaveBeenCalledWith()
  await expect(
    jwtVerify(token, createLocalJWKSet(keys), {
      audience: "https://other.example",
    })
  ).rejects.toThrow()
  // Real OAuth UserInfo accepts this delegated token only for a registered client.
  const context = await server.$context
  await context.adapter.create({
    model: "oauthClient",
    data: {
      clientId: "gorth-single-sign-on",
      name: "SSO",
      disabled: false,
      scopes: ["openid", "profile", "email", "sso:read", "sso:write"],
      redirectUris: [],
      tokenEndpointAuthMethod: "none",
    },
  })
  await context.adapter.create({
    model: "oauthResource",
    data: {
      identifier: "https://media.example",
      name: "Media",
      disabled: false,
      allowedScopes: ["sso:read", "sso:write"],
    },
  })
  await context.adapter.create({
    model: "oauthClientResource",
    data: {
      clientId: "gorth-single-sign-on",
      resourceId: "https://media.example",
    },
  })
  const userinfo = await server.handler(
    new Request("https://sso.example/auth/oauth2/userinfo", {
      headers: { authorization: `Bearer ${token}` },
    })
  )
  const info = await userinfo.json()
  expect(userinfo.status, JSON.stringify(info)).toBe(200)
  expect(info).toMatchObject({
    email: "upload@example.test",
    sub: verified.payload.sub,
    status: "active",
  })
})

it("rejects missing, inactive and revoked sessions despite cookie cache", async () => {
  const server = fixture()
  await expect(
    server.api.issueMediaAccessToken({ headers: new Headers() })
  ).rejects.toThrow()
  const headers = await login(server)
  state.status = "suspended"
  await expect(server.api.issueMediaAccessToken({ headers })).rejects.toThrow(
    "inactive_user"
  )
  state.status = "active"
  const session = await server.api.getSession({ headers })
  await server.api.revokeSession({
    headers,
    body: { token: session!.session.token },
  })
  await expect(server.api.issueMediaAccessToken({ headers })).rejects.toThrow()
})

it("never exposes the signing operation as a browser HTTP endpoint", async () => {
  const server = fixture()
  const response = await server.handler(
    new Request("https://sso.example/auth/issue-media-access-token", {
      method: "POST",
    })
  )
  expect(response.status).toBe(404)
})

it("does not delegate expired sessions or a client with missing registration", async () => {
  const server = fixture()
  const headers = await login(server)
  state.registration.mockRejectedValueOnce(new Error("registration missing"))
  await expect(server.api.issueMediaAccessToken({ headers })).rejects.toThrow(
    "sso_media_registration_required"
  )
  const session = await server.api.getSession({ headers })
  const context = await server.$context
  await context.adapter.update({
    model: "session",
    where: [{ field: "id", value: session!.session.id }],
    update: { expiresAt: new Date(Date.now() - 1000) },
  })
  await expect(server.api.issueMediaAccessToken({ headers })).rejects.toThrow()
})
