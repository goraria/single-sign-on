import { z } from "@gorth/structure/cores/zod"

// Private upstream shape. Tokens never leave the Next.js boundary in this UI.
export const deviceSessionSchema = z.object({
  session: z.object({ id: z.string().min(1), token: z.string().min(1) }),
  user: z.object({
    id: z.string().min(1),
    name: z.string(),
    email: z.email(),
    image: z.string().nullable().optional(),
  }),
})

export const browserAccountActionSchema = z
  .object({
    operation: z.enum(["switch", "revoke"]),
    sessionId: z.string().min(1).max(256),
  })
  .strict()

export interface BrowserAccount {
  sessionId: string
  user: { id: string; name: string; email: string; image?: string | null }
  active: boolean
}
