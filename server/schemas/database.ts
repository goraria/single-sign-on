import z from "@gorth/structure/cores/zod"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod"

import {
  account,
  invitation,
  jwks,
  member,
  oauthAccessToken,
  oauthApplicationType,
  oauthClientAssertion,
  oauthClientResource,
  oauthClient,
  oauthConsent,
  oauthGrantType,
  oauthRefreshToken,
  oauthResource,
  oauthResponseType,
  oauthSubjectType,
  oauthTokenEndpointAuthMethod,
  organization,
  session,
  ssoProvider,
  userRole,
  userStatus,
  user,
  verification,
} from "@/database/schema"

export const userRoleSchema = createSelectSchema(userRole)
export const userStatusSchema = createSelectSchema(userStatus)
export const oauthGrantTypeSchema = createSelectSchema(oauthGrantType)
export const oauthResponseTypeSchema = createSelectSchema(oauthResponseType)
export const oauthTokenEndpointAuthMethodSchema = createSelectSchema(
  oauthTokenEndpointAuthMethod
)
export const oauthSubjectTypeSchema = createSelectSchema(oauthSubjectType)
export const oauthApplicationTypeSchema =
  createSelectSchema(oauthApplicationType)

export const oauthScopeSchema = z.enum([
  "openid",
  "profile",
  "email",
  "offline_access",
])

export const oauthClientMetadataSchema = z
  .object({
    description: z.string().nullable().optional(),
  })
  .catchall(z.unknown())

export const userSelectSchema = createSelectSchema(user)
export const userInsertSchema = createInsertSchema(user, {
  name: (schema) => schema.min(1).max(255),
  username: (schema) =>
    schema
      .min(3)
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/),
  email: (schema) => schema.max(255).email(),
  firstName: (schema) => schema.max(128),
  lastName: (schema) => schema.max(128),
})
export const userUpdateSchema = createUpdateSchema(user, {
  name: (schema) => schema.min(1).max(255),
  username: (schema) =>
    schema
      .min(3)
      .max(64)
      .regex(/^[a-zA-Z0-9._-]+$/),
  email: (schema) => schema.max(255).email(),
  firstName: (schema) => schema.max(128),
  lastName: (schema) => schema.max(128),
})

export const sessionSelectSchema = createSelectSchema(session)
export const sessionInsertSchema = createInsertSchema(session)
export const sessionUpdateSchema = createUpdateSchema(session)

export const accountSelectSchema = createSelectSchema(account)
export const accountInsertSchema = createInsertSchema(account)
export const accountUpdateSchema = createUpdateSchema(account)

export const verificationSelectSchema = createSelectSchema(verification)
export const verificationInsertSchema = createInsertSchema(verification)
export const verificationUpdateSchema = createUpdateSchema(verification)

export const jwksSelectSchema = createSelectSchema(jwks)
export const jwksInsertSchema = createInsertSchema(jwks)
export const jwksUpdateSchema = createUpdateSchema(jwks)

export const oauthClientSelectSchema = createSelectSchema(oauthClient)
export const oauthClientInsertSchema = createInsertSchema(oauthClient)
export const oauthClientUpdateSchema = createUpdateSchema(oauthClient)

export const oauthResourceSelectSchema = createSelectSchema(oauthResource)
export const oauthResourceInsertSchema = createInsertSchema(oauthResource)
export const oauthResourceUpdateSchema = createUpdateSchema(oauthResource)

export const oauthClientResourceSelectSchema =
  createSelectSchema(oauthClientResource)
export const oauthClientResourceInsertSchema =
  createInsertSchema(oauthClientResource)
export const oauthClientResourceUpdateSchema =
  createUpdateSchema(oauthClientResource)

export const oauthRefreshTokenSelectSchema =
  createSelectSchema(oauthRefreshToken)
export const oauthRefreshTokenInsertSchema =
  createInsertSchema(oauthRefreshToken)
export const oauthRefreshTokenUpdateSchema =
  createUpdateSchema(oauthRefreshToken)

export const oauthAccessTokenSelectSchema = createSelectSchema(oauthAccessToken)
export const oauthAccessTokenInsertSchema = createInsertSchema(oauthAccessToken)
export const oauthAccessTokenUpdateSchema = createUpdateSchema(oauthAccessToken)

export const oauthConsentSelectSchema = createSelectSchema(oauthConsent)
export const oauthConsentInsertSchema = createInsertSchema(oauthConsent)
export const oauthConsentUpdateSchema = createUpdateSchema(oauthConsent)

export const oauthClientAssertionSelectSchema =
  createSelectSchema(oauthClientAssertion)
export const oauthClientAssertionInsertSchema =
  createInsertSchema(oauthClientAssertion)
export const oauthClientAssertionUpdateSchema =
  createUpdateSchema(oauthClientAssertion)

export const ssoProviderSelectSchema = createSelectSchema(ssoProvider)
export const ssoProviderInsertSchema = createInsertSchema(ssoProvider)
export const ssoProviderUpdateSchema = createUpdateSchema(ssoProvider)

export const organizationSelectSchema = createSelectSchema(organization)
export const organizationInsertSchema = createInsertSchema(organization)
export const organizationUpdateSchema = createUpdateSchema(organization)

export const memberSelectSchema = createSelectSchema(member)
export const memberInsertSchema = createInsertSchema(member)
export const memberUpdateSchema = createUpdateSchema(member)

export const invitationSelectSchema = createSelectSchema(invitation)
export const invitationInsertSchema = createInsertSchema(invitation)
export const invitationUpdateSchema = createUpdateSchema(invitation)

export const databaseSchemas = {
  user: {
    select: userSelectSchema,
    insert: userInsertSchema,
    update: userUpdateSchema,
  },
  session: {
    select: sessionSelectSchema,
    insert: sessionInsertSchema,
    update: sessionUpdateSchema,
  },
  account: {
    select: accountSelectSchema,
    insert: accountInsertSchema,
    update: accountUpdateSchema,
  },
  verification: {
    select: verificationSelectSchema,
    insert: verificationInsertSchema,
    update: verificationUpdateSchema,
  },
  jwks: {
    select: jwksSelectSchema,
    insert: jwksInsertSchema,
    update: jwksUpdateSchema,
  },
  oauthClient: {
    select: oauthClientSelectSchema,
    insert: oauthClientInsertSchema,
    update: oauthClientUpdateSchema,
  },
  oauthResource: {
    select: oauthResourceSelectSchema,
    insert: oauthResourceInsertSchema,
    update: oauthResourceUpdateSchema,
  },
  oauthClientResource: {
    select: oauthClientResourceSelectSchema,
    insert: oauthClientResourceInsertSchema,
    update: oauthClientResourceUpdateSchema,
  },
  oauthRefreshToken: {
    select: oauthRefreshTokenSelectSchema,
    insert: oauthRefreshTokenInsertSchema,
    update: oauthRefreshTokenUpdateSchema,
  },
  oauthAccessToken: {
    select: oauthAccessTokenSelectSchema,
    insert: oauthAccessTokenInsertSchema,
    update: oauthAccessTokenUpdateSchema,
  },
  oauthConsent: {
    select: oauthConsentSelectSchema,
    insert: oauthConsentInsertSchema,
    update: oauthConsentUpdateSchema,
  },
  oauthClientAssertion: {
    select: oauthClientAssertionSelectSchema,
    insert: oauthClientAssertionInsertSchema,
    update: oauthClientAssertionUpdateSchema,
  },
  ssoProvider: {
    select: ssoProviderSelectSchema,
    insert: ssoProviderInsertSchema,
    update: ssoProviderUpdateSchema,
  },
  organization: {
    select: organizationSelectSchema,
    insert: organizationInsertSchema,
    update: organizationUpdateSchema,
  },
  member: {
    select: memberSelectSchema,
    insert: memberInsertSchema,
    update: memberUpdateSchema,
  },
  invitation: {
    select: invitationSelectSchema,
    insert: invitationInsertSchema,
    update: invitationUpdateSchema,
  },
}

export type UserData = z.infer<typeof userSelectSchema>
export type UserRoleData = z.infer<typeof userRoleSchema>
export type UserStatusData = z.infer<typeof userStatusSchema>
export type OAuthScopeData = z.infer<typeof oauthScopeSchema>
export type OAuthGrantTypeData = z.infer<typeof oauthGrantTypeSchema>
export type OAuthResponseTypeData = z.infer<typeof oauthResponseTypeSchema>
export type OAuthTokenEndpointAuthMethodData = z.infer<
  typeof oauthTokenEndpointAuthMethodSchema
>
export type OAuthSubjectTypeData = z.infer<typeof oauthSubjectTypeSchema>
export type OAuthApplicationTypeData = z.infer<
  typeof oauthApplicationTypeSchema
>
export type SessionData = z.infer<typeof sessionSelectSchema>
export type AccountData = z.infer<typeof accountSelectSchema>
export type VerificationData = z.infer<typeof verificationSelectSchema>
export type JwksData = z.infer<typeof jwksSelectSchema>
export type OAuthClientData = z.infer<typeof oauthClientSelectSchema>
export type OAuthResourceData = z.infer<typeof oauthResourceSelectSchema>
export type OAuthClientResourceData = z.infer<
  typeof oauthClientResourceSelectSchema
>
export type OAuthClientMetadataData = z.infer<typeof oauthClientMetadataSchema>
export type OAuthRefreshTokenData = z.infer<
  typeof oauthRefreshTokenSelectSchema
>
export type OAuthAccessTokenData = z.infer<typeof oauthAccessTokenSelectSchema>
export type OAuthConsentData = z.infer<typeof oauthConsentSelectSchema>
export type OAuthClientAssertionData = z.infer<
  typeof oauthClientAssertionSelectSchema
>
export type SsoProviderData = z.infer<typeof ssoProviderSelectSchema>
export type OrganizationData = z.infer<typeof organizationSelectSchema>
export type MemberData = z.infer<typeof memberSelectSchema>
export type InvitationData = z.infer<typeof invitationSelectSchema>
