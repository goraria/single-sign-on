import z from "@/lib/structure/cores/zod"

export const oauthClientRedirectPurposeSchema = z.enum([
  "origin",
  "post_logout",
])

export const oauthClientRedirectPolicySchema = z.object({
  url: z.string().trim().min(1),
  purpose: oauthClientRedirectPurposeSchema,
})

export const ssoAppContextSchema = z.object({
  id: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(1).optional(),
  redirect_uri: z.string().trim().min(1),
  next: z.string().nullable().optional(),
})

export const tokenBundleSchema = z.object({
  app: ssoAppContextSchema,
})

export const tokenVerifySchema = z.object({
  app: ssoAppContextSchema.partial().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
})

export type OAuthClientRedirectPurpose = z.infer<
  typeof oauthClientRedirectPurposeSchema
>
export type OAuthClientRedirectPolicy = z.infer<
  typeof oauthClientRedirectPolicySchema
>
export type SsoAppContextInput = z.infer<typeof ssoAppContextSchema>
export type TokenBundleInput = z.infer<typeof tokenBundleSchema>
export type TokenVerifyInput = z.infer<typeof tokenVerifySchema>
