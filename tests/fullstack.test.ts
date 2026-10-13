import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Browser, createFixture, fixtureOrigin } from "./fixtures/multi-session"

const state = vi.hoisted(() => ({
  auth: null as ReturnType<typeof createFixture> | null,
  timeout: vi.fn(),
  databaseQuery: vi.fn(() => {
    throw new Error("Unexpected application DB access")
  }),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  appUrl: "http://localhost:3300",
  isDevelopment: false,
  isProduction: true,
}))
vi.mock("@/database", () => ({ database: { select: state.databaseQuery } }))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    get $context() {
      return state.auth!.$context
    },
    handler: (request: Request) => state.auth!.handler(request),
    get api() {
      return state.auth!.api
    },
  },
}))
vi.mock("@/services/oauth-client", () => ({
  getOAuthClientOrigins: async () => ["http://localhost:3300"],
}))
vi.mock("@/services/oauth-timeout", () => ({
  prepareOAuthTimeout: state.timeout,
}))
vi.mock("@/lib/rate-limit/database-store", () => ({
  DatabaseRateLimitStore: class {
    readonly localKeys = false
    init() {}
    async increment() {
      return { totalHits: 1, resetTime: new Date(Date.now() + 60_000) }
    }
    async decrement() {}
    async resetKey() {}
  },
}))

import { fetchApi } from "@/lib/hono"

function authRequest(
  path: string,
  body?: Record<string, unknown>,
  cookie = "",
  origin = fixtureOrigin
) {
  const request = new Request(`${fixtureOrigin}/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return fetchApi(request)
}

beforeEach(() => {
  state.auth = createFixture()
  state.timeout.mockReset()
  state.databaseQuery.mockClear()
  // Native auth and the router must not call an HTTP upstream within this app.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Unexpected HTTP upstream")
    })
  )
})
afterEach(() => vi.unstubAllGlobals())

describe("Next fullstack Hono boundary", () => {
  it("dispatches health locally without accessing a DB or HTTP upstream", async () => {
    const response = await fetchApi(new Request(`${fixtureOrigin}/health`))
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe("OK")
    expect(state.databaseQuery).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("preserves native cookies and reads the session through Hono", async () => {
    const browser = new Browser(state.auth!)
    const response = await authRequest("sign-up/email", {
      name: "Fullstack Account",
      email: "fullstack@example.test",
      password: "Fixture-password-only-2026!",
    })
    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    expect(cookies.length).toBeGreaterThanOrEqual(2)
    expect(cookies.some((value) => /HttpOnly/i.test(value))).toBe(true)
    browser.accept(response)
    const session = await authRequest(
      "get-session?disableCookieCache=true",
      undefined,
      browser.cookie
    )
    expect((await session.json()).user.email).toBe("fullstack@example.test")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("keeps Better Auth's origin protection for native endpoints", async () => {
    const browser = new Browser(state.auth!)
    await browser.signup("Fullstack Account", "fullstack@example.test")
    const response = await authRequest(
      "sign-in/email",
      {
        email: "fullstack@example.test",
        password: "Fixture-password-only-2026!",
      },
      browser.cookie,
      "https://untrusted.example.test"
    )
    expect(response.status).toBe(403)
  })

  it("checks admin permissions even when no UI proxy is involved", async () => {
    const response = await fetchApi(new Request(`${fixtureOrigin}/admin/user`))
    expect(response.status).toBe(401)
    expect(state.databaseQuery).not.toHaveBeenCalled()
  })

  it("serves OIDC metadata from the provider on the same public origin", async () => {
    const response = await fetchApi(
      new Request(`${fixtureOrigin}/.well-known/openid-configuration`)
    )
    expect(response.status).toBe(200)
    const metadata = await response.json()
    expect(metadata.issuer).toBe(`${fixtureOrigin}/auth`)
    expect(metadata.authorization_endpoint).toBe(
      `${fixtureOrigin}/auth/oauth2/authorize`
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it("rejects cross-origin timeout requests before using the signed query", async () => {
    const response = await authRequest(
      "oauth-timeout",
      { oauth_query: "untrusted" },
      "",
      "https://untrusted.example.test"
    )
    expect(response.status).toBe(400)
    expect(state.timeout).not.toHaveBeenCalled()
  })

  it("dispatches validated timeout preparation locally", async () => {
    state.timeout.mockResolvedValue({
      url: "https://app.example.test/auth/exchange?error=access_denied",
      expiresAt: Date.now() + 120_000,
    })
    const response = await authRequest("oauth-timeout", {
      oauth_query: "provider-signed-query",
    })
    expect(response.status).toBe(200)
    expect(state.timeout).toHaveBeenCalledWith("provider-signed-query")
    expect(fetch).not.toHaveBeenCalled()
  })
})
