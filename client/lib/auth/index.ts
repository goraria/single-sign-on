import { createAuthClient } from "@gorth/structure/cores/auth/client/index"
import { oauthProviderClient } from "@gorth/structure/cores/auth/client/oap"
import { ssoClient } from "@gorth/structure/cores/auth/client/sso"

function getAuthClientOptions() {
  return {
    basePath: "/auth",
    // Keep browser auth requests on the SSO client origin. The Next route at
    // /auth/[...all] forwards them to the server and returns Set-Cookie on the
    // same origin used by layouts, proxy guards, and server components.
    fetchOptions: {
      credentials: "include" as const,
      headers: {
        "Content-Type": "application/json",
      },
    },
  }
}

export const auth = createAuthClient({
  ...getAuthClientOptions(),
  plugins: [oauthProviderClient(), ssoClient()],
})

// Account creation must not receive the signed OAuth query. The OAuth
// transaction is resumed explicitly with auth.oauth2.continue afterwards.
export const registrationAuth = createAuthClient(getAuthClientOptions())
