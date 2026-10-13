import { validate } from "@gorth/structure/cores/uuid"
import { z } from "@gorth/structure/cores/zod"

export const userRoleSchema = z.enum(["user", "admin", "vice", "master"])

export const userSchema = z.object({
  id: z.string().refine(validate, "Invalid UUID"),
  name: z.string().min(1),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.url().nullable(),
  role: userRoleSchema,
  banExpires: z.string().nullable(),
  banReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type User = z.infer<typeof userSchema>
