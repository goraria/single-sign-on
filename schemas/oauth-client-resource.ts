import { adminIdParamsSchema } from "@/schemas/admin"

export const oauthClientResourceParamsSchema = adminIdParamsSchema.extend({
  resourceId: adminIdParamsSchema.shape.id,
})
