import z from "@gorth/structure/cores/zod"

export const oauthClientRedirectPurposeSchema = z.enum([
  "origin",
  "post_logout",
])

export const oauthClientRedirectPolicySchema = z.object({
  url: z.string().trim().min(1),
  purpose: oauthClientRedirectPurposeSchema,
})

export type OAuthClientRedirectPurpose = z.infer<
  typeof oauthClientRedirectPurposeSchema
>
export type OAuthClientRedirectPolicy = z.infer<
  typeof oauthClientRedirectPolicySchema
>
