// import { relations } from "drizzle-orm";
// import {
//   pgTable,
//   text,
//   timestamp,
//   boolean,
//   integer,
//   jsonb,
//   index,
//   uniqueIndex,
// } from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   email: text("email").notNull().unique(),
//   emailVerified: boolean("email_verified").default(false).notNull(),
//   image: text("image"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at")
//     .defaultNow()
//     .$onUpdate(() => /* @__PURE__ */ new Date())
//     .notNull(),
//   username: text("username"),
//   firstName: text("first_name"),
//   lastName: text("last_name"),
//   role: text("role", { enum: ["user", "admin", "vice", "master"] })
//     .default("user")
//     .notNull(),
// });

// export const sessions = pgTable(
//   "sessions",
//   {
//     id: text("id").primaryKey(),
//     expiresAt: timestamp("expires_at").notNull(),
//     token: text("token").notNull().unique(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => /* @__PURE__ */ new Date())
//       .notNull(),
//     ipAddress: text("ip_address"),
//     userAgent: text("user_agent"),
//     userId: text("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     activeOrganizationId: text("active_organization_id"),
//   },
//   (table) => [index("sessions_userId_idx").on(table.userId)],
// );

// export const accounts = pgTable(
//   "accounts",
//   {
//     id: text("id").primaryKey(),
//     accountId: text("account_id").notNull(),
//     providerId: text("provider_id").notNull(),
//     userId: text("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     accessToken: text("access_token"),
//     refreshToken: text("refresh_token"),
//     idToken: text("id_token"),
//     accessTokenExpiresAt: timestamp("access_token_expires_at"),
//     refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
//     scope: text("scope"),
//     password: text("password"),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => /* @__PURE__ */ new Date())
//       .notNull(),
//   },
//   (table) => [index("accounts_userId_idx").on(table.userId)],
// );

// export const verifications = pgTable(
//   "verifications",
//   {
//     id: text("id").primaryKey(),
//     identifier: text("identifier").notNull(),
//     value: text("value").notNull(),
//     expiresAt: timestamp("expires_at").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at")
//       .defaultNow()
//       .$onUpdate(() => /* @__PURE__ */ new Date())
//       .notNull(),
//   },
//   (table) => [index("verifications_identifier_idx").on(table.identifier)],
// );

// export const jwkss = pgTable("jwkss", {
//   id: text("id").primaryKey(),
//   publicKey: text("public_key").notNull(),
//   privateKey: text("private_key").notNull(),
//   createdAt: timestamp("created_at").notNull(),
//   expiresAt: timestamp("expires_at"),
//   alg: text("alg"),
//   crv: text("crv"),
// });

// export const oauthClients = pgTable(
//   "oauth_clients",
//   {
//     id: text("id").primaryKey(),
//     clientId: text("client_id").notNull().unique(),
//     clientSecret: text("client_secret"),
//     clientDiscoveryId: text("client_discovery_id"),
//     disabled: boolean("disabled").default(false),
//     skipConsent: boolean("skip_consent"),
//     enableEndSession: boolean("enable_end_session"),
//     subjectType: text("subject_type"),
//     scopes: text("scopes").array(),
//     clientCredentialsScopes: text("client_credentials_scopes")
//       .array()
//       .default([]),
//     userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
//     createdAt: timestamp("created_at"),
//     updatedAt: timestamp("updated_at"),
//     name: text("name"),
//     uri: text("uri"),
//     icon: text("icon"),
//     contacts: text("contacts").array(),
//     tos: text("tos"),
//     policy: text("policy"),
//     softwareId: text("software_id"),
//     softwareVersion: text("software_version"),
//     softwareStatement: text("software_statement"),
//     redirectUris: text("redirect_uris").array().notNull(),
//     postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
//     backchannelLogoutUri: text("backchannel_logout_uri"),
//     backchannelLogoutSessionRequired: boolean(
//       "backchannel_logout_session_required",
//     ),
//     tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
//     applicationType: text("application_type"),
//     jwks: text("jwks"),
//     jwksUri: text("jwks_uri"),
//     grantTypes: text("grant_types").array(),
//     responseTypes: text("response_types").array(),
//     requirePKCE: boolean("require_pkce"),
//     dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
//     referenceId: text("reference_id"),
//     metadata: jsonb("metadata"),
//   },
//   (table) => [index("oauthClients_userId_idx").on(table.userId)],
// );

// export const oauthResources = pgTable("oauth_resources", {
//   id: text("id").primaryKey(),
//   identifier: text("identifier").notNull().unique(),
//   name: text("name").notNull(),
//   accessTokenTtl: integer("access_token_ttl"),
//   refreshTokenTtl: integer("refresh_token_ttl"),
//   signingAlgorithm: text("signing_algorithm"),
//   signingKeyId: text("signing_key_id"),
//   allowedScopes: text("allowed_scopes").array(),
//   customClaims: jsonb("custom_claims"),
//   dpopBoundAccessTokensRequired: boolean(
//     "dpop_bound_access_tokens_required",
//   ).default(false),
//   disabled: boolean("disabled").default(false),
//   createdAt: timestamp("created_at"),
//   updatedAt: timestamp("updated_at"),
//   policyVersion: integer("policy_version").default(1),
//   metadata: jsonb("metadata"),
// });

// export const oauthClientResources = pgTable(
//   "oauth_client_resources",
//   {
//     id: text("id").primaryKey(),
//     clientId: text("client_id")
//       .notNull()
//       .references(() => oauthClients.clientId, { onDelete: "cascade" }),
//     resourceId: text("resource_id")
//       .notNull()
//       .references(() => oauthResources.identifier, { onDelete: "cascade" }),
//     metadata: jsonb("metadata"),
//     createdAt: timestamp("created_at"),
//   },
//   (table) => [
//     uniqueIndex("oauthClientResources_clientId_resourceId_uidx").on(
//       table.clientId,
//       table.resourceId,
//     ),
//     index("oauthClientResources_clientId_idx").on(table.clientId),
//     index("oauthClientResources_resourceId_idx").on(table.resourceId),
//   ],
// );

// export const oauthRefreshTokens = pgTable(
//   "oauth_refresh_tokens",
//   {
//     id: text("id").primaryKey(),
//     token: text("token").notNull().unique(),
//     clientId: text("client_id")
//       .notNull()
//       .references(() => oauthClients.clientId, { onDelete: "cascade" }),
//     sessionId: text("session_id").references(() => sessions.id, {
//       onDelete: "set null",
//     }),
//     userId: text("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     referenceId: text("reference_id"),
//     authorizationCodeId: text("authorization_code_id"),
//     resources: text("resources").array(),
//     requestedUserInfoClaims: text("requested_user_info_claims").array(),
//     expiresAt: timestamp("expires_at").notNull(),
//     createdAt: timestamp("created_at").notNull(),
//     revoked: timestamp("revoked"),
//     rotatedAt: timestamp("rotated_at"),
//     rotationReplayResponse: text("rotation_replay_response"),
//     rotationReplayExpiresAt: timestamp("rotation_replay_expires_at"),
//     authTime: timestamp("auth_time"),
//     confirmation: jsonb("confirmation"),
//     scopes: text("scopes").array().notNull(),
//   },
//   (table) => [
//     index("oauthRefreshTokens_clientId_idx").on(table.clientId),
//     index("oauthRefreshTokens_sessionId_idx").on(table.sessionId),
//     index("oauthRefreshTokens_userId_idx").on(table.userId),
//     index("oauthRefreshTokens_authorizationCodeId_idx").on(
//       table.authorizationCodeId,
//     ),
//   ],
// );

// export const oauthAccessTokens = pgTable(
//   "oauth_access_tokens",
//   {
//     id: text("id").primaryKey(),
//     token: text("token").notNull().unique(),
//     clientId: text("client_id")
//       .notNull()
//       .references(() => oauthClients.clientId, { onDelete: "cascade" }),
//     sessionId: text("session_id").references(() => sessions.id, {
//       onDelete: "set null",
//     }),
//     userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
//     referenceId: text("reference_id"),
//     authorizationCodeId: text("authorization_code_id"),
//     resources: text("resources").array(),
//     requestedUserInfoClaims: text("requested_user_info_claims").array(),
//     refreshId: text("refresh_id").references(() => oauthRefreshTokens.id, {
//       onDelete: "cascade",
//     }),
//     expiresAt: timestamp("expires_at").notNull(),
//     createdAt: timestamp("created_at").notNull(),
//     revoked: timestamp("revoked"),
//     confirmation: jsonb("confirmation"),
//     scopes: text("scopes").array().notNull(),
//   },
//   (table) => [
//     index("oauthAccessTokens_clientId_idx").on(table.clientId),
//     index("oauthAccessTokens_sessionId_idx").on(table.sessionId),
//     index("oauthAccessTokens_userId_idx").on(table.userId),
//     index("oauthAccessTokens_authorizationCodeId_idx").on(
//       table.authorizationCodeId,
//     ),
//     index("oauthAccessTokens_refreshId_idx").on(table.refreshId),
//   ],
// );

// export const oauthConsents = pgTable(
//   "oauth_consents",
//   {
//     id: text("id").primaryKey(),
//     clientId: text("client_id")
//       .notNull()
//       .references(() => oauthClients.clientId, { onDelete: "cascade" }),
//     userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
//     referenceId: text("reference_id"),
//     resources: text("resources").array(),
//     requestedUserInfoClaims: text("requested_user_info_claims").array(),
//     scopes: text("scopes").array().notNull(),
//     createdAt: timestamp("created_at").notNull(),
//     updatedAt: timestamp("updated_at").notNull(),
//   },
//   (table) => [
//     index("oauthConsents_clientId_idx").on(table.clientId),
//     index("oauthConsents_userId_idx").on(table.userId),
//   ],
// );

// export const oauthClientAssertions = pgTable("oauth_client_assertions", {
//   id: text("id").primaryKey(),
//   expiresAt: timestamp("expires_at").notNull(),
// });

// export const ssoProviders = pgTable("sso_providers", {
//   id: text("id").primaryKey(),
//   issuer: text("issuer").notNull(),
//   oidcConfig: text("oidc_config"),
//   samlConfig: text("saml_config"),
//   userId: text("user_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "cascade" }),
//   providerId: text("provider_id").notNull().unique(),
//   organizationId: text("organization_id"),
//   domain: text("domain").notNull(),
// });

// export const organizations = pgTable("organizations", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   slug: text("slug").notNull().unique(),
//   logo: text("logo"),
//   createdAt: timestamp("created_at").notNull(),
//   metadata: text("metadata"),
// });

// export const members = pgTable(
//   "members",
//   {
//     id: text("id").primaryKey(),
//     organizationId: text("organization_id")
//       .notNull()
//       .references(() => organizations.id, { onDelete: "cascade" }),
//     userId: text("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//     role: text("role").default("member").notNull(),
//     createdAt: timestamp("created_at").notNull(),
//   },
//   (table) => [
//     index("members_organizationId_idx").on(table.organizationId),
//     index("members_userId_idx").on(table.userId),
//   ],
// );

// export const invitations = pgTable(
//   "invitations",
//   {
//     id: text("id").primaryKey(),
//     organizationId: text("organization_id")
//       .notNull()
//       .references(() => organizations.id, { onDelete: "cascade" }),
//     email: text("email").notNull(),
//     role: text("role"),
//     status: text("status").default("pending").notNull(),
//     expiresAt: timestamp("expires_at").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     inviterId: text("inviter_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),
//   },
//   (table) => [
//     index("invitations_organizationId_idx").on(table.organizationId),
//     index("invitations_email_idx").on(table.email),
//   ],
// );

// export const usersRelations = relations(users, ({ many }) => ({
//   sessions: many(sessions),
//   accounts: many(accounts),
//   oauthClients: many(oauthClients),
//   oauthRefreshTokens: many(oauthRefreshTokens),
//   oauthAccessTokens: many(oauthAccessTokens),
//   oauthConsents: many(oauthConsents),
//   ssoProviders: many(ssoProviders),
//   members: many(members),
//   invitations: many(invitations),
// }));

// export const sessionsRelations = relations(sessions, ({ one, many }) => ({
//   user: one(users, {
//     fields: [sessions.userId],
//     references: [users.id],
//   }),
//   oauthRefreshTokens: many(oauthRefreshTokens),
//   oauthAccessTokens: many(oauthAccessTokens),
// }));

// export const accountsRelations = relations(accounts, ({ one }) => ({
//   user: one(users, {
//     fields: [accounts.userId],
//     references: [users.id],
//   }),
// }));

// export const oauthClientsRelations = relations(
//   oauthClients,
//   ({ one, many }) => ({
//     user: one(users, {
//       fields: [oauthClients.userId],
//       references: [users.id],
//     }),
//     oauthClientResources: many(oauthClientResources),
//     oauthRefreshTokens: many(oauthRefreshTokens),
//     oauthAccessTokens: many(oauthAccessTokens),
//     oauthConsents: many(oauthConsents),
//   }),
// );

// export const oauthResourcesRelations = relations(
//   oauthResources,
//   ({ many }) => ({
//     oauthClientResources: many(oauthClientResources),
//   }),
// );

// export const oauthClientResourcesRelations = relations(
//   oauthClientResources,
//   ({ one }) => ({
//     oauthClient: one(oauthClients, {
//       fields: [oauthClientResources.clientId],
//       references: [oauthClients.clientId],
//     }),
//     oauthResource: one(oauthResources, {
//       fields: [oauthClientResources.resourceId],
//       references: [oauthResources.identifier],
//     }),
//   }),
// );

// export const oauthRefreshTokensRelations = relations(
//   oauthRefreshTokens,
//   ({ one, many }) => ({
//     oauthClient: one(oauthClients, {
//       fields: [oauthRefreshTokens.clientId],
//       references: [oauthClients.clientId],
//     }),
//     session: one(sessions, {
//       fields: [oauthRefreshTokens.sessionId],
//       references: [sessions.id],
//     }),
//     user: one(users, {
//       fields: [oauthRefreshTokens.userId],
//       references: [users.id],
//     }),
//     oauthAccessTokens: many(oauthAccessTokens),
//   }),
// );

// export const oauthAccessTokensRelations = relations(
//   oauthAccessTokens,
//   ({ one }) => ({
//     oauthClient: one(oauthClients, {
//       fields: [oauthAccessTokens.clientId],
//       references: [oauthClients.clientId],
//     }),
//     session: one(sessions, {
//       fields: [oauthAccessTokens.sessionId],
//       references: [sessions.id],
//     }),
//     user: one(users, {
//       fields: [oauthAccessTokens.userId],
//       references: [users.id],
//     }),
//     oauthRefreshToken: one(oauthRefreshTokens, {
//       fields: [oauthAccessTokens.refreshId],
//       references: [oauthRefreshTokens.id],
//     }),
//   }),
// );

// export const oauthConsentsRelations = relations(oauthConsents, ({ one }) => ({
//   oauthClient: one(oauthClients, {
//     fields: [oauthConsents.clientId],
//     references: [oauthClients.clientId],
//   }),
//   user: one(users, {
//     fields: [oauthConsents.userId],
//     references: [users.id],
//   }),
// }));

// export const ssoProvidersRelations = relations(ssoProviders, ({ one }) => ({
//   user: one(users, {
//     fields: [ssoProviders.userId],
//     references: [users.id],
//   }),
// }));

// export const organizationsRelations = relations(organizations, ({ many }) => ({
//   members: many(members),
//   invitations: many(invitations),
// }));

// export const membersRelations = relations(members, ({ one }) => ({
//   organization: one(organizations, {
//     fields: [members.organizationId],
//     references: [organizations.id],
//   }),
//   user: one(users, {
//     fields: [members.userId],
//     references: [users.id],
//   }),
// }));

// export const invitationsRelations = relations(invitations, ({ one }) => ({
//   organization: one(organizations, {
//     fields: [invitations.organizationId],
//     references: [organizations.id],
//   }),
//   user: one(users, {
//     fields: [invitations.inviterId],
//     references: [users.id],
//   }),
// }));
