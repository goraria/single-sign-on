export interface AuthPageProps {
  searchParams: Promise<{
    redirect?: string | string[]
  }>
}

export interface SsoUser {
  id: string
  aud: "authenticated"
  email: string
  email_confirmed_at?: string | null
  phone?: string | null
  confirmed_at?: string | null
  last_sign_in_at?: string | null
  role?: string
  updated_at?: string | null
  created_at?: string | null
  app_metadata: Record<string, unknown>
  user_metadata: {
    name?: string | null
    full_name?: string | null
    avatar_url?: string | null
    picture?: string | null
  }
}

export interface SsoUserResponse {
  user: SsoUser
  sso_sub: string
  email?: string
}

export interface SsoAppContext {
  id: string
  origin: string
  redirect_uri: string
  next?: string | null
  issued_at?: number
}

export interface SsoExchangeResponse extends SsoUserResponse {
  access_token: string
  refresh_token: string
  gorth_app: SsoAppContext
}

export interface BetterAuthUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified?: boolean
  updatedAt?: Date | string | null
  createdAt?: Date | string | null
}
