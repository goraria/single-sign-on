import { createHash, randomBytes } from "node:crypto"
import { expect, it } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { jwt } from "better-auth/plugins/jwt"
import { oauthProvider } from "@better-auth/oauth-provider"
import { allowLocalAppRedirect } from "@/utils/oauth-local-redirect"
import { basicClientRegistration } from "@/utils/oauth-client-authentication"

it.each([
  ["client_secret_basic", "https://unified-app.test/auth/callback/gorth"],
  ["client_secret_basic", "http://localhost:3030/auth/callback/gorth"],
  ["client_secret_basic", "http://localhost:3036/auth/callback/gorth"],
] as const)(
  "keeps code+PKCE, refresh and machine scope ceilings separate on one %s client at %s",
  async (method, redirect) => {
    // Isolated native provider; never imports the cloud DB or app credentials.
    const db: Record<string, any[]> = Object.fromEntries([
      "user", "account", "session", "verification", "jwks", "oauthClient",
      "oauthResource", "oauthClientResource", "oauthAccessToken", "oauthRefreshToken", "oauthConsent",
    ].map((name) => [name, []]))
    const origin = "https://unified-sso.test"
    const auth = betterAuth({
      baseURL: origin, basePath: "/auth",
      secret: randomBytes(48).toString("base64url"),
      database: memoryAdapter(db),
      hooks: { before: basicClientRegistration },
      emailAndPassword: { enabled: true },
      rateLimit: { enabled: false }, logger: { disabled: true },
      plugins: [jwt(), oauthProvider({
        loginPage: "/sign-in", consentPage: "/consent",
        scopes: ["openid", "profile", "email", "offline_access", "chat:read", "chat:notification:publish"],
        allowInsecureRedirectUri: allowLocalAppRedirect,
        // Only this isolated test operator has native administration privileges.
        clientReference: async () => "fixture-administration",
        clientPrivileges: async () => true,
      })],
    })
    const signup = await auth.api.signUpEmail({
      body: { name: "Fixture", email: "fixture@unified.test", password: "fixture-unified-password-12345" },
      returnHeaders: true,
    })
    const headers = new Headers({ cookie: signup.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ") })
    await expect(auth.api.adminCreateOAuthClient({ headers, body: {
      client_name: "Rejected Post client", redirect_uris: [redirect],
      token_endpoint_auth_method: "client_secret_post", scope: "openid",
    } })).rejects.toMatchObject({ statusCode: 400 })
    const registered = await auth.api.adminCreateOAuthClient({ headers, body: {
      client_name: "Unified fixture", redirect_uris: [redirect],
      token_endpoint_auth_method: method, require_pkce: true,
      grant_types: ["authorization_code", "refresh_token", "client_credentials"],
      response_types: ["code"], skip_consent: true,
      scope: "openid profile email offline_access chat:read chat:notification:publish",
      client_credentials_scopes: ["chat:notification:publish"],
    } })
    const id = registered.client_id, secret = registered.client_secret!
    expect(secret).toBeTruthy()
    const token = async (params: Record<string, string>, credential = secret) => {
      const body = new URLSearchParams({ client_id: id, ...params })
      const requestHeaders: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" }
      requestHeaders.authorization = "Basic " + Buffer.from(`${id}:${credential}`).toString("base64")
      return auth.handler(new Request(origin + "/auth/oauth2/token", { method: "POST", headers: requestHeaders, body }))
    }
    const verifier = randomBytes(32).toString("base64url")
    const authorize = async (challenge?: string) => auth.handler(new Request(
      origin + "/auth/oauth2/authorize?" + new URLSearchParams({
        client_id: id, redirect_uri: redirect, response_type: "code",
        scope: "openid profile email offline_access chat:read", state: "fixture-state", nonce: "fixture-nonce",
        ...(challenge ? { code_challenge: challenge, code_challenge_method: "S256" } : {}),
      }), { headers },
    ))
    const noPkce = await authorize()
    expect(noPkce.headers.get("location") ?? await noPkce.text()).not.toContain("code=")
    const authorized = await authorize(createHash("sha256").update(verifier).digest("base64url"))
    const location = new URL(authorized.headers.get("location")!)
    expect(location.origin + location.pathname).toBe(redirect)
    const code = location.searchParams.get("code")!
    expect(code).toBeTruthy()
    const exchange = await token({ grant_type: "authorization_code", code, redirect_uri: redirect, code_verifier: verifier })
    expect(exchange.status).toBe(200)
    const user = await exchange.json()
    expect(user.id_token).toBeTruthy()
    expect(user.refresh_token).toBeTruthy()
    expect(user.scope).not.toContain("chat:notification:publish")
    const refreshed = await token({ grant_type: "refresh_token", refresh_token: user.refresh_token })
    expect(refreshed.status).toBe(200)
    const machine = await token({ grant_type: "client_credentials", scope: "chat:notification:publish" })
    expect(machine.status).toBe(200)
    const machineBody = await machine.json()
    expect(machineBody.scope).toBe("chat:notification:publish")
    expect(machineBody.id_token).toBeUndefined()
    expect(machineBody.refresh_token).toBeUndefined()
    expect((await token({ grant_type: "client_credentials", scope: "openid chat:read" })).status).toBeGreaterThanOrEqual(400)
    expect((await token({ grant_type: "client_credentials", scope: "chat:notification:publish" }, "wrong-secret")).status).toBeGreaterThanOrEqual(400)
  },
)
