import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm/_relations"
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

const timestampConfig = { mode: "date", withTimezone: true } as const

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

export const auditOutcome = pgEnum("audit_outcome_enum", ["success", "failure"])

export const authenticationEventType = pgEnum(
  "authentication_event_type_enum",
  [
    "sign_up",
    "sign_in",
    "sign_out",
    "password_change",
    "password_reset",
    "email_verified",
    "mfa_challenge",
    "account_linked",
    "account_unlinked",
  ]
)

export const user = pgTable(
  "user",
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
    banned: boolean("banned").notNull().default(false),
    status: userStatus("status").notNull().default("active"),
    banExpires: timestamp("ban_expires", timestampConfig),
    banReason: text("ban_reason"),
    deletedAt: timestamp("deleted_at", timestampConfig),
    bannedAt: timestamp("banned_at", timestampConfig),
    publicMetadata: jsonb("public_metadata")
      .notNull()
      .default(sql.raw("'{}'::jsonb")),
    privateMetadata: jsonb("private_metadata")
      .notNull()
      .default(sql.raw("'{}'::jsonb")),
    lastSignInAt: timestamp("last_sign_in_at", timestampConfig),
    lastActiveAt: timestamp("last_active_at", timestampConfig),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_username_key").on(sql`lower(${table.username})`),
    index("user_status_idx").on(table.status),
    index("user_last_active_at_idx").on(table.lastActiveAt),
  ]
)

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", timestampConfig).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    activeOrganizationId: uuid("active_organization_id"),
    activeTeamId: uuid("active_team_id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("session_token_key").on(table.token),
    index("session_user_id_idx").on(table.userId),
  ]
)

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    issuer: text("issuer"),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_key").on(
      table.providerId,
      table.accountId
    ),
    uniqueIndex("account_issuer_account_id_key").on(
      table.issuer,
      table.accountId
    ),
  ]
)

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", timestampConfig).notNull(),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export const jwks = pgTable("jwks", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", timestampConfig),
  alg: text("alg"),
  crv: text("crv"),
})

export const projectConfig = pgTable(
  "project_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    endpointId: text("endpoint_id").notNull(),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
    trustedOrigins: jsonb("trusted_origins").notNull(),
    socialProviders: jsonb("social_providers").notNull(),
    emailProvider: jsonb("email_provider"),
    emailAndPassword: jsonb("email_and_password"),
    allowLocalhost: boolean("allow_localhost").notNull(),
    pluginConfigs: jsonb("plugin_configs"),
    webhookConfig: jsonb("webhook_config"),
  },
  (table) => [
    uniqueIndex("project_config_endpoint_id_key").on(table.endpointId),
  ]
)

export const oauthClient = pgTable(
  "oauth_client",
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
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", timestampConfig).defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).defaultNow(),
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
  (table) => [index("oauth_client_user_id_idx").on(table.userId)]
)

export const oauthResource = pgTable("oauth_resource", {
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
  createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  policyVersion: integer("policy_version").notNull().default(1),
  metadata: jsonb("metadata"),
})

export const oauthClientResource = pgTable(
  "oauth_client_resource",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResource.identifier, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    index("oauth_client_resource_client_id_idx").on(table.clientId),
    index("oauth_client_resource_resource_id_idx").on(table.resourceId),
    uniqueIndex("oauth_client_resource_client_resource_key").on(
      table.clientId,
      table.resourceId
    ),
  ]
)

export const oauthRefreshToken = pgTable(
  "oauth_refresh_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: timestamp("expires_at", timestampConfig),
    createdAt: timestamp("created_at", timestampConfig),
    revoked: timestamp("revoked", timestampConfig),
    authTime: timestamp("auth_time", timestampConfig),
    rotatedAt: timestamp("rotated_at", timestampConfig),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: timestamp("rotation_replay_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_refresh_token_token_key").on(table.token),
    index("oauth_refresh_token_client_id_idx").on(table.clientId),
    index("oauth_refresh_token_session_id_idx").on(table.sessionId),
    index("oauth_refresh_token_user_id_idx").on(table.userId),
    index("oauth_refresh_token_authorization_code_id_idx").on(
      table.authorizationCodeId
    ),
  ]
)

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token"),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: uuid("refresh_id").references(() => oauthRefreshToken.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", timestampConfig),
    createdAt: timestamp("created_at", timestampConfig),
    revoked: timestamp("revoked", timestampConfig),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_access_token_token_key").on(table.token),
    index("oauth_access_token_client_id_idx").on(table.clientId),
    index("oauth_access_token_session_id_idx").on(table.sessionId),
    index("oauth_access_token_user_id_idx").on(table.userId),
    index("oauth_access_token_refresh_id_idx").on(table.refreshId),
    index("oauth_access_token_authorization_code_id_idx").on(
      table.authorizationCodeId
    ),
  ]
)

export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at", timestampConfig),
    updatedAt: timestamp("updated_at", timestampConfig),
  },
  (table) => [
    index("oauth_consent_client_id_idx").on(table.clientId),
    index("oauth_consent_user_id_idx").on(table.userId),
  ]
)

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", timestampConfig).notNull(),
})

export const ssoProvider = pgTable(
  "sso_provider",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issuer: text("issuer").notNull(),
    oidcConfig: text("oidc_config"),
    samlConfig: text("saml_config"),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    providerId: text("provider_id").notNull(),
    organizationId: text("organization_id"),
    domain: text("domain").notNull(),
    domainVerified: boolean("domain_verified"),
  },
  (table) => [
    uniqueIndex("sso_provider_provider_id_key").on(table.providerId),
    index("sso_provider_user_id_idx").on(table.userId),
  ]
)

export const organization = pgTable(
  "organization",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("organization_slug_key").on(table.slug)]
)

export const team = pgTable(
  "auth_team",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    memberCount: integer("member_count").notNull().default(0),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig),
  },
  (table) => [index("auth_team_organization_id_idx").on(table.organizationId)]
)

export const teamMember = pgTable(
  "auth_team_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    membershipKey: text("membership_key").unique(),
    createdAt: timestamp("created_at", timestampConfig).defaultNow(),
  },
  (table) => [
    index("auth_team_member_team_id_idx").on(table.teamId),
    index("auth_team_member_user_id_idx").on(table.userId),
  ]
)

export const member = pgTable(
  "member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
    uniqueIndex("member_organization_user_key").on(
      table.organizationId,
      table.userId
    ),
  ]
)

export const invitation = pgTable(
  "invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    teamId: uuid("team_id").references(() => team.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", timestampConfig).notNull(),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    inviterId: uuid("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
)

export const rateLimit = pgTable(
  "rate_limit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [index("rate_limit_key_idx").on(table.key)]
)

// These platform tables predate Better Auth Teams. Keep their declarations in
// the Drizzle source of truth so future migrations never treat them as stale.
export const permission = pgTable(
  "permission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resource: varchar("resource", { length: 128 }).notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("permission_resource_action_key").on(
      table.resource,
      table.action
    ),
  ]
)

export const role = pgTable(
  "role",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    key: varchar("key", { length: 128 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    metadata: jsonb("metadata").notNull().default(sql.raw("'{}'::jsonb")),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("role_organization_key_key").on(
      table.organizationId,
      table.key
    ),
    index("role_organization_id_idx").on(table.organizationId),
  ]
)

export const memberRole = pgTable(
  "member_role",
  {
    memberId: uuid("member_id").references(() => member.id, {
      onDelete: "cascade",
    }),
    roleId: uuid("role_id").references(() => role.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [primaryKey({ columns: [table.memberId, table.roleId] })]
)

export const rolePermission = pgTable(
  "role_permission",
  {
    roleId: uuid("role_id").references(() => role.id, {
      onDelete: "cascade",
    }),
    permissionId: uuid("permission_id").references(() => permission.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
)

export const legacyTeam = pgTable(
  "team",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 128 }).notNull(),
    metadata: jsonb("metadata").notNull().default(sql.raw("'{}'::jsonb")),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_organization_slug_key").on(
      table.organizationId,
      table.slug
    ),
    index("team_organization_id_idx").on(table.organizationId),
  ]
)

export const legacyTeamMember = pgTable(
  "team_member",
  {
    teamId: uuid("team_id").references(() => legacyTeam.id, {
      onDelete: "cascade",
    }),
    memberId: uuid("member_id").references(() => member.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.memberId] }),
    index("team_member_member_id_idx").on(table.memberId),
  ]
)

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: uuid("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 128 }).notNull(),
    outcome: auditOutcome("outcome").notNull(),
    resourceType: varchar("resource_type", { length: 128 }),
    resourceId: text("resource_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").notNull().default(sql.raw("'{}'::jsonb")),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_actor_user_id_idx").on(table.actorUserId),
    index("audit_log_organization_id_idx").on(table.organizationId),
    index("audit_log_created_at_idx").on(table.createdAt),
  ]
)

export const authenticationEvent = pgTable(
  "authentication_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    type: authenticationEventType("type").notNull(),
    provider: varchar("provider", { length: 128 }),
    success: boolean("success").notNull().default(true),
    failureReason: text("failure_reason"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").notNull().default(sql.raw("'{}'::jsonb")),
    createdAt: timestamp("created_at", timestampConfig).notNull().defaultNow(),
  },
  (table) => [
    index("authentication_event_user_id_idx").on(table.userId),
    index("authentication_event_created_at_idx").on(table.createdAt),
  ]
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizationMemberships: many(member),
  teamMemberships: many(teamMember),
  sentOrganizationInvitations: many(invitation),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const oauthClientRelations = relations(oauthClient, ({ many }) => ({
  resources: many(oauthClientResource),
}))

export const oauthResourceRelations = relations(oauthResource, ({ many }) => ({
  clients: many(oauthClientResource),
}))

export const oauthClientResourceRelations = relations(
  oauthClientResource,
  ({ one }) => ({
    client: one(oauthClient, {
      fields: [oauthClientResource.clientId],
      references: [oauthClient.clientId],
    }),
    resource: one(oauthResource, {
      fields: [oauthClientResource.resourceId],
      references: [oauthResource.identifier],
    }),
  })
)

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  teams: many(team),
  invitations: many(invitation),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  members: many(teamMember),
  invitations: many(invitation),
}))

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}))

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}))

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [invitation.teamId],
    references: [team.id],
  }),
}))

export const betterAuthSchema = {
  user,
  session,
  account,
  verification,

  jwks,

  oauthClient,
  oauthResource,
  oauthClientResource,
  oauthRefreshToken,
  oauthAccessToken,
  oauthConsent,
  oauthClientAssertion,

  ssoProvider,

  organization,
  member,
  invitation,
  team,
  teamMember,

  rateLimit,
}

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type Jwks = typeof jwks.$inferSelect
export type ProjectConfig = typeof projectConfig.$inferSelect
export type OAuthClient = typeof oauthClient.$inferSelect
export type OAuthResource = typeof oauthResource.$inferSelect
export type OAuthClientResource = typeof oauthClientResource.$inferSelect
export type OAuthRefreshToken = typeof oauthRefreshToken.$inferSelect
export type OAuthAccessToken = typeof oauthAccessToken.$inferSelect
export type OAuthConsent = typeof oauthConsent.$inferSelect
export type OAuthClientAssertion = typeof oauthClientAssertion.$inferSelect
export type SsoProvider = typeof ssoProvider.$inferSelect
export type Organization = typeof organization.$inferSelect
export type Member = typeof member.$inferSelect
export type Invitation = typeof invitation.$inferSelect
export type Team = typeof team.$inferSelect
export type TeamMember = typeof teamMember.$inferSelect
export type RateLimit = typeof rateLimit.$inferSelect

export type UserRole = (typeof userRole.enumValues)[number]
export type UserStatus = (typeof userStatus.enumValues)[number]
export type OAuthGrantType = (typeof oauthGrantType.enumValues)[number]
export type OAuthResponseType = (typeof oauthResponseType.enumValues)[number]
export type OAuthTokenEndpointAuthMethod =
  (typeof oauthTokenEndpointAuthMethod.enumValues)[number]
export type OAuthSubjectType = (typeof oauthSubjectType.enumValues)[number]
export type OAuthApplicationType =
  (typeof oauthApplicationType.enumValues)[number]
