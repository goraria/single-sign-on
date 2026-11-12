import { z } from "@gorth-io/structure/cores/zod"

export const commerceRecipientQuery = z.object({
  application: z.enum(["marketplace", "restaurant"]),
  organizationId: z.uuid(),
  teamId: z.uuid().optional(),
  capability: z.enum(["order", "catalog", "inventory", "finance", "fulfillment", "loyalty", "procurement"]),
}).strict()
export type CommerceRecipientQuery = z.infer<typeof commerceRecipientQuery>
