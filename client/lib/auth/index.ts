import { createAuthClient } from "@gorth/structure/cores/auth/client/index"
import { oauthProviderClient } from "@gorth/structure/cores/auth/client/oap"
import { ssoClient } from "@gorth/structure/cores/auth/client/sso"
import { apiBaseUrl } from "@/lib/utils/environment"

function getAuthClientOptions() {
  return {
    basePath: "/auth",
    baseURL: apiBaseUrl || "http://localhost:8080",
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
