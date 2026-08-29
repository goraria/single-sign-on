import z from "@/lib/structure/cores/zod"

export const userRoleSchema = z.enum(["user", "admin", "vice", "master"])

export const oauthScopeSchema = z.enum([
  "openid",
  "profile",
  "email",
  "offline_access",
])

export const oauthGrantTypeSchema = z.enum([
  "authorization_code",
  "refresh_token",
  "client_credentials",
])

export const oauthResponseTypeSchema = z.enum(["code"])

export const oauthTokenEndpointAuthMethodSchema = z.enum([
  "none",
  "client_secret_basic",
  "client_secret_post",
])

export const oauthSubjectTypeSchema = z.enum(["public", "pairwise"])

export const nullableDateSchema = z.coerce.date().nullable()
export const dateSchema = z.coerce.date()
export const jsonObjectSchema = z.record(z.string(), z.unknown())
export const oauthClientMetadataSchema = z
  .object({
    description: z.string().nullable().optional(),
  })
  .catchall(z.unknown())

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: userRoleSchema,
  bannedUntil: nullableDateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
})

export const sessionSchema = z.object({
  id: z.uuid(),
  expiresAt: dateSchema,
  token: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.uuid(),
})

export const accountSchema = z.object({
  id: z.uuid(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.uuid(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: nullableDateSchema,
  refreshTokenExpiresAt: nullableDateSchema,
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
})

export const verificationSchema = z.object({
  id: z.uuid(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: dateSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
})

export const jwksSchema = z.object({
  id: z.uuid(),
  publicKey: z.string(),
  privateKey: z.string(),
  createdAt: dateSchema,
  expiresAt: nullableDateSchema,
})

export const oauthClientSchema = z.object({
  id: z.uuid(),
  clientId: z.string(),
  clientSecret: z.string().nullable(),
  disabled: z.boolean().nullable(),
  skipConsent: z.boolean().nullable(),
  enableEndSession: z.boolean().nullable(),
  subjectType: oauthSubjectTypeSchema.nullable(),
  scopes: z.array(oauthScopeSchema).nullable(),
  userId: z.uuid().nullable(),
  createdAt: nullableDateSchema,
  updatedAt: nullableDateSchema,
  name: z.string().nullable(),
  uri: z.string().nullable(),
  icon: z.string().nullable(),
  contacts: z.array(z.string()).nullable(),
  tos: z.string().nullable(),
  policy: z.string().nullable(),
  softwareId: z.string().nullable(),
  softwareVersion: z.string().nullable(),
  softwareStatement: z.string().nullable(),
  redirectUris: z.array(z.string()),
  postLogoutRedirectUris: z.array(z.string()).nullable(),
  tokenEndpointAuthMethod: oauthTokenEndpointAuthMethodSchema.nullable(),
  grantTypes: z.array(oauthGrantTypeSchema).nullable(),
  responseTypes: z.array(oauthResponseTypeSchema).nullable(),
  public: z.boolean().nullable(),
  type: z.string().nullable(),
  requirePKCE: z.boolean().nullable(),
  referenceId: z.string().nullable(),
  metadata: oauthClientMetadataSchema.nullable(),
})

export const oauthRefreshTokenSchema = z.object({
  id: z.uuid(),
  token: z.string(),
  clientId: z.string(),
  sessionId: z.uuid().nullable(),
  userId: z.uuid(),
  referenceId: z.string().nullable(),
  expiresAt: nullableDateSchema,
  createdAt: nullableDateSchema,
  revoked: nullableDateSchema,
  authTime: nullableDateSchema,
  scopes: z.array(oauthScopeSchema),
})

export const oauthAccessTokenSchema = z.object({
  id: z.uuid(),
  token: z.string().nullable(),
  clientId: z.string(),
  sessionId: z.uuid().nullable(),
  userId: z.uuid().nullable(),
  referenceId: z.string().nullable(),
  refreshId: z.uuid().nullable(),
  expiresAt: nullableDateSchema,
  createdAt: nullableDateSchema,
  scopes: z.array(oauthScopeSchema),
})

export const oauthConsentSchema = z.object({
  id: z.uuid(),
  clientId: z.string(),
  userId: z.uuid().nullable(),
  referenceId: z.string().nullable(),
  scopes: z.array(oauthScopeSchema),
  createdAt: nullableDateSchema,
  updatedAt: nullableDateSchema,
})

export const ssoProviderSchema = z.object({
  id: z.uuid(),
  issuer: z.string(),
  oidcConfig: z.string().nullable(),
  samlConfig: z.string().nullable(),
  userId: z.uuid().nullable(),
  providerId: z.string(),
  organizationId: z.string().nullable(),
  domain: z.string(),
  domainVerified: z.boolean().nullable(),
})

export const databaseSchemas = {
  users: userSchema,
  sessions: sessionSchema,
  accounts: accountSchema,
  verifications: verificationSchema,
  jwkss: jwksSchema,
  oauthClients: oauthClientSchema,
  oauthRefreshTokens: oauthRefreshTokenSchema,
  oauthAccessTokens: oauthAccessTokenSchema,
  oauthConsents: oauthConsentSchema,
  ssoProviders: ssoProviderSchema,
}

export type UserData = z.infer<typeof userSchema>
export type UserRoleData = z.infer<typeof userRoleSchema>
export type OAuthScopeData = z.infer<typeof oauthScopeSchema>
export type OAuthGrantTypeData = z.infer<typeof oauthGrantTypeSchema>
export type OAuthResponseTypeData = z.infer<typeof oauthResponseTypeSchema>
export type OAuthTokenEndpointAuthMethodData = z.infer<
  typeof oauthTokenEndpointAuthMethodSchema
>
export type OAuthSubjectTypeData = z.infer<typeof oauthSubjectTypeSchema>
export type SessionData = z.infer<typeof sessionSchema>
export type AccountData = z.infer<typeof accountSchema>
export type VerificationData = z.infer<typeof verificationSchema>
export type JwksData = z.infer<typeof jwksSchema>
export type OAuthClientData = z.infer<typeof oauthClientSchema>
export type OAuthClientMetadataData = z.infer<typeof oauthClientMetadataSchema>
export type OAuthRefreshTokenData = z.infer<typeof oauthRefreshTokenSchema>
export type OAuthAccessTokenData = z.infer<typeof oauthAccessTokenSchema>
export type OAuthConsentData = z.infer<typeof oauthConsentSchema>
export type SsoProviderData = z.infer<typeof ssoProviderSchema>
