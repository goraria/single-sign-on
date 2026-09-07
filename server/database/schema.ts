import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm/_relations"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const userRole = pgEnum("user_role_enum", [
  "user",
  "admin",
  "vice",
  "master",
])

export const userStatus = pgEnum("user_status_enum", [
  "active",
  "inactive",
  "suspended",
  "deleted",
])

export const oauthGrantType = pgEnum("oauth_grant_type_enum", [
  "authorization_code",
  "refresh_token",
  "client_credentials",
])

export const oauthResponseType = pgEnum("oauth_response_type_enum", ["code"])

export const oauthTokenEndpointAuthMethod = pgEnum(
  "oauth_token_endpoint_auth_method_enum",
  ["none", "client_secret_basic", "client_secret_post"]
)

export const oauthSubjectType = pgEnum("oauth_subject_type_enum", [
  "public",
  "pairwise",
])

export const oauthApplicationType = pgEnum("oauth_application_type_enum", [
  "web",
  "native",
])

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().default(""),
    username: varchar("username", { length: 64 }),
    firstName: varchar("first_name", { length: 128 }),
    lastName: varchar("last_name", { length: 128 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRole("role").notNull().default("user"),
    status: userStatus("status").notNull().default("active"),
    bannedUntil: timestamp("banned_until", { mode: "date" }),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    bannedAt: timestamp("banned_at", { mode: "date" }),
    publicMetadata: jsonb("public_metadata")
      .notNull()
      .default(sql.raw("'{}'::jsonb")),
    privateMetadata: jsonb("private_metadata")
      .notNull()
      .default(sql.raw("'{}'::jsonb")),
    lastSignInAt: timestamp("last_sign_in_at", { mode: "date" }),
    lastActiveAt: timestamp("last_active_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_key").on(sql`lower(${table.username})`),
    index("users_status_idx").on(table.status),
    index("users_last_active_at_idx").on(table.lastActiveAt),
  ]
)

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeOrganizationId: uuid("active_organization_id"),
    activeTeamId: uuid("active_team_id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("sessions_token_key").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
  ]
)

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    issuer: text("issuer").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_key").on(
      table.providerId,
      table.accountId
    ),
    uniqueIndex("accounts_issuer_account_id_key").on(
      table.issuer,
      table.accountId
    ),
  ]
)

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)]
)

export const jwkss = pgTable("jwkss", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  alg: text("alg"),
  crv: text("crv"),
})

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientDiscoveryId: text("client_discovery_id"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: oauthSubjectType("subject_type"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("client_credentials_scopes")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    backchannelLogoutSessionRequired: boolean(
      "backchannel_logout_session_required"
    ),
    tokenEndpointAuthMethod: oauthTokenEndpointAuthMethod(
      "token_endpoint_auth_method"
    ),
    grantTypes: oauthGrantType("grant_types").array(),
    responseTypes: oauthResponseType("response_types").array(),
    applicationType: oauthApplicationType("application_type"),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    public: boolean("public"),
    type: text("type"),
    requirePKCE: boolean("require_pkce"),
    dpopBoundAccessTokens: boolean("dpop_bound_access_tokens")
      .notNull()
      .default(false),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauth_clients_user_id_idx").on(table.userId)]
)

export const oauthResources = pgTable("oauth_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: integer("access_token_ttl"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  allowedScopes: text("allowed_scopes").array(),
  customClaims: jsonb("custom_claims"),
  dpopBoundAccessTokensRequired: boolean("dpop_bound_access_tokens_required")
    .notNull()
    .default(false),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  policyVersion: integer("policy_version").notNull().default(1),
  metadata: jsonb("metadata"),
})

export const oauthClientResources = pgTable(
  "oauth_client_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResources.identifier, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("oauth_client_resources_client_id_idx").on(table.clientId),
    index("oauth_client_resources_resource_id_idx").on(table.resourceId),
    uniqueIndex("oauth_client_resources_client_resource_key").on(
      table.clientId,
      table.resourceId
    ),
  ]
)

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }),
    revoked: timestamp("revoked", { mode: "date" }),
    authTime: timestamp("auth_time", { mode: "date" }),
    rotatedAt: timestamp("rotated_at", { mode: "date" }),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: timestamp("rotation_replay_expires_at", {
      mode: "date",
    }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_refresh_tokens_token_key").on(table.token),
    index("oauth_refresh_tokens_client_id_idx").on(table.clientId),
    index("oauth_refresh_tokens_session_id_idx").on(table.sessionId),
    index("oauth_refresh_tokens_user_id_idx").on(table.userId),
    index("oauth_refresh_tokens_authorization_code_id_idx").on(
      table.authorizationCodeId
    ),
  ]
)

export const oauthAccessTokens = pgTable(
  "oauth_access_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token"),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: uuid("refresh_id").references(() => oauthRefreshTokens.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }),
    revoked: timestamp("revoked", { mode: "date" }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_access_tokens_token_key").on(table.token),
    index("oauth_access_tokens_client_id_idx").on(table.clientId),
    index("oauth_access_tokens_session_id_idx").on(table.sessionId),
    index("oauth_access_tokens_user_id_idx").on(table.userId),
    index("oauth_access_tokens_refresh_id_idx").on(table.refreshId),
    index("oauth_access_tokens_authorization_code_id_idx").on(
      table.authorizationCodeId
    ),
  ]
)

export const oauthConsents = pgTable(
  "oauth_consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }),
  },
  (table) => [
    index("oauth_consents_client_id_idx").on(table.clientId),
    index("oauth_consents_user_id_idx").on(table.userId),
  ]
)

export const oauthClientAssertions = pgTable("oauth_client_assertions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
})

export const ssoProviders = pgTable(
  "sso_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issuer: text("issuer").notNull(),
    oidcConfig: text("oidc_config"),
    samlConfig: text("saml_config"),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    providerId: text("provider_id").notNull(),
    organizationId: text("organization_id"),
    domain: text("domain").notNull(),
    domainVerified: boolean("domain_verified"),
  },
  (table) => [
    uniqueIndex("sso_providers_provider_id_key").on(table.providerId),
    index("sso_providers_user_id_idx").on(table.userId),
  ]
)

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_key").on(table.slug)]
)

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("members_organization_id_idx").on(table.organizationId),
    index("members_user_id_idx").on(table.userId),
    uniqueIndex("members_organization_user_key").on(
      table.organizationId,
      table.userId
    ),
  ]
)

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    memberCount: integer("member_count").notNull().default(0),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }),
  },
  (table) => [
    index("teams_organization_id_idx").on(table.organizationId),
  ]
)

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    membershipKey: text("membership_key").unique(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (table) => [
    index("team_members_team_id_idx").on(table.teamId),
    index("team_members_user_id_idx").on(table.userId),
  ]
)

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    teamId: uuid("team_id"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitations_organization_id_idx").on(table.organizationId),
    index("invitations_email_idx").on(table.email),
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  organizationMemberships: many(members),
  teamMemberships: many(teamMembers),
  sentOrganizationInvitations: many(invitations),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const oauthClientsRelations = relations(oauthClients, ({ many }) => ({
  resources: many(oauthClientResources),
}))

export const oauthResourcesRelations = relations(
  oauthResources,
  ({ many }) => ({
    clients: many(oauthClientResources),
  })
)

export const oauthClientResourcesRelations = relations(
  oauthClientResources,
  ({ one }) => ({
    client: one(oauthClients, {
      fields: [oauthClientResources.clientId],
      references: [oauthClients.clientId],
    }),
    resource: one(oauthResources, {
      fields: [oauthClientResources.resourceId],
      references: [oauthResources.identifier],
    }),
  })
)

export const organizationsRelations = relations(
  organizations,
  ({ many }) => ({
    members: many(members),
    invitations: many(invitations),
    teams: many(teams),
  })
)

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  teamMembers: many(teamMembers),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}))

export const betterAuthSchema = {
  users,
  sessions,
  accounts,
  verifications,
  jwks: jwkss,
  jwkss,
  oauthClients,
  oauthResources,
  oauthClientResources,
  oauthRefreshTokens,
  oauthAccessTokens,
  oauthConsents,
  oauthClientAssertions,
  ssoProviders,
  organizations,
  members,
  invitations,
  teams,
  teamMembers,
}

export type User = typeof users.$inferSelect
export type Session = typeof sessions.$inferSelect
export type Account = typeof accounts.$inferSelect
export type Verification = typeof verifications.$inferSelect
export type Jwks = typeof jwkss.$inferSelect
export type OAuthClient = typeof oauthClients.$inferSelect
export type OAuthResource = typeof oauthResources.$inferSelect
export type OAuthClientResource = typeof oauthClientResources.$inferSelect
export type OAuthRefreshToken = typeof oauthRefreshTokens.$inferSelect
export type OAuthAccessToken = typeof oauthAccessTokens.$inferSelect
export type OAuthConsent = typeof oauthConsents.$inferSelect
export type OAuthClientAssertion = typeof oauthClientAssertions.$inferSelect
export type SsoProvider = typeof ssoProviders.$inferSelect
export type Organization = typeof organizations.$inferSelect
export type Member = typeof members.$inferSelect
export type Invitation = typeof invitations.$inferSelect
export type Team = typeof teams.$inferSelect
export type TeamMember = typeof teamMembers.$inferSelect

export type UserRole = (typeof userRole.enumValues)[number]
export type UserStatus = (typeof userStatus.enumValues)[number]
export type OAuthGrantType = (typeof oauthGrantType.enumValues)[number]
export type OAuthResponseType = (typeof oauthResponseType.enumValues)[number]
export type OAuthTokenEndpointAuthMethod =
  (typeof oauthTokenEndpointAuthMethod.enumValues)[number]
export type OAuthSubjectType = (typeof oauthSubjectType.enumValues)[number]
export type OAuthApplicationType =
  (typeof oauthApplicationType.enumValues)[number]
