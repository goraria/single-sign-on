import { z } from "@gorth/structure/cores/zod"

export const storageCredentialRequestSchema = z
  .object({
    bucketName: z.string().min(1).max(255),
  })
  .strict()

export const storageConfigurationSchema = z.object({
  endpoint: z.url().refine((value) => {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/" &&
      !/^(localhost|\d+\.\d+\.\d+\.\d+|\[)/.test(url.hostname)
    )
  }),
  region: z.string().regex(/^[a-z0-9-]{1,64}$/),
  bucketName: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,253}[a-z0-9]$/),
  accessKeyId: z.string().min(1).max(4096),
  secretAccessKey: z.string().min(1).max(4096),
})
