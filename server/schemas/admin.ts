import z from "@/lib/structure/cores/zod"
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod"

import { oauthClients, users, type OAuthClient } from "@/database/schema"
import { isProduction } from "@/lib/utils/environment"
import {
  oauthGrantTypeSchema,
  oauthResponseTypeSchema,
  oauthScopeSchema,
  oauthTokenEndpointAuthMethodSchema,
  userRoleSchema,
} from "@/schemas/database"

export const adminUserSelection = {
  id: users.id,
  name: users.name,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  emailVerified: users.emailVerified,
  image: users.image,
  role: users.role,
  bannedUntil: users.bannedUntil,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

export const adminSsoApplicationSelection = {
  id: oauthClients.id,
  clientId: oauthClients.clientId,
  name: oauthClients.name,
  metadata: oauthClients.metadata,
  uri: oauthClients.uri,
  icon: oauthClients.icon,
  redirectUris: oauthClients.redirectUris,
  postLogoutRedirectUris: oauthClients.postLogoutRedirectUris,
  scopes: oauthClients.scopes,
  grantTypes: oauthClients.grantTypes,
  responseTypes: oauthClients.responseTypes,
  public: oauthClients.public,
  requirePKCE: oauthClients.requirePKCE,
  tokenEndpointAuthMethod: oauthClients.tokenEndpointAuthMethod,
  skipConsent: oauthClients.skipConsent,
  disabled: oauthClients.disabled,
  createdAt: oauthClients.createdAt,
  updatedAt: oauthClients.updatedAt,
}

function splitStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === "string") {
    return value.split(/[\n,]/)
  }

  return value
}

const adminHttpUrlSchema = z
  .string()
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
  .refine((value) => !isProduction || new URL(value).protocol === "https:")

export const adminUrlListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(adminHttpUrlSchema).min(1))
    .transform((values) =>
      Array.from(new Set(values.map((value) => new URL(value).toString())))
    )
)

export const adminOptionalUrlListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(adminHttpUrlSchema))
    .transform((values) =>
      Array.from(new Set(values.map((value) => new URL(value).toString())))
    )
)

export const adminScopeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthScopeSchema))
)

export const adminGrantTypeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthGrantTypeSchema))
)

export const adminResponseTypeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthResponseTypeSchema))
)

export const adminOptionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().nullable()
)

export const adminOptionalUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  adminHttpUrlSchema.nullable()
)

const adminSsoApplicationSchema = z.object({
  clientId: z
    .string()
    .trim()
    .min(3)
    .max(128)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,127}$/),
  name: z.string().trim().min(1),
  description: adminOptionalStringSchema.optional(),
  homepageUrl: adminOptionalUrlSchema.optional(),
  icon: adminOptionalStringSchema.optional(),
  redirectUris: adminUrlListSchema,
  postLogoutRedirectUris: adminOptionalUrlListSchema.optional(),
  scopes: adminScopeListSchema,
  grantTypes: adminGrantTypeListSchema,
  responseTypes: adminResponseTypeListSchema,
  public: z.boolean(),
  requirePKCE: z.boolean(),
  tokenEndpointAuthMethod: oauthTokenEndpointAuthMethodSchema,
  skipConsent: z.boolean(),
  disabled: z.boolean(),
})

export const adminSsoApplicationPayloadSchema =
  adminSsoApplicationSchema.extend({
    scopes: adminScopeListSchema.default([
      "openid",
      "profile",
      "email",
      "offline_access",
    ]),
    grantTypes: adminGrantTypeListSchema.default([
      "authorization_code",
      "refresh_token",
    ]),
    responseTypes: adminResponseTypeListSchema.default(["code"]),
    public: z.boolean().default(true),
    requirePKCE: z.boolean().default(true),
    tokenEndpointAuthMethod: oauthTokenEndpointAuthMethodSchema.default("none"),
    skipConsent: z.boolean().default(true),
    disabled: z.boolean().default(false),
  })

export const adminSsoApplicationPatchSchema =
  adminSsoApplicationSchema.partial()

export const adminSsoApplicationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(128).default(""),
  status: z.enum(["enabled", "disabled"]).optional(),
  sortBy: z
    .enum(["name", "clientId", "homepageUrl", "state", "updatedAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export const adminUserRoleSchema = userRoleSchema

const adminUserInsertSchema = createInsertSchema(users, {
  name: z.string().trim().min(1).max(255),
  username: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z
    .string()
    .trim()
    .max(255)
    .email()
    .transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  image: adminOptionalStringSchema.optional(),
  bannedUntil: z.coerce.date().nullable().optional(),
})

const adminUserUpdateSchema = createUpdateSchema(users, {
  name: z.string().trim().min(1).max(255),
  username: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z
    .string()
    .trim()
    .max(255)
    .email()
    .transform((value) => value.toLowerCase()),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  image: adminOptionalStringSchema.optional(),
  bannedUntil: z.coerce.date().nullable().optional(),
})

export const adminUserPayloadSchema = adminUserInsertSchema
  .pick({
    firstName: true,
    lastName: true,
    username: true,
    name: true,
    email: true,
    image: true,
    role: true,
    emailVerified: true,
    bannedUntil: true,
  })
  .extend({ password: z.string().min(8).max(128) })

export const adminUserPatchSchema = adminUserUpdateSchema
  .pick({
    firstName: true,
    lastName: true,
    username: true,
    name: true,
    email: true,
    image: true,
    role: true,
    emailVerified: true,
    bannedUntil: true,
  })
  .extend({ password: z.string().min(8).max(128).optional() })

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(128).default(""),
  state: z.enum(["verified", "unverified", "banned"]).optional(),
  role: adminUserRoleSchema.optional(),
  sortBy: z
    .enum(["name", "email", "role", "state", "createdAt", "updatedAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export const adminIdParamsSchema = z.object({
  id: z.uuid(),
})

export type AdminSsoApplicationPayload = z.infer<
  typeof adminSsoApplicationPayloadSchema
>
export type AdminSsoApplicationPatch = z.infer<
  typeof adminSsoApplicationPatchSchema
>
export type AdminSsoApplicationListQuery = z.infer<
  typeof adminSsoApplicationListQuerySchema
>
export type AdminUserPayload = z.infer<typeof adminUserPayloadSchema>
export type AdminUserPatch = z.infer<typeof adminUserPatchSchema>
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>
export type AdminSsoApplicationRecord = Pick<
  OAuthClient,
  keyof typeof adminSsoApplicationSelection
>
