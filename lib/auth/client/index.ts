import { createAuthClient } from "better-auth/react"
import { oauthProviderClient } from "@better-auth/oauth-provider/client"
import { ssoClient } from "@better-auth/sso/client"
import {
  adminClient,
  emailOTPClient,
  multiSessionClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins"
import { adminAccessControl, adminRoles } from "@/lib/auth/client/access"

const browserAuthOptions = {
  basePath: "/auth",
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchInterval: 0,
  },
  // Same-origin requests are handled by Better Auth through the local Hono
  // application. No HTTP hop to a separate SSO server is needed.
  fetchOptions: {
    credentials: "include" as const,
    headers: {
      "Content-Type": "application/json",
    },
  },
} satisfies NonNullable<Parameters<typeof createAuthClient>[0]>

export const auth = createAuthClient({
  ...browserAuthOptions,
  plugins: [
    multiSessionClient(),
    usernameClient({ displayUsername: false }),
    adminClient({
      ac: adminAccessControl,
      roles: adminRoles,
    }),
    emailOTPClient(),
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
    oauthProviderClient(),
    ssoClient(),
  ],
})

// Adding credentials is not OAuth authorization. This SDK intentionally has
// no oauthProviderClient auto-query injection: the signed request stays on the
// chooser URL and only oauth2.continue({ selected: true }) may complete it.
export const additionalAccountAuth = createAuthClient({
  ...browserAuthOptions,
  plugins: [multiSessionClient(), usernameClient({ displayUsername: false })],
})
