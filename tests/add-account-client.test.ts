import { createHash } from "node:crypto"
import { afterEach, expect, it, vi } from "vitest"
import { Browser, createFixture, fixtureOrigin } from "./fixtures/multi-session"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it.each(["email", "username"])(
  "the add-account SDK retains OAuth selection without injecting oauth_query into %s sign-in",
  async (method) => {
    const server = createFixture()
    const browser = new Browser(server)
    await browser.signup("First", "first@example.test", "first.user")
    await browser.signup("Second", "second@example.test")
    const client = await server.api.createOAuthClient({
      headers: new Headers({ Cookie: browser.cookie, Origin: fixtureOrigin }),
      body: {
        redirect_uris: ["https://app.example.test/auth/callback"],
        scope: "openid profile email",
        token_endpoint_auth_method: "none",
      },
    })
    const query = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: "https://app.example.test/auth/callback",
      response_type: "code",
      scope: "openid profile email",
      state: "fixture-state",
      code_challenge: createHash("sha256")
        .update("fixture-only-verifier".repeat(3))
        .digest("base64url"),
      code_challenge_method: "S256",
    })
    const authorization = await browser.request(`oauth2/authorize?${query}`)
    const selection = new URL(
      authorization.headers.get("location")!,
      fixtureOrigin
    )
    expect(selection.pathname).toBe("/auth/select-account")
    vi.stubGlobal("window", {
      location: {
        origin: fixtureOrigin,
        href: selection.href,
        search: selection.search,
      },
      addEventListener() {},
      removeEventListener() {},
    })
    const bodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init)
        const body = await request.text()
        bodies.push(JSON.parse(body))
        const headers = new Headers(request.headers)
        headers.set("Origin", fixtureOrigin)
        headers.set("Cookie", browser.cookie)
        return browser.accept(
          await server.handler(
            new Request(request.url, { method: request.method, headers, body })
          )
        )
      }
    )
    const { signInWithIdentifier } = await import("@/lib/auth/client/username")
    const result = await signInWithIdentifier(
      {
        identifier: method === "email" ? "first@example.test" : "first.user",
        password: "Fixture-password-only-2026!",
        rememberMe: true,
      },
      selection.href,
      true
    )
    expect(result.error).toBeNull()
    expect(bodies[0]).not.toHaveProperty("oauth_query")
    expect(window.location.href).toBe(selection.href)
    expect((await browser.current()).user.email).toBe("first@example.test")
  }
)
