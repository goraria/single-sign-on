import { randomBytes } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { betterAuth } from "better-auth"
import { username } from "better-auth/plugins/username"
import { Browser, createFixture, fixtureOrigin } from "./fixtures/multi-session"
import { signInSchema } from "@/schemas/auth"

let browser: Browser
let requests: URL[]

beforeEach(() => {
  vi.resetModules()
  browser = new Browser(createFixture())
  requests = []
  vi.stubGlobal("window", {
    location: {
      origin: fixtureOrigin,
      href: `${fixtureOrigin}/auth/sign-in`,
      search: "",
    },
    addEventListener() {},
    removeEventListener() {},
  })
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init)
      requests.push(new URL(request.url))
      const headers = new Headers(request.headers)
      headers.set("Origin", fixtureOrigin)
      headers.set("Cookie", browser.cookie)
      return browser.accept(
        await browser.auth.handler(new Request(request, { headers }))
      )
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe("Better Auth username", () => {
  it.each([
    ["first@example.test", "email"],
    ["first.user", "username"],
  ])(
    "dispatches %s to the native %s sign-in endpoint",
    async (identifier, method) => {
      await browser.signup("First", "first@example.test", "first.user")
      await browser.request("sign-out", {})
      const { signInWithIdentifier } =
        await import("@/lib/auth/client/username")
      const result = await signInWithIdentifier(
        {
          identifier: ` ${identifier} `,
          password: "Fixture-password-only-2026!",
          rememberMe: false,
        },
        `${fixtureOrigin}/`
      )
      expect(result.error).toBeNull()
      expect(requests[0].pathname).toBe(`/auth/sign-in/${method}`)
      expect((await browser.current()).user.username).toBe("first.user")
      expect(result.data?.user).not.toHaveProperty("displayUsername")
    }
  )

  it("uses native availability and rejects a duplicate at registration even after a successful preflight", async () => {
    const { getUsernameAvailabilityError } =
      await import("@/lib/auth/client/username")
    expect(await getUsernameAvailabilityError("first.user")).toBeUndefined()
    expect(requests.at(-1)?.pathname).toBe("/auth/is-username-available")
    await browser.signup("First", "first@example.test", "first.user")
    expect(await getUsernameAvailabilityError("first.user")).toBe(
      "This username is already taken."
    )
    const duplicate = await browser.request("sign-up/email", {
      name: "Second",
      email: "second@example.test",
      username: "first.user",
      password: "Fixture-password-only-2026!",
    })
    expect(duplicate.ok).toBe(false)
    expect((await duplicate.json()).code).toBe("USERNAME_IS_ALREADY_TAKEN")
  })

  it("skips an unchanged profile username and updates a new username through the SDK", async () => {
    await browser.signup("First", "first@example.test", "first.user")
    const { getUsernameAvailabilityError } =
      await import("@/lib/auth/client/username")
    expect(
      await getUsernameAvailabilityError("first.user", undefined, "first.user")
    ).toBeUndefined()
    expect(requests).toHaveLength(0)
    expect(
      await getUsernameAvailabilityError("new.user", undefined, "first.user")
    ).toBeUndefined()
    const { auth } = await import("@/lib/auth/client")
    expect((await auth.updateUser({ username: "new.user" })).error).toBeNull()
    expect((await browser.current()).user.username).toBe("new.user")
    expect((await browser.current()).user).not.toHaveProperty("displayUsername")
  })

  it("does not query invalid names; reports server failures rather than treating them as available", async () => {
    const { getUsernameAvailabilityError } =
      await import("@/lib/auth/client/username")
    expect(await getUsernameAvailabilityError("bad!")).toBeTruthy()
    expect(requests).toHaveLength(0)
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Offline"))
    expect(await getUsernameAvailabilityError("valid.user")).toContain(
      "Unable to check"
    )
  })

  it("ignores a cancelled availability response", async () => {
    const { getUsernameAvailabilityError } =
      await import("@/lib/auth/client/username")
    const controller = new AbortController()
    controller.abort()
    expect(
      await getUsernameAvailabilityError("valid.user", controller.signal)
    ).toBeUndefined()
    expect(requests).toHaveLength(0)
  })

  it("ignores an old availability result after the user edits the field", async () => {
    let respond!: (value: Response) => void
    vi.mocked(fetch).mockImplementationOnce(
      async () =>
        await new Promise<Response>((resolve) => {
          respond = resolve
        })
    )
    const { getUsernameAvailabilityError } =
      await import("@/lib/auth/client/username")
    const controller = new AbortController()
    const pending = getUsernameAvailabilityError(
      "first.user",
      controller.signal
    )
    await vi.waitFor(() => expect(respond).toBeDefined())
    controller.abort()
    respond(Response.json({ available: false }))
    expect(await pending).toBeUndefined()
  })

  it("keeps email verification enforced for username sign-in without returning the user's email", async () => {
    const server = betterAuth({
      baseURL: fixtureOrigin,
      basePath: "/auth",
      secret: randomBytes(48).toString("base64url"),
      emailAndPassword: { enabled: true, requireEmailVerification: true },
      emailVerification: {
        sendOnSignIn: true,
        sendVerificationEmail: async () => {},
      },
      rateLimit: { enabled: false },
      logger: { disabled: true },
      plugins: [username({ displayUsername: false })],
    })
    const request = (path: string, body: Record<string, unknown>) =>
      server.handler(
        new Request(`${fixtureOrigin}/auth/${path}`, {
          method: "POST",
          headers: {
            Origin: fixtureOrigin,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
      )
    const created = await request("sign-up/email", {
      name: "Unverified",
      email: "unverified@example.test",
      username: "unverified.user",
      password: "Fixture-password-only-2026!",
    })
    expect(created.ok).toBe(true)
    const denied = await request("sign-in/username", {
      username: "unverified.user",
      password: "Fixture-password-only-2026!",
    })
    expect(denied.status).toBe(403)
    const data = await denied.json()
    expect(data.code).toBe("EMAIL_NOT_VERIFIED")
    expect(JSON.stringify(data)).not.toContain("unverified@example.test")
    expect(denied.headers.getSetCookie()).toHaveLength(0)
  })

  it("rejects invalid credentials and an untrusted origin in the native username endpoint", async () => {
    await browser.signup("First", "first@example.test", "first.user")
    const loggedInCookie = browser.cookie
    await browser.request("sign-out", {})
    const { signInWithIdentifier } = await import("@/lib/auth/client/username")
    const invalid = await signInWithIdentifier(
      {
        identifier: "first.user",
        password: "Wrong-password-only!",
        rememberMe: true,
      },
      `${fixtureOrigin}/`
    )
    expect(invalid.error?.code).toBe("INVALID_USERNAME_OR_PASSWORD")
    const denied = await browser.auth.handler(
      new Request(`${fixtureOrigin}/auth/sign-in/username`, {
        method: "POST",
        headers: {
          Origin: "https://evil.test",
          Cookie: loggedInCookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "first.user",
          password: "Fixture-password-only-2026!",
        }),
      })
    )
    expect(denied.status).toBe(403)
    expect(await browser.current()).toBeNull()
  })

  it("accepts email or username in the form schema without changing password requirements", () => {
    const credentials = { password: "Password-only!", rememberMe: true }
    for (const identifier of [" first.user ", "first@example.test"])
      expect(
        signInSchema.safeParse({ ...credentials, identifier }).success
      ).toBe(true)
    for (const identifier of ["", "bad@", "no", "bad space", "bad!"])
      expect(
        signInSchema.safeParse({ ...credentials, identifier }).success
      ).toBe(false)
  })
})
