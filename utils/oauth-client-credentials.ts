import { AsyncLocalStorage } from "node:async_hooks"
import { randomBytes, randomInt } from "node:crypto"

const requestedClientId = new AsyncLocalStorage<string | undefined>()
export function withRequestedOAuthClientId<T>(
  id: string | undefined,
  operation: () => T
): T {
  return requestedClientId.run(id, operation)
}
export function generateOAuthClientId() {
  return requestedClientId.getStore() ?? randomBytes(24).toString("base64url")
}
export function generateOAuthClientSecret() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length: 32 }, () => alphabet[randomInt(alphabet.length)]).join("")
}
