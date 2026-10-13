import { afterEach, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it("routine session reads use native caching; callers can request a fresh session explicitly", async () => {
  const paths: URL[] = []
  const requests: string[] = []
  vi.stubGlobal("window", {
    location: {
      origin: "https://sso.example.test",
      href: "https://sso.example.test/settings",
      search: "",
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      requests.push(input instanceof Request ? input.url : input.toString())
      paths.push(
        new URL(
          input instanceof Request ? input.url : input.toString(),
          "http://localhost"
        )
      )
      return Response.json(null)
    })
  )
  vi.resetModules()
  const { auth } = await import("@/lib/auth/client")
  await auth.getSession()
  expect(paths[0].pathname).toBe("/auth/get-session")
  expect(paths[0].searchParams.has("disableCookieCache")).toBe(false)
  expect(paths[0].origin).toBe("https://sso.example.test")
  await auth.signOut()
  const logout = paths.find((url) => url.pathname === "/auth/sign-out")
  expect(logout).toBeDefined()
  expect(logout!.searchParams.has("disableCookieCache")).toBe(false)
  await auth.$fetch("/get-session", { baseURL: "/auth" })
  expect(requests.at(-1)).toBe("/auth/get-session")
  await auth.getSession({ query: { disableCookieCache: true } })
  expect(paths.at(-1)!.searchParams.get("disableCookieCache")).toBe("true")
})
