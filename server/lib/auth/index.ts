import { betterAuth } from "@/lib/structure/auth"
import { drizzleAdapter } from "@/lib/structure/auth/adapters"
import { emailOTP, jwt, openAPI } from "@/lib/structure/auth/plugins"
import { oauthProvider } from "@/lib/structure/auth/oap"
import { sso } from "@/lib/structure/auth/sso"
import { dash } from "@gorth/structure/cores/auth/server/infra"
import {
  betterAuthSecret,
  betterAuthUrl,
  googleClientId,
  googleClientSecret,
  isExpressProduction,
} from "@/lib/utils/environment"
import {
  getAudienceClaim,
  getStringClaim,
  getTrustedOrigins,
} from "@/lib/utils/formatter"

import { database } from "@/database"
import { betterAuthSchema } from "@/database/schema"
import {
  getOAuthClientAudiences,
  getSsoApplicationContext,
  getTrustedOAuthClientIds,
} from "@/services/oauth-client"
import { getUserProfileClaims } from "@/services/user"
import { sendVerificationOtpEmail } from "@/lib/email/mailer"

const gorthAppClaim = "https://gorth.dev/claims/app"
const accessTokenExpiresIn = 60 * 60
const refreshTokenExpiresIn = 60 * 60 * 24 * 30

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
  const username =
    typeof user.username === "string" ? user.username.trim() : undefined

  if (
    username &&
    (username.length < 5 ||
      username.length > 32 ||
      !/^[a-z0-9._]+$/.test(username))
  ) {
    throw new Error("invalid_username")
  }

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
    ...(username ? { username } : {}),
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

const trustedOrigins = getTrustedOrigins()
const resources = await getOAuthClientAudiences(trustedOrigins)
const cachedTrustedClients = await getTrustedOAuthClientIds()

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  disabledPaths: ["/token"],
  trustedOrigins,
  plugins: [
    jwt({
      // Session reads do not need a freshly signed JWT response header.
      // OAuth endpoints still use the JWT/JWKS plugin normally, while
      // /get-session remains independent from legacy encrypted JWKS rows.
      disableSettingJwtHeader: true,
    }),
    oauthProvider({
      loginPage: "/auth/sign-in",
      consentPage: "/auth/consent",
      signup: {
        page: "/auth/sign-up",
      },
      scopes: ["openid", "profile", "email", "offline_access"],
      resources,
      enforcePerClientResources: false,

      cachedTrustedClients,
      allowPublicClientPrelogin: true,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      idTokenExpiresIn: 60 * 60 * 10,
      codeExpiresIn: 60 * 10,
      customUserInfoClaims: ({ jwt, scopes }) =>
        getGorthUserInfoClaims(jwt, scopes),
      customTokenResponseFields: () => ({
        refresh_token_expires_in: refreshTokenExpiresIn,
      }),
    }),

    openAPI(),

    dash(),

    sso(),

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
        await sendVerificationOtpEmail({ email, otp, type })
      },
    }),
  ],

  database: drizzleAdapter(database, {
    provider: "pg",
    usePlural: true,
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
    trustedProxyHeaders: isExpressProduction,
    database: {
      generateId: false,
    },

    useSecureCookies: false,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isExpressProduction,
      sameSite: isExpressProduction ? "none" : "lax",
      // A partitioned cookie created while SSO is top-level is not available
      // when another Vercel app calls SSO cross-site. SameSite=None + Secure
      // already provides the credentialed CORS behavior used by this system.
      partitioned: false,
      path: "/",
    },

    cookiePrefix: "gorth",
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
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
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      role: {
        type: ["user", "admin", "vice", "master"],
        input: false,
        defaultValue: "user",
      },
    },
  },
})
