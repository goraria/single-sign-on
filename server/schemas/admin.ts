import { validate } from "@gorth/structure/cores/uuid"
import z from "@gorth/structure/cores/zod"
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod"

import { oauthClient, user, type OAuthClient } from "@/database/schema"
import { isProduction } from "@/lib/utils/environment"
import {
  oauthGrantTypeSchema,
  oauthResponseTypeSchema,
  oauthScopeSchema,
  oauthTokenEndpointAuthMethodSchema,
  userRoleSchema,
} from "@/schemas/database"

export const adminUserSelection = {
  id: user.id,
  name: user.name,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  role: user.role,
  banExpires: user.banExpires,
  banReason: user.banReason,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
}

export const adminSsoApplicationSelection = {
  id: oauthClient.id,
  clientId: oauthClient.clientId,
  name: oauthClient.name,
  metadata: oauthClient.metadata,
  uri: oauthClient.uri,
  icon: oauthClient.icon,
  redirectUris: oauthClient.redirectUris,
  postLogoutRedirectUris: oauthClient.postLogoutRedirectUris,
  scopes: oauthClient.scopes,
  grantTypes: oauthClient.grantTypes,
  responseTypes: oauthClient.responseTypes,
  public: oauthClient.public,
  requirePKCE: oauthClient.requirePKCE,
  tokenEndpointAuthMethod: oauthClient.tokenEndpointAuthMethod,
  skipConsent: oauthClient.skipConsent,
  disabled: oauthClient.disabled,
  createdAt: oauthClient.createdAt,
  updatedAt: oauthClient.updatedAt,
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

const adminUserInsertSchema = createInsertSchema(user, {
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
  banExpires: z.coerce.date().nullable().optional(),
  banReason: adminOptionalStringSchema.optional(),
})

const adminUserUpdateSchema = createUpdateSchema(user, {
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
  banExpires: z.coerce.date().nullable().optional(),
  banReason: adminOptionalStringSchema.optional(),
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
    banExpires: true,
    banReason: true,
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
    banExpires: true,
    banReason: true,
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
  id: z.string().refine(validate, "Invalid UUID"),
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
