export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
export const apiAuthUrl = process.env.NEXT_PUBLIC_AUTH_URL
export const ssoServerUrl =
  process.env.SSO_SERVER_INTERNAL_URL ?? apiBaseUrl ?? "http://127.0.0.1:8080"
export const ssoPublicUrl = apiAuthUrl
export const redirectUrl = process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS
export const ssoClientUrl = process.env.NEXT_PUBLIC_SSO_CLIENT_URL
export const appUrl = process.env.NEXT_PUBLIC_APP_URL
