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

export const administratorStringListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string())
    .transform((values) => values.map((value) => value.trim()).filter(Boolean))
)

export const administratorScopeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthScopeSchema))
)

export const administratorGrantTypeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthGrantTypeSchema))
)

export const administratorResponseTypeListSchema = z.preprocess(
  splitStringList,
  z
    .array(z.string().trim())
    .transform((values) => values.filter(Boolean))
    .pipe(z.array(oauthResponseTypeSchema))
)

export const administratorOptionalStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().nullable()
)

export const administratorSsoApplicationPayloadSchema = z.object({
  clientId: z.string().trim().min(3).max(128),
  name: z.string().trim().min(1),
  description: administratorOptionalStringSchema.optional(),
  homepageUrl: administratorOptionalStringSchema.optional(),
  icon: administratorOptionalStringSchema.optional(),
  redirectUris: administratorStringListSchema,
  postLogoutRedirectUris: administratorStringListSchema.optional(),
  scopes: administratorScopeListSchema.default([
    "openid",
    "profile",
    "email",
    "offline_access",
  ]),
  grantTypes: administratorGrantTypeListSchema.default([
    "authorization_code",
    "refresh_token",
  ]),
  responseTypes: administratorResponseTypeListSchema.default(["code"]),
  public: z.boolean().default(true),
  requirePKCE: z.boolean().default(true),
  tokenEndpointAuthMethod: oauthTokenEndpointAuthMethodSchema.default("none"),
  skipConsent: z.boolean().default(true),
  disabled: z.boolean().default(false),
})

export const administratorSsoApplicationPatchSchema =
  administratorSsoApplicationPayloadSchema.partial()

export type AdministratorSsoApplicationPayload = z.infer<
  typeof administratorSsoApplicationPayloadSchema
>
export type AdministratorSsoApplicationPatch = z.infer<
  typeof administratorSsoApplicationPatchSchema
>
