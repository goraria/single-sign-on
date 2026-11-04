import { z } from "@gorth-io/structure/cores/zod"
export const commerceTeamRoles = [
  "member",
  "manager",
  "staff",
  "catalog",
  "inventory",
  "fulfillment",
  "finance",
  "support",
  "viewer",
] as const
export const commerceTeamRoleInput = z
  .object({
    teamId: z.uuid(),
    userId: z.uuid(),
    role: z.enum(commerceTeamRoles),
  })
  .strict()
export const teamBusinessActions: Record<string, readonly string[]> = {
  member: ["profile:read"],
  manager: [
    "read",
    "manage",
    "catalog:read",
    "inventory:read",
    "inventory:write",
    "order:read",
    "order:write",
    "fulfillment:read",
    "fulfillment:write",
    "finance:read",
    "finance:write",
  ],
  staff: [
    "profile:read",
    "order:read",
    "fulfillment:read",
    "fulfillment:write",
  ],
  catalog: ["profile:read", "catalog:read"],
  inventory: ["profile:read", "inventory:read", "inventory:write"],
  fulfillment: [
    "profile:read",
    "order:read",
    "fulfillment:read",
    "fulfillment:write",
  ],
  finance: ["profile:read", "order:read", "finance:read", "finance:write"],
  support: ["profile:read", "order:read", "order:write"],
  viewer: ["read", "profile:read"],
}
