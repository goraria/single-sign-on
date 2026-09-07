import z from "@/lib/structure/cores/zod"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod"

import {
  accounts,
  invitations,
  jwkss,
  members,
  oauthAccessTokens,
  oauthApplicationType,
  oauthClientAssertions,
  oauthClientResources,
  oauthClients,
  oauthConsents,
  oauthGrantType,
  oauthRefreshTokens,
  oauthResources,
  oauthResponseType,
  oauthSubjectType,
  oauthTokenEndpointAuthMethod,
  organizations,
  sessions,
  ssoProviders,
  teamMembers,
  teams,
  userRole,
  userStatus,
  users,
  verifications,
} from "@/database/schema"

export const userRoleSchema = createSelectSchema(userRole)
export const userStatusSchema = createSelectSchema(userStatus)
export const oauthGrantTypeSchema = createSelectSchema(oauthGrantType)
export const oauthResponseTypeSchema = createSelectSchema(oauthResponseType)
export const oauthTokenEndpointAuthMethodSchema = createSelectSchema(
  oauthTokenEndpointAuthMethod
)
export const oauthSubjectTypeSchema = createSelectSchema(oauthSubjectType)
export const oauthApplicationTypeSchema = createSelectSchema(
  oauthApplicationType
)

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

export const userSelectSchema = createSelectSchema(users)
export const userInsertSchema = createInsertSchema(users, {
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
export const userUpdateSchema = createUpdateSchema(users, {
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

export const sessionSelectSchema = createSelectSchema(sessions)
export const sessionInsertSchema = createInsertSchema(sessions)
export const sessionUpdateSchema = createUpdateSchema(sessions)

export const accountSelectSchema = createSelectSchema(accounts)
export const accountInsertSchema = createInsertSchema(accounts)
export const accountUpdateSchema = createUpdateSchema(accounts)

export const verificationSelectSchema = createSelectSchema(verifications)
export const verificationInsertSchema = createInsertSchema(verifications)
export const verificationUpdateSchema = createUpdateSchema(verifications)

export const jwksSelectSchema = createSelectSchema(jwkss)
export const jwksInsertSchema = createInsertSchema(jwkss)
export const jwksUpdateSchema = createUpdateSchema(jwkss)

export const oauthClientSelectSchema = createSelectSchema(oauthClients)
export const oauthClientInsertSchema = createInsertSchema(oauthClients)
export const oauthClientUpdateSchema = createUpdateSchema(oauthClients)

export const oauthResourceSelectSchema = createSelectSchema(oauthResources)
export const oauthResourceInsertSchema = createInsertSchema(oauthResources)
export const oauthResourceUpdateSchema = createUpdateSchema(oauthResources)

export const oauthClientResourceSelectSchema =
  createSelectSchema(oauthClientResources)
export const oauthClientResourceInsertSchema =
  createInsertSchema(oauthClientResources)
export const oauthClientResourceUpdateSchema =
  createUpdateSchema(oauthClientResources)

export const oauthRefreshTokenSelectSchema =
  createSelectSchema(oauthRefreshTokens)
export const oauthRefreshTokenInsertSchema =
  createInsertSchema(oauthRefreshTokens)
export const oauthRefreshTokenUpdateSchema =
  createUpdateSchema(oauthRefreshTokens)

export const oauthAccessTokenSelectSchema = createSelectSchema(oauthAccessTokens)
export const oauthAccessTokenInsertSchema = createInsertSchema(oauthAccessTokens)
export const oauthAccessTokenUpdateSchema = createUpdateSchema(oauthAccessTokens)

export const oauthConsentSelectSchema = createSelectSchema(oauthConsents)
export const oauthConsentInsertSchema = createInsertSchema(oauthConsents)
export const oauthConsentUpdateSchema = createUpdateSchema(oauthConsents)

export const oauthClientAssertionSelectSchema =
  createSelectSchema(oauthClientAssertions)
export const oauthClientAssertionInsertSchema =
  createInsertSchema(oauthClientAssertions)
export const oauthClientAssertionUpdateSchema =
  createUpdateSchema(oauthClientAssertions)

export const ssoProviderSelectSchema = createSelectSchema(ssoProviders)
export const ssoProviderInsertSchema = createInsertSchema(ssoProviders)
export const ssoProviderUpdateSchema = createUpdateSchema(ssoProviders)

export const organizationSelectSchema = createSelectSchema(organizations)
export const organizationInsertSchema = createInsertSchema(organizations)
export const organizationUpdateSchema = createUpdateSchema(organizations)

export const memberSelectSchema = createSelectSchema(members)
export const memberInsertSchema = createInsertSchema(members)
export const memberUpdateSchema = createUpdateSchema(members)

export const teamSelectSchema = createSelectSchema(teams)
export const teamInsertSchema = createInsertSchema(teams)
export const teamUpdateSchema = createUpdateSchema(teams)

export const teamMemberSelectSchema = createSelectSchema(teamMembers)
export const teamMemberInsertSchema = createInsertSchema(teamMembers)
export const teamMemberUpdateSchema = createUpdateSchema(teamMembers)

export const invitationSelectSchema = createSelectSchema(invitations)
export const invitationInsertSchema = createInsertSchema(invitations)
export const invitationUpdateSchema = createUpdateSchema(invitations)

export const databaseSchemas = {
  users: {
    select: userSelectSchema,
    insert: userInsertSchema,
    update: userUpdateSchema,
  },
  sessions: {
    select: sessionSelectSchema,
    insert: sessionInsertSchema,
    update: sessionUpdateSchema,
  },
  accounts: {
    select: accountSelectSchema,
    insert: accountInsertSchema,
    update: accountUpdateSchema,
  },
  verifications: {
    select: verificationSelectSchema,
    insert: verificationInsertSchema,
    update: verificationUpdateSchema,
  },
  jwkss: {
    select: jwksSelectSchema,
    insert: jwksInsertSchema,
    update: jwksUpdateSchema,
  },
  oauthClients: {
    select: oauthClientSelectSchema,
    insert: oauthClientInsertSchema,
    update: oauthClientUpdateSchema,
  },
  oauthResources: {
    select: oauthResourceSelectSchema,
    insert: oauthResourceInsertSchema,
    update: oauthResourceUpdateSchema,
  },
  oauthClientResources: {
    select: oauthClientResourceSelectSchema,
    insert: oauthClientResourceInsertSchema,
    update: oauthClientResourceUpdateSchema,
  },
  oauthRefreshTokens: {
    select: oauthRefreshTokenSelectSchema,
    insert: oauthRefreshTokenInsertSchema,
    update: oauthRefreshTokenUpdateSchema,
  },
  oauthAccessTokens: {
    select: oauthAccessTokenSelectSchema,
    insert: oauthAccessTokenInsertSchema,
    update: oauthAccessTokenUpdateSchema,
  },
  oauthConsents: {
    select: oauthConsentSelectSchema,
    insert: oauthConsentInsertSchema,
    update: oauthConsentUpdateSchema,
  },
  oauthClientAssertions: {
    select: oauthClientAssertionSelectSchema,
    insert: oauthClientAssertionInsertSchema,
    update: oauthClientAssertionUpdateSchema,
  },
  ssoProviders: {
    select: ssoProviderSelectSchema,
    insert: ssoProviderInsertSchema,
    update: ssoProviderUpdateSchema,
  },
  organizations: {
    select: organizationSelectSchema,
    insert: organizationInsertSchema,
    update: organizationUpdateSchema,
  },
  members: {
    select: memberSelectSchema,
    insert: memberInsertSchema,
    update: memberUpdateSchema,
  },
  teams: {
    select: teamSelectSchema,
    insert: teamInsertSchema,
    update: teamUpdateSchema,
  },
  teamMembers: {
    select: teamMemberSelectSchema,
    insert: teamMemberInsertSchema,
    update: teamMemberUpdateSchema,
  },
  invitations: {
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
export type OAuthClientMetadataData = z.infer<
  typeof oauthClientMetadataSchema
>
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
export type TeamData = z.infer<typeof teamSelectSchema>
export type TeamMemberData = z.infer<typeof teamMemberSelectSchema>
export type InvitationData = z.infer<typeof invitationSelectSchema>
