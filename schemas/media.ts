import { z } from "@gorth/structure/cores/zod"

export const mediaUploadSchema = z.object({
  asset: z.object({ id: z.uuid(), objectKey: z.string().min(1) }),
  upload: z.object({ id: z.uuid(), method: z.literal("PUT"), url: z.url() }),
})
export const mediaReadyAssetSchema = z.object({
  id: z.uuid(),
  status: z.literal("ready"),
})
export const mediaAssetIdSchema = z.uuid()
export const avatarUploadTicketSchema = z.object({
  assetId: z.uuid(),
  uploadId: z.uuid(),
  uploadUrl: z.url(),
  contentType: z.string(),
})
export const mediaAvatarUploadStateSchema = z.object({
  asset: z.object({
    id: z.uuid(),
    objectKey: z.string().min(1),
    bucketId: z.string().min(1),
    resourceType: z.literal("avatar"),
    resourceId: z.string().min(1),
  }),
})
