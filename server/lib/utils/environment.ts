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
export const authUrl = process.env.VITE_PUBLIC_AUTH_URL
export const clientUrl = process.env.VITE_PUBLIC_CLIENT_URL
export const mobileUrl = process.env.VITE_PUBLIC_MOBILE_URL
export const serverUrl = process.env.VITE_PUBLIC_SERVER_URL
export const authSecret = process.env.VITE_AUTH_SECRET
export const sessionSecret = process.env.VITE_SESSION_SECRET
export const betterAuthUrl = process.env.BETTER_AUTH_URL
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
export const accessToken = process.env.GORTH_ACCESS_TOKEN
export const refreshToken = process.env.GORTH_REFRESH_TOKEN
export const accessTokenSecret = process.env.GORTH_ACCESS_TOKEN_SECRET
export const refreshTokenSecret = process.env.GORTH_REFRESH_TOKEN_SECRET
export const accessTokenExpiresIn = process.env.GORTH_ACCESS_TOKEN_EXPIRES_IN
export const refreshTokenExpiresIn = process.env.GORTH_REFRESH_TOKEN_EXPIRES_IN
export const databaseUrl = process.env.DATABASE_URL
export const pgPoolMax = process.env.PG_POOL_MAX
export const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY
export const supabasePublishableKey =
  process.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
export const supabasePublishableOrAnonKey =
  process.env.SUPABASE_PUBLISHABLE_OR_ANON_KEY
export const supabasePublishableDefaultKey =
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY
export const supabaseBucket = process.env.SUPABASE_BUCKET
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
