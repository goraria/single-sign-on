import { createHash, randomBytes } from "node:crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { decodeJwt } from "@gorth/structure/cores/jose"
import { verifyOAuthQueryParams } from "@better-auth/oauth-provider"
import { Browser, createFixture, fixtureOrigin } from "./fixtures/multi-session"

let auth: ReturnType<typeof createFixture>
let browser: Browser
let query: URLSearchParams
let verifier: string
beforeEach(async () => {
  auth = createFixture()
  browser = new Browser(auth)
  await browser.signup("First", "first@example.test")
  const client = await auth.api.createOAuthClient({
    headers: new Headers({ Cookie: browser.cookie, Origin: fixtureOrigin }),
    body: {
      client_name: "Isolated test app",
      redirect_uris: ["https://app.example.test/auth/callback"],
      token_endpoint_auth_method: "none",
      scope: "openid profile email",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    },
  })
  verifier = randomBytes(48).toString("base64url")
  query = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: "https://app.example.test/auth/callback",
    response_type: "code",
    scope: "openid profile email",
    state: "fixture-state",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  })
})

function target(response: Response) {
  const location = response.headers.get("location")
  expect(location).toBeTruthy()
  return new URL(location!, fixtureOrigin)
}

describe("native OAuth select-account contract", () => {
  it("signs account selection with a 120-second expiry and verifies it server-side", async () => {
    query.set("prompt", "select_account")
    const selection = target(await browser.request(`oauth2/authorize?${query}`))
    const params = selection.searchParams
    const issuedAt = Number(params.get("ba_iat"))
    expect(Number(params.get("exp")) * 1000 - issuedAt).toBeGreaterThan(119000)
    expect(Number(params.get("exp")) * 1000 - issuedAt).toBeLessThanOrEqual(
      120000
    )
    const { secret } = await auth.$context
    expect(await verifyOAuthQueryParams(params.toString(), secret)).toBe(true)
    params.set("redirect_uri", "https://evil.test/")
    expect(await verifyOAuthQueryParams(params.toString(), secret)).toBe(false)
    params.set("redirect_uri", query.get("redirect_uri")!)
    vi.useFakeTimers({ toFake: ["Date"] })
    try {
      vi.setSystemTime(Number(params.get("exp")) * 1000 + 1)
      expect(await verifyOAuthQueryParams(params.toString(), secret)).toBe(
        false
      )
    } finally {
      vi.useRealTimers()
    }
  })
  it("does not ask for account selection when only one account is present", async () => {
    const response = await browser.request(`oauth2/authorize?${query}`)
    expect(target(response).pathname).toBe("/auth/consent")
  })

  it("offers multiple accounts and continues as the selected account, without looping", async () => {
    await browser.signup("Second", "second@example.test")
    const response = await browser.request(`oauth2/authorize?${query}`)
    const selection = target(response)
    expect(selection.pathname).toBe("/auth/select-account")
    expect(selection.searchParams.get("sig")).toBeTruthy()
    expect(selection.searchParams.get("state")).toBe("fixture-state")
    const sessions = await (
      await browser.request("multi-session/list-device-sessions")
    ).json()
    const first = sessions.find(
      (item: { user: { email: string } }) =>
        item.user.email === "first@example.test"
    )
    expect(
      (
        await browser.request("multi-session/set-active", {
          sessionToken: first.session.token,
        })
      ).ok
    ).toBe(true)
    const continued = await browser.request("oauth2/continue", {
      selected: true,
      oauth_query: selection.searchParams.toString(),
    })
    expect(continued.ok).toBe(true)
    const data = await continued.json()
    const destination = new URL(data.url ?? data.redirect_uri, fixtureOrigin)
    expect(destination.pathname).toBe("/auth/consent")
    expect((await browser.current()).user.email).toBe("first@example.test")
    // Consent still belongs to the original signed OAuth request and selected user.
    const consent = await browser.request("oauth2/consent", {
      accept: true,
      oauth_query: destination.searchParams.toString(),
    })
    expect(consent.ok).toBe(true)
    const consentData = await consent.json()
    const callback = new URL(consentData.url ?? consentData.redirect_uri)
    expect(callback.origin).toBe("https://app.example.test")
    expect(callback.searchParams.get("state")).toBe("fixture-state")
    expect(callback.searchParams.get("code")).toBeTruthy()
    const tokenResponse = await auth.handler(
      new Request(`${fixtureOrigin}/auth/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: query.get("client_id")!,
          redirect_uri: query.get("redirect_uri")!,
          code: callback.searchParams.get("code")!,
          code_verifier: verifier,
        }),
      })
    )
    expect(tokenResponse.ok).toBe(true)
    const tokens = await tokenResponse.json()
    expect(decodeJwt(tokens.id_token).sub).toBe(first.user.id)
  })

  it("honors prompt=select_account even with a single signed-in account", async () => {
    query.set("prompt", "select_account")
    const selection = target(await browser.request(`oauth2/authorize?${query}`))
    expect(selection.pathname).toBe("/auth/select-account")
    const continued = await browser.request("oauth2/continue", {
      selected: true,
      oauth_query: selection.searchParams.toString(),
    })
    expect(continued.ok).toBe(true)
    const data = await continued.json()
    expect(new URL(data.url ?? data.redirect_uri, fixtureOrigin).pathname).toBe(
      "/auth/consent"
    )
  })

  it("adds credentials without automatically completing the signed OAuth request", async () => {
    await browser.signup("Second", "second@example.test")
    const selection = target(await browser.request(`oauth2/authorize?${query}`))
    const other = new Browser(auth)
    await other.signup("Third", "third@example.test")
    // The add-account SDK omits oauthProviderClient, so no oauth_query is
    // attached to credential entry. It only preserves it in the callback URL.
    const signedIn = await browser.request("sign-in/email", {
      email: "third@example.test",
      password: "Fixture-password-only-2026!",
      callbackURL: `${fixtureOrigin}/auth/select-account?${selection.searchParams}`,
    })
    expect(signedIn.ok).toBe(true)
    const result = await signedIn.json()
    expect(result.user.email).toBe("third@example.test")
    expect(new URL(result.url, fixtureOrigin).pathname).toBe(
      "/auth/select-account"
    )
    expect(new URL(result.url, fixtureOrigin).searchParams.get("sig")).toBe(
      selection.searchParams.get("sig")
    )
    expect(
      new URL(result.url, fixtureOrigin).searchParams.get("code")
    ).toBeNull()
    expect((await browser.current()).user.email).toBe("third@example.test")
    expect(
      await (await browser.request("multi-session/list-device-sessions")).json()
    ).toHaveLength(3)
    const continued = await browser.request("oauth2/continue", {
      selected: true,
      oauth_query: selection.searchParams.toString(),
    })
    expect(continued.ok).toBe(true)
  })

  it("rejects a tampered signed query instead of authorizing it", async () => {
    await browser.signup("Second", "second@example.test")
    const selection = target(await browser.request(`oauth2/authorize?${query}`))
    selection.searchParams.set("redirect_uri", "https://evil.example/callback")
    const continued = await browser.request("oauth2/continue", {
      selected: true,
      oauth_query: selection.searchParams.toString(),
    })
    expect(continued.ok).toBe(false)
    expect(continued.headers.get("location")).toBeNull()
  })

  it("fails prompt=none with account_selection_required rather than displaying interactive UI", async () => {
    await browser.signup("Second", "second@example.test")
    query.set("prompt", "none")
    const callback = target(await browser.request(`oauth2/authorize?${query}`))
    expect(callback.origin).toBe("https://app.example.test")
    expect(callback.searchParams.get("error")).toBe(
      "account_selection_required"
    )
  })
})
