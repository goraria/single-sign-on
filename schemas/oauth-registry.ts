import z from "@gorth-io/structure/cores/zod"

// OAuth scope-token syntax (RFC 6749); these are names, never grants.
export const oauthScopeNameSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\x21\x23-\x5B\x5D-\x7E]+$/)
export const oidcScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
] as const
export const oauthScopePublicationSchema = z.object({
  baseRevision: z.number().int().positive(),
  scopes: z
    .array(oauthScopeNameSchema)
    .min(4)
    .max(512)
    .transform((values) => [...new Set(values)].sort())
    .refine(
      (values) => oidcScopes.every((scope) => values.includes(scope)),
      "Keep the standard OIDC scopes"
    ),
})
export type OAuthScopePublication = z.infer<typeof oauthScopePublicationSchema>
