// Next loads root env files. Never import dotenv or read archived pkg env.
export const nodeEnv = process.env.NODE_ENV
export const isDevelopment = nodeEnv === "development"
export const isProduction = nodeEnv === "production"
export const appUrl = process.env.NEXT_PUBLIC_APP_URL
export const authSecret = process.env.NEXT_AUTH_SECRET
export const betterAuthUrl = process.env.BETTER_AUTH_URL
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
export const cookiePrefix = process.env.GORTH_COOKIE_PREFIX?.trim() || "gorth"
export const databaseUrl = process.env.DATABASE_URL
export const pgPoolMax = process.env.PG_POOL_MAX
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
