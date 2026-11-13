import "server-only"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  emailOTP,
  jwt,
  multiSession,
  openAPI,
  organization,
  username,
} from "better-auth/plugins"
import { waitUntil } from "@vercel/functions"
import { oauthProvider } from "@better-auth/oauth-provider"
import { generateOAuthClientId, generateOAuthClientSecret } from "@/utils/oauth-client-credentials"
import { sso } from "@better-auth/sso"
import { dash } from "@better-auth/infra"
import {
  betterAuthUrl,
  cookiePrefix,
  googleClientId,
  googleClientSecret,
  isProduction,
} from "@/utils/environment"
import {
  getAudienceClaim,
  getCorsOrigins,
  getStringClaim,
} from "@/utils/server/formatter"

import { database } from "@/database"
import { betterAuthSchema } from "@/database/schema"
import {
  getOAuthClientOrigins,
  getSsoApplicationContext,
} from "@/services/oauth-client"
import { getUserProfileClaims } from "@/services/user"
import { sendVerificationOtpEmail } from "@/lib/email/mailer"
import { adminAccessControl, adminRoles } from "@/lib/auth/server/access"
import { mediaAccess } from "@/lib/auth/server/media-access"
import { commerceTeamAccess } from "@/lib/auth/server/commerce-access"
import { commerceOrganization } from "@/lib/auth/server/commerce-organization"
import { adminAudit } from "@/lib/auth/server/admin-audit"
import { loadOAuthScopeRevision } from "@/services/oauth-registry"
import { oauthManagementReference } from "@/utils/oauth-management"
import { getOAuthAdministratorRole } from "@/services/oauth-management"
import { oidcScopes } from "@/schemas/oauth-registry"
import { onceAsync } from "@/utils/server/once"
import { allowLocalAppRedirect } from "@/utils/oauth-local-redirect"
import { basicClientRegistration } from "@/utils/oauth-client-authentication"

const gorthAppClaim = "https://gorth-auth.vercel.app/claims/app"
const accessTokenExpiresIn = 60 * 10
const refreshTokenExpiresIn = 60 * 60 * 24 * 30
const jwtOptions = { disableSettingJwtHeader: true }

function getNameParts(value: unknown) {
  if (typeof value !== "string") return null

  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return null

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  }
}

function synchronizeUserProfile<T extends Record<string, unknown>>(user: T) {
  const nameParts = getNameParts(user.name)
  return {
    ...user,
    ...(nameParts
      ? {
          firstName:
            typeof user.firstName === "string" && user.firstName.trim()
              ? user.firstName.trim()
              : nameParts.firstName,
          lastName:
            typeof user.lastName === "string" && user.lastName.trim()
              ? user.lastName.trim()
              : nameParts.lastName,
        }
      : {}),
  }
}

async function getGorthUserInfoClaims(
  payload: {
    sub?: unknown
    client_id?: unknown
    azp?: unknown
    aud?: unknown
  },
  scopes: readonly string[]
) {
  const userId = getStringClaim(payload.sub)
  const clientId =
    getStringClaim(payload.client_id) ?? getStringClaim(payload.azp)

  const profile =
    userId && scopes.includes("profile")
      ? await getUserProfileClaims(userId)
      : {}

  if (!clientId) return profile

  const application = await getSsoApplicationContext(clientId)

  return {
    ...profile,
    [gorthAppClaim]: {
      id: clientId,
      name: application?.name ?? null,
      origin: getAudienceClaim(payload.aud),
      homepage_url: application?.homepageUrl ?? null,
      scopes,
      provider: "better-auth-oauth-provider",
    },
  }
}

export function createAuth(scopes: string[]) {
  const auth = betterAuth({
    hooks: { before: basicClientRegistration },
    basePath: "/auth",
    baseURL: betterAuthUrl,
    // Better Auth reads BETTER_AUTH_SECRET directly. Keep its existing value;
    // this application does not configure versioned secret rotation.
    disabledPaths: ["/token"],
    // Initialization has no request and must not query the DB during a build.
    // Real requests still validate against the registered OAuth client origins.
    trustedOrigins: (request) =>
      request ? getOAuthClientOrigins(getCorsOrigins()) : getCorsOrigins(),
    plugins: [
      multiSession(),
      username({
        minUsernameLength: 5,
        maxUsernameLength: 32,
        displayUsername: false,
        usernameValidator: (value) => /^[a-z0-9._]+$/.test(value),
      }),
      admin({
        ac: adminAccessControl,
        roles: adminRoles,
        adminRoles: ["admin", "master"],
      }),

      // Reuse the same JWKS/signing configuration for OAuth and Media delegation.
      jwt(jwtOptions),
      mediaAccess(jwtOptions),
      adminAudit(),
      oauthProvider({
        generateClientId: generateOAuthClientId,
        generateClientSecret: generateOAuthClientSecret,
        allowInsecureRedirectUri: allowLocalAppRedirect,
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        selectAccount: {
          page: "/auth/select-account",
          shouldRedirect: async ({ headers }): Promise<boolean> => {
            const sessions = await auth.api.listDeviceSessions({ headers })
            return sessions.length > 1
          },
        },
        signup: {
          page: "/auth/sign-up",
        },
        scopes,
        clientRegistrationDefaultScopes: [...oidcScopes],
        clientRegistrationAllowedScopes: scopes,
        // Protected resources are persisted in oauth_resource. Bootstrap data
        // is idempotently seeded; later changes use the OAuth Provider resource
        // API. Runtime instances never rebuild the registry from environment.
        enforcePerClientResources: true,

        // Machine scope ceilings are administrative policy, never user consent.
        resourcePrivileges: async ({ user }) =>
          Boolean(await getOAuthAdministratorRole(user?.id)),
        clientReference: async ({ user }) =>
          (await getOAuthAdministratorRole(user?.id))
            ? oauthManagementReference
            : undefined,
        clientPrivileges: async ({ action, user }) => {
          const role = await getOAuthAdministratorRole(user?.id)
          return action === "configure-client-credentials-scopes"
            ? role === "master"
            : Boolean(role)
        },

        allowPublicClientPrelogin: true,
        accessTokenExpiresIn,
        m2mAccessTokenExpiresIn: accessTokenExpiresIn,
        refreshTokenExpiresIn,
        // A short grace window makes concurrent refreshes idempotent across
        // Vercel instances while preserving refresh-token rotation/replay checks.
        refreshTokenReuseInterval: 30,
        idTokenExpiresIn: 60 * 60 * 10,
        codeExpiresIn: 120,
        customIdTokenClaims: async ({ user, scopes }) =>
          scopes.includes("profile") ? getUserProfileClaims(user.id) : {},
        customUserInfoClaims: ({ jwt, scopes }) =>
          getGorthUserInfoClaims(jwt, scopes),
        customTokenResponseFields: () => ({
          refresh_token_expires_in: refreshTokenExpiresIn,
        }),
        rateLimit: {
          token: { window: 60, max: 30 },
          authorize: { window: 60, max: 30 },
          introspect: { window: 60, max: 120 },
          revoke: { window: 60, max: 60 },
          register: { window: 60, max: 5 },
          // Six resource servers validate revocation/ban through UserInfo. Keep
          // this token-authenticated endpoint above the aggregate serverless
          // egress rate while the database-backed global limiter remains active.
          userinfo: { window: 60, max: 1_000 },
        },
      }),

      openAPI(),

      dash(),

      sso(),

      organization({
        teams: {
          enabled: true,
        },
      }),
      commerceTeamAccess(),
      commerceOrganization(),

      emailOTP({
        otpLength: 6,
        expiresIn: 120,
        allowedAttempts: 3,
        storeOTP: "hashed",
        overrideDefaultEmailVerification: true,
        sendVerificationOnSignUp: true,
        resendStrategy: "rotate",
        rateLimit: {
          window: 120,
          max: 3,
        },
        async sendVerificationOTP({ email, otp, type }) {
          const delivery = sendVerificationOtpEmail({ email, otp, type }).catch(
            (error: unknown) => {
              console.error(
                "[verification-email-error]",
                error instanceof Error ? error.message : "Unknown email error"
              )
            }
          )

          waitUntil(delivery)
        },
      }),
    ],

    rateLimit: {
      enabled: isProduction,
      window: 60,
      max: 100,
      storage: "database",
      customRules: {
        "/oauth2/userinfo": { window: 60, max: 1_000 },
        "/auth/oauth2/userinfo": { window: 60, max: 1_000 },
      },
    },

    database: drizzleAdapter(database, {
      provider: "pg",
      // usePlural: true,
      schema: betterAuthSchema,
    }),

    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: synchronizeUserProfile(user) }),
        },
        update: {
          before: async (user) => ({ data: synchronizeUserProfile(user) }),
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24,

      cookieCache: {
        enabled: true,
        maxAge: 120,
      },
    },

    advanced: {
      backgroundTasks: {
        handler: (promise) => waitUntil(promise),
      },
      trustedProxyHeaders: isProduction,
      ipAddress: {
        ipAddressHeaders: ["x-real-ip"],
      },
      database: {
        generateId: false,
      },

      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        // A partitioned cookie created while SSO is top-level is not available
        // when another Vercel app calls SSO cross-site. SameSite=None + Secure
        // already provides the credentialed CORS behavior used by this system.
        partitioned: false,
        path: "/",
      },

      cookiePrefix,
    },

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
        ...coreFields,
        // Admin plugin fields must be present on the synthetic user used by
        // requireEmailVerification before the persistent user is created.
        role: "user",
        banned: false,
        banReason: null,
        banExpires: null,
        ...additionalFields,
        id,
      }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
    },
    socialProviders: {
      google: {
        clientId: googleClientId ?? "",
        clientSecret: googleClientSecret,
      },
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    user: {
      additionalFields: {
        firstName: {
          type: "string",
          required: false,
        },
        lastName: {
          type: "string",
          required: false,
        },
      },
    },
  })

  return auth
}

// One immutable policy snapshot and one Better Auth instance per runtime.
// Failed startup can retry; publishing never silently replaces a live instance.
export const getAuth = onceAsync(async () =>
  createAuth((await loadOAuthScopeRevision()).scopes)
)
