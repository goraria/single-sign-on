import { randomBytes } from "node:crypto"
import { betterAuth } from "better-auth"
import { jwt, multiSession, username } from "better-auth/plugins"
import { oauthProvider } from "@better-auth/oauth-provider"

export const fixtureOrigin = "http://localhost:3300"

export function createFixture() {
  // Omitting database intentionally selects Better Auth's isolated memory DB.
  // Never import the application's database, auth config or environment here.
  const auth = betterAuth({
    baseURL: fixtureOrigin,
    basePath: "/auth",
    secret: randomBytes(48).toString("base64url"),
    trustedOrigins: [fixtureOrigin],
    // Better Auth defaults to skipping origin checks under NODE_ENV=test.
    // Exercise the real protection used by deployed applications instead.
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: false },
    logger: { disabled: true },
    session: { cookieCache: { enabled: true, maxAge: 120 } },
    plugins: [
      multiSession(),
      username({
        minUsernameLength: 5,
        maxUsernameLength: 32,
        displayUsername: false,
        usernameValidator: (value) => /^[a-z0-9._]+$/.test(value),
      }),
      jwt({ disableSettingJwtHeader: true }),
      oauthProvider({
        codeExpiresIn: 120,
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        selectAccount: {
          page: "/auth/select-account",
          shouldRedirect: async ({ headers }): Promise<boolean> =>
            (await auth.api.listDeviceSessions({ headers })).length > 1,
        },
      }),
    ],
  })
  return auth
}

export class Browser {
  readonly cookies = new Map<string, string>()
  constructor(readonly auth: ReturnType<typeof createFixture>) {}

  get cookie() {
    return [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; ")
  }

  accept(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";")
      const separator = pair.indexOf("=")
      const name = pair.slice(0, separator)
      const value = pair.slice(separator + 1)
      if (!value || /max-age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name)
      else this.cookies.set(name, value)
    }
    return response
  }

  async request(path: string, body?: Record<string, unknown>) {
    return this.accept(
      await this.auth.handler(
        new Request(`${fixtureOrigin}/auth/${path}`, {
          method: body ? "POST" : "GET",
          headers: {
            Cookie: this.cookie,
            Origin: fixtureOrigin,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        })
      )
    )
  }

  async signup(name: string, email: string, username?: string) {
    const response = await this.request("sign-up/email", {
      name,
      email,
      password: "Fixture-password-only-2026!",
      ...(username ? { username } : {}),
    })
    if (!response.ok)
      throw new Error(`Fixture sign-up failed (${response.status})`)
    const data = await response.json()
    return data.user as { id: string; email: string }
  }

  async current() {
    return (await this.request("get-session?disableCookieCache=true")).json()
  }
}
