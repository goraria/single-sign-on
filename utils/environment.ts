// Next loads root env files. Never import dotenv or read archived pkg env.
export const nodeEnv = process.env.NODE_ENV
export const isDevelopment = nodeEnv === "development"
export const isProduction = nodeEnv === "production"
export const appUrl = process.env.NEXT_PUBLIC_APP_URL
export const mediaAvatarBucketId = process.env.NEXT_MEDIA_AVATAR_BUCKET_ID
export const awsEndpointUrlS3 = process.env.AWS_ENDPOINT_URL_S3
export const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
export const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
export const awsRegion = process.env.AWS_REGION
export const awsBucket = process.env.AWS_BUCKET
export const authSecret = process.env.NEXT_AUTH_SECRET
export const betterAuthUrl = process.env.BETTER_AUTH_URL
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
export const cookiePrefix = process.env.GORTH_COOKIE_PREFIX?.trim() || "gorth"
export const databaseUrl = process.env.DATABASE_URL
export const pgPoolMax = process.env.PG_POOL_MAX
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
