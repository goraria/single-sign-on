import { createAuthClient } from "@gorth/structure/cores/auth/client/index"
import { oauthProviderClient } from "@gorth/structure/cores/auth/client/oap"
import { ssoClient } from "@gorth/structure/cores/auth/client/sso"

function getOAuthProviderClient() {
  const plugin = oauthProviderClient()

  for (const fetchPlugin of plugin.fetchPlugins) {
    const onRequest = fetchPlugin.hooks.onRequest

    fetchPlugin.hooks.onRequest = async (context) => {
      const pathname = new URL(context.url, "http://localhost").pathname

      // Account creation is completed explicitly through oauth2.continue().
      // Avoid attaching the current signed OAuth query to signUp.email while
      // retaining the OAuth client plugin and its inferred methods.
      if (pathname.endsWith("/sign-up/email")) return

      return onRequest(context)
    }
  }

  return plugin
}

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
  plugins: [getOAuthProviderClient(), ssoClient()],
})
