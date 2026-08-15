import { betterAuth } from "@/lib/structure/auth"
import { drizzleAdapter } from "@/lib/structure/auth/adapters"
import { jwt, openAPI } from "@/lib/structure/auth/plugins"
import { oauthProvider } from "@/lib/structure/auth/oap"
import { sso } from "@/lib/structure/auth/sso"
import { dash } from "@gorth/structure/cores/auth/server/infra"
import {
  allowedRedirectOrigins,
  betterAuthUrl,
  expressClientUrl,
  expressJwtSecret,
  expressLocalUrl,
  expressMobileUrl,
  expressServerUrl,
  googleClientId,
  googleClientSecret,
  isExpressProduction,
} from "@/lib/utils/environment"
import {
  getStringClaim,
  getAudienceClaim,
  getTrustedOrigins,
  normalizeOrigin,
  splitOrigins,
} from "@/lib/utils/formatter"
// import { headers } from "next/headers"
// import { redirect } from "next/navigation"

import { database } from "@/database"
import { betterAuthSchema } from "@/database/schema"
import {
  getOAuthClientAudiences,
  getSsoApplicationContext,
  getTrustedOAuthClientIds,
} from "@/services/oauth-client"

const gorthAppClaim = "https://gorth.dev/claims/app"
const accessTokenExpiresIn = 60 * 60
const refreshTokenExpiresIn = 60 * 60 * 24 * 30

async function getGorthUserInfoClaims(
  payload: {
    client_id?: unknown
    azp?: unknown
    aud?: unknown
  },
  scopes: readonly string[]
) {
  const clientId =
    getStringClaim(payload.client_id) ?? getStringClaim(payload.azp)

  if (!clientId) return {}

  const application = await getSsoApplicationContext(clientId)

  return {
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
const validAudiences = await getOAuthClientAudiences(trustedOrigins)
const cachedTrustedClients = await getTrustedOAuthClientIds()

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: expressServerUrl!,
  secret: expressJwtSecret!,
  disabledPaths: ["/token"],
  trustedOrigins,
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: "/auth/sign-in",
      consentPage: "/auth/consent",
      signup: {
        page: "/auth/sign-up",
      },
      scopes: ["openid", "profile", "email", "offline_access"],
      validAudiences,
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
      silenceWarnings: {
        oauthAuthServerConfig: true,
        openidConfig: true,
      },
    }),
    openAPI(),
    dash(),
    sso(),
  ],
  database: drizzleAdapter(database, {
    provider: "pg",
    usePlural: true,
    schema: betterAuthSchema,
  }),
  session: {
    expiresIn: 86400,
    cookieCache: {
      enabled: true,
      maxAge: 120,
    },
    // updateAge: "1d",
  },
  advanced: {
    database: {
      generateId: false,
    },
    useSecureCookies: false,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isExpressProduction,
      sameSite: isExpressProduction ? "none" : "lax",
      partitioned: isExpressProduction,
      path: "/",
    },
    cookiePrefix: "gorth",
    cookies: {
      session_token: {
        // name: "session-token",
        attributes: {
          // Set custom cookie attributes
        },
      },
      session_data: {
        // name: "session-data",
        attributes: {
          // Set custom cookie attributes
        },
      },
    },
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: "app.example.com",
    // },
  },
  // pages: {
  //   signIn: "/login",
  // },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // password: {
    //   hash: (password: string) => {},
    //   verify: ({ password, hash }) => {}
    // }
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
      role: {
        type: ["user", "moderator", "administrator"],
        input: false,
        defaultValue: "user",
      },
    },
  },
  // databaseHooks: {
  //   account: {
  //     create: {
  //       before(account, context) {
  //         const withEncryptedTokens = { ...account }
  //         if (account.accessToken) {
  //           const encryptedAccessToken = encrypt(account.accessToken)
  //           withEncryptedTokens.accessToken = encryptedAccessToken
  //         }
  //         if (account.refreshToken) {
  //           const encryptedRefreshToken = encrypt(account.refreshToken)
  //           withEncryptedTokens.refreshToken = encryptedRefreshToken
  //         }
  //         return {
  //           data: withEncryptedTokens,
  //         }
  //       },
  //     },
  //   },
  // },
})
