import dotenv from "dotenv"

dotenv.config({
  path: ".env.local",
  override: false,
  debug: false,
  quiet: true,
})

function readEnvironment(...keys: string[]) {
  const viteEnvironment = import.meta.env as
    Record<string, string | undefined> | undefined

  for (const key of keys) {
    const runtimeValue = process.env[key]

    if (runtimeValue?.trim()) return runtimeValue.trim()

    const viteValue = viteEnvironment?.[key]

    if (typeof viteValue === "string" && viteValue.trim()) {
      return viteValue.trim()
    }
  }

  return undefined
}

function normalizeUrl(value: string | undefined) {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value.replace(/\/$/, "")

  return `https://${value.replace(/\/$/, "")}`
}

const vercelDeploymentUrl = normalizeUrl(
  readEnvironment("VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL")
)

export const expressNodeEnv = readEnvironment("VITE_NODE_ENV", "NODE_ENV")
export const expressEnv = readEnvironment("VITE_ENV") ?? expressNodeEnv
export const isExpressProduction =
  expressEnv === "production" ||
  expressNodeEnv === "production" ||
  readEnvironment("VERCEL") === "1"
export const port = readEnvironment("VITE_PORT", "VITE_PUBLIC_PORT", "PORT")
export const jwtSecret = readEnvironment("VITE_JWT_SECRET")
export const expressSessionSecret = readEnvironment("VITE_SESSION_SECRET")
export const apiBaseUrl = readEnvironment("VITE_API_BASE_URL")
export const authUrl = readEnvironment("VITE_AUTH_URL")
export const allowedRedirectOrigins = readEnvironment(
  "VITE_ALLOWED_REDIRECT_ORIGINS"
)
export const betterAuthUrl =
  normalizeUrl(
    readEnvironment(
      "BETTER_AUTH_URL",
      "VITE_BETTER_AUTH_URL",
      "VITE_AUTH_URL",
      "VITE_SERVER_URL",
      "VITE_PUBLIC_SERVER_URL"
    )
  ) ?? vercelDeploymentUrl
export const betterAuthSecret = readEnvironment(
  "BETTER_AUTH_SECRET",
  "VITE_BETTER_AUTH_SECRET",
  "VITE_JWT_SECRET",
  "BETTER_AUTH_API_KEY",
  "VITE_BETTER_AUTH_API_KEY",
  "VITE_SESSION_SECRET"
)
export const ssoServerUrl = readEnvironment("VITE_SSO_SERVER_URL")
export const ssoInternalSecret = readEnvironment("VITE_SSO_INTERNAL_SECRET")
export const ssoClientInternalSecret = readEnvironment(
  "VITE_SSO_CLIENT_INTERNAL_SECRET"
)
export const accessTokenSecret = readEnvironment(
  "VITE_GORTH_ACCESS_TOKEN_SECRET"
)
export const refreshTokenSecret = readEnvironment(
  "VITE_GORTH_REFRESH_TOKEN_SECRET"
)
export const accessTokenExpiresIn = readEnvironment(
  "VITE_GORTH_ACCESS_TOKEN_EXPIRES_IN"
)
export const refreshTokenExpiresIn = readEnvironment(
  "VITE_GORTH_REFRESH_TOKEN_EXPIRES_IN"
)
export const notificationCenterUrl = readEnvironment(
  "VITE_NOTIFICATION_CENTER_URL"
)
export const paymentGatewayUrl = readEnvironment("VITE_PAYMENT_GATEWAY_URL")
export const searchEngineUrl = readEnvironment("VITE_SEARCH_ENGINE_URL")
export const billingSubscriptionUrl = readEnvironment(
  "VITE_BILLING_SUBSCRIPTION_URL"
)
export const databaseUrl = readEnvironment(
  "DATABASE_URL",
  "BETTER_AUTH_DATABASE_URL",
  "VITE_DATABASE_URL",
  "VITE_BETTER_AUTH_DATABASE_URL",
  "VITE_PUBLIC_DATABASE_URL"
)
export const pgPoolMax = readEnvironment("VITE_PG_POOL_MAX")
export const supabaseUrl = readEnvironment(
  "VITE_SUPABASE_URL",
  "VITE_PUBLIC_SUPABASE_URL"
)
export const supabaseAnonKey = readEnvironment(
  "VITE_SUPABASE_ANON_KEY",
  "VITE_PUBLIC_SUPABASE_ANON_KEY"
)
export const supabaseServiceRoleKey = readEnvironment(
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"
)
export const supabaseDirectUrl = readEnvironment(
  "VITE_SUPABASE_DIRECT_URL",
  "VITE_PUBLIC_SUPABASE_DIRECT_URL"
)
export const googleClientId = readEnvironment(
  "GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_CLIENT_ID"
)
export const googleClientSecret = readEnvironment(
  "GOOGLE_CLIENT_SECRET",
  "VITE_GOOGLE_CLIENT_SECRET"
)
export const smtpService = readEnvironment("VITE_SMTP_SERVICE", "SMTP_SERVICE")
export const smtpHost = readEnvironment("VITE_SMTP_HOST", "SMTP_HOST")
export const smtpPort = Number(
  readEnvironment("VITE_SMTP_PORT", "SMTP_PORT") ?? "587"
)
export const smtpSecure =
  readEnvironment("VITE_SMTP_SECURE", "SMTP_SECURE") === "true"
export const smtpUser = readEnvironment("VITE_SMTP_USER", "SMTP_USER")
export const smtpPassword = readEnvironment("VITE_SMTP_PASS", "SMTP_PASS")
export const emailFrom = readEnvironment("VITE_EMAIL_FROM", "EMAIL_FROM")
export const emailFromName =
  readEnvironment("VITE_EMAIL_FROM_NAME", "EMAIL_FROM_NAME") ?? "Gorth"
export const emailReplyTo = readEnvironment(
  "VITE_EMAIL_REPLY_TO",
  "EMAIL_REPLY_TO"
)
export const clientUrl = readEnvironment(
  "VITE_CLIENT_URL",
  "VITE_PUBLIC_CLIENT_URL"
)
export const mobileUrl = readEnvironment("VITE_MOBILE_URL")
export const localUrl = readEnvironment("VITE_LOCAL_URL")
export const serverUrl =
  normalizeUrl(readEnvironment("VITE_SERVER_URL", "VITE_PUBLIC_SERVER_URL")) ??
  vercelDeploymentUrl
