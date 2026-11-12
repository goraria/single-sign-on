import { randomBytes, randomUUID } from "node:crypto"
import { expect, it } from "vitest"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { jwt } from "better-auth/plugins/jwt"
import { oauthProvider } from "@better-auth/oauth-provider"

const issuer = "https://sso-redirect.fixture.test"
const local = "http://localhost:3030/auth/callback/gorth"
const production = "https://chat.fixture.test/auth/callback/gorth"
function fixture() {
  const db: Record<string, unknown[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
    jwks: [],
    oauthClientResource: [],
    oauthResource: [],
    oauthClient: [
      ["chat-production", production],
      ["chat-local", local],
    ].map(([clientId, redirect]) => ({
      id: randomUUID(),
      clientId,
      redirectUris: [redirect],
      scopes: ["openid"],
      public: true,
      disabled: false,
      requirePKCE: true,
      tokenEndpointAuthMethod: "none",
      grantTypes: ["authorization_code"],
      responseTypes: ["code"],
      applicationType: "web",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  }
  return betterAuth({
    baseURL: issuer,
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    database: memoryAdapter(db),
    plugins: [
      jwt(),
      oauthProvider({
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        scopes: ["openid"],
      }),
    ],
    logger: { disabled: true },
    rateLimit: { enabled: false },
  })
}
it.each([
  ["chat-production", local, "invalid_redirect"],
  ["chat-local", local, null],
  ["chat-production", production, null],
  ["chat-local", "https://attacker.fixture.test/callback", "invalid_redirect"],
])(
  "native OAuth redirect validation: %s + %s",
  async (clientId, redirectUri, error) => {
    const url = new URL("/auth/oauth2/authorize", issuer)
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid",
      state: randomUUID(),
      nonce: randomUUID(),
      code_challenge: "A".repeat(43),
      code_challenge_method: "S256",
    }).toString()
    const response = await fixture().handler(new Request(url))
    const body = response.headers.get("location") ? null : await response.json()
    const destination = new URL(
      response.headers.get("location") ?? body.url,
      issuer
    )
    expect(destination.searchParams.get("error")).toBe(error)
    expect(destination.pathname).toBe(error ? "/auth/error" : "/auth/sign-in")
  }
)
