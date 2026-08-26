import dotenv from "dotenv"

dotenv.config({
  path: ".env.local",
  // Runtime environment variables (Vercel, Docker, CI, etc.) must take
  // precedence over local development values.
  override: false,
  debug: false,
  quiet: true,
})

export const expressNodeEnv =
  import.meta.env.VITE_NODE_ENV ?? import.meta.env.NODE_ENV
export const expressEnv = import.meta.env.VITE_ENV ?? expressNodeEnv
export const isExpressProduction =
  expressEnv === "production" ||
  expressNodeEnv === "production" ||
  import.meta.env.VERCEL === "1"
export const port = import.meta.env.VITE_PORT
export const jwtSecret = import.meta.env.VITE_JWT_SECRET
export const expressSessionSecret = import.meta.env.VITE_SESSION_SECRET
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
export const authUrl = import.meta.env.VITE_AUTH_URL
export const allowedRedirectOrigins =
  import.meta.env.VITE_ALLOWED_REDIRECT_ORIGINS
export const betterAuthUrl =
  import.meta.env.BETTER_AUTH_URL ??
  import.meta.env.VITE_BETTER_AUTH_URL ??
  import.meta.env.VITE_AUTH_URL ??
  import.meta.env.VITE_SERVER_URL
export const betterAuthSecret =
  import.meta.env.BETTER_AUTH_SECRET ??
  import.meta.env.BETTER_AUTH_API_KEY
export const ssoServerUrl = import.meta.env.VITE_SSO_SERVER_URL
export const ssoInternalSecret = import.meta.env.VITE_SSO_INTERNAL_SECRET
export const ssoClientInternalSecret =
  import.meta.env.VITE_SSO_CLIENT_INTERNAL_SECRET
export const accessTokenSecret = import.meta.env.VITE_GORTH_ACCESS_TOKEN_SECRET
export const refreshTokenSecret = import.meta.env.VITE_GORTH_REFRESH_TOKEN_SECRET
export const accessTokenExpiresIn =
  import.meta.env.VITE_GORTH_ACCESS_TOKEN_EXPIRES_IN
export const refreshTokenExpiresIn =
  import.meta.env.VITE_GORTH_REFRESH_TOKEN_EXPIRES_IN
export const notificationCenterUrl = import.meta.env.VITE_NOTIFICATION_CENTER_URL
export const paymentGatewayUrl = import.meta.env.VITE_PAYMENT_GATEWAY_URL
export const searchEngineUrl = import.meta.env.VITE_SEARCH_ENGINE_URL
export const billingSubscriptionUrl =
  import.meta.env.VITE_BILLING_SUBSCRIPTION_URL
export const databaseUrl =
  process.env.DATABASE_URL ??
  import.meta.env.DATABASE_URL
export const pgPoolMax = import.meta.env.VITE_PG_POOL_MAX
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseServiceRoleKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
export const supabaseDirectUrl = import.meta.env.VITE_SUPABASE_DIRECT_URL
export const googleClientId =
  import.meta.env.GOOGLE_CLIENT_ID ?? import.meta.env.VITE_GOOGLE_CLIENT_ID
export const googleClientSecret =
  import.meta.env.GOOGLE_CLIENT_SECRET ?? import.meta.env.VITE_GOOGLE_CLIENT_SECRET
export const clientUrl = import.meta.env.VITE_CLIENT_URL
export const mobileUrl = import.meta.env.VITE_MOBILE_URL
export const localUrl = import.meta.env.VITE_LOCAL_URL
export const serverUrl = import.meta.env.VITE_SERVER_URL
