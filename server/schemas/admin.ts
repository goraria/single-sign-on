import z from "@/lib/structure/cores/zod"
import {
  oauthGrantTypeSchema,
  oauthResponseTypeSchema,
  oauthScopeSchema,
  oauthTokenEndpointAuthMethodSchema,
} from "@/schemas/database"

function splitStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === "string") {
    return value.split(/[\n,]/)
  }

  return value
}

export const adminStringListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string())
    .transform((values) => values.map((value) => value.trim()).filter(Boolean))
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

export const adminSsoApplicationPayloadSchema = z.object({
  clientId: z.string().trim().min(3).max(128),
  name: z.string().trim().min(1),
  description: adminOptionalStringSchema.optional(),
  homepageUrl: adminOptionalStringSchema.optional(),
  icon: adminOptionalStringSchema.optional(),
  redirectUris: adminStringListSchema,
  postLogoutRedirectUris: adminStringListSchema.optional(),
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
  adminSsoApplicationPayloadSchema.partial()

export type AdminSsoApplicationPayload = z.infer<
  typeof adminSsoApplicationPayloadSchema
>
export type AdminSsoApplicationPatch = z.infer<
  typeof adminSsoApplicationPatchSchema
>
