import { afterEach, describe, expect, it, vi } from "vitest"
import { scheduleOAuthTimeout } from "@/lib/auth/client/timeout"
import { oauthTimeoutResult } from "@/lib/auth/server/timeout"

afterEach(() => vi.useRealTimers())

describe("120-second OAuth timeout", () => {
  it("returns to the app once at the deadline, without authorizing or logging out", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const navigate = vi.fn()
    const timer = scheduleOAuthTimeout(
      {
        url: "https://app.test/auth/exchange?error=access_denied",
        expiresAt: 121000,
      },
      navigate
    )
    vi.advanceTimersByTime(119999)
    expect(navigate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    timer.check()
    vi.advanceTimersByTime(120000)
    expect(navigate).toHaveBeenCalledTimes(1)
    timer.stop()
  })

  it("checks the absolute deadline after a suspended/background tab resumes", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const navigate = vi.fn()
    const timer = scheduleOAuthTimeout(
      { url: "https://app.test/", expiresAt: 121000 },
      navigate
    )
    vi.setSystemTime(121001)
    timer.check()
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it("cancels the timer on unmount and never resets its deadline after navigation", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const navigate = vi.fn()
    const timeout = { url: "https://app.test/", expiresAt: 121000 }
    const first = scheduleOAuthTimeout(timeout, navigate)
    vi.advanceTimersByTime(60000)
    first.stop()
    const next = scheduleOAuthTimeout(timeout, navigate)
    vi.advanceTimersByTime(60000)
    expect(navigate).toHaveBeenCalledTimes(1)
    next.stop()
  })

  it("only uses the exact registered callback and preserves state and issuer", () => {
    const query = new URLSearchParams({
      client_id: "test",
      redirect_uri: "https://app.test/auth/exchange",
      state: "fixture-state",
      sig: "already-verified-by-service",
      ba_iat: "1000",
      exp: "121",
    })
    const client = {
      disabled: false,
      redirectUris: ["https://app.test/auth/exchange"],
    }
    const result = oauthTimeoutResult(
      query,
      client,
      "https://sso.test/auth",
      2000
    )
    expect(result.expiresAt).toBe(121000)
    const callback = new URL(result.url)
    expect(callback.searchParams.get("state")).toBe("fixture-state")
    expect(callback.searchParams.get("iss")).toBe("https://sso.test/auth")
    expect(callback.searchParams.get("error")).toBe("access_denied")
    expect(callback.searchParams.has("code")).toBe(false)
    expect(() =>
      oauthTimeoutResult(
        query,
        { ...client, disabled: true },
        "https://sso.test/auth",
        2000
      )
    ).toThrow()
    expect(() =>
      oauthTimeoutResult(query, client, "https://sso.test/auth", 121000)
    ).toThrow()
    query.set("redirect_uri", "https://evil.test/")
    expect(() =>
      oauthTimeoutResult(query, client, "https://sso.test/auth", 2000)
    ).toThrow()
  })
})
