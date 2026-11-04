import { z } from "@gorth-io/structure/cores/zod"

export const oauthTimeoutSchema = z
  .object({
    oauth_query: z.string().min(1).max(8192),
  })
  .strict()
