import { auth, additionalAccountAuth } from "@/lib/auth/client"
import { signInSchema, usernameSchema } from "@/schemas/auth"
import type { z } from "@gorth/structure/cores/zod"

// Only UI dispatch lives here; credential verification, cookies and sessions
// remain owned by Better Auth. Do not resolve a username to an email ourselves.
export async function signInWithIdentifier(
  value: z.infer<typeof signInSchema>,
  callbackURL: string,
  addAccount = false
) {
  const client = addAccount ? additionalAccountAuth : auth
  const identifier = value.identifier.trim()
  const options = {
    password: value.password,
    rememberMe: value.rememberMe,
    callbackURL,
  }

  return identifier.includes("@")
    ? await client.signIn.email({ ...options, email: identifier })
    : await client.signIn.username({ ...options, username: identifier })
}

export async function getUsernameAvailabilityError(
  value: string,
  signal?: AbortSignal,
  currentUsername?: string | null
) {
  if (signal?.aborted) return undefined
  const parsed = usernameSchema.safeParse(value)
  if (!parsed.success) return parsed.error.issues[0]?.message
  // The native availability endpoint reports the current user's name as taken.
  // An unchanged profile does not need an availability query.
  if (parsed.data === currentUsername) return undefined

  try {
    const { data, error } = await auth.isUsernameAvailable(
      { username: parsed.data },
      { signal }
    )
    if (signal?.aborted) return undefined
    if (error) return error.message ?? "Unable to check username availability."
    if (!data) return "Unable to check username availability."
    return data.available ? undefined : "This username is already taken."
  } catch {
    if (signal?.aborted) return undefined
    return "Unable to check username availability. Please try again."
  }
}
