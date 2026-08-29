import { z } from "@gorth/structure/cores/zod"

export const userRoleSchema = z.enum(["user", "admin", "vice", "master"])

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  role: userRoleSchema,
  bannedUntil: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type User = z.infer<typeof userSchema>
