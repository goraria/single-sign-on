import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { Browser, createFixture, fixtureOrigin } from "./fixtures/multi-session"

const upstream = vi.hoisted(() => ({
  handler: null as null | ((request: Request) => Promise<Response>),
  paths: [] as string[],
}))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/environment", () => ({
  appUrl: "http://localhost:3300",
}))
vi.mock("@/lib/auth/server/index", () => ({
  auth: {
    handler: async (request: Request) => {
      upstream.paths.push(new URL(request.url).pathname)
      return upstream.handler!(request)
    },
  },
}))
vi.mock("@/services/route", () => ({
  validateOAuthRedirectPolicy: async () => false,
  signOutRouteSession: async ({
    cookie,
    origin,
  }: {
    cookie: string
    origin: string
  }) => {
    upstream.paths.push("/auth/sign-out")
    return upstream.handler!(
      new Request("http://localhost:3300/auth/sign-out", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    )
  },
}))

import { GET, POST } from "@/app/(api)/auth/browser-account/route"
import {
  GET as signOutNavigation,
  POST as signOut,
} from "@/app/(api)/auth/sign-out/route"

let auth: ReturnType<typeof createFixture>
let browser: Browser
beforeEach(() => {
  auth = createFixture()
  browser = new Browser(auth)
  upstream.handler = (request) => auth.handler(request)
  upstream.paths = []
})

function request(
  body?: unknown,
  cookie = browser.cookie,
  origin: string | null = fixtureOrigin
) {
  return new NextRequest(`${fixtureOrigin}/auth/browser-account`, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

async function accounts() {
  const response = await GET(request())
  expect(response.status).toBe(200)
  return response.json() as Promise<{
    accounts: { sessionId: string; user: { email: string }; active: boolean }[]
  }>
}

describe("fullstack browser accounts with real Better Auth multi-session", () => {
  it("lists no accounts anonymously, without caching", async () => {
    const response = await GET(request())
    expect(await response.json()).toEqual({ accounts: [] })
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("lists two accounts without exposing bearer tokens and switches with all cookies", async () => {
    await browser.signup("First", "first@example.test")
    await browser.signup("Second", "second@example.test")
    const { accounts: items } = await accounts()
    expect(items).toHaveLength(2)
    const serialized = JSON.stringify(items)
    expect(serialized).not.toContain('"token"')
    expect(serialized).not.toContain('"password"')
    const first = items.find(
      (item) => item.user.email === "first@example.test"
    )!
    const response = await POST(
      request({ operation: "switch", sessionId: first.sessionId })
    )
    expect(response.status).toBe(200)
    expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(2)
    browser.accept(response)
    expect((await browser.current()).user.email).toBe("first@example.test")
    expect((await accounts()).accounts).toHaveLength(2)
  })

  it("revokes only the selected inactive account", async () => {
    await browser.signup("First", "first@example.test")
    await browser.signup("Second", "second@example.test")
    const first = (await accounts()).accounts.find((item) => !item.active)!
    const response = await POST(
      request({ operation: "revoke", sessionId: first.sessionId })
    )
    expect(response.status).toBe(200)
    browser.accept(response)
    expect((await browser.current()).user.email).toBe("second@example.test")
    expect((await accounts()).accounts.map((item) => item.user.email)).toEqual([
      "second@example.test",
    ])
    expect(upstream.paths).not.toContain("/auth/sign-out")
  })

  it("revokes the active account, then activates a remaining account without deleting it", async () => {
    await browser.signup("First", "first@example.test")
    await browser.signup("Second", "second@example.test")
    const active = (await accounts()).accounts.find((item) => item.active)!
    const response = await POST(
      request({ operation: "revoke", sessionId: active.sessionId })
    )
    expect(response.status).toBe(200)
    browser.accept(response)
    expect((await browser.current()).user.email).toBe("first@example.test")
    expect((await accounts()).accounts).toHaveLength(1)
  })

  it("signs out all slots on this browser but preserves another device's session", async () => {
    await browser.signup("First", "first@example.test")
    const otherDevice = new Browser(auth)
    expect(
      (
        await otherDevice.request("sign-in/email", {
          email: "first@example.test",
          password: "Fixture-password-only-2026!",
        })
      ).ok
    ).toBe(true)
    await browser.signup("Second", "second@example.test")
    const response = await signOut(request({}))
    expect(response.status).toBe(200)
    browser.accept(response)
    expect((await accounts()).accounts).toEqual([])
    expect(await browser.current()).toBeNull()
    expect((await otherDevice.current()).user.email).toBe("first@example.test")
  })

  it("GET sign-out is non-mutating", async () => {
    await browser.signup("First", "first@example.test")
    const response = await signOutNavigation(request())
    expect(response.headers.get("location")).toBe(
      `${fixtureOrigin}/auth/select-account`
    )
    expect(upstream.paths).toEqual([])
    expect((await browser.current()).user.email).toBe("first@example.test")
  })

  it.each([null, "http://evil.example", "null"])(
    "rejects mutation Origin %s before reading any sessions",
    async (origin) => {
      const action = await POST(
        request({ operation: "switch", sessionId: "unknown" }, "", origin)
      )
      const logout = await signOut(request({}, "", origin))
      expect(action.status).toBe(403)
      expect(logout.status).toBe(403)
      expect(upstream.paths).toEqual([])
    }
  )

  it("rejects another device's session id and token input", async () => {
    await browser.signup("First", "first@example.test")
    const other = new Browser(auth)
    await other.signup("Other", "other@example.test")
    const session = (await other.current()).session
    expect(
      (await POST(request({ operation: "switch", sessionId: session.id })))
        .status
    ).toBe(401)
    expect(
      (
        await POST(
          request({
            operation: "revoke",
            sessionId: session.id,
            sessionToken: session.token,
          })
        )
      ).status
    ).toBe(400)
    expect((await other.current()).user.email).toBe("other@example.test")
  })

  it("supports a pre-plugin active session without clearing other account slots", async () => {
    await browser.signup("Legacy", "legacy@example.test")
    for (const name of browser.cookies.keys())
      if (name.includes("_multi-")) browser.cookies.delete(name)
    const legacy = (await accounts()).accounts[0]
    expect(legacy.active).toBe(true)
    const response = await POST(
      request({ operation: "revoke", sessionId: legacy.sessionId })
    )
    expect(response.status).toBe(200)
    browser.accept(response)
    expect(await browser.current()).toBeNull()
    expect(upstream.paths).toContain("/auth/revoke-session")
    expect(upstream.paths).not.toContain("/auth/sign-out")
  })

  it("fails closed when SSO is unavailable", async () => {
    upstream.handler = async () => {
      throw new Error("fixture offline")
    }
    expect((await GET(request())).status).toBe(503)
    expect(
      (await POST(request({ operation: "switch", sessionId: "unknown" })))
        .status
    ).toBe(503)
    expect((await signOut(request({}))).status).toBe(503)
  })

  it("revokes the last account and clears active/cache cookies", async () => {
    await browser.signup("Only", "only@example.test")
    const account = (await accounts()).accounts[0]
    const response = await POST(
      request({ operation: "revoke", sessionId: account.sessionId })
    )
    expect(response.ok).toBe(true)
    browser.accept(response)
    expect(await browser.current()).toBeNull()
    expect((await accounts()).accounts).toEqual([])
  })

  it("clears a stale active/cache cookie during authoritative account listing", async () => {
    await browser.signup("Only", "only@example.test")
    const current = await browser.current()
    const context = await auth.$context
    await context.internalAdapter.deleteSession(current.session.token)
    const response = await GET(request())
    expect(response.ok).toBe(true)
    expect((await response.json()).accounts).toEqual([])
    expect(
      response.headers
        .getSetCookie()
        .some((cookie) => /max-age=0(?:;|$)/i.test(cookie))
    ).toBe(true)
    browser.accept(response)
    expect(await browser.current()).toBeNull()
  })

  it("recovers a verified device slot to revoke it when the active cookie is missing", async () => {
    await browser.signup("First", "first@example.test")
    await browser.signup("Second", "second@example.test")
    for (const name of browser.cookies.keys())
      if (!name.includes("_multi-")) browser.cookies.delete(name)
    const account = (await accounts()).accounts.find(
      (item) => item.user.email === "first@example.test"
    )!
    expect(account.active).toBe(false)
    const response = await POST(
      request({ operation: "revoke", sessionId: account.sessionId })
    )
    expect(response.ok).toBe(true)
    browser.accept(response)
    expect((await accounts()).accounts.map((item) => item.user.email)).toEqual([
      "second@example.test",
    ])
    expect((await browser.current()).user.email).toBe("second@example.test")
  })

  it("deduplicates a re-login of the same account without dropping another account", async () => {
    await browser.signup("First", "first@example.test")
    await browser.signup("Second", "second@example.test")
    expect(
      (
        await browser.request("sign-in/email", {
          email: "first@example.test",
          password: "Fixture-password-only-2026!",
        })
      ).ok
    ).toBe(true)
    expect((await accounts()).accounts).toHaveLength(2)
    expect((await browser.current()).user.email).toBe("first@example.test")
  })

  it("does not read sessions for an oversized, invalid or wrong-content-type payload", async () => {
    expect(
      (
        await POST(
          request({ operation: "switch", sessionId: "x".repeat(3000) })
        )
      ).status
    ).toBe(413)
    const malformed = new NextRequest(`${fixtureOrigin}/auth/browser-account`, {
      method: "POST",
      headers: { Origin: fixtureOrigin, "Content-Type": "application/json" },
      body: "{",
    })
    expect((await POST(malformed)).status).toBe(400)
    const form = new NextRequest(`${fixtureOrigin}/auth/browser-account`, {
      method: "POST",
      headers: {
        Origin: fixtureOrigin,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "sessionId=x",
    })
    expect((await POST(form)).status).toBe(415)
    expect(upstream.paths).toEqual([])
  })
})
