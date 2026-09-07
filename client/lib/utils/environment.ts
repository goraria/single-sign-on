export const nodeEnv = process.env.NODE_ENV
export const isDevelopment = nodeEnv === "development"
export const isProduction = nodeEnv === "production"
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
export const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
export const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL
export const authUrl = process.env.NEXT_PUBLIC_AUTH_URL
export const authSecret = process.env.NEXT_AUTH_SECRET
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
export const accessToken = process.env.GORTH_ACCESS_TOKEN
export const refreshToken = process.env.GORTH_REFRESH_TOKEN
export const betterAuthApiKey = process.env.BETTER_AUTH_API_KEY
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
export const betterAuthUrl = process.env.BETTER_AUTH_URL
export const betterAuthDatabaseUrl = process.env.BETTER_AUTH_DATABASE_URL
export const betterAuthDatabaseSsl = process.env.BETTER_AUTH_DATABASE_SSL
export const googleClientId = process.env.GOOGLE_CLIENT_ID
export const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
export const facebookClientId = process.env.FACEBOOK_CLIENT_ID
export const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET
