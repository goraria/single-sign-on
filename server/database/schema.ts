import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role_enum", [
  "user",
  "moderator",
  "administrator",
])

export const oauthGrantTypeEnum = pgEnum("oauth_grant_type_enum", [
  "authorization_code",
  "refresh_token",
  "client_credentials",
])

export const oauthResponseTypeEnum = pgEnum("oauth_response_type_enum", [
  "code",
])

export const oauthTokenEndpointAuthMethodEnum = pgEnum(
  "oauth_token_endpoint_auth_method_enum",
  ["none", "client_secret_basic", "client_secret_post"]
)

export const oauthSubjectTypeEnum = pgEnum("oauth_subject_type_enum", [
  "public",
  "pairwise",
])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  bannedUntil: timestamp("banned_until", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
})

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
})

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: oauthSubjectTypeEnum("subject_type"),
    scopes: text("scopes").array(),
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
    tokenEndpointAuthMethod: oauthTokenEndpointAuthMethodEnum(
      "token_endpoint_auth_method"
    ),
    grantTypes: oauthGrantTypeEnum("grant_types").array(),
    responseTypes: oauthResponseTypeEnum("response_types").array(),
    public: boolean("public"),
    type: text("type"),
    requirePKCE: boolean("require_pkce"),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauth_clients_user_id_idx").on(table.userId)]
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
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }),
    revoked: timestamp("revoked", { mode: "date" }),
    authTime: timestamp("auth_time", { mode: "date" }),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_refresh_tokens_token_key").on(table.token),
    index("oauth_refresh_tokens_client_id_idx").on(table.clientId),
    index("oauth_refresh_tokens_session_id_idx").on(table.sessionId),
    index("oauth_refresh_tokens_user_id_idx").on(table.userId),
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
    refreshId: uuid("refresh_id").references(() => oauthRefreshTokens.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauth_access_tokens_token_key").on(table.token),
    index("oauth_access_tokens_client_id_idx").on(table.clientId),
    index("oauth_access_tokens_session_id_idx").on(table.sessionId),
    index("oauth_access_tokens_user_id_idx").on(table.userId),
    index("oauth_access_tokens_refresh_id_idx").on(table.refreshId),
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
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }),
  },
  (table) => [
    index("oauth_consents_client_id_idx").on(table.clientId),
    index("oauth_consents_user_id_idx").on(table.userId),
  ]
)

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

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
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

export const betterAuthSchema = {
  users,
  sessions,
  accounts,
  verifications,
  jwks: jwkss,
  jwkss,
  oauthClients,
  oauthRefreshTokens,
  oauthAccessTokens,
  oauthConsents,
  ssoProviders,
}

export type UserRow = typeof users.$inferSelect
export type SessionRow = typeof sessions.$inferSelect
export type AccountRow = typeof accounts.$inferSelect
export type VerificationRow = typeof verifications.$inferSelect
export type JwksRow = typeof jwkss.$inferSelect
export type OAuthClientRow = typeof oauthClients.$inferSelect
export type OAuthRefreshTokenRow = typeof oauthRefreshTokens.$inferSelect
export type OAuthAccessTokenRow = typeof oauthAccessTokens.$inferSelect
export type OAuthConsentRow = typeof oauthConsents.$inferSelect
export type SsoProviderRow = typeof ssoProviders.$inferSelect
