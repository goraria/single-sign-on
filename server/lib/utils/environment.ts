import dotenv from "dotenv"

dotenv.config({
  path: ".env.local",
  override: false,
  debug: false,
  quiet: true,
})

export const nodeEnv = process.env.NODE_ENV
export const isProduction = nodeEnv === "production"
export const port = process.env.VITE_PUBLIC_PORT
export const jwtSecret = process.env.JWT_SECRET
export const sessionSecret = process.env.SESSION_SECRET
export const apiBaseUrl = process.env.VITE_PUBLIC_API_BASE_URL
export const authUrl = process.env.VITE_PUBLIC_AUTH_URL
export const allowedRedirectOrigins = process.env.VITE_PUBLIC_ALLOWED_REDIRECT_ORIGINS
export const betterAuthUrl = process.env.BETTER_AUTH_URL
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
export const ssoServerUrl = process.env.SSO_SERVER_URL
export const ssoInternalSecret = process.env.SSO_INTERNAL_SECRET
export const ssoClientInternalSecret = process.env.SSO_CLIENT_INTERNAL_SECRET
export const accessTokenSecret = process.env.SSO_ACCESS_TOKEN_SECRET
export const refreshTokenSecret = process.env.SSO_REFRESH_TOKEN_SECRET
export const accessTokenExpiresIn = process.env.SSO_ACCESS_TOKEN_EXPIRES_IN
export const refreshTokenExpiresIn = process.env.SSO_REFRESH_TOKEN_EXPIRES_IN
export const notificationCenterUrl = process.env.GORTH_PUBLIC_NOTIFICATION_CENTER_URL
export const paymentGatewayUrl = process.env.GORTH_PUBLIC_PAYMENT_GATEWAY_URL
export const searchEngineUrl = process.env.GORTH_PUBLIC_SEARCH_ENGINE_URL
export const billingSubscriptionUrl = process.env.GORTH_PUBLIC_BILLING_SUBSCRIPTION_URL
export const databaseUrl = process.env.DATABASE_URL
export const pgPoolMax = process.env.PG_POOL_MAX
export const supabaseUrl = process.env.SUPABASE_URL
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseDirectUrl = process.env.SUPABASE_DIRECT_URL
export const googleClientId = process.env.GOOGLE_CLIENT_ID
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
export const smtpService = process.env.SMTP_SERVICE
export const smtpHost = process.env.SMTP_HOST
export const smtpPort = Number(process.env.SMTP_PORT)
export const smtpSecure = process.env.SMTP_SECURE === "true"
export const smtpUser = process.env.SMTP_USER
export const smtpPassword = process.env.SMTP_PASS
export const emailFrom = process.env.EMAIL_FROM
export const emailFromName = process.env.EMAIL_FROM_NAME
export const emailReplyTo = process.env.EMAIL_REPLY_TO
export const clientUrl = process.env.VITE_PUBLIC_CLIENT_URL
export const mobileUrl = process.env.VITE_PUBLIC_MOBILE_URL
export const localUrl = process.env.VITE_PUBLIC_LOCAL_URL
export const serverUrl = process.env.VITE_PUBLIC_SERVER_URL
